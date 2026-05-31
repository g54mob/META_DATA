---
description: "/init continuation (part 3/3) — generates GameStateSoFar.md, phase-All/ scaffolding, SystemIsolationAnalysis.md, surfer.md, and runs verification. Run /init-2 first."
---

<!-- SPLIT: Part 3 of /init — exceeds Windsurf's 12K char limit when combined -->

## Generate GameStateSoFar.md

25b. Create `LEARN/{PROJECT}/GameStateSoFar.md` — follow `.windsurf/templates/GameStateSoFar-template.md`. This is the plain-English progressive gameplay state guide:

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

26b. Create `LEARN/{PROJECT}/SystemIsolationAnalysis.md` — follow `.windsurf/templates/SystemIsolationAnalysis-template.md`. The global architectural isolation map:

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

27. Create `LEARN/{PROJECT}/surfer.md` — follow `.windsurf/templates/surfer-template.md`. Format:

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