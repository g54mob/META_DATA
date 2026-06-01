---
description: "Workflow-powered /init — deterministic JS workflows for scan + doc-gen. Same output as /init but guaranteed agent counts, word-budget enforcement, structured output, resumability. CLI-only (requires Claude Code Workflow tool). Use for Massive/Colossal/Titan projects or when determinism matters."
---

# /init-pro — Deterministic Workflow Architecture Bootstrap

Same output as `/init` (13 docs + phase-All/) but Phases 2 and 4 use **deterministic Workflow JS scripts** instead of natural-language agent spawning. Claude handles reasoning (Phases 1/3/5); workflows handle mechanical sweeps (Phases 2/4).

**When to use:** Massive+ projects (2000+ files), or anytime deterministic agent spawning + resume matters. CLI-only — Windsurf/Copilot cannot run workflows.

The orchestration follows a strict dependency DAG:

```
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Setup (Claude — interactive + reasoning)                    │
│   Ask project → verify source → read .stub → create folders        │
│   Determine scale → estimate words → build workflow args            │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Source Scan (Workflow JS — deterministic)                   │
│   Script: .claude/workflows/init-phase2-scan.js                     │
│                                                                     │
│   PATH A (≤149 files): Skip workflow — main reads directly          │
│   PATH B (150-1999): word-chunked deep scan (exact agent count)     │
│   PATH C (2000+): surface → schema-validated filter → deep          │
│                   (multi-wave automatic if >16 agents needed)        │
│                                                                     │
│   Returns: { scanResults[], surfaceMetadata, filterStats, agentStats }
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Synthesis (Claude — deep reasoning)                         │
│   Merge scan results + surface metadata for skipped files           │
│   Build full dependency graph                                       │
│   Generate ARCHITECTURE.md (requires full intelligence)             │
│   Generate PhaseMap.md (requires judgment on phase boundaries)      │
│   Generate StructureMap.md (requires PhaseMap)                      │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 4: Doc Generation (Workflow JS — deterministic)                │
│   Script: .claude/workflows/init-phase4-docs.js                     │
│   6 agents in parallel(): GOAL, NewAgent, Estimate+Portability,     │
│   Coverage+Isolation, Optional+GameState, phase-All/                │
│   Returns: { docsGenerated, failed, agents[] }                      │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 5: Verify + surfer.md (Claude — judgment)                      │
│   Completeness check → surfer.md entry → summary                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1 — Setup (Main Agent, Sequential)

1. Ask: "Which project?" → sets `{PROJECT}` (e.g., `project-0`)
2. Verify `MAIN-SOURCE/{PROJECT}/` exists and contains source scripts
3. Read `MAIN-SOURCE/entire-{PROJECT}.stub` — this is the COMPLETE file hierarchy of the original project including assets excluded due to size. Use it to understand the full project scope (3D models, audio, prefabs, scenes, etc.) even if those files aren't physically present.
4. Create `LEARN/{PROJECT}/` folder structure if it doesn't exist
4b. Read ALL templates in `.claude/templates/` — these define the exact structure for every generated doc:
    - `ARCHITECTURE-template.md` → format for ARCHITECTURE.md
    - `PhaseMap-template.md` → format for PhaseMap.md
    - `StructureMap-template.md` → format for StructureMap.md
    - `SystemPortabilityMap-template.md` → format for SystemPortabilityMap.md
    - `SystemIsolationAnalysis-template.md` → format for SystemIsolationAnalysis.md
    - `CoverageMap-template.md` → format for CoverageMap.md
    - `Estimate-template.md` → format for Estimate.md
    - `OptionalFeatures-template.md` → format for OptionalFeatures.md
    - `GameStateSoFar-template.md` → format for GameStateSoFar.md
    - `surfer-template.md` → format for surfer.md
    - `GOAL-general.md` → copied into GOAL.md
    - `NewAgent-general.md` → copied into NewAgent.md

5. Cross-reference the `.stub` hierarchy against `MAIN-SOURCE/{PROJECT}/` — identify:
   - Which folders are asset-only (listed in .stub but not present — 3D, audio, textures, scenes)
   - Which contains engine/third-party DLLs (skip these)
   - Locate the game code folder: `MAIN-SOURCE/{PROJECT}/Scripts/Assembly-CSharp/` (or equivalent)

6. **Enumerate all `.cs` files** in the game code folder using Glob. Count them AND estimate total words (sample 10 files, average words/file × count). Determine scale:
    | Scale | File Count | Words | Architecture Approach |
    |-------|-----------|-------|----------------------|
    | Micro | <50 | <50k | 2-3 phases max, minimal sub-systems, single DataService per domain, skip SystemIsolationAnalysis |
    | Small | 50-149 | 50k-150k | 3-5 phases, standard _-Systems/ approach, full docs |
    | Medium | 150-399 | 150k-400k | 5-8 phases, full architecture, all docs mandatory |
    | Large | 400-799 | 400k-800k | 8-12 phases, aggressive splitting, full docs + Phase Dependency DAG |
    | XLarge | 800-1999 | 800k-1.5M | 10-15 phases, sub-phase strategy, domain boundary splits |
    | Massive | 2000-3999 | 1.5M-2.5M | 12-20+ phases, sub-phase numbering (C-1, C-2), dedicated domain boundaries |
    | Colossal | 4000-6999 | 2.5M-4M | 15-25 phases, domain partitioning, aggressive filtering |
    | Titan | 7000+ | 4M+ | 20-30+ phases, strict domain partitioning, maximum filtering |

6b. **Determine scan strategy** — reference `.claude/instructions/file-scan.md` for full details:
    - **Micro/Small (≤149 files):** No fan-out. Main agent reads all directly.
    - **Medium through XLarge (150-1999 files):** Deep-scan-only (original strategy).
    - **Massive/Colossal/Titan (2000+ files OR >1.5M words):** Two-tier scan (surface → filter → deep).

---

## PHASE 2 — Source Scan (Workflow, Deterministic)

**Goal:** Read every `.cs` file and extract structured metadata using a deterministic JS workflow.

7. **Select scan path and build args:**

   **PATH A — Direct Read (Micro/Small, ≤149 files):**
   Skip workflow. Main agent reads all files directly (fits in 200k). Jump to Phase 3 step 9.

   **PATH B or C — Use Workflow:**
   Build the args object and invoke the workflow. **First, create the `LEARN/{PROJECT}/_scan/` directory** (e.g. `mkdir -p LEARN/{PROJECT}/_scan`) — workflow agents will write scan results there.

   **HOW TO BUILD THE FILE LIST:**
   1. Use the **Glob tool** with pattern `**/*.cs` in the game code folder — it returns all paths directly into your context.
   2. The Glob result IS the file list. Pass it directly as the `files` array.
   3. **FORBIDDEN:** Do NOT use `find`, `bash`, `node`, `python`, temp files, or ANY shell command to build the file list. The Glob tool does this natively and correctly.

   ```
   Workflow({
     scriptPath: ".claude/workflows/init-phase2-scan.js",
     args: {
       project: "{PROJECT}",
       files: ["U:/IMPL/IMPL/MAIN-SOURCE/{PROJECT}/Scripts/Assembly-CSharp/File1.cs", "File2.cs", ...],
       totalWords: estimated_total_words,
       scale: "Medium" | "Large" | "XLarge" | "Massive" | "Colossal" | "Titan",
       scanPath: "B" | "C",
       avgWordsPerFile: avg_words_per_file
     }
   })
   ```

   The Glob tool already returns paths sorted. For large projects (2000+ files), the array will be large — that's expected and supported. The Workflow tool accepts large args values natively.

### What the workflow does internally:

- **PATH B (150-1999 files):** Computes `ceil(totalWords / 112,000)` deep agents, chunks files by accumulated words (folder-sorted), spawns all in `parallel()`, returns results.
- **PATH C (2000+ files):** Spawns `ceil(fileCount / 600)` surface agents → collects metadata → invokes a filter agent with `{schema: FILTER_SCHEMA}` for structured JSON classification → spawns word-chunked deep agents on filtered list (multi-wave via sequential `parallel()` calls if >16 needed) → returns merged results.

### What it returns:

```json
{
  "scanDir": "LEARN/{PROJECT}/_scan",
  "deepScanFiles": ["LEARN/{PROJECT}/_scan/deep-1.md", "deep-2.md", ...],
  "surfaceScanFiles": ["LEARN/{PROJECT}/_scan/surface-1.md", ...],
  "surfaceMergedFile": "LEARN/{PROJECT}/_scan/surface-merged.md (PATH C only, null for PATH B)",
  "filterStats": { "totalFiles": N, "deepScanCount": N, "skippedCount": N, "filterReduction": "X%" },
  "agentStats": { "surfaceAgents": N, "deepAgents": N, "totalAgents": N }
}
```

**KEY: File-based handoff.** Scan results are written to `LEARN/{PROJECT}/_scan/` on disk — NOT returned as in-memory text. This keeps the orchestrator context lean (~5% usage instead of 99%). Phase 3 agents read from these files directly.

### Determinism guarantees (vs /init):

| Feature | /init (natural-language) | /init-pro (workflow) |
|---------|------------------------|---------------------|
| Agent count | Claude interprets "spawn N" | **Exact** — JS computes `ceil(words/112k)` |
| Word-budget per agent | Claude approximates | **Validated** — JS asserts < 150k tokens |
| Multi-wave | Claude might forget wave 2 | **Automatic** — JS loop |
| Filter output | Free-text | **JSON schema** validated |
| Context pressure | Scan text held in main loop (99%) | **File-based** — main loop stays <30% |
| Resume on failure | Re-run from scratch | **`resumeFromRunId`** replays cached agents |

### Error handling:

- If workflow returns partial results (fewer `deepScanFiles` than expected), check which `_scan/deep-N.md` files exist on disk. For missing ones, fall back to manually reading those file chunks.
- If workflow fails entirely, fall back to `/init` Phase 2 behavior (manual agent spawning).

**Wait for workflow to complete before proceeding.**

---

## PHASE 3 — Synthesis (Background Agents, Disk-Based)

Scan results are on disk at `LEARN/{PROJECT}/_scan/`. The main loop stays lean — it spawns background agents that read from disk and write docs to disk. The main loop only tracks: file paths, agent status, and metadata (agentStats, filterStats).

**Context budget rule:** After Phase 2 completes, the main loop should be under 30% context. If you find yourself reading scan file contents into your own context, STOP — spawn an agent to do it instead.

### Merge & Analyze

9. **Spawn a background agent** to synthesize ARCHITECTURE.md from the scan files on disk. This keeps the main loop's context lean.

   The agent should:
   - Read ALL files in `LEARN/{PROJECT}/_scan/deep-*.md` (the scan results written by Phase 2)
   - If Two-Tier (PATH C): also read `LEARN/{PROJECT}/_scan/surface-merged.md` for lightweight entries
   - Combine all DEPENDENCY EDGES tables → full dependency graph
   - Combine all SINGLETONS FOUND → execution order candidates
   - Combine all INTERFACES FOUND → interface catalog
   - Combine all GOD OBJECTS → split candidate list
   - Combine all EVENTS DECLARED → event communication map
   - Combine all THIRD-PARTY USAGE → third-party dependency list
   - Combine all COLLECTIONS FOR DATASERVICE → DataService extraction candidates
   - Count total files analyzed. Cross-check against Glob count from step 6.
   - **If Two-Tier (PATH C):** Files that were NOT deep-scanned appear as lightweight entries (class name, type, base class, line count, interfaces) from surface-merged.md. They still get assigned to phases in PhaseMap and tracked in CoverageMap.

   **IMPORTANT:** Do NOT read the scan files yourself. Spawn the agent and let IT read them. Your context stays lean — you only track file paths and metadata.

   The ARCHITECTURE agent should ALSO perform genre classification and skill selection as part of its analysis (steps 9b and 9c below) and include the results in a `## Genre & Skills` section at the top of ARCHITECTURE.md.

9b. **Genre Classification** — The ARCHITECTURE agent determines the project's primary genre(s) from source patterns:
    | Genre | Detection Signals |
    |-------|------------------|
    | Mining/Factory | OreType, Conveyor, Smelter, Belt, Recipe |
    | Tycoon | Money, Customer, Satisfaction, Staff, Building placement |
    | Combat/Action | Health, Damage, Weapon, Enemy, Projectile |
    | Horror | Sanity, Flashlight, JumpScare, DayNight fear |
    | Colony/Strategy | Colonist, Job, Need, Zone, Stockpile |
    | Puzzle | Level, Solution, Grid, Tile, Move |
    | Simulation | Physics, Vehicle, Bridge, Stress |

9c. **Skill Selection** — Based on genre + detected patterns, note which skills apply:
    - Save/Load: ISaveable or PlayerPrefs or JSON serialization found? → `unity-save-load`
    - FSM: IState or StateMachine or state pattern found? → `unity-fsm`
    - Day/Night: DayNightCycle or TimeOfDay or lighting transitions? → `unity-day-night`
    - AI Navigation: NavMeshAgent or AIPath or patrol? → `unity-ai-navigation`
    - Networking: FishNet/Photon/Mirror imports? → `unity-networking`
    - Quest: Quest or Objective or Journal? → `unity-quest`
    - Procedural: Perlin or seed-based generation or chunks? → `unity-procedural-gen`
    - Camera: Cinemachine or custom camera rig? → `unity-camera`
    - Testing: DEBUG_Check patterns? → `unity-testing`
    - Scene Setup: URP pipeline, lighting bake, layer config? → `unity-scene-setup`
    - Audio: AudioSource or SoundManager or FMOD imports? → `unity-audio`
    - Animation: Animator or AnimatorController or DOTween or Spine? → `unity-animation`
    - Prefab Hierarchy: nested prefab structure, ViewModel/WorldModel splits? → `unity-prefab-hierarchy`
    - Dialogue: DialogueManager or YarnSpinner or Ink or PixelCrushers? → `unity-dialogue`
    - Input: New Input System or Rewired or InputActions asset or rebinding? → `unity-input`
    - Physics: Rigidbody joints, ragdoll, OverlapSphere, physics-based grab, stress simulation? → `unity-physics`
    - Inventory: Item slots, stacking, drag-drop, equipment, hotbar? → `unity-inventory`
    - Grid Building: Grid placement, ghost preview, building validation, snap-to-grid? → `unity-grid-building`

### Generate ARCHITECTURE.md

10. The background agent creates `LEARN/{PROJECT}/ARCHITECTURE.md` by reading ALL `_scan/deep-*.md` files from disk. It follows `.claude/templates/ARCHITECTURE-template.md` with this **mandatory Table of Contents**:

```
# {PROJECT} — Detailed Architecture Documentation

1. Project Overview
   - Game description (1-2 paragraphs — what genre, what the player does)
   - Project structure (folder tree of source)
   - Third-party dependencies (table: Library | Purpose)

2. High-Level Architecture Diagram
   - ASCII art: Singleton Managers → Player Systems → World Systems → UI
   - Data flow diagrams for major game loops (resource lifecycle, progression, etc.)

3. Core Architectural Pattern: Singleton Managers
   - Singleton base class code (from original source)
   - Execution order table (priority | manager | reason)
   - How managers communicate in original source (tight coupling hotspots)

4. System-by-System Breakdown
   - 4.1 [System Name] — files, responsibilities, key code, data flow, coupling
   - 4.2 [System Name] — ...
   - (one subsection per major system — typically 10-20 systems)
   - Each subsection: file list, class hierarchy, SerializeField deps, public API,
     events fired/subscribed, god-object analysis (if >200 lines doing 3+ things)

5. Key Design Patterns & Techniques
   - Object pooling, interfaces, coroutine patterns, event-driven, etc.

6. Coupling Analysis
   - Table: every FindObjectOfType call (file | target type | how to decouple)
   - Table: every direct cross-system reference (file A | file B | how to decouple)
   - Table: every static instance access (file | singleton | read or command)

7. God Objects — Split Candidates
   - Table: files >200 lines doing 3+ things
   - For each: what it does, suggested split into new architecture roles

8. Critique & Thoughts
   - What the original source does well (preserve these)
   - What to improve (these drive the architecture transformation)

9. File Index
   - Every script with one-line purpose (table: File | Lines | Purpose)
```

This analysis is the foundation for PhaseMap and StructureMap. Be thorough — missing systems here means missing phases later.

**Once ARCHITECTURE.md is written to disk, spawn a SECOND background agent for PhaseMap + StructureMap.** That agent reads ARCHITECTURE.md from disk (not from the main loop's context). The main loop only needs to know: "ARCHITECTURE.md is at `LEARN/{PROJECT}/ARCHITECTURE.md`" — it does NOT need to hold the content.

### Generate PhaseMap.md

11. The PhaseMap agent reads `LEARN/{PROJECT}/ARCHITECTURE.md` + `_scan/deep-*.md` and groups all source scripts into logical phases by dependency order:
    - Phase = set of scripts that can be built and tested independently
    - Rule: each phase depends only on earlier phases, never forward
    - **SIZE CAP: Max ~25 scripts per phase.** If a phase exceeds 25 files, split it into sub-phases (e.g., phase-C → phase-C + phase-D). Reasons: hand-typing fatigue, vertical slice testing scope, manageable PR size. Count ALL files (SO_, Field_, DataService, Orchestrator, SubManager, interfaces, bridges, enums, tests).
    - For each phase: file list with folder placement, "What It Looks Like When Running" (conversational), difficulty rating, weight %
    - Phase ordering (dependency order):
      1. Core + Economy + UI framework (shop, interaction)
      2. Environment (level-specific setup)
      3. Player (controller, inventory, tools, grabbing)
      4. Primary game mechanic (game-specific: mining, combat, building, etc.)
      5. Secondary mechanics (automation, processing, crafting)
      6. Content systems (quests, research, progression)
      7. Persistence (save/load)
      8. Polish (audio, settings, menus)
      9. Final (debug, demo, world events)

12. For each phase include:
    - **Domain boundary** — what this phase covers (one sentence)
    - **File list** — every .cs file with exact folder placement and one-line purpose. **Primary placement = `_-Systems/XxxSystem/`** for all feature code (SO_, Field_, DataService, DataWrapper, Orchestrator, SubManager, Interface/, Bridge/). Only shared infra goes in numbered folders (0-Core/, 2-Data/Enums/, 4-Utils/). **80% rule: at least 80% of scripts MUST be inside `_-Systems/`.**
    - **_-Systems/ assignments** — which files group into systems (3+ tightly coupled files per system). Most scripts should be inside a system.
    - **Modifications to earlier phases** — table: `| File | How (partial/direct) | Change | Why |`
    - **Vertical Slice Tests** — what to test, prerequisites, checklist per system
    - **"What It Looks Like When Running"** — conversational description of the player experience

13. Append **Gap Audit** at the end of PhaseMap:
    ```
    | Phase | +Scripts | Key Additions | Priority |
    |-------|---------|---------------|----------|
    ```
    - **Critical** — source has it, missing = broken fidelity
    - **Important** — source has it, adds meaningful behavior
    - **Polish** — nice-to-have, goes in `#region extra` blocks

13b. **Dependency DAG Verification** — After all phases are defined, draw an ASCII dependency DAG:
    ```
    phase-All ← phase-A ← phase-B ← phase-C
                                  ↖ phase-D
    ```
    - Every arrow must point LEFT (to an earlier phase). If any arrow points RIGHT, reorder phases.
    - Verify: for EACH phase, list every class it imports from another phase. If any import comes from a LATER phase, either reorder or split.
    - Verify: each phase compiles with ONLY earlier phases present (no forward references).
    - Include this DAG in PhaseMap.md as a "Phase Dependency Order" section.

13c. **Phase Size Validation** — After splitting, verify:
    ```
    | Phase | File Count | Status |
    |-------|-----------|--------|
    ```
    - ✅ = ≤25 files
    - ⚠️ = 26-30 files (acceptable if tightly coupled, add justification)
    - ❌ = 31+ files (MUST split — no exceptions)

14. Create `LEARN/{PROJECT}/PhaseMap.md` — follow the structure in `.claude/templates/PhaseMap-template.md`

### Generate StructureMap.md

15. For each phase, define the internal structure:
    - **DataService candidates** — every `List<T>` / `Dictionary<K,V>` extractable from MonoBehaviours into pure C# DataService classes
    - For each DataService: exact collections (field names, types), methods (signatures, what they return/do), nested types (with all fields), `GetSnapShotForTest()` format
    - **SO_ / Field_ / W prefix assignments** — which original scripts become which role
    - **Orchestrator triads** — which SubManager owns which DataService, which Orchestrator wires which Field_ types
    - **Interface candidates** — cross-system communication points, who owns, who implements
    - **_-Systems/ structure** — which scripts go in which system folder, with Interface/ and Bridge/ subfolders
    - **Decision trees** — for ambiguous scripts: "Is it a Manager or MonoBehaviour? Does it need DataService extraction?"
    - **Full folder tree per phase** — ASCII tree showing exact file placement:
      ```
      phase-X/
      ├── _-Systems/
      │   ├── FeatureASystem/
      │   │   ├── SO_FeatureADef.cs
      │   │   ├── Field_FeatureA.cs
      │   │   ├── WFeatureA.cs
      │   │   ├── FeatureADataService.cs
      │   │   ├── FeatureAOrchestrator.cs
      │   │   ├── FeatureAUI.cs
      │   │   ├── Interface/
      │   │   │   └── IFeatureAProvider.cs
      │   │   ├── Bridge/
      │   │   │   └── FeatureAContextBridge.cs
      │   │   ├── Test.md
      │   │   └── Dependency.md
      │   └── FeatureBSystem/
      │       └── ...
      ├── 0-Core/
      │   └── GameEvents.cs
      ├── 2-Data/Enums/
      │   └── GlobalEnumsX.cs
      └── 4-Utils/
          └── PhaseXLOG.cs
      ```
      This tree is the agent's build target — every file listed here MUST be produced by `/build-phase`.

16. Create `LEARN/{PROJECT}/StructureMap.md` — follow the structure in `.claude/templates/StructureMap-template.md`

---

## PHASE 4 — Doc Generation (Workflow, Deterministic)

**Now that ARCHITECTURE.md, PhaseMap.md, and StructureMap.md exist**, invoke the doc generation workflow:

```
Workflow({
  scriptPath: ".claude/workflows/init-phase4-docs.js",
  args: {
    project: "{PROJECT}",
    stubPath: "MAIN-SOURCE/entire-{PROJECT}.stub",
    skills: ["unity-save-load", "unity-fsm", ...]  // from step 9c
  }
})
```

### What it does:

Spawns 6 agents in `parallel()`:
- **Agent A:** GOAL.md (from GOAL-general.md template + PhaseMap + ARCHITECTURE)
- **Agent B:** NewAgent.md (from NewAgent-general.md template + PhaseMap + ARCHITECTURE)
- **Agent C:** Estimate.md + SystemPortabilityMap.md (from templates + PhaseMap + StructureMap)
- **Agent D:** CoverageMap.md + SystemIsolationAnalysis.md (from templates + PhaseMap + StructureMap + ARCHITECTURE)
- **Agent E:** OptionalFeatures.md + GameStateSoFar.md (from templates + PhaseMap + ARCHITECTURE + StructureMap)
- **Agent F:** phase-All/ scaffolding (Singleton.cs, GameEvents.cs, UIManager.cs, GlobalEnumsAll.cs, Utils.cs, 7-3D/ docs)

Each agent reads its required templates + Phase 3 docs and writes its assigned files. Full prompts are embedded in the workflow script.

### What it returns:

```json
{
  "docsGenerated": 6,
  "failed": 0,
  "agents": [
    { "index": 0, "label": "GOAL.md", "success": true },
    { "index": 1, "label": "NewAgent.md", "success": true },
    { "index": 2, "label": "Estimate+Portability", "success": true },
    { "index": 3, "label": "Coverage+Isolation", "success": true },
    { "index": 4, "label": "Optional+GameState", "success": true },
    { "index": 5, "label": "phase-All", "success": true }
  ]
}
```

### Error handling:

- If any agent fails (`success: false`), generate that specific doc directly in the main context.
- The `agents[]` array tells you exactly which ones need manual generation.

**Wait for workflow to complete before proceeding.**

---

## PHASE 5 — Verify & Finalize (Main Agent, Sequential)

17. **Generate surfer.md** — Create `LEARN/{PROJECT}/surfer.md` following `.claude/templates/surfer-template.md`:

    ```markdown
    # {PROJECT} — Reasoning Log

    > Append after each agent prompt. Never edit previous entries — only add new ones.
    > Each entry captures: what was asked, what was decided, what was discovered, what changed.

    ---

    ## Prompt 1 — Initial Source Analysis (`/init`)

    **Asked:** Bootstrap all architecture docs from raw source.

    **Key Discoveries:**
    - [list major findings: god-objects, coupling hotspots, system count, total files]
    - [list surprising patterns: unusual inheritance, missing events, duplicate logic]

    **Decisions Made:**
    - [phase grouping rationale: why these boundaries]
    - [split decisions: which god-objects to split and how]
    - [system classifications: which systems are L0 vs L1+]

    **What Changed:** Created ARCHITECTURE.md, GOAL.md, NewAgent.md, PhaseMap.md, StructureMap.md, Estimate.md, SystemPortabilityMap.md, CoverageMap.md, OptionalFeatures.md, GameStateSoFar.md, SystemIsolationAnalysis.md, surfer.md, phase-All/.

    ---
    ```

18. **Run completeness check** — verify ALL of these pass:
    - [ ] ARCHITECTURE.md has ALL source files documented (cross-check file count from step 6). For Two-Tier projects: deep-scanned files get full entries, surface-only files get lightweight entries (class, type, base, line count). Both categories must be present — no orphans.
    - [ ] PhaseMap covers every source file (no orphans — verify against CoverageMap)
    - [ ] PhaseMap dependency DAG has no forward references (all arrows point LEFT)
    - [ ] PhaseMap phase sizes: ALL phases ≤25 files (or justified ⚠️ at 26-30)
    - [ ] StructureMap has DataService specs for every phase that needs them
    - [ ] StructureMap has full ASCII folder tree per phase
    - [ ] GOAL.md is customized (no remaining `[PROJECT_NAME]` placeholders)
    - [ ] NewAgent.md is customized (no remaining `[PROJECT_NAME]` or `[PHASE_X]` placeholders)
    - [ ] Estimate.md has hours for every phase
    - [ ] SystemPortabilityMap has every system classified
    - [ ] SystemIsolationAnalysis.md has communication matrix + interface ownership + bridge catalog + events flow
    - [ ] CoverageMap has every source file → phase mapping
    - [ ] CoverageMap has Interface Inventory, Bridge Inventory, and GameEvents Registry sections
    - [ ] OptionalFeatures has specific integration points (not just categories) with code patterns
    - [ ] GameStateSoFar.md has header + "After /init" section with game pitch
    - [ ] phase-All/ has Singleton, GameEvents, UIManager, GlobalEnumsAll, Utils (EconomyManager is phase-specific, NOT in phase-All)
    - [ ] phase-All/7-3D/ has MODEL.md, ANIM.md, WORLD.md (or N/A placeholders)
    - [ ] surfer.md has Prompt 1 entry

    **If any check fails:** Fix it directly. If a Phase 4 agent missed something, generate the missing content in the main context.

19. **Output summary** to user:
    - Total scripts found (code count + total words)
    - Scale classification (Micro/Small/Medium/Large/XLarge/Massive/Colossal/Titan)
    - Scan path used (A: direct / B: deep-only / C: two-tier)
    - Total assets found (from .stub)
    - Phases planned (count + names)
    - Systems identified (count)
    - Estimated hours
    - phase-All/ scripts created (count)
    - Docs generated (count — including GameStateSoFar.md, SystemIsolationAnalysis.md)
    - **Agent stats:** surface agents + deep agents + doc agents = total agent calls
    - **If Two-Tier:** files surface-scanned, files deep-scanned, files skipped (surface-only), filter reduction %

---

## Scale-Adaptive Behavior

| Scale | Words | Surface Agents | Deep Agents `ceil(w/112k)` | Doc Agents | Total Agents | Speedup |
|-------|-------|---------------|---------------------------|------------|--------------|---------|
| Micro (<50k) | <50k | 0 | 0 (main reads) | 6 | 6 | ~2x |
| Small (50k-150k) | 50k-150k | 0 | 0 (main reads) | 6 | 6 | ~2x |
| Medium (150k-400k) | 150k-400k | 0 | 2-4 | 6 | 8-10 | ~3x |
| Large (400k-800k) | 400k-800k | 0 | 4-8 | 6 | 10-14 | ~4x |
| XLarge (800k-1.5M) | 800k-1.5M | 0 | 8-14 | 6 | 14-20 | ~5-6x |
| Massive (1.5M-2.5M) | 1.5M-2.5M | 4-8 | 8-16 | 6 | 18-30 | ~6-8x |
| Colossal (2.5M-4M) | 2.5M-4M | 8-14 | 16 (1 wave) | 6 | 30-36 | ~8-10x |
| Titan (4M+) | 4M+ | 14-16 | 16-32 (2 waves) | 6 | 36-54 | ~10-12x |

**Why this works:**
- **Distribution is word-primary** — agents are sized by total words (≤112k words = ≤150k tokens per agent), not file count. This prevents both context overflow (too many heavy files) and waste (too many tiny files per agent).
- **Surface agents** extract metadata only (~30-50 output words/file) — trivially within budget even at 600 files/agent.
- **Deep agents** get ≤112k words of source each (architecturally significant files only) — full focused attention within 200k context.
- **The filter step** (between surface and deep) eliminates 50-70% of files that don't need full analysis. Their surface metadata still flows into Phase 3.
- **Multi-wave deep scan** runs sequential batches of 16 agents when filtered_words > 16 × 112k = 1.79M.
- **Doc generation agents** each read only 3-4 docs they need (all <100k combined).
- Full strategy details: `.claude/instructions/file-scan.md`

### Project Coverage Validation

Agent counts derived from word-based formula: `deep_agents = ceil(words / 112,000)`

| Example-Project | Files | Words | Scale | Scan Path | Deep Agents (from words) | Total |
|---------|-------|-------|-------|-----------|--------------------------|-------|
| project-titan | ~10,000 | ~3.1M | Titan | Two-tier (16 surface → filter → ~28 deep, 2 waves) | 28 | ~50 |
| project-colossal-heavy | ~5,800 | ~1.8M | Colossal | Two-tier (10 surface → filter → ~16 deep) | 16 | ~32 |
| project-colossal | ~4,300 | ~1.1M | Colossal | Two-tier (7 surface → filter → ~10 deep) | 10 | ~23 |
| project-massive-dense | ~3,300 | ~1.8M | Massive | Two-tier (6 surface → filter → ~16 deep) | 16 | ~28 |
| project-massive-light | ~3,400 | ~387k | Massive | Two-tier (6 surface → filter → ~4 deep) | 4 | ~16 |
| project-xlarge | ~1,800 | ~623k | XLarge | Deep-only (ceil(623k/112k) = 6 agents) | 6 | ~12 |
| project-large | ~590 | ~184k | Large | Deep-only (ceil(184k/112k) = 2 agents) | 2 | ~8 |
| project-medium | ~245 | ~34k | Medium | Deep-only (ceil(34k/112k) = 2 min) | 2 | ~8 |
| project-micro | ~31 | ~33k | Micro | Main reads all | 0 | ~6 |

---

## Fallback Behavior

- **If an agent fails or returns incomplete data:** The main agent reads the missing files directly and fills the gap. The parallel architecture is additive — falling back to sequential never loses functionality.
- **If the project is Micro/Small (≤149 files):** Skip Phase 2 entirely. Main agent reads all files directly (they fit in 200k). Phase 4 parallelization still applies for doc generation.
- **If context compaction triggers during Phase 3:** Unlikely with file-based handoff (main loop stays <30%), but if it happens: the main loop only holds file paths and metadata, so compaction loses nothing critical. Background agents have their own fresh contexts reading from disk.
- **If a surface agent fails (Two-Tier only):** Main agent re-reads that chunk's files with surface-level extraction directly. Slower but functional.
- **If filtered_words > 1.79M (needs >16 deep agents):** Run deep scan in sequential waves (16 agents per wave, each getting ≤112k words). See `file-scan.md` for multi-wave details.
- **If per-agent token budget still exceeds 150k after filtering:** Tighten the filter — drop "Conditional" category entirely and deep-scan only "Must" + "Should" files. The conditionally-skipped files still appear in docs via their surface metadata.
- **If total agents would exceed 60:** The project is at the extreme end (Titan). Cap deep waves at 2 (32 deep agents max). If still insufficient, accept slightly reduced per-file attention quality by increasing word budget to 130k/agent.
- **Surface metadata for skipped files:** Files that don't get deep-scanned still appear in ARCHITECTURE.md, PhaseMap.md, and CoverageMap.md using their surface metadata from `_scan/surface-merged.md` (class name, type, base class, interfaces, line count). This ensures 100% coverage without 100% deep reads.
