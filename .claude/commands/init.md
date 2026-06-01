---
description: "Analyse a raw source project and bootstrap all architecture docs from scratch. Use when: starting a new project, initial source analysis, generating ARCHITECTURE.md GOAL.md NewAgent.md PhaseMap.md StructureMap.md Estimate.md SystemPortabilityMap.md CoverageMap.md OptionalFeatures.md GameStateSoFar.md surfer.md phase-All/"
---

# /init — Agentic Architecture Bootstrap

This command uses **parallel subagents** to analyze source code faster and with better coverage than sequential reading allows. The orchestration follows a strict dependency DAG:

```
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Setup (sequential — main agent)                            │
│   Ask project → verify source → read .stub → create folders        │
│   Determine scale → select scan path (A/B/C)                       │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Parallel Source Scan (fan-out — multiple agents)           │
│                                                                     │
│   PATH A (≤149 files): Main reads all directly — skip agents        │
│                                                                     │
│   PATH B (150-1999 files): Deep-only scan                           │
│     Chunk into groups of ~80-150 → 2-12 deep agents                │
│     Each: full structural extraction (deps, events, interfaces)     │
│                                                                     │
│   PATH C (2000+ files): Two-tier scan                               │
│     Step 1: Surface scan (4-16 agents, 400-700 files each)          │
│       → metadata only (signatures, types, inheritance)              │
│     Step 2: Filter (main agent) → classify → drop 50-70% trivial   │
│     Step 3: Deep scan (8-32 agents, filtered files only)            │
│       → full structural extraction on significant files             │
│     (Multi-wave if filtered > 1920 files)                           │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Synthesis (sequential — main agent)                        │
│   Merge deep results + surface metadata for skipped files           │
│   Build full dependency graph                                       │
│   Generate ARCHITECTURE.md (requires full picture)                  │
│   Generate PhaseMap.md (requires ARCHITECTURE)                      │
│   Generate StructureMap.md (requires PhaseMap)                      │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 4: Parallel Doc Generation (fan-out — 6 agents)               │
│   Agent A: GOAL.md (from template + PhaseMap)                       │
│   Agent B: NewAgent.md (from template + PhaseMap)                   │
│   Agent C: Estimate.md + SystemPortabilityMap.md                    │
│   Agent D: CoverageMap.md + SystemIsolationAnalysis.md              │
│   Agent E: OptionalFeatures.md + GameStateSoFar.md                  │
│   Agent F: phase-All/ scaffolding scripts                           │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 5: Verify + surfer.md (sequential — main agent)               │
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

## PHASE 2 — Parallel Source Scan (Fan-Out Agents)

**Goal:** Read every `.cs` file and extract structured metadata. Distribute the work across parallel agents so each agent has a manageable context load.

**IMPORTANT:** Read `.claude/instructions/file-scan.md` for the complete two-tier scan strategy, prompt templates, filter rules, and fallback behaviors. The instructions below are the execution steps.

### Scan Path Selection

7. **Select scan path based on scale:**

   **PATH A — Direct Read (Micro/Small, ≤149 files):**
   Skip fan-out. Main agent reads all files directly (fits in 200k). Jump to Phase 3 step 9.

   **PATH B — Deep-Only Scan (Medium/Large/XLarge, 150-1999 files):**
   Standard chunked deep scan. Jump to step 8-DEEP.

   **PATH C — Two-Tier Scan (Massive/Colossal/Titan, 2000+ files):**
   Surface scan first, then filtered deep scan. Jump to step 8-SURFACE.

---

### PATH C: Two-Tier Scan (Massive/Colossal/Titan)

> Full strategy, prompt templates, filter rules, and word-budget math are in `.claude/instructions/file-scan.md`. Steps below are the execution sequence.

8-SURFACE. **Launch Surface Scan agents** — lightweight metadata extraction of ALL files:

   **Chunking:** File-count-based (exception — surface agents skip method bodies so input words are negligible; the constraint is output catalog length). Formula from `file-scan.md`: `ceil(file_count / 600)` agents (capped at 16), sorted by folder path. Each agent extracts metadata only (no method bodies).

   **Prompt:** Use the Surface Agent Prompt Template from `file-scan.md`.

8-FILTER. **Merge surface results and classify** (main agent, sequential):

   1. Combine all surface catalogs → single merged Classification Catalog.
   2. Apply filter rules from `file-scan.md` (Must/Should/Conditional/Skip) → produce filtered file list.
   3. Estimate filtered words: `sum(file.line_count × 8)` for all files passing filter.
   4. Compute deep agent count: `min(16, ceil(filtered_words / 112,000))`.
   5. Validate per-agent token budget: `filtered_words / agent_count × 1.33 < 150,000`.
   6. **Build chunked file lists for deep agents:** Sort filtered files by folder path, walk the list accumulating words per chunk. When a chunk reaches `filtered_words / agent_count`, emit it and start a new chunk. This produces the actual file-path lists to hand to each deep agent.

8-DEEP-FILTERED. **Launch Deep Scan agents on filtered file list:**

   Standard deep scan (same prompt as PATH B step 8-DEEP-LAUNCH) but ONLY on files that passed the filter. Chunk by accumulated words (≤112k words per agent), not file count.

   **If more than 16 agents needed:** Run in sequential waves (wave 1: 16 agents, wave 2: remainder).

   **After deep scan completes:** Merge deep scan results WITH surface metadata for skipped files.

   Jump to Phase 3 step 9.

---

### PATH B: Deep-Only Scan (Medium/Large/XLarge)

> Chunking is word-primary. See `.claude/instructions/file-scan.md` "Distribution Principle" section.

8-DEEP. **Compute agent count from total words:**
   ```
   agents_needed = ceil(total_words / 112,000)
   agents_to_launch = min(16, max(2, agents_needed))
   ```

   **Chunk by accumulated words:** Sort files by folder path, then walk the list accumulating words per chunk. When a chunk reaches `total_words / agents_to_launch`, emit it and start a new one. This keeps related files together while respecting the word budget per agent.

8-DEEP-LAUNCH. **Launch parallel Agent calls** — one per chunk. Each agent gets this prompt:

   ```
   You are a source code analyzer for a Unity game project called {PROJECT}.
   
   Your job: Read every .cs file in your assigned list and extract structured metadata.
   Return your results as a single structured report (plain text, not JSON).
   
   ## Your assigned files (read ALL of them):
   {LIST_OF_FILE_PATHS_FOR_THIS_CHUNK}
   
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
   
   Be thorough. Read EVERY file. Miss nothing. The accuracy of the entire project
   architecture depends on your completeness.
   ```

   **CRITICAL:** Each agent MUST be given the exact file paths to read (absolute paths). The main agent builds the path list from the Glob results.

8-DEEP-WAIT. **Wait for all scan agents to complete.** Collect all results. (Applies to both PATH B and PATH C deep scan.)

---

## PHASE 3 — Synthesis (Main Agent, Sequential)

The main agent now has all scan results from Phase 2 (deep scan results + surface metadata for skipped files if Two-Tier). This is the critical synthesis step — it CANNOT be parallelized because each doc depends on the previous.

### Merge & Analyze

9. **Merge all agent reports** into a unified picture:
   - Combine all DEPENDENCY EDGES tables → full dependency graph
   - Combine all SINGLETONS FOUND → execution order candidates
   - Combine all INTERFACES FOUND → interface catalog
   - Combine all GOD OBJECTS → split candidate list
   - Combine all EVENTS DECLARED → event communication map
   - Combine all THIRD-PARTY USAGE → third-party dependency list
   - Combine all COLLECTIONS FOR DATASERVICE → DataService extraction candidates
   - Count total files analyzed. Cross-check against Glob count from step 6.
   - **If Two-Tier (PATH C):** Also merge surface metadata for files that were NOT deep-scanned. These files appear in ARCHITECTURE.md as lightweight entries (class name, type, base class, line count, interfaces) rather than full breakdowns. They still get assigned to phases in PhaseMap and tracked in CoverageMap.

9b. **Genre Classification** — Determine the project's primary genre(s) from source patterns:
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

10. Create `LEARN/{PROJECT}/ARCHITECTURE.md` — follow `.claude/templates/ARCHITECTURE-template.md`. Use this **mandatory Table of Contents**:

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

### Generate PhaseMap.md

11. Group all source scripts into logical phases by dependency order:
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

## PHASE 4 — Parallel Doc Generation (Fan-Out Agents)

**Now that ARCHITECTURE.md, PhaseMap.md, and StructureMap.md exist**, the remaining docs can be generated **in parallel** because they only READ the core docs — they don't depend on each other.

**Launch 6 parallel Agent calls:**

### Agent A — GOAL.md

```
You are generating GOAL.md for the Unity project {PROJECT}.

