---
description: "Analyse a raw source project and bootstrap all architecture docs from scratch. Use when: starting a new project, initial source analysis, generating ARCHITECTURE.md GOAL.md NewAgent.md PhaseMap.md StructureMap.md Estimate.md SystemPortabilityMap.md CoverageMap.md OptionalFeatures.md GameStateSoFar.md surfer.md phase-All/"
---

## Setup

1. Ask: "Which project?" → sets `{PROJECT}` (e.g., `project-0`)
2. Verify `MAIN-SOURCE/{PROJECT}/` exists and contains source scripts
3. Read `MAIN-SOURCE/entire-{PROJECT}.stub` — this is the COMPLETE file hierarchy of the original project including assets excluded due to size. Use it to understand the full project scope (3D models, audio, prefabs, scenes, etc.) even if those files aren't physically present.
4. Create `LEARN/{PROJECT}/` folder structure if it doesn't exist

## Read Templates

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

## Source Analysis

5. Cross-reference the `.stub` hierarchy against `MAIN-SOURCE/{PROJECT}/` — identify:
   - Which folders are asset-only (listed in .stub but not present — 3D, audio, textures, scenes)
   - Which contains engine/third-party DLLs (skip these)
6. Read **every single `.cs` file** in `MAIN-SOURCE/{PROJECT}/Scripts/Assembly-CSharp/` (or equivalent game code folder). This is the actual game source — read ALL of them, no skipping.
   - Start with the 10 largest files (god-objects that reveal the dependency graph)
   - Then read every remaining `.cs` file
7. For each file read, extract: class name, base class, interfaces implemented, singletons, [SerializeField] fields, public methods, FindObjectOfType calls, event subscriptions/raises, direct references to other classes
8. Map the full dependency graph: who imports who, who calls who, who subscribes to whose events. Count total files.

8b. **Project Scale Profile** — Count total `.cs` files and classify:
    | Scale | File Count | Architecture Approach |
    |-------|-----------|----------------------|
    | Micro | <50 | 2-3 phases max, minimal sub-systems, single DataService per domain, skip SystemIsolationAnalysis |
    | Small | 50-149 | 3-5 phases, standard _-Systems/ approach, full docs |
    | Medium | 150-399 | 5-8 phases, full architecture, all docs mandatory |
    | Large | 400-799 | 8-12 phases, aggressive splitting, full docs + Phase Dependency DAG |
    | XLarge | 800-1999 | 10-15 phases, sub-phase strategy, domain boundary splits |
    | Massive | 2000+ | 12-20+ phases, sub-phase numbering (C-1, C-2), dedicated domain boundaries |
    
    **Scale adjustments:**
    - **Micro (<50 files):** Combine related systems into fewer, larger _-Systems/ folders (e.g., one PlayerSystem instead of separate Movement + Inventory + Health systems). Skip SystemIsolationAnalysis.md. Estimate.md can use simplified single-tier formula. PhaseMap gap audit can be abbreviated.
    - **Small (50-149):** Standard approach applies as-is.
    - **Medium (150-399):** Full architecture, no shortcuts.
    - **Large (400-799):** Generate a "Phase Dependency DAG" section showing all inter-phase imports. Consider splitting broad systems into sub-systems.
    - **XLarge (800-1999):** Sub-phase numbering (e.g., phase-C-1, phase-C-2). Domain boundaries take priority over file count for phase splits.
    - **Massive (2000+):** All XLarge rules plus: group phases into "arcs" (Core arc, Gameplay arc, Content arc). Consider parallel-safe phase groups. Generate a top-level "Arc Map" section in PhaseMap.md.
    
    Record scale in ARCHITECTURE.md header. Scale influences PhaseMap granularity and doc verbosity.

8c. **Genre Classification** — Determine the project's primary genre(s) from source patterns:
    | Genre | Detection Signals |
    |-------|------------------|
    | Mining/Factory | OreType, Conveyor, Smelter, Belt, Recipe |
    | Tycoon | Money, Customer, Satisfaction, Staff, Building placement |
    | Combat/Action | Health, Damage, Weapon, Enemy, Projectile |
    | Horror | Sanity, Flashlight, JumpScare, DayNight fear |
    | Colony/Strategy | Colonist, Job, Need, Zone, Stockpile |
    | Puzzle | Level, Solution, Grid, Tile, Move |
    | Simulation | Physics, Vehicle, Bridge, Stress |
    
    Record genre in ARCHITECTURE.md (Genre Classification table). Genre drives which skills to reference in later phases.

