---
name: 'File Scan Strategy'
description: 'Two-tier source scanning strategy for /init — surface scan (metadata extraction) and deep scan (full analysis). Handles projects from Micro (<50 files) to Titan (10,000+ files). Distributes work by WORD COUNT, not file count, to prevent per-agent context overflow.'
applyTo: '**/commands/init.md'
---

# File Scan Strategy (Two-Tier)

> Defines how `/init` Phase 2 distributes source reading across agents.
> Two tiers: Surface (lightweight metadata) → Deep (full structural analysis).
> The tier boundary prevents per-agent context overflow on Massive/Colossal/Titan projects.

---

## Distribution Principle

**Agents are segregated by WORD COUNT, not file count.**

File count is a misleading proxy — a project with 600 files averaging 100 words/file (60k total words) needs far fewer agents than a project with 600 files averaging 500 words/file (300k total words). The true constraint is tokens-per-agent, which maps directly to words.

### The Formula

```
TOKEN_BUDGET_PER_AGENT = 150,000 tokens (safe margin under 200k context)
WORDS_TO_TOKENS = 1.33 (average for C# code)
MAX_WORDS_PER_AGENT = TOKEN_BUDGET_PER_AGENT / WORDS_TO_TOKENS ≈ 112,000 words

agents_needed = ceil(total_words / 112,000)
agents_to_launch = min(16, agents_needed)   // concurrency cap
```

### How To Estimate Total Words

