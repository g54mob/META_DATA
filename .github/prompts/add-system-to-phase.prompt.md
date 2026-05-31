---
mode: agent
description: "Add a single new system to an existing completed phase"
---

# /add-system-to-phase — Add One System Without Full Phase Rebuild

> Run when the user realizes a system is missing from an already-completed phase. Generates the new system and updates all affected docs.

## Context

Phase `[PHASE_X]` is complete. The user wants to add `[SYSTEM_NAME]` to it without re-running `/build-phase` for the entire phase.

## Prerequisites

Ask the user for:
1. **Which project?** `{PROJECT}`
2. **Which phase?** `{PHASE}`
3. **System name?** `[SYSTEM_NAME]`
4. **Which original source files?** (from `MAIN-SOURCE/{PROJECT}/`)
5. **Any cross-phase dependencies?** (does this system need mods to earlier phases?)

## Steps

### 1. Read context

1. `LEARN/{PROJECT}/GOAL.md` — architecture rules
2. `LEARN/{PROJECT}/PhaseMap.md` — `{PHASE}` section (existing systems)
3. `LEARN/{PROJECT}/StructureMap.md` — `{PHASE}` section (existing DataService specs)
4. `LEARN/{PROJECT}/handTyped(latest)/` if it exists — user's coding style
5. `MAIN-SOURCE/{PROJECT}/` — original source for the new system's files
6. Existing `LEARN/{PROJECT}/phase-{PHASE}/` — reference for established patterns in this phase
7. `.github/templates/Dependency-template.md` — format for new system's Dependency.md

### 2. Generate the new system

Create `_-Systems/[SystemName]/` with all required files:
- SO_, Field_, DataWrapper, DataService, Orchestrator, SubManager (as needed)
- Interface/ subfolder (if system defines interfaces)
- Bridge/ subfolder (if system needs cross-system context)
- Test.md — vertical slice test for this system
- Dependency.md — full portability analysis (including Scene Setup section)

If the system involves visual/physics behavior, also create:
- `5-Tests/Manual/[SystemName]_Manual.md` — self-contained test guide with:
  - Prerequisites, step-by-step scene setup (every GO, component, `| Field | Drag From |` tables)
  - **"How It Works"** prose section explaining the full data-flow lifecycle
  - DO/EXPECT steps, pass/fail checklist

Follow ALL [C# Conventions](../instructions/csharp-conventions.instructions.md) and GOAL.md rules. Load domain skills when relevant:
- **[unity-testing](../skills/unity-testing/SKILL.md)** — when generating Test.md, DEBUG_Check, or Manual/*.md
- **[unity-scene-setup](../skills/unity-scene-setup/SKILL.md)** — when documenting scene setup or Dependency.md Scene Setup section
- **[unity-audio](../skills/unity-audio/SKILL.md)** — when the system involves sound playback
- **[unity-animation](../skills/unity-animation/SKILL.md)** — when the system involves animation or motion
- **[unity-prefab-hierarchy](../skills/unity-prefab-hierarchy/SKILL.md)** — when the system involves prefab GO structure, collider zones, or connection points
- **[unity-save-load](../skills/unity-save-load/SKILL.md)** — when adding a system with persistence, ISaveable, save data classes
- **[unity-fsm](../skills/unity-fsm/SKILL.md)** — when adding a system with state machines, IState implementations
- **[unity-day-night](../skills/unity-day-night/SKILL.md)** — when adding time/day-night cycle, IDaytimeSensitive hooks
- **[unity-ai-navigation](../skills/unity-ai-navigation/SKILL.md)** — when adding NPC pathfinding, NavMesh agents, patrol behaviors
- **[unity-networking](../skills/unity-networking/SKILL.md)** — when adding networked systems, RPCs, state sync
- **[unity-quest](../skills/unity-quest/SKILL.md)** — when adding quest/objective tracking systems
- **[unity-procedural-gen](../skills/unity-procedural-gen/SKILL.md)** — when adding procedural generation, chunk systems
- **[unity-camera](../skills/unity-camera/SKILL.md)** — when adding camera systems, Cinemachine VCams
- **[unity-dialogue](../skills/unity-dialogue/SKILL.md)** — when adding dialogue/conversation systems, NPC speech
- **[unity-input](../skills/unity-input/SKILL.md)** — when adding input systems, rebinding, action maps
- **[unity-physics](../skills/unity-physics/SKILL.md)** — when adding physics-based systems, joints, ragdoll, grab mechanics
- **[unity-inventory](../skills/unity-inventory/SKILL.md)** — when adding inventory, equipment, hotbar, item containers
- **[unity-grid-building](../skills/unity-grid-building/SKILL.md)** — when adding building/placement systems, grid snapping, ghost preview

Key reminders for new systems:
- `[AddComponentMenu]` on every MonoBehaviour
- `/// <summary>` on every class and method
- `// purpose:` on every Raise/Subscribe
- `isFirstEnable` on SubManagers
- DataService for all collections
- PhaseXLOG methods for every collection

### 3. Generate/update GameEvents

If the new system needs new events:
- Add to `phase-[X]/0-Core/GameEvents.cs` (partial class)
- Use interfaces in event signatures, never concrete classes

### 4. Generate/update GlobalEnumsX

If the new system needs new enums:
- Add to `phase-[X]/2-Data/Enums/GlobalEnumsX.cs`
- Enum values in camelCase

### 5. Update PhaseXLOG

If the new system has DataService collections:
- Add LOG methods to `phase-[X]/4-Utils/PhaseXLOG.cs`

### 6. Check cross-phase modifications

If the new system needs changes to earlier phase files:
- Document exact changes (file path, what to add/modify, code blocks)
- Run `/cross-phase-mod` logic to verify no missing deps

### 7. Update all living docs

- **GUIDE.md**: Add new system to folder structure, script purpose, hand-typing order, scene setup, systems & testability
- **FLOW.md**: Add new system to system map, new data flows, event registry, portability diagram
- **PhaseMap.md**: Add new system's files to the phase section
- **StructureMap.md**: Add new DataService specs
- **CoverageMap.md**: Map new source files → this system
- **SystemPortabilityMap.md**: Add new system's portability entry
- **GameStateSoFar.md**: Update the relevant phase section's "New this phase" bullets if the new system adds player-visible capabilities

### 8. Self-audit

- Method-by-method comparison against original source
- Verify all GOAL.md rules are followed
- Verify no tight coupling with existing systems

### 8b. Phase size check

After adding this system, count total files in `phase-[X]/`:
- ✅ ≤25 files — no action needed
- ⚠️ 26-30 files — warn user that the phase is getting large, suggest reviewing if it should split
- ❌ 31+ files — **strongly recommend** splitting the phase. Propose which systems could move to a new phase (prefer moving the newly added system + any loosely coupled systems). Generate a draft phase split plan.

### 9. Summary

Output:
- Files created
- Files modified (earlier phases + living docs)
- Portability assessment
- Test instructions for the new system