8d. **Third-Party Detection** — Scan Assemblies/ and using statements for non-Unity third-party libraries:
    - FishNet, Mirror, Photon → networking skill applies
    - A*Pathfinding (Pathfinding.*) → ai-navigation skill applies
    - DOTween (DG.Tweening) → animation skill applies (DOTween variant)
    - Spine (Spine.Unity) → animation skill applies (Spine variant)
    - FMOD (FMODUnity) → audio skill applies (FMOD variant)
    - Newtonsoft.Json → save-load skill applies
    - TextMeshPro → standard (not third-party)
    
    Record ALL third-party dependencies with wrapper depth in ARCHITECTURE.md Third-Party table.

8e. **Skill Selection** — Based on genre + detected patterns, note which skills apply to this project:
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
    
    Record applicable skills in NewAgent.md reference table so `/build-phase` loads the right skills.

## Generate ARCHITECTURE.md

9. Create `LEARN/{PROJECT}/ARCHITECTURE.md` — follow `.claude/templates/ARCHITECTURE-template.md`. Use this **mandatory Table of Contents**:

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

## Generate PhaseMap.md

10. Group all source scripts into logical phases by dependency order:
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

11. For each phase include:
    - **Domain boundary** — what this phase covers (one sentence)
    - **File list** — every .cs file with exact folder placement and one-line purpose. **Primary placement = `_-Systems/XxxSystem/`** for all feature code (SO_, Field_, DataService, DataWrapper, Orchestrator, SubManager, Interface/, Bridge/). Only shared infra goes in numbered folders (0-Core/, 2-Data/Enums/, 4-Utils/). **80% rule: at least 80% of scripts MUST be inside `_-Systems/`.**
    - **_-Systems/ assignments** — which files group into systems (3+ tightly coupled files per system). Most scripts should be inside a system.
    - **Modifications to earlier phases** — table: `| File | How (partial/direct) | Change | Why |`
    - **Vertical Slice Tests** — what to test, prerequisites, checklist per system
    - **"What It Looks Like When Running"** — conversational description of the player experience

12. Append **Gap Audit** at the end of PhaseMap:
    ```
    | Phase | +Scripts | Key Additions | Priority |
    |-------|---------|---------------|----------|
    ```
    - **Critical** — source has it, missing = broken fidelity
    - **Important** — source has it, adds meaningful behavior
    - **Polish** — nice-to-have, goes in `#region extra` blocks

12b. **Dependency DAG Verification** — After all phases are defined, draw an ASCII dependency DAG:
    ```
    phase-All ← phase-A ← phase-B ← phase-C
                                  ↖ phase-D
    ```
    - Every arrow must point LEFT (to an earlier phase). If any arrow points RIGHT, reorder phases.
    - Verify: for EACH phase, list every class it imports from another phase. If any import comes from a LATER phase, either reorder or split.
    - Verify: each phase compiles with ONLY earlier phases present (no forward references).
    - Include this DAG in PhaseMap.md as a "Phase Dependency Order" section.

12c. **Phase Size Validation** — After splitting, verify:
    ```
    | Phase | File Count | Status |
    |-------|-----------|--------|
    ```
    - ✅ = ≤25 files
    - ⚠️ = 26-30 files (acceptable if tightly coupled, add justification)
    - ❌ = 31+ files (MUST split — no exceptions)

13. Create `LEARN/{PROJECT}/PhaseMap.md` — follow the structure in `.claude/templates/PhaseMap-template.md`

## Generate StructureMap.md

14. For each phase, define the internal structure:
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

15. Create `LEARN/{PROJECT}/StructureMap.md` — follow the structure in `.claude/templates/StructureMap-template.md`

## Generate GOAL.md (from template)

16. **Read `.claude/templates/GOAL-general.md`** — this is the universal architecture rules template containing ALL conventions: folder structure, naming, class responsibilities, decoupling, lifecycle, C# features, testing, pitfalls, gold-standard doc examples, mandatory patterns, common agent mistakes.

