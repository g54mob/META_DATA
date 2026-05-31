---
description: "Analyse a raw source project and bootstrap all architecture docs from scratch. Use when: starting a new project, initial source analysis, generating ARCHITECTURE.md GOAL.md NewAgent.md PhaseMap.md StructureMap.md Estimate.md SystemPortabilityMap.md CoverageMap.md OptionalFeatures.md GameStateSoFar.md surfer.md phase-All/"
---

## Setup

1. Ask: "Which project?" → sets `{PROJECT}` (e.g., `project-0`)
2. Verify `MAIN-SOURCE/{PROJECT}/` exists and contains source scripts
3. Read `MAIN-SOURCE/entire-{PROJECT}.stub` — this is the COMPLETE file hierarchy of the original project including assets excluded due to size. Use it to understand the full project scope (3D models, audio, prefabs, scenes, etc.) even if those files aren't physically present.
4. Create `LEARN/{PROJECT}/` folder structure if it doesn't exist

## Read Templates

4b. Read ALL templates in `.windsurf/templates/` — these define the exact structure for every generated doc:
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

9. Create `LEARN/{PROJECT}/ARCHITECTURE.md` — follow `.windsurf/templates/ARCHITECTURE-template.md`. Use this **mandatory Table of Contents**:

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


<!-- SPLIT: This workflow exceeds Windsurf's 12K char limit. Continues in /init-2 -->

> **Continue:** Run `/init-2` to proceed with PhaseMap, StructureMap, GOAL, and NewAgent generation.