Read these files:
- .claude/templates/GOAL-general.md (the template — copy its ENTIRE content)
- LEARN/{PROJECT}/PhaseMap.md (for phase names and system names)
- LEARN/{PROJECT}/ARCHITECTURE.md (for project-specific patterns — sections 4, 5, 8)

Then create LEARN/{PROJECT}/GOAL.md by:
1. Copying the ENTIRE content of GOAL-general.md
2. Replacing all [PROJECT_NAME] with {PROJECT}
3. Replacing [PHASE_X] placeholders with actual phase names from PhaseMap
4. Filling "User's Coding Style — CUSTOMIZE THIS" with "TO BE FILLED after user types Phase A" 
   (unless LEARN/{PROJECT}/handTyped(latest)/ exists — if so, read it and fill from that)
5. Filling "Phase Overview — CUSTOMIZE THIS" table with actual phases from PhaseMap
6. Adding project-specific utility extensions found in ARCHITECTURE.md
7. Adding project-specific enums, tags, layers found in ARCHITECTURE.md

CRITICAL: GOAL.md describes the REDESIGNED architecture (what to build), NOT the original source patterns.
Write the file to LEARN/{PROJECT}/GOAL.md.
```

### Agent B — NewAgent.md

```
You are generating NewAgent.md for the Unity project {PROJECT}.