17. **Copy the ENTIRE content** of `GOAL-general.md` into a new `LEARN/{PROJECT}/GOAL.md`, then customize:
    - Replace all `[PROJECT_NAME]` with the actual project name
    - Replace `[PHASE_X]` placeholders with actual phase names from PhaseMap
    - Fill in the **"User's Coding Style — CUSTOMIZE THIS"** section by reading `LEARN/{PROJECT}/handTyped(latest)/` if it exists, or noting "TO BE FILLED after user types Phase A"
    - Fill in the **"Phase Overview — CUSTOMIZE THIS"** table with actual phases from PhaseMap
    - Add project-specific utility extensions found in source (if any)
    - Add project-specific enums, tags, layers found in source
    - **CRITICAL: GOAL.md must describe the REDESIGNED architecture (what to build), NOT the original source patterns (what exists).** The original source analysis belongs in ARCHITECTURE.md. GOAL.md defines the transformation target.

18. Create `LEARN/{PROJECT}/GOAL.md`

## Generate NewAgent.md (from template)

19. **Read `.claude/templates/NewAgent-general.md`** — this is the universal agent instruction template containing: first prompt, delivery checklist, common mistakes, mandatory patterns, reference files table.

20. **Copy the ENTIRE content** of `NewAgent-general.md` into a new `LEARN/{PROJECT}/NewAgent.md`, then customize:
    - Replace all `[PROJECT_NAME]` with the actual project name
    - Replace `[PHASE_X]` with Phase A (first phase to build)
    - Update the "First Prompt" template with project-specific phase names and system names
    - Fill in the reference files table with actual file paths
    - Add any project-specific patterns discovered during source analysis

21. Create `LEARN/{PROJECT}/NewAgent.md`

## Generate Supporting Docs

22. Create `LEARN/{PROJECT}/Estimate.md` — follow `.claude/templates/Estimate-template.md`. Hours per phase using these complexity tiers:
    | Script Complexity | Examples | Avg Time |
    |-------------------|---------|----------|
    | **Simple** (enums, stubs, interfaces, SOs, entities) | GlobalEnumsX, SO_Def, SaveEntry | ~15 min |
    | **Medium** (DataService, DataWrapper, Field_, Utils, tests) | ItemDataService, WItem, Field_Slot | ~30 min |
    | **Complex** (MonoBehaviours, Orchestrators, Managers, Player scripts) | PlayerMovement, Orchestrator | ~60 min |
    Formula: `(simple × 15 + medium × 30 + complex × 60) + scene/testing buffer (~25%)`

23. Create `LEARN/{PROJECT}/SystemPortabilityMap.md` — follow `.claude/templates/SystemPortabilityMap-template.md`. For every system in every phase:
    - Portability level (L0 = zero deps, L1+ = each import = +1)
    - System shape (Spider/Hunter/Adapter/Broadcaster/Infrastructure)
    - What it owns (interfaces), what it implements, concrete deps
    - FREE items that don't count: GameEvents, Singleton<T>, UIManager, DataManager, Utils.*, GlobalEnumsX, phase-All/ infra

24. Create `LEARN/{PROJECT}/CoverageMap.md` — follow `.claude/templates/CoverageMap-template.md`. Cross-reference table:
    - Every source file in `LEARN/{PROJECT}/Scripts/Assembly-CSharp/**/` → which phase covers it
    - Format: `| Source File | Lines | Phase | New Name(s) | Notes |`
    - Flag any source file NOT covered by any phase as "UNCOVERED — needs assignment"
    - This ensures 100% source coverage — no file falls through the cracks

    **Additionally, include these inventory sections:**

    **Interface Inventory:**
    ```
    | Interface | Owner System | Phase | Implementors (System → Phase) |
    |-----------|-------------|-------|-------------------------------|
    | IInteractable | InteractionSystem | B | OreSystem→C, ToolSystem→B |
    ```
    - Every interface defined across all phases, who owns it, who implements it
    - Helps identify cross-phase coupling at a glance

    **Bridge Inventory:**
    ```
    | Bridge | Lives In (System) | Pushes Context To | Phase |
    |--------|-------------------|-------------------|-------|
    | CamContextBridge | CameraSystem | PlayerGrab, FresnelHighlighter | B |
    ```
    - Every Bridge class, where it lives, what systems consume it

    **GameEvents Registry:**
    ```
    | Event | Defined In Phase | Raised By | Subscribed By |
    |-------|-----------------|-----------|---------------|
    | OnMoneyChanged | All | EconomyManager | ShopOrchestrator(A), ToolOrchestrator(B) |
    ```
    - Complete event communication map across all phases

