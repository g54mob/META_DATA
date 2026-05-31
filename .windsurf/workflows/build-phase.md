---
description: "Build a new phase from scratch — reads all reference docs, generates scripts + documentation. Use when: starting a new phase, generating phase scripts, creating GUIDE.md FLOW.md Dependency.md"
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`. Ask: "Which phase?" → `{PHASE}`

**In-depth detailed analysis is MANDATORY.** Cross-reference GOAL.md, check existing patterns, verify naming/structure/decoupling rules before generating any code.

## Context Load

2. Read `LEARN/{PROJECT}/GOAL.md` — architecture bible (all rules, naming, patterns, pitfalls, common mistakes)
3. Read `LEARN/{PROJECT}/NewAgent.md` — agent instructions (first prompt, delivery checklist, mandatory patterns, common mistakes to catch). This file defines WHAT the agent must deliver and HOW to avoid the 17 most common mistakes. Do NOT skip this file.
4. Read `LEARN/{PROJECT}/PhaseMap.md` — target phase section (file list, folder placements, _-Systems/ assignments, cross-phase mods, vertical slice tests, gap audit)
5. Read `LEARN/{PROJECT}/StructureMap.md` — DataService specs for this phase (exact collections, methods, nested types, GetSnapShotForTest format)
6. Read `LEARN/{PROJECT}/handTyped(latest)/` if it exists — ground truth coding style. Match this user's actual conventions: #region style, naming, extensions used, verbosity level. If it doesn't exist yet, rely on GOAL.md conventions.
7. Read completed phase folders in `LEARN/{PROJECT}/` — established patterns from earlier phases. Pay attention to: GameEvents partial class additions, cross-phase mod patterns, how Field_/DataService/Orchestrator triads were structured.
8. Read all original source files from `MAIN-SOURCE/{PROJECT}/` for this phase (every file listed in PhaseMap + any unlisted files that belong to this phase's domain). Read them line-by-line — 100% source behavior must be preserved. **Do NOT limit yourself to PhaseMap listings** — scan the entire source folder for related functionality: helper methods, edge cases, conditional logic paths, coroutines, secondary behaviors, nice-to-have features. If you discover unlisted functionality, incorporate Critical/Important items into the phase and flag Nice-to-haves in `#region Extra` blocks or note them for OptionalFeatures.md.
9. Read `LEARN/{PROJECT}/phase-All/` — shared FREE infra (Singleton, GameEvents core, UIManager, Utils, GlobalEnumsAll). Know what's available without reimplementing.

## C# Conventions

