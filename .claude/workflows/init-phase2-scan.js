export const meta = {
  name: 'init-phase2-scan',
  description: 'Phase 2 source scan — surface (if two-tier) + deep scan with word-based chunking',
  phases: [
    { title: 'Surface Scan', detail: 'Lightweight metadata extraction from all files (Two-Tier only)' },
    { title: 'Filter', detail: 'Classify files and compute deep scan targets (Two-Tier only)' },
    { title: 'Deep Scan', detail: 'Full structural extraction of significant files' },
  ],
}

// --- Constants from file-scan.md ---
const TOKEN_BUDGET_PER_AGENT = 150000
const WORDS_TO_TOKENS = 1.33
const MAX_WORDS_PER_AGENT = Math.floor(TOKEN_BUDGET_PER_AGENT / WORDS_TO_TOKENS) // ~112,782
const SURFACE_FILES_PER_AGENT = 600
const CONCURRENCY_CAP = 16

// --- Args (passed from init-pro.md via Claude) ---
// args.project        - project name
// args.files          - array of absolute .cs file paths
// args.totalWords     - estimated total words
// args.scale          - "Medium" | "Large" | "XLarge" | "Massive" | "Colossal" | "Titan"
// args.scanPath       - "B" (deep-only) | "C" (two-tier)
// args.avgWordsPerFile - average words per file (from sampling)

const { project, files, totalWords, scale, scanPath, avgWordsPerFile } = args

// Scan output directory — agents write results to disk to keep orchestrator context lean
const scanDir = `LEARN/${project}/_scan`

// --- Utility: chunk files by accumulated words ---
function chunkByWords(fileList, wordsPerFile, targetWordsPerChunk) {
  const chunks = []
  let chunk = []
  let chunkWords = 0
  for (let i = 0; i < fileList.length; i++) {
    chunk.push(fileList[i])
    chunkWords += wordsPerFile
    if (chunkWords >= targetWordsPerChunk && chunks.length < CONCURRENCY_CAP - 1) {
      chunks.push(chunk)
      chunk = []
      chunkWords = 0
    }
  }
  if (chunk.length > 0) chunks.push(chunk)
  return chunks
}

// --- Deep scan prompt template ---
function deepScanPrompt(filePaths, chunkIndex, totalChunks) {
  return `You are a source code analyzer for a Unity game project called ${project}.

Your job: Read every .cs file in your assigned list and extract structured metadata.
Write your results to the file: ${scanDir}/deep-${chunkIndex}.md

IMPORTANT: Write the FULL report to that file path using the Write tool. Your final text return should be a SHORT summary only (e.g. "Scanned X files, found Y singletons, Z god objects"). The detailed report goes in the file.

## Your assigned files (read ALL of them):
${filePaths.join('\n')}

## For EACH file, extract and report:

### {filename} ({line_count} lines)
- **Class/Struct/Enum:** name, base class, interfaces implemented
- **Type:** MonoBehaviour | ScriptableObject | NetworkBehaviour | Interface | Plain Class | Struct | Enum
- **Singleton:** yes/no (if yes, note access pattern)
- **SerializeField deps:** list all [SerializeField] fields with types
- **Public API:** list public methods (name + params + return type)
- **Events:** events declared, events raised (Invoke), events subscribed (+=)
- **Direct deps:** other project classes directly referenced (not Unity/System)
- **FindObjectOfType calls:** list target types
- **Static access:** Instance/Ins/singleton access to other classes
- **God object signals:** file >200 lines AND does 3+ unrelated things? Note what.
- **Patterns:** object pooling, coroutine usage, async, interfaces, observer, etc.
- **Collections:** any List<T>, Dictionary<K,V>, arrays that could become DataService

## Also produce these summary sections at the END:

### DEPENDENCY EDGES (from this chunk)
Table: | Source Class | Target Class | Relationship Type |
(Relationship: Inherits, Implements, References, Subscribes, FindsObject, StaticAccess)

### SINGLETONS FOUND
Table: | Class | Access Pattern | What It Manages |

### INTERFACES FOUND
Table: | Interface | Methods | Likely Purpose |

### GOD OBJECTS
Table: | File | Lines | Responsibilities (3+) | Suggested Split |

### EVENTS DECLARED
Table: | Class | Event Name | Delegate Type | Raised Where |

### THIRD-PARTY USAGE
Table: | Using Statement | Library | Which Files |
(Only non-Unity, non-System — e.g., FishNet, DOTween, FMOD, Newtonsoft, A*Pathfinding)

### COLLECTIONS FOR DATASERVICE
Table: | Class | Field | Type | Could Extract To |

Be thorough. Read EVERY file. Miss nothing. The accuracy of the entire project architecture depends on your completeness.

REMINDER: Write the full report to ${scanDir}/deep-${chunkIndex}.md — your return text is just a brief summary line.`
}