25. Create `LEARN/{PROJECT}/OptionalFeatures.md` — follow `.claude/templates/OptionalFeatures-template.md`. Features outside mandatory 100% scope:
    - Visual polish (particles, screen shake, post-processing)
    - Audio (ambient, SFX, music system)
    - Advanced UI (tooltips, notifications, tutorials)
    - Performance (object pooling, LOD, culling optimizations)

    **For each feature, provide:**
    ```
    ### [Feature Name] — [Nice/Cool/Stretch]
    **Phase:** where it naturally fits
    **Effort:** [Simple/Medium/Complex] (~Xmin)
    **Integration point:** exact script + method where this plugs in
    **SerializeField refs needed:** what inspector refs the feature needs
    **Call pattern:**
    ```csharp
    // In [ScriptName].cs, [method]:
    [SerializeField] ParticleSystem _hitParticles;  // ← ADD
    _hitParticles.Play();  // ← ADD after damage applied
    ```
    **Why optional:** [doesn't affect core behavior / pure visual / requires asset work]
    ```

    This specificity ensures any optional feature can be added in ~5 minutes by knowing exactly WHERE the code goes and WHAT it looks like — not just a vague category.

## Generate GameStateSoFar.md

25b. Create `LEARN/{PROJECT}/GameStateSoFar.md` — follow `.claude/templates/GameStateSoFar-template.md`. This is the plain-English progressive gameplay state guide:

    - Write the header with project name
    - Write the "After /init" section with a 1-2 sentence game pitch (genre, core loop, what makes it interesting) derived from the source analysis
    - State that nothing is playable yet
    - **Player-experience language ONLY** — no class names, no system names, no architecture terms
    - Keep the pitch concise — what genre is it, what does the player DO, what makes it interesting

## Generate phase-All/ Scaffolding

26. Create `LEARN/{PROJECT}/phase-All/` with the shared foundation scripts that ALL phases depend on:

    ```
    phase-All/
    ├── 0-Core/
    │   ├── Singleton.cs          → generic singleton base (first instance wins, .Ins access)
    │   └── GameEvents.cs         → core shared events (OnMenuStateChanged, OnCloseAllSubManagers)
    │                                with LogSubscribersCount pattern
    ├── 1-Managers/
    │   ├── UIManager.cs          → reports menu state, CloseAllSubManager(), keyboard routing
    │   └── DataManager.cs        → shared visual data: materials, layer masks (if source has shared lookups)
    │   (NOTE: EconomyManager/CurrencyManager is game-specific — place in phase-specific _-Systems/EconomySystem/, NOT here)
    ├── 2-Data/
    │   └── Enums/
    │       └── GlobalEnumsAll.cs → TagType enum (grows across phases), any shared enums
    ├── 3-MonoBehaviours/
    │   └── Physics/              → shared base classes for physics objects (BasePhysicsObject, etc.)
    │       └── (only if source has inherited physics hierarchy — identify in ARCHITECTURE.md)
    ├── 4-Utils/
    │   ├── Utils.cs              → shared extensions: HasTag, SetTag, .map(), .gc<T>(),
    │   │                            .destroyLeaves(), .toggle(), TimeSince/TimeUntil, etc.
    │   └── TimeHelper.cs         → TimeSince/TimeUntil structs (if source uses time tracking)
    ├── 6-Shaders/
    │   └── ShaderGuide.md        → shader/material conventions (if source uses custom shaders)
    └── 7-3D/
        ├── MODEL.md              → 3D model conventions, scale, pivot, naming
        ├── ANIM.md               → animation conventions, state machine patterns
        └── WORLD.md              → world/level design conventions, grid, scale
    ```

    **7-3D/ documents:** Analyze the `.stub` file hierarchy for 3D assets (Models/, Animations/, Prefabs/, Scenes/). From that + source code references (`[SerializeField] Mesh`, `Animator`, `RuntimeAnimatorController`), generate:
    - **MODEL.md**: model naming conventions found in assets, scale/units used, prefab structure patterns, LOD setup (if any)
    - **ANIM.md**: animation clip naming, Animator Controller structure, animation event patterns found in source, state machine flow
    - **WORLD.md**: scene organization, level scale/grid, terrain setup, lighting conventions, layer usage
    - If the project has minimal 3D (pure 2D/UI), create placeholder docs noting "N/A — 2D project"

    **3-MonoBehaviours/Physics/:** If source analysis reveals shared physics base classes (e.g., objects that can be grabbed, thrown, stacked), create the base class here. Identify these from inheritance patterns in step 7.

    - **Singleton.cs**: Use the exact pattern from GOAL-general.md (abstract class, Ins property, duplicate destruction)
    - **GameEvents.cs**: Core events only — `OnMenuStateChanged(bool)`, `OnCloseAllSubManagers`. Each phase extends via partial class in its own 0-Core/.
    - **UIManager.cs**: Skeleton — `isAnyMenuOpen`, `CloseAllSubManager()`, keyboard routing. Each phase adds Close event calls.
    - **EconomyManager/CurrencyManager**: Game-specific — belongs in the earliest phase that uses it (e.g., `phase-a/_-Systems/EconomySystem/`), NOT in phase-All. `GetMoney()`, `AddMoney()`, `CanAfford()`.
    - **GlobalEnumsAll.cs**: `TagType` enum with initial values from source analysis.
    - **Utils.cs**: Common extensions found in source + mandatory ones (HasTag, SetTag).
    - Read the source for existing utility patterns and replicate them in the new architecture.