Read these files:
- .claude/templates/NewAgent-general.md (the template — copy its ENTIRE content)
- LEARN/{PROJECT}/PhaseMap.md (for phase names, first phase details)
- LEARN/{PROJECT}/ARCHITECTURE.md (for discovered patterns and skills)

Then create LEARN/{PROJECT}/NewAgent.md by:
1. Copying the ENTIRE content of NewAgent-general.md
2. Replacing all [PROJECT_NAME] with {PROJECT}
3. Replacing [PHASE_X] with Phase A (first phase from PhaseMap)
4. Updating the "First Prompt" template with project-specific phase/system names
5. Filling the reference files table with actual file paths
6. Adding project-specific patterns from ARCHITECTURE.md
7. Recording applicable skills in the reference table

Write the file to LEARN/{PROJECT}/NewAgent.md.
```

### Agent C — Estimate.md + SystemPortabilityMap.md

```
You are generating Estimate.md and SystemPortabilityMap.md for the Unity project {PROJECT}.

Read these files:
- .claude/templates/Estimate-template.md
- .claude/templates/SystemPortabilityMap-template.md
- LEARN/{PROJECT}/PhaseMap.md (all phases with file lists)
- LEARN/{PROJECT}/StructureMap.md (system structure details)

Generate TWO files:

FILE 1: LEARN/{PROJECT}/Estimate.md
Follow Estimate-template.md. Hours per phase using these complexity tiers:
| Script Complexity | Examples | Avg Time |
|-------------------|---------|----------|
| **Simple** (enums, stubs, interfaces, SOs, entities) | GlobalEnumsX, SO_Def, SaveEntry | ~15 min |
| **Medium** (DataService, DataWrapper, Field_, Utils, tests) | ItemDataService, WItem, Field_Slot | ~30 min |
| **Complex** (MonoBehaviours, Orchestrators, Managers, Player scripts) | PlayerMovement, Orchestrator | ~60 min |
Formula: (simple × 15 + medium × 30 + complex × 60) + scene/testing buffer (~25%)