// --- Surface scan prompt template ---
function surfaceScanPrompt(filePaths, chunkIndex, totalChunks) {
  return `You are a source code SURFACE scanner for a Unity game project called ${project}.

Your job: Read every .cs file in your assigned list and extract METADATA ONLY.
Do NOT read method bodies. Only extract: signatures, types, inheritance, field declarations.

Write your results to the file: ${scanDir}/surface-${chunkIndex}.md

IMPORTANT: Write the FULL catalog to that file path using the Write tool. Your final text return should be a SHORT summary only (e.g. "Surface-scanned X files"). The detailed catalog goes in the file.

Write a structured catalog — one entry per file, in this exact format:

### {filename} | {line_count} lines | {type}
- **Class:** {name} : {base_class} [implements: {interfaces}]
- **Singleton:** {yes/no}
- **Size:** {Trivial(<30)/Small(30-100)/Medium(100-300)/Large(300-600)/God(600+)}
- **Using (3rd party):** {list or "none"}
- **SerializeField:** {field: Type, field: Type, ...}
- **Public API:** {MethodName(params): ReturnType, ...}
- **Static Access To:** {ClassName.Instance, ...}

## Your assigned files (extract metadata from ALL):
${filePaths.join('\n')}

RULES:
- Do NOT read method bodies — only signatures
- Do NOT report private fields (except [SerializeField])
- If a file is auto-generated (comments say so, or >1000 lines of repetitive pattern), mark "AUTO-GEN" and skip details
- Simple enums (<30 lines): one-liner format "### {name} | {lines} | Enum | Values: {v1, v2, ...}"
- Be fast and complete. This is metadata extraction, not analysis.

REMINDER: Write the full catalog to ${scanDir}/surface-${chunkIndex}.md — your return text is just a brief summary line.`
}

// --- Filter schema for structured output ---
const FILTER_SCHEMA = {
  type: 'object',
  properties: {
    deepScanFiles: {
      type: 'array',
      items: { type: 'string' },
      description: 'Absolute paths of files that should be deep-scanned (Must + Should + Conditional categories)'
    },
    skippedFiles: {
      type: 'array',
      items: { type: 'string' },
      description: 'Absolute paths of files skipped from deep scan (Trivial category)'
    },
    surfaceMetadata: {
      type: 'string',
      description: 'Confirmation note that merged surface catalog was written to disk (e.g. "Written to LEARN/project/_scan/surface-merged.md")'
    },
    stats: {
      type: 'object',
      properties: {
        totalFiles: { type: 'number' },
        deepScanCount: { type: 'number' },
        skippedCount: { type: 'number' },
        estimatedDeepWords: { type: 'number' },
        filterReduction: { type: 'string' }
      }
    }
  },
  required: ['deepScanFiles', 'skippedFiles', 'surfaceMetadata', 'stats']
}

// =============================================================
// EXECUTION
// =============================================================

// Ensure _scan directory exists (first write creates it via Write tool)
let scanResults = []
let filterStats = null

