---
description: "Workflow-powered /init — same output as /init but uses deterministic JS workflows for Phase 2 (scan) and Phase 4 (docs). Guaranteed agent spawning, word-based chunking, structured output, and resumability. Use for Massive/Colossal/Titan projects. CLI-only (requires Claude Code Workflow tool)."
---

# /init-pro — Deterministic Workflow Architecture Bootstrap

Same output as `/init` (13 docs + phase-All/) but uses **deterministic Workflow JS scripts** for the mechanical phases. Claude handles reasoning; workflows handle sweeps.

```
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Setup (Claude — interactive + reasoning)                    │
│   Ask project → verify source → read .stub → create folders        │
│   Determine scale → estimate words → select scan path              │
│   Build file list + compute args for workflow                       │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Source Scan (Workflow JS — deterministic)                   │
│   Script: .claude/workflows/init-phase2-scan.js                     │
│   PATH B: word-chunked deep scan (2-14 agents, exact)              │
│   PATH C: surface (4-16) → filter → deep (2-32, multi-wave)        │
│   Returns: { scanResults[], surfaceMetadata, filterStats }          │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Synthesis (Claude — deep reasoning)                         │
│   Merge scan results → dependency graph → genre → skills            │
│   Generate ARCHITECTURE.md (requires full intelligence)             │
│   Generate PhaseMap.md (requires judgment on phase boundaries)      │
│   Generate StructureMap.md (requires PhaseMap)                      │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 4: Doc Generation (Workflow JS — deterministic)                │
│   Script: .claude/workflows/init-phase4-docs.js                     │
│   6 agents in parallel: GOAL, NewAgent, Estimate+Portability,       │
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

## When to Use /init-pro vs /init

| Scenario | Use |
|----------|-----|
| Micro/Small projects (≤149 files) | `/init` — no agents needed anyway |
| Medium projects (150-399 files, <400k words) | `/init` — works fine, fewer moving parts |
| Large/XLarge projects (400-1999 files) | Either — `/init-pro` gives determinism but `/init` is adequate |
| **Massive/Colossal/Titan** (2000+ files OR >1.5M words) | **`/init-pro`** — deterministic chunking, resume, structured output |
| Running on Windsurf or Copilot | `/init` — workflows are Claude Code-exclusive |

---

## PHASE 1 — Setup (Claude, Interactive)

Identical to `/init` Phase 1. Execute steps 1-6b from `/init`:

1. Ask: "Which project?" → sets `{PROJECT}`
2. Verify `MAIN-SOURCE/{PROJECT}/` exists
3. Read `MAIN-SOURCE/entire-{PROJECT}.stub`
4. Create `LEARN/{PROJECT}/` folder structure
4b. Read ALL templates in `.claude/templates/`
5. Cross-reference `.stub` vs `MAIN-SOURCE/{PROJECT}/` → locate game code folder
6. **Enumerate all `.cs` files** → count files AND estimate total words:
   - Sample 10-20 files (spread evenly: first, middle, last, random)
   - Count words per sample (line_count × ~8 words/line for C#)
   - `avg_words_per_file = sum(sample_words) / sample_count`
   - `total_words = avg_words_per_file × total_file_count`
   - **Shortcut:** If project is in WORKSPACE-REG.md, use the Words column directly.
   - Determine scale from the table in `/init` step 6.

6b. **Determine scan path:**
   - **PATH A (Micro/Small, ≤149 files):** Skip workflow. Read all files directly → jump to Phase 3.
   - **PATH B (Medium/Large/XLarge, 150-1999 files, ≤1.5M words):** Use workflow with `scanPath: "B"`.
   - **PATH C (Massive/Colossal/Titan, 2000+ files OR >1.5M words):** Use workflow with `scanPath: "C"`.

7. **Build the args object** for the Phase 2 workflow:
   ```
   args = {
     project: "{PROJECT}",
     files: [array of ALL .cs absolute file paths from Glob],
     totalWords: estimated_total_words,
     scale: "Medium" | "Large" | "XLarge" | "Massive" | "Colossal" | "Titan",
     scanPath: "B" | "C",
     avgWordsPerFile: avg_words_per_file
   }
   ```

---

## PHASE 2 — Source Scan (Workflow, Deterministic)

**Call the Workflow tool:**

```
Workflow({
  scriptPath: ".claude/workflows/init-phase2-scan.js",
  args: { project, files, totalWords, scale, scanPath, avgWordsPerFile }
})
```

**What it does internally:**
- PATH B: Computes `ceil(totalWords / 112,000)` deep agents, chunks files by accumulated words, spawns all in parallel, returns results.
- PATH C: Spawns `ceil(fileCount / 600)` surface agents → gets structured filter classification → spawns word-chunked deep agents on filtered list (multi-wave if >16 needed) → returns results.

**What it returns:**
```json
{
  "scanResults": ["agent1 report text", "agent2 report text", ...],
  "surfaceMetadata": "merged catalog for skipped files (PATH C only)",
  "filterStats": { "totalFiles": N, "deepScanCount": N, "skippedCount": N, ... },
  "agentStats": { "surfaceAgents": N, "deepAgents": N, "totalAgents": N }
}
```

**If the workflow fails:** The result will indicate partial completion. Read the error, then fall back to manually spawning agents for the failed chunks (same as `/init` fallback behavior).

**Wait for workflow to complete before proceeding.**

---

## PHASE 3 — Synthesis (Claude, Deep Reasoning)

The main agent now has structured scan results from the workflow. This is the critical phase — it requires full intelligence for architectural judgment and CANNOT be abbreviated.

### Merge & Analyze

9. **Merge all scan reports** into a unified picture:
   - Combine all DEPENDENCY EDGES tables → full dependency graph
   - Combine all SINGLETONS FOUND → execution order candidates
   - Combine all INTERFACES FOUND → interface catalog
   - Combine all GOD OBJECTS → split candidate list
   - Combine all EVENTS DECLARED → event communication map
   - Combine all THIRD-PARTY USAGE → third-party dependency list
   - Combine all COLLECTIONS FOR DATASERVICE → DataService extraction candidates
   - Count total files analyzed. Cross-check against Glob count from step 6.
   - **If PATH C:** Also merge `surfaceMetadata` for files that were NOT deep-scanned. These files appear in ARCHITECTURE.md as lightweight entries (class name, type, base class, line count, interfaces) rather than full breakdowns. They still get assigned to phases in PhaseMap and tracked in CoverageMap.

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

## PHASE 4 — Doc Generation (Workflow, Deterministic)

**Call the Workflow tool:**

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

**What it does:** Spawns 6 agents in parallel — GOAL.md, NewAgent.md, Estimate+Portability, Coverage+Isolation, Optional+GameState, phase-All/. Each agent reads the docs generated in Phase 3 and writes its assigned files.

**What it returns:**
```json
{
  "docsGenerated": 6,
  "failed": 0,
  "agents": [
    { "index": 0, "label": "GOAL.md", "success": true },
    { "index": 1, "label": "NewAgent.md", "success": true },
    ...
  ]
}
```

**If any agent fails:** The `agents[]` array shows which ones. Generate the missing doc content directly in the main context (same as `/init` fallback).

**Wait for workflow to complete before proceeding.**

---

## PHASE 5 — Verify & Finalize (Claude, Judgment)

Same as `/init` Phase 5:

17. **Generate surfer.md** — Create `LEARN/{PROJECT}/surfer.md` with Prompt 1 entry documenting:
    - Key discoveries (god-objects, coupling hotspots, system count)
    - Decisions made (phase boundaries, splits, classifications)
    - What changed (all docs created)
    - **Add workflow stats:** surface agents used, deep agents used, filter reduction %

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

    **If any check fails:** Fix it directly. If a Phase 4 workflow agent missed something, generate the missing content in the main context.

19. **Output summary:**
    - Total scripts found (count + total words)
    - Scale classification + scan path used
    - Total assets (from .stub)
    - Phases planned (count + names)
    - Systems identified (count)
    - Estimated hours
    - phase-All/ scripts created (count)
    - Docs generated (count)
    - **Workflow stats:**
      - Phase 2: surface agents + deep agents + filter reduction %
      - Phase 4: 6 doc agents (successes/failures)
      - Total agents spawned (deterministic count)
      - Resume capability: report runId for potential future resume

---

## Advantages Over /init

| Feature | /init (natural-language) | /init-pro (workflow hybrid) |
|---------|------------------------|---------------------------|
| Agent spawn | Best-effort (Claude interprets) | **Deterministic** (JS spawns exactly N) |
| Word-budget enforcement | Claude approximates | **Exact math** (JS computes) |
| Resume on failure | Re-run from scratch | **`resumeFromRunId`** replays cached agents |
| Structured filter output | Free-text classification | **JSON schema** validated |
| Multi-wave handling | Claude might forget wave 2 | **Automatic** (JS loop) |
| Phase 3/5 reasoning | Full intelligence | **Same** (Claude does these phases) |
| Wall-clock overhead | Claude thinks between agent batches | **Zero dispatch overhead** for mechanical phases |
| Portability | Windsurf/Copilot (degraded) | **Claude Code CLI only** |

---

## Fallback Behavior

- **If Workflow tool is unavailable:** Fall back to `/init` (the natural-language version works identically, just less deterministically).
- **If Phase 2 workflow returns partial results:** Inspect `agentStats` — if some agents returned null, manually read the missing file chunks.
- **If Phase 4 workflow has failed agents:** Generate the specific failed doc(s) directly in the main context.
- **If the session disconnects mid-workflow:** The workflow's `runId` allows resume. Call `Workflow({scriptPath: "...", resumeFromRunId: "wf_..."})` — completed agents return cached results instantly.

---

## File References

| File | Purpose |
|------|---------|
| `.claude/commands/init-pro.md` | This file — orchestration instructions for Claude |
| `.claude/workflows/init-phase2-scan.js` | Phase 2 deterministic scan workflow |
| `.claude/workflows/init-phase4-docs.js` | Phase 4 deterministic doc generation workflow |
| `.claude/instructions/file-scan.md` | Strategy documentation (constants, filter rules, word-budget math) |
| `.claude/commands/init.md` | Original natural-language version (still valid for all scales) |