FILE 2: LEARN/{PROJECT}/SystemPortabilityMap.md
Follow SystemPortabilityMap-template.md. For every system in every phase:
- Portability level (L0 = zero deps, L1+ = each import = +1)
- System shape (Spider/Hunter/Adapter/Broadcaster/Infrastructure)
- What it owns (interfaces), what it implements, concrete deps
- FREE items that don't count: GameEvents, Singleton<T>, UIManager, DataManager, Utils.*, GlobalEnumsX, phase-All/ infra

Write both files.
```

### Agent D — CoverageMap.md + SystemIsolationAnalysis.md

```
You are generating CoverageMap.md and SystemIsolationAnalysis.md for the Unity project {PROJECT}.

Read these files:
- .claude/templates/CoverageMap-template.md
- .claude/templates/SystemIsolationAnalysis-template.md
- LEARN/{PROJECT}/PhaseMap.md (phase assignments for all files)
- LEARN/{PROJECT}/StructureMap.md (system structure, interfaces, bridges)
- LEARN/{PROJECT}/ARCHITECTURE.md (dependency graph, coupling analysis, events)

Generate TWO files:

FILE 1: LEARN/{PROJECT}/CoverageMap.md
Follow CoverageMap-template.md. Cross-reference table:
- Every source file → which phase covers it
- Format: | Source File | Lines | Phase | New Name(s) | Notes |
- Flag any source file NOT covered as "UNCOVERED — needs assignment"

Additionally include:
- Interface Inventory: | Interface | Owner System | Phase | Implementors (System → Phase) |
- Bridge Inventory: | Bridge | Lives In (System) | Pushes Context To | Phase |
- GameEvents Registry: | Event | Defined In Phase | Raised By | Subscribed By |

FILE 2: LEARN/{PROJECT}/SystemIsolationAnalysis.md
Follow SystemIsolationAnalysis-template.md. Required sections:
- Communication Matrix (From\To table with Event/Read/Interface/Bridge/Direct)
- Interface Ownership Map
- Bridge Pattern Catalog
- GameEvents Flow (ALL phases)
- Isolation Tiers Summary (L0/L1/L2+)
- Coupling Hotspots (3+ connections = hub)

Write both files.
```

### Agent E — OptionalFeatures.md + GameStateSoFar.md

```
You are generating OptionalFeatures.md and GameStateSoFar.md for the Unity project {PROJECT}.

Read these files:
- .claude/templates/OptionalFeatures-template.md
- .claude/templates/GameStateSoFar-template.md
- LEARN/{PROJECT}/PhaseMap.md (phase structure)
- LEARN/{PROJECT}/ARCHITECTURE.md (full system analysis — sections 4, 5, 8)
- LEARN/{PROJECT}/StructureMap.md (integration points)

Generate TWO files:

FILE 1: LEARN/{PROJECT}/OptionalFeatures.md
Follow OptionalFeatures-template.md. Features outside mandatory 100% scope:
- Visual polish (particles, screen shake, post-processing)
- Audio (ambient, SFX, music system)
- Advanced UI (tooltips, notifications, tutorials)
- Performance (object pooling, LOD, culling optimizations)

For each feature provide:
- Phase where it fits
- Effort: Simple/Medium/Complex (~Xmin)
- Integration point: exact script + method
- SerializeField refs needed
- Call pattern (code snippet showing WHERE and WHAT)
- Why optional

FILE 2: LEARN/{PROJECT}/GameStateSoFar.md
Follow GameStateSoFar-template.md:
- Header with project name
- "After /init" section with 1-2 sentence game pitch (genre, core loop, what makes it interesting)
- State nothing is playable yet
- Player-experience language ONLY — no class names, no system names, no architecture terms

Write both files.
```

### Agent F — phase-All/ Scaffolding

```
You are generating the phase-All/ shared foundation scripts for the Unity project {PROJECT}.