if (scanPath === 'C') {
  // ===================== PATH C: TWO-TIER =====================

  // --- Step 1: Surface Scan ---
  phase('Surface Scan')

  const surfaceAgentCount = Math.min(CONCURRENCY_CAP, Math.ceil(files.length / SURFACE_FILES_PER_AGENT))
  const filesPerSurfaceAgent = Math.ceil(files.length / surfaceAgentCount)

  log(`Surface scan: ${files.length} files across ${surfaceAgentCount} agents (~${filesPerSurfaceAgent} files each)`)

  const surfaceChunks = []
  for (let i = 0; i < surfaceAgentCount; i++) {
    const start = i * filesPerSurfaceAgent
    const end = Math.min(start + filesPerSurfaceAgent, files.length)
    surfaceChunks.push(files.slice(start, end))
  }

  const surfaceResults = await parallel(
    surfaceChunks.map((chunk, i) => () =>
      agent(surfaceScanPrompt(chunk, i + 1, surfaceAgentCount), {
        label: `surface-${i + 1}/${surfaceAgentCount}`,
        phase: 'Surface Scan'
      })
    )
  )

  const validSurface = surfaceResults.filter(Boolean)
  log(`Surface scan complete: ${validSurface.length}/${surfaceAgentCount} agents returned (results on disk: ${scanDir}/surface-*.md)`)

  // --- Step 2: Filter ---
  phase('Filter')

  // Surface results are on disk — build file list for the filter agent to read
  const surfaceFileList = Array.from({length: surfaceAgentCount}, (_, i) => `${scanDir}/surface-${i + 1}.md`)

  const filterResult = await agent(
    `You are a file classifier for the Unity project ${project}.

Read ALL surface catalog files from disk:
${surfaceFileList.join('\n')}

These contain the merged surface catalog from ${validSurface.length} scan agents covering ${files.length} files.
Your job: classify each file into deep-scan categories and return a structured result.

## Filter Rules
| Category | Deep Scan? | Criteria |
|----------|-----------|----------|
| **Must scan** | Yes | MonoBehaviours >100 lines, Singletons, NetworkBehaviours, God objects (600+) |
| **Should scan** | Yes | ScriptableObjects with 5+ fields, classes with 5+ public methods, 2+ interfaces implemented |
| **Conditional** | Yes (if ≤budget) | Medium classes (100-300 lines) referenced by 3+ others via static access |
| **Skip** | No | Trivial enums (<30 lines), auto-generated, empty interfaces, simple data structs <50 lines |

Files in Must + Should + Conditional → deepScanFiles
Files in Skip → skippedFiles

## Word budget constraint
After filtering, estimate deep scan words: count of deepScanFiles × ${avgWordsPerFile} (avg words/file).
If estimated > ${MAX_WORDS_PER_AGENT * CONCURRENCY_CAP} (${MAX_WORDS_PER_AGENT * CONCURRENCY_CAP} words = 16 agents × ${MAX_WORDS_PER_AGENT} each):
  Drop "Conditional" category from deepScanFiles → move to skippedFiles.

Also write a merged surface catalog (all files from all surface-*.md combined) to: ${scanDir}/surface-merged.md
Include the surfaceMetadata field in your structured output as just a reference note: "Written to ${scanDir}/surface-merged.md"

## Available file paths (use these exact paths):
${files.join('\n')}

Return the classification as structured output.`,
    {
      label: 'filter-classify',
      phase: 'Filter',
      schema: FILTER_SCHEMA
    }
  )

  if (!filterResult) {
    log('ERROR: Filter agent returned null — falling back to deep-scan all files')
    // Fallback: deep scan everything (word-chunked)
    const fallbackAgents = Math.min(CONCURRENCY_CAP, Math.ceil(totalWords / MAX_WORDS_PER_AGENT))
    const fallbackChunks = chunkByWords(files, avgWordsPerFile, Math.ceil(totalWords / fallbackAgents))

    phase('Deep Scan')
    scanResults = await parallel(
      fallbackChunks.map((chunk, i) => () =>
        agent(deepScanPrompt(chunk, i + 1, fallbackChunks.length), {
          label: `deep-fallback-${i + 1}/${fallbackChunks.length}`,
          phase: 'Deep Scan'
        })
      )
    )
  } else {
    filterStats = filterResult.stats

    log(`Filter: ${filterResult.stats.deepScanCount} files for deep scan, ${filterResult.stats.skippedCount} skipped (${filterResult.stats.filterReduction} reduction)`)

    // --- Step 3: Deep Scan (filtered) ---
    phase('Deep Scan')

    const deepFiles = filterResult.deepScanFiles
    const estimatedDeepWords = deepFiles.length * avgWordsPerFile
    const deepAgentCount = Math.min(CONCURRENCY_CAP, Math.max(2, Math.ceil(estimatedDeepWords / MAX_WORDS_PER_AGENT)))
    const targetWordsPerDeep = Math.ceil(estimatedDeepWords / deepAgentCount)

    log(`Deep scan: ${deepFiles.length} files (~${estimatedDeepWords} words) across ${deepAgentCount} agents`)

    const deepChunks = chunkByWords(deepFiles, avgWordsPerFile, targetWordsPerDeep)

    // Wave 1
    const wave1Chunks = deepChunks.slice(0, CONCURRENCY_CAP)
    const wave1Results = await parallel(
      wave1Chunks.map((chunk, i) => () =>
        agent(deepScanPrompt(chunk, i + 1, deepChunks.length), {
          label: `deep-${i + 1}/${deepChunks.length}`,
          phase: 'Deep Scan'
        })
      )
    )
    scanResults = wave1Results

    // Wave 2 (if needed)
    if (deepChunks.length > CONCURRENCY_CAP) {
      const wave2Chunks = deepChunks.slice(CONCURRENCY_CAP)
      log(`Deep scan wave 2: ${wave2Chunks.length} additional agents`)

      const wave2Results = await parallel(
        wave2Chunks.map((chunk, i) => () =>
          agent(deepScanPrompt(chunk, CONCURRENCY_CAP + i + 1, deepChunks.length), {
            label: `deep-w2-${i + 1}/${wave2Chunks.length}`,
            phase: 'Deep Scan'
          })
        )
      )
      scanResults = scanResults.concat(wave2Results)
    }
  }

} else {
  // ===================== PATH B: DEEP-ONLY =====================

  phase('Deep Scan')

  const deepAgentCount = Math.min(CONCURRENCY_CAP, Math.max(2, Math.ceil(totalWords / MAX_WORDS_PER_AGENT)))
  const targetWordsPerAgent = Math.ceil(totalWords / deepAgentCount)

  log(`Deep-only scan: ${files.length} files (~${totalWords} words) across ${deepAgentCount} agents`)

  const deepChunks = chunkByWords(files, avgWordsPerFile, targetWordsPerAgent)

  scanResults = await parallel(
    deepChunks.map((chunk, i) => () =>
      agent(deepScanPrompt(chunk, i + 1, deepChunks.length), {
        label: `deep-${i + 1}/${deepChunks.length}`,
        phase: 'Deep Scan'
      })
    )
  )
}