At step 6 of `/init`, after globbing all `.cs` files:
1. Sample 10–20 files spread evenly across the file list (first, middle, last, some random)
2. Count words in each sample (Read tool gives line count; estimate ~8 words/line for C#)
3. `avg_words_per_file = sum(sample_words) / sample_count`
4. `total_words_estimate = avg_words_per_file × total_file_count`

Alternatively, use WORKSPACE-REG.md "Words" column if the project is already registered.

### Chunking By Words (Not Files)

Once `agents_to_launch` is determined:
```
target_words_per_agent = total_words / agents_to_launch

// Walk the sorted file list, accumulating words per chunk:
chunk = []
chunk_words = 0
for each file in sorted_file_list:
    chunk.push(file)
    chunk_words += file.estimated_words
    if chunk_words >= target_words_per_agent:
        emit_chunk(chunk)
        chunk = []
        chunk_words = 0
emit_chunk(chunk)  // remainder
```

This means:
- A folder of 200 tiny enums (20 words each = 4k words) → stays in ONE chunk
- A folder of 15 god-objects (2000 words each = 30k words) → may split across chunks

**Chunk assignment strategy:** Sort files by folder path FIRST, then chunk by accumulated words. This keeps related files together while respecting word budget.

---

## Tier Selection

| Scale | Files | Words | Strategy |
|-------|-------|-------|----------|
| Micro (<50) | <50 | <50k | **Skip fan-out** — main agent reads all |
| Small (50–149) | 50–149 | 50k–150k | **Skip fan-out** — main agent reads all |
| Medium (150–399) | 150–399 | 150k–400k | **Deep-only** — word-based chunking |
| Large (400–799) | 400–799 | 400k–800k | **Deep-only** — word-based chunking |
| XLarge (800–1999) | 800–1999 | 800k–1.5M | **Deep-only** — word-based chunking |
| Massive (2000–3999) | 2000–3999 | 1.5M–2.5M | **Two-tier** — surface first, then deep |
| Colossal (4000–6999) | 4000–6999 | 2.5M–4M | **Two-tier** — surface first, then deep (filtered) |
| Titan (7000+) | 7000+ | 4M+ | **Two-tier** — surface first, then deep (heavily filtered) |

**Decision rule:** If `total_words > 1.5M` OR `file_count > 2000` → use two-tier. Otherwise deep-only (or skip if ≤149 files).

**Words take precedence over file count.** A 1500-file project averaging 1200 words/file (1.8M total) should use two-tier even though file_count < 2000.

---

## Deep-Only Scan (Medium/Large/XLarge)

For projects with ≤1.5M words: chunk ALL files directly into deep agents using the word-based formula.

```
agents_needed = ceil(total_words / 112,000)
agents_to_launch = min(16, max(2, agents_needed))
```

| Total Words | Agents | Words/Agent |
|-------------|--------|-------------|
| 150k–250k | 2–3 | ~75k–85k |
| 250k–500k | 3–5 | ~75k–100k |
| 500k–800k | 5–8 | ~85k–100k |
| 800k–1.2M | 8–11 | ~95k–110k |
| 1.2M–1.5M | 11–14 | ~100k–110k |

---

## Tier 1: Surface Scan

### Purpose

Extract lightweight metadata from ALL files without reading full implementations. Produces a classification catalog that Tier 2 uses to focus deep reads on architecturally significant files only.

### What Surface Agents Extract Per File

```
- File path
- Line count
- Class/Struct/Enum/Interface name
- Base class (if any)
- Interfaces implemented (list)
- Type: MonoBehaviour | ScriptableObject | NetworkBehaviour | Interface | Plain Class | Struct | Enum
- Namespace (if any)
- using statements (non-Unity, non-System only — these reveal third-party deps)
- Public method signatures (name + params + return type — NO bodies)
- [SerializeField] field names + types (NO default values)
- Singleton pattern? (yes/no)
- Line count classification: Trivial (<30) | Small (30–100) | Medium (100–300) | Large (300–600) | God (600+)
- Static access patterns (Class.Instance, Class.Ins, etc.)
```

### What Surface Agents Do NOT Read

- Method bodies
- Private field implementations
- Comments or regions
- Logic flow / algorithms
- String literals or magic numbers

### Surface Agent Budget

**Exception to word-primary rule:** Surface agents skip method bodies entirely, so their input consumption is negligible (~30–50 words extracted per file regardless of file size). The binding constraint for surface agents is **output catalog length** (how many entries the agent can produce before quality degrades), not input tokens. Therefore surface chunking uses file count:

- **Surface words consumed per file:** ~30–50 words (vs. 200–500 for deep read)
- **Max words per surface agent:** ~112,000 (same budget) → could handle ~2000–3500 files per agent theoretically
- **Practical cap:** ~600 files per agent for output quality (catalog gets too long beyond this)

### Surface Agent Chunking (File-Count, Exception)

```
// Surface scans produce ~40 words of OUTPUT per file (the catalog entry)
// The constraint is output/catalog length, not input (since we skip method bodies)
// This is the ONE exception to the word-primary distribution rule

surface_agents_needed = ceil(file_count / 600)  // ~600 files per agent
surface_agents_to_launch = min(16, surface_agents_needed)

// Still chunk by folder-sorted order for related files staying together
```

### Surface Agent Prompt Template

```
You are a source code SURFACE scanner for a Unity game project called {PROJECT}.

Your job: Read every .cs file in your assigned list and extract METADATA ONLY.
Do NOT read method bodies. Only extract: signatures, types, inheritance, field declarations.

Return a structured catalog — one entry per file, in this exact format:

### {filename} | {line_count} lines | {type}
- **Class:** {name} : {base_class} [implements: {interfaces}]
- **Singleton:** {yes/no}
- **Size:** {Trivial(<30)/Small(30-100)/Medium(100-300)/Large(300-600)/God(600+)}
- **Using (3rd party):** {list or "none"}
- **SerializeField:** {field: Type, field: Type, ...}
- **Public API:** {MethodName(params): ReturnType, ...}
- **Static Access To:** {ClassName.Instance, ...}

## Your assigned files (extract metadata from ALL):
{LIST_OF_FILE_PATHS}

RULES:
- Do NOT read method bodies — only signatures
- Do NOT report private fields (except [SerializeField])
- If a file is auto-generated (comments say so, or >1000 lines of repetitive pattern), mark as "AUTO-GEN" and skip details
- If a file is a simple enum (<30 lines), report as one-liner: "### {name} | {lines} | Enum | Values: {v1, v2, ...}"
- Be fast. This is metadata extraction, not analysis.
```

### Surface Scan Output: Classification Catalog

After all surface agents return, the main agent merges results into a **Classification Catalog**:

```
## ARCHITECTURALLY SIGNIFICANT (Deep Scan Candidates)
Files that are: MonoBehaviour + Large/God size, OR Singleton, OR implements 2+ interfaces,
OR has 5+ SerializeField, OR has 5+ public methods, OR is referenced as static by 3+ others

## STRUCTURAL (Deep Scan — brief)
Files that are: Medium-sized classes, ScriptableObjects, significant enums (10+ values)

## TRIVIAL (Skip Deep Scan)
Files that are: Trivial/Small enums, empty interfaces, auto-generated, tiny data classes <30 lines
```

---

## Tier 2: Deep Scan (Filtered)

### Purpose

Full structural analysis of architecturally significant files. Identical to the original deep scan — but operates on a FILTERED file list (only files classified as significant/structural by Tier 1).

### Filter Rules (Which Files Get Deep Scanned)

| Category | Deep Scan? | Criteria |
|----------|-----------|----------|
| **Must scan** | Always | MonoBehaviours >100 lines, Singletons, NetworkBehaviours, God objects (600+ lines) |
| **Should scan** | Yes | ScriptableObjects with 5+ fields, classes with 5+ public methods, classes implementing 2+ interfaces |
| **Conditional** | If budget allows | Medium classes (100–300 lines) that are referenced by 3+ other files |
| **Skip** | Never | Trivial enums (<30 lines), auto-generated files, empty interfaces, simple data structs <50 lines |

### Expected Reduction

| Scale | Total Files | Total Words | After Filter (files) | After Filter (words) | Reduction |
|-------|-------------|-------------|---------------------|---------------------|-----------|
| Massive (2000–3999) | 2000–3999 | 1.5M–2.5M | 800–1800 | 900k–1.8M | ~40–55% words cut |
| Colossal (4000–6999) | 4000–6999 | 2.5M–4M | 1200–2500 | 1.5M–3M | ~35–50% words cut |
| Titan (7000+) | 7000+ | 4M+ | 1500–3000 | 2M–3.5M | ~30–50% words cut |

Note: Word reduction is less dramatic than file reduction because the trivial files we filter out are tiny. But the key benefit is that deep agents now focus attention on architecturally significant code only.

### Deep Agent Chunking (Word-Primary, Post-Filter)

```
filtered_words = sum of estimated words for all files passing filter
deep_agents_needed = ceil(filtered_words / 112,000)
deep_agents_to_launch = min(16, deep_agents_needed)

// Chunk filtered files by accumulated words (same folder-sorted strategy)
// If deep_agents_needed > 16: run in sequential waves
//   wave_1: 16 agents, first ~1.79M words
//   wave_2: ceil(remaining_words / 112,000) agents, rest
```

### Context Budget Validation

Before launching deep agents, validate:
```
per_agent_words = filtered_words / deep_agents_to_launch
per_agent_tokens = per_agent_words × 1.33

ASSERT: per_agent_tokens < 150,000 (safe margin under 200k)

If violated:
  1. Increase agent count (up to concurrency cap of 16)
  2. If already at 16: add another wave
  3. If still violated: tighten filter (drop "Conditional" category)
```

### Deep Agent Prompt Template

Same as the standard deep scan prompt in `/init` (full structural extraction):
- Class/Struct/Enum details
- SerializeField deps
- Public API
- Events declared/raised/subscribed
- Direct deps
- FindObjectOfType calls
- Static access patterns
- God object signals
- Collections for DataService
- Plus summary tables (DEPENDENCY EDGES, SINGLETONS, INTERFACES, GOD OBJECTS, EVENTS, THIRD-PARTY, COLLECTIONS)

---

## Two-Tier Pipeline (Massive/Colossal/Titan)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP A: Surface Scan (parallel — 4–16 agents)                           │
│   All .cs files chunked by folder order (~600 files/agent)              │
│   Returns: Classification Catalog per chunk                             │
└─────────────────────────┬───────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP B: Merge + Filter (sequential — main agent)                        │
│   Merge all catalogs → classify → produce filtered file list            │
│   Estimate words for filtered files (line_count × ~8 words/line)        │
│   Compute deep agent count from filtered_words / 112,000                │
│   Validate context budget per deep agent                                │
└─────────────────────────┬───────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP C: Deep Scan (parallel — word-chunked agents, possibly multi-wave) │
│   Filtered files only → full structural extraction                      │
│   Each agent gets ≤112k words of source                                 │
│   Returns: structured metadata (deps, events, interfaces, god objects)  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Total Agent Budget (Two-Tier)

| Scale | Total Words | Surface Agents | Deep Agents | Doc Agents | Total |
|-------|-------------|---------------|-------------|------------|-------|
| Massive (1.5M–2.5M) | 1.5M–2.5M | 4–7 | 8–16 | 6 | 18–29 |
| Colossal (2.5M–4M) | 2.5M–4M | 7–12 | 14–16 (1 wave) | 6 | 27–34 |
| Titan (4M+) | 4M+ | 12–16 | 16–32 (2 waves) | 6 | 34–54 |

All within the 1000-agent lifetime cap.

---

## Fallback Behaviors

1. **If a surface agent fails:** Main agent re-reads that chunk's files with surface extraction directly. Slower but functional.
2. **If deep agents need >16 concurrent:** Run in sequential waves. Wave 1 handles ~1.79M words across 16 agents. Wave 2 handles the remainder.
3. **If total words of filtered files still exceeds budget after 2 waves:** Tighten filter — drop "Conditional" category entirely and deep-scan only "Must" + "Should".
4. **If Tier 1 surface data is sufficient for trivial files:** Directly include surface metadata in the merged synthesis (Phase 3) without deep scanning. Simple enums, empty interfaces, and tiny data classes don't need deep reads — their surface metadata IS their full picture.
5. **If word estimation is wildly off (actual >> estimated):** An agent that runs out of context will return partial results. Main agent detects incomplete reports (missing files from the assigned list) and either re-chunks the remainder or reads missing files directly.

---

## Integration Notes

- Surface scan results feed into Phase 3 synthesis alongside deep scan results
- Trivial files (skipped from deep scan) still appear in ARCHITECTURE.md and PhaseMap.md — using their surface metadata
- CoverageMap.md must still account for ALL files (surface + deep scanned)
- The Classification Catalog is ephemeral — not written to disk, only used within the /init pipeline
- `/init` is the ONLY consumer of this strategy — other commands (`/build-phase`, `/audit-phase`, etc.) work on single phases (≤25 files) and never need fan-out