Read these files:
- .claude/templates/GOAL-general.md (for Singleton pattern, Utils patterns, mandatory conventions)
- .claude/instructions/csharp-conventions.md (C# coding rules — MUST follow)
- LEARN/{PROJECT}/ARCHITECTURE.md (sections 3, 4, 5 — singleton patterns, utils, shared code)
- LEARN/{PROJECT}/PhaseMap.md (to know what TagType values are needed)
- MAIN-SOURCE/entire-{PROJECT}.stub (for 3D/asset conventions)

Create the following folder structure and files under LEARN/{PROJECT}/phase-All/:

phase-All/
├── 0-Core/
│   ├── Singleton.cs          → generic singleton base (abstract class, Ins property, duplicate destruction)
│   └── GameEvents.cs         → core shared events: OnMenuStateChanged(bool), OnCloseAllSubManagers
│                                with LogSubscribersCount pattern. Partial class — phases extend it.
├── 1-Managers/
│   ├── UIManager.cs          → isAnyMenuOpen, CloseAllSubManager(), keyboard routing skeleton
│   └── DataManager.cs        → shared visual data: materials, layer masks (if source has shared lookups)
│                                (skip DataManager if source has no shared visual data lookups)
├── 2-Data/
│   └── Enums/
│       └── GlobalEnumsAll.cs → TagType enum with initial values from source analysis, any shared enums
├── 3-MonoBehaviours/
│   └── Physics/              → shared base classes IF source has inherited physics hierarchy
│                                (skip if no physics base classes found)
├── 4-Utils/
│   ├── Utils.cs              → shared extensions: HasTag, SetTag, .map(), .gc<T>(),
│   │                            .destroyLeaves(), .toggle(), TimeSince/TimeUntil, etc.
│   └── TimeHelper.cs         → TimeSince/TimeUntil structs (if source uses time tracking, else skip)
├── 6-Shaders/
│   └── ShaderGuide.md        → shader/material conventions (from .stub shader references)
└── 7-3D/
    ├── MODEL.md              → model naming, scale, pivot, prefab structure from .stub
    ├── ANIM.md               → animation clip naming, AnimatorController structure from .stub
    └── WORLD.md              → scene org, level scale, terrain, lighting, layers from .stub

RULES:
- Singleton.cs: Use the exact pattern from GOAL-general.md (abstract class, Ins, duplicate destruction)
- GameEvents.cs: Core events ONLY. Partial class. Each phase extends via its own 0-Core/.
- UIManager.cs: Skeleton only — isAnyMenuOpen, CloseAllSubManager(), keyboard routing
- EconomyManager/CurrencyManager: DO NOT put here — it's game-specific, belongs in phase-specific _-Systems/
- GlobalEnumsAll.cs: TagType enum with values found in source (tags/layers analysis)
- Utils.cs: Common extensions from source + mandatory ones (HasTag, SetTag)
- 7-3D/ docs: If project is pure 2D/UI, create placeholder docs noting "N/A — 2D project"
- 3-MonoBehaviours/Physics/: Only if source has shared physics base classes

Follow csharp-conventions.md exactly for all .cs files (camelCase, no CONSTANT_CASE, etc.)
Write ALL files.
```

### Wait for all 6 agents to complete.

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
- **If context compaction triggers during Phase 3:** This is expected for XLarge+ projects. The agent reports from Phase 2 are already structured summaries — compaction of the raw reports is acceptable because the key data (dependency edges, events, interfaces) is tabular and survives summarization well.
- **If a surface agent fails (Two-Tier only):** Main agent re-reads that chunk's files with surface-level extraction directly. Slower but functional.
- **If filtered_words > 1.79M (needs >16 deep agents):** Run deep scan in sequential waves (16 agents per wave, each getting ≤112k words). See `file-scan.md` for multi-wave details.
- **If per-agent token budget still exceeds 150k after filtering:** Tighten the filter — drop "Conditional" category entirely and deep-scan only "Must" + "Should" files. The conditionally-skipped files still appear in docs via their surface metadata.
- **If total agents would exceed 60:** The project is at the extreme end (Titan). Cap deep waves at 2 (32 deep agents max). If still insufficient, accept slightly reduced per-file attention quality by increasing word budget to 130k/agent.
- **Surface metadata for skipped files:** Files that don't get deep-scanned still appear in ARCHITECTURE.md, PhaseMap.md, and CoverageMap.md using their surface metadata (class name, type, base class, interfaces, line count). This ensures 100% coverage without 100% deep reads.