// =============================================================
// RETURN RESULTS
// =============================================================

const validResults = scanResults.filter(Boolean)
const deepFileCount = validResults.length
log(`Scan complete: ${deepFileCount} deep agents wrote results to ${scanDir}/deep-*.md`)

// Build the list of files written to disk (for Phase 3 to read)
const deepScanFiles = Array.from({length: deepFileCount}, (_, i) => `${scanDir}/deep-${i + 1}.md`)
const surfaceScanFiles = scanPath === 'C'
  ? Array.from({length: Math.min(CONCURRENCY_CAP, Math.ceil(files.length / SURFACE_FILES_PER_AGENT))}, (_, i) => `${scanDir}/surface-${i + 1}.md`)
  : []

return {
  scanDir: scanDir,
  deepScanFiles: deepScanFiles,
  surfaceScanFiles: surfaceScanFiles,
  surfaceMergedFile: scanPath === 'C' ? `${scanDir}/surface-merged.md` : null,
  filterStats: filterStats,
  agentStats: {
    surfaceAgents: scanPath === 'C' ? Math.min(CONCURRENCY_CAP, Math.ceil(files.length / SURFACE_FILES_PER_AGENT)) : 0,
    deepAgents: deepFileCount,
    totalAgents: (scanPath === 'C' ? Math.min(CONCURRENCY_CAP, Math.ceil(files.length / SURFACE_FILES_PER_AGENT)) + 1 : 0) + deepFileCount
  }
}