## Generate SystemIsolationAnalysis.md

26b. Create `LEARN/{PROJECT}/SystemIsolationAnalysis.md` — follow `.claude/templates/SystemIsolationAnalysis-template.md`. The global architectural isolation map:

    This document provides the bird's-eye view of ALL system relationships. While `SystemPortabilityMap.md` lists per-system portability scores, this document maps the CONNECTIONS between systems.

    **Required sections:**

    ```markdown
    # SystemIsolationAnalysis — {PROJECT}

    ## Communication Matrix
    | From \ To | SystemA | SystemB | SystemC | ... |
    |-----------|---------|---------|---------|-----|
    | SystemA   | —       | Event   | Interface | ... |
    | SystemB   | Read    | —       | Bridge  | ... |

    Legend: Event = GameEvents, Read = Singleton.Ins.Get*(), Interface = implements I*,
            Bridge = pushes context via Bridge class, Direct = concrete import (BAD)

    ## Interface Ownership Map
    | Interface | Owner System | Phase | Implementors |
    |-----------|-------------|-------|--------------|
    | IInteractable | InteractionSystem | B | OreNode(C), Tool(B), Conveyor(D) |

    ## Bridge Pattern Catalog
    | Bridge | Pattern | From → To | Purpose |
    |--------|---------|-----------|----------|
    | CamContextBridge | Push-on-equip | ToolSystem → CameraSystem | Provides zoom/FOV context |

    ## GameEvents Flow (ALL phases)
    | Event | Phase Defined | Raiser(s) | Subscriber(s) |
    |-------|--------------|-----------|----------------|

    ## Isolation Tiers Summary
    | Tier | Systems | Copy-paste portable? |
    |------|---------|---------------------|
    | L0 (zero deps) | [list] | ✅ Yes |
    | L1 (1 dep) | [list] | ✅ With 1 interface |
    | L2+ (multiple) | [list] | ⚠️ Needs adaptation |

    ## Coupling Hotspots
    - [List systems with 3+ incoming connections — these are integration hubs]
    - [List systems with 3+ outgoing connections — these are dependency-heavy]
    - [Recommendations for reducing L2+ systems to L1]
    ```

    **How to generate:** Use the dependency graph from step 8, the interface candidates from step 14, and the portability classifications from step 23. Cross-reference to build the matrices.

## Generate surfer.md

27. Create `LEARN/{PROJECT}/surfer.md` — follow `.claude/templates/surfer-template.md`. Format:

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

    **What Changed:** Created ARCHITECTURE.md, GOAL.md, NewAgent.md, PhaseMap.md, StructureMap.md, Estimate.md, SystemPortabilityMap.md, CoverageMap.md, OptionalFeatures.md, surfer.md, phase-All/.

    ---
    ```

    Future entries follow the same format: `## Prompt N — [topic]` with Asked/Discoveries/Decisions/Changed sections.

## Verify

28. Run a completeness check before finishing:
    - [ ] ARCHITECTURE.md has ALL source files documented (cross-check file count)
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
    - [ ] phase-All/ has Singleton, GameEvents, UIManager, DataManager, GlobalEnumsAll, Utils (EconomyManager is phase-specific, NOT in phase-All)
    - [ ] phase-All/3-MonoBehaviours/Physics/ has base classes (if source has physics hierarchy)
    - [ ] phase-All/7-3D/ has MODEL.md, ANIM.md, WORLD.md (or N/A placeholders)
    - [ ] surfer.md has Prompt 1 entry

29. Output summary: total scripts found (code), total assets found (from .stub), phases planned, systems identified, estimated hours, phase-All/ scripts created, docs generated (count — including GameStateSoFar.md)