All naming, capitalization, class roles, decoupling, mandatory patterns, pitfalls, and common mistakes are defined in [C# Conventions](../rules/csharp-conventions.md). Every script generated below MUST follow these conventions — no exceptions.

## Skills Reference

Domain-specific knowledge lives in `.windsurf/skills/`. Load the relevant skill when working on that domain:

- **[unity-testing](../skills/unity-testing/SKILL.md)** — when generating `5-Tests/`, `DEBUG_Check`, `Test.md` files, or manual test guides
- **[unity-scene-setup](../skills/unity-scene-setup/SKILL.md)** — when generating `WORLD.md` sections, scene setup instructions in GUIDE.md, or layer/lighting/material docs
- **[unity-audio](../skills/unity-audio/SKILL.md)** — when the phase includes SoundManager, SoundDefinition, LoopingSoundPlayer, or any audio playback
- **[unity-animation](../skills/unity-animation/SKILL.md)** — when the phase includes AnimatorControllers, AnimParamType enum values, code-driven rotation, or shader-driven motion
- **[unity-prefab-hierarchy](../skills/unity-prefab-hierarchy/SKILL.md)** — when structuring prefab GameObjects, ViewModel/WorldModel splits, collider zones, connection points, or inheritance chains
- **[unity-save-load](../skills/unity-save-load/SKILL.md)** — when the phase includes ISaveable, SaveData classes, SaveManager, or any save/load persistence
- **[unity-fsm](../skills/unity-fsm/SKILL.md)** — when the phase includes IState, StateMachine, AI states, or state-driven gameplay
- **[unity-day-night](../skills/unity-day-night/SKILL.md)** — when the phase includes DayNightCycle, time progression, or day/night-sensitive behavior
- **[unity-ai-navigation](../skills/unity-ai-navigation/SKILL.md)** — when the phase includes NavMeshAgent, patrol waypoints, AI pathfinding, or A*Pathfinding
- **[unity-networking](../skills/unity-networking/SKILL.md)** — when the phase includes networked RPCs, SyncVars, client/server authority, or multiplayer
- **[unity-quest](../skills/unity-quest/SKILL.md)** — when the phase includes quest definitions, objective tracking, or quest UI
- **[unity-procedural-gen](../skills/unity-procedural-gen/SKILL.md)** — when the phase includes procedural terrain, chunk generation, seeded random, or Perlin noise
- **[unity-camera](../skills/unity-camera/SKILL.md)** — when the phase includes Cinemachine, manual camera rigs, screen shake, or FOV transitions
- **[unity-dialogue](../skills/unity-dialogue/SKILL.md)** — when the phase includes NPC dialogue, conversation trees, YarnSpinner, Ink, or PixelCrushers
- **[unity-input](../skills/unity-input/SKILL.md)** — when the phase includes player input handling, InputActions, rebinding UI, action maps, or context switching
- **[unity-physics](../skills/unity-physics/SKILL.md)** — when the phase includes Rigidbody forces, joints, ragdoll, physics-based grab, raycasting, or trigger zones
- **[unity-inventory](../skills/unity-inventory/SKILL.md)** — when the phase includes item slots, stacking, drag-drop, equipment, hotbar, or container transfer
- **[unity-grid-building](../skills/unity-grid-building/SKILL.md)** — when the phase includes grid placement, ghost preview, building validation, snap-to-grid, or free-form placement

## Build

10. Create `LEARN/{PROJECT}/phase-{PHASE}/Scripts/0-Core/GameEvents.cs` — partial class extending the shared GameEvents with phase-specific events. Use `// when X >>` / `// << when X` comment blocks. Every event has `LogSubscribersCount` call in Raise. **GameEvents signatures use interfaces, NEVER concrete classes** — `Action<IInventoryItem>` not `Action<BaseHeldTool>`. GameEvents.cs must have zero imports from any `_-Systems/` folder.

11. Create `LEARN/{PROJECT}/phase-{PHASE}/Scripts/2-Data/Enums/GlobalEnums{PHASE}.cs` — all enums for this phase in ONE file. Enum values use **camelCase** (`TagType.grabbable`, NOT `Grabbable`). Include **AnimParamType enum** for any Animator parameters in this phase — no raw strings for SetTrigger/SetBool/SetFloat.

12. For each system in this phase: create `_-Systems/XxxSystem/` with all scripts + `Dependency.md`. Follow all class role rules from [C# Conventions](../rules/csharp-conventions.md). **80% rule: at least 80% of scripts in this phase MUST live inside `_-Systems/`.** Only GameEvents partial, PhaseXLOG, shared enums, and cross-system interfaces go in numbered folders outside. Key reminders per file type:
    - Every MonoBehaviour gets `[AddComponentMenu("ProjectName/Category/ClassName")]`
    - Every class gets comprehensive first-person "I" summary
    - Every method gets 2-line summary explaining what actually happens inside
    - Every method body gets `// →` inline flow markers
    - Every `.Raise...()` and `+=` subscription gets `// purpose:` comment
    - `SO_` = pure data (only public fields, zero methods)
    - `Field_` = display only (SetData/SetState, no onClick, no logic, no singleton access)
    - `W` = wraps SO_ with mutable session state
    - `DataService` = purely C# collection service (Build/Get/Add/Remove/Snapshot + PhaseXLOG methods)
    - `Orchestrator` = wires Field_ to DataService (DOC__X__Field, .destroyLeaves(), .gc<T>(), AddListener ONLY here, RefreshAllRequired())
    - `SubManager` = open/close one UI panel (isFirstEnable pattern, creates DataService on first enable)
    - `[SerializeField]` = always private with `_` prefix
    - Interfaces in `Interface/` subfolder, owned by caller or implementor
    - Bridge scripts in `Bridge/` subfolder for cross-system runtime context
    - `Dependency.md` per system — follow `.windsurf/templates/Dependency-template.md` for format: Level (L0/L1+), Shape (Spider/Hunter/Adapter/Broadcaster/Infrastructure), scripts list, owns/implements, concrete deps, 3-zone ASCII diagram, future phase mods, **Scene Setup section** (optional — include for systems with non-obvious GO creation / SerializeField wiring / layer-tag setup; omit for pure-data or UI-only systems), verdict, checklist

12b. **Prototype scripts (optional):** If the system involves complex runtime behavior (physics, state machines, multi-step interactions), generate lightweight prototype scripts in `LEARN/{PROJECT}/phase-{PHASE}/prototype/` that test the core mechanic in isolation. Each prototype:
    - Is a single self-contained MonoBehaviour with `[AddComponentMenu("Prototype/...")]`
    - Tests ONE behavior (e.g., grab + throw, conveyor movement, ore breaking)
    - Has inline `// HOW TO TEST:` comments at the top (create empty scene, add this script, press Play)
    - Uses no DataService/Field_/Orchestrator — just raw Unity API to validate the mechanic
    - Named `Proto_XxxTest.cs`
    Prototypes are NOT part of the final architecture — they're throwaway validation scripts.

13. For scripts NOT in any `_-Systems/` folder: create in the appropriate numbered folder directly under `phase-{PHASE}/Scripts/`.

14. Create `4-Utils/Phase{PHASE}LOG.cs` — one LOG method per DataService collection: `LIST_X__TO__JSON` for lists, `DOC_X__TO__JSON` for dictionaries. All use `.map()` to anonymous type + `.ToNSJson(pretify: true)`.
    - **Sub-phases** (e.g., phase-a-1, phase-b-1) sharing the same LOG as their parent phase may skip this file.

15. If any new reusable utility methods are needed (used by 2+ scripts across systems), add them to `LEARN/{PROJECT}/phase-All/4-Utils/Utils.cs` as new `#region` sections. No per-phase UtilsPhaseX.cs — all utility code is centralized in phase-All.

16. Create `5-Tests/` — DEBUG_Check for data-level testing (new DataService → Build → mutate → LOG.AddLog(snapshot, "json")). System-specific test scripts for UI-level testing. Each test lists prerequisites, NOT required, controls, checklist.

17. Create `5-Tests/Manual/*.md` for systems needing visual/hands-on verification (UI panels, animations, physics, effects). Each manual test guide is **self-contained**: prerequisites, step-by-step scene setup (every GO, component, wiring with `| Field | Drag From |` tables), DO/EXPECT steps, pass/fail checklist. Include the 10 common pitfalls relevant to this system.


<!-- SPLIT: This workflow exceeds Windsurf's 12K char limit. Continues in /build-phase-2 -->

> **Continue:** Run `/build-phase-2` to proceed with documentation generation and post-delivery checks.
