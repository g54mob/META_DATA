export const meta = {
  name: 'init-phase4-docs',
  description: 'Phase 4 parallel doc generation — 6 agents producing remaining LEARN/ docs + phase-All/',
  phases: [
    { title: 'Generate Docs', detail: 'GOAL.md, NewAgent.md, Estimate, Coverage, Optional, phase-All/' },
  ],
}

// --- Args (passed from init-pro.md via Claude) ---
// args.project     - project name
// args.stubPath    - path to entire-{project}.stub
// args.skills      - array of applicable skill names (from Phase 3 analysis)

const { project, stubPath, skills } = args

phase('Generate Docs')

log(`Generating 6 doc sets in parallel for ${project}`)

const results = await parallel([
  // Agent A: GOAL.md
  () => agent(
    `You are generating GOAL.md for the Unity project ${project}.

Read these files:
- .claude/templates/GOAL-general.md (the template — copy its ENTIRE content)
- LEARN/${project}/PhaseMap.md (for phase names and system names)
- LEARN/${project}/ARCHITECTURE.md (for project-specific patterns — sections 4, 5, 8)

Then create LEARN/${project}/GOAL.md by:
1. Copying the ENTIRE content of GOAL-general.md
2. Replacing all [PROJECT_NAME] with ${project}
3. Replacing [PHASE_X] placeholders with actual phase names from PhaseMap
4. Filling "User's Coding Style — CUSTOMIZE THIS" with "TO BE FILLED after user types Phase A"
   (unless LEARN/${project}/handTyped(latest)/ exists — if so, read it and fill from that)
5. Filling "Phase Overview — CUSTOMIZE THIS" table with actual phases from PhaseMap
6. Adding project-specific utility extensions found in ARCHITECTURE.md
7. Adding project-specific enums, tags, layers found in ARCHITECTURE.md

CRITICAL: GOAL.md describes the REDESIGNED architecture (what to build), NOT the original source patterns.
Write the file to LEARN/${project}/GOAL.md.`,
    { label: 'GOAL.md', phase: 'Generate Docs' }
  ),

  // Agent B: NewAgent.md
  () => agent(
    `You are generating NewAgent.md for the Unity project ${project}.

Read these files:
- .claude/templates/NewAgent-general.md (the template — copy its ENTIRE content)
- LEARN/${project}/PhaseMap.md (for phase names, first phase details)
- LEARN/${project}/ARCHITECTURE.md (for discovered patterns and skills)

Then create LEARN/${project}/NewAgent.md by:
1. Copying the ENTIRE content of NewAgent-general.md
2. Replacing all [PROJECT_NAME] with ${project}
3. Replacing [PHASE_X] with Phase A (first phase from PhaseMap)
4. Updating the "First Prompt" template with project-specific phase/system names
5. Filling the reference files table with actual file paths
6. Adding project-specific patterns from ARCHITECTURE.md
7. Recording applicable skills in the reference table: ${(skills || []).join(', ')}

Write the file to LEARN/${project}/NewAgent.md.`,
    { label: 'NewAgent.md', phase: 'Generate Docs' }
  ),

  // Agent C: Estimate.md + SystemPortabilityMap.md
  () => agent(
    `You are generating Estimate.md and SystemPortabilityMap.md for the Unity project ${project}.

Read these files:
- .claude/templates/Estimate-template.md
- .claude/templates/SystemPortabilityMap-template.md
- LEARN/${project}/PhaseMap.md (all phases with file lists)
- LEARN/${project}/StructureMap.md (system structure details)

Generate TWO files:

FILE 1: LEARN/${project}/Estimate.md
Follow Estimate-template.md. Hours per phase using these complexity tiers:
| Script Complexity | Examples | Avg Time |
|-------------------|---------|----------|
| **Simple** (enums, stubs, interfaces, SOs, entities) | GlobalEnumsX, SO_Def, SaveEntry | ~15 min |
| **Medium** (DataService, DataWrapper, Field_, Utils, tests) | ItemDataService, WItem, Field_Slot | ~30 min |
| **Complex** (MonoBehaviours, Orchestrators, Managers, Player scripts) | PlayerMovement, Orchestrator | ~60 min |
Formula: (simple x 15 + medium x 30 + complex x 60) + scene/testing buffer (~25%)

FILE 2: LEARN/${project}/SystemPortabilityMap.md
Follow SystemPortabilityMap-template.md. For every system in every phase:
- Portability level (L0 = zero deps, L1+ = each import = +1)
- System shape (Spider/Hunter/Adapter/Broadcaster/Infrastructure)
- What it owns (interfaces), what it implements, concrete deps
- FREE items that don't count: GameEvents, Singleton<T>, UIManager, DataManager, Utils.*, GlobalEnumsX, phase-All/ infra

Write both files.`,
    { label: 'Estimate+Portability', phase: 'Generate Docs' }
  ),

  // Agent D: CoverageMap.md + SystemIsolationAnalysis.md
  () => agent(
    `You are generating CoverageMap.md and SystemIsolationAnalysis.md for the Unity project ${project}.

Read these files:
- .claude/templates/CoverageMap-template.md
- .claude/templates/SystemIsolationAnalysis-template.md
- LEARN/${project}/PhaseMap.md (phase assignments for all files)
- LEARN/${project}/StructureMap.md (system structure, interfaces, bridges)
- LEARN/${project}/ARCHITECTURE.md (dependency graph, coupling analysis, events)

Generate TWO files:

FILE 1: LEARN/${project}/CoverageMap.md
Follow CoverageMap-template.md. Cross-reference table:
- Every source file -> which phase covers it
- Format: | Source File | Lines | Phase | New Name(s) | Notes |
- Flag any source file NOT covered as "UNCOVERED — needs assignment"

Additionally include:
- Interface Inventory: | Interface | Owner System | Phase | Implementors (System -> Phase) |
- Bridge Inventory: | Bridge | Lives In (System) | Pushes Context To | Phase |
- GameEvents Registry: | Event | Defined In Phase | Raised By | Subscribed By |

FILE 2: LEARN/${project}/SystemIsolationAnalysis.md
Follow SystemIsolationAnalysis-template.md. Required sections:
- Communication Matrix (From\\To table with Event/Read/Interface/Bridge/Direct)
- Interface Ownership Map
- Bridge Pattern Catalog
- GameEvents Flow (ALL phases)
- Isolation Tiers Summary (L0/L1/L2+)
- Coupling Hotspots (3+ connections = hub)

Write both files.`,
    { label: 'Coverage+Isolation', phase: 'Generate Docs' }
  ),

  // Agent E: OptionalFeatures.md + GameStateSoFar.md
  () => agent(
    `You are generating OptionalFeatures.md and GameStateSoFar.md for the Unity project ${project}.

Read these files:
- .claude/templates/OptionalFeatures-template.md
- .claude/templates/GameStateSoFar-template.md
- LEARN/${project}/PhaseMap.md (phase structure)
- LEARN/${project}/ARCHITECTURE.md (full system analysis — sections 4, 5, 8)
- LEARN/${project}/StructureMap.md (integration points)

Generate TWO files:

FILE 1: LEARN/${project}/OptionalFeatures.md
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

FILE 2: LEARN/${project}/GameStateSoFar.md
Follow GameStateSoFar-template.md:
- Header with project name
- "After /init" section with 1-2 sentence game pitch (genre, core loop, what makes it interesting)
- State nothing is playable yet
- Player-experience language ONLY — no class names, no system names, no architecture terms

Write both files.`,
    { label: 'Optional+GameState', phase: 'Generate Docs' }
  ),

  // Agent F: phase-All/ Scaffolding
  () => agent(
    `You are generating the phase-All/ shared foundation scripts for the Unity project ${project}.

Read these files:
- .claude/templates/GOAL-general.md (for Singleton pattern, Utils patterns, mandatory conventions)
- .claude/instructions/csharp-conventions.md (C# coding rules — MUST follow)
- LEARN/${project}/ARCHITECTURE.md (sections 3, 4, 5 — singleton patterns, utils, shared code)
- LEARN/${project}/PhaseMap.md (to know what TagType values are needed)
- ${stubPath} (for 3D/asset conventions)

Create the following folder structure and files under LEARN/${project}/phase-All/:

phase-All/
├── 0-Core/
│   ├── Singleton.cs          -> generic singleton base (abstract class, Ins property, duplicate destruction)
│   └── GameEvents.cs         -> core shared events: OnMenuStateChanged(bool), OnCloseAllSubManagers
│                                with LogSubscribersCount pattern. Partial class — phases extend it.
├── 1-Managers/
│   ├── UIManager.cs          -> isAnyMenuOpen, CloseAllSubManager(), keyboard routing skeleton
│   └── DataManager.cs        -> shared visual data: materials, layer masks (if source has shared lookups)
│                                (skip DataManager if source has no shared visual data lookups)
├── 2-Data/
│   └── Enums/
│       └── GlobalEnumsAll.cs -> TagType enum with initial values from source analysis, any shared enums
├── 3-MonoBehaviours/
│   └── Physics/              -> shared base classes IF source has inherited physics hierarchy
│                                (skip if no physics base classes found)
├── 4-Utils/
│   ├── Utils.cs              -> shared extensions: HasTag, SetTag, .map(), .gc<T>(),
│   │                            .destroyLeaves(), .toggle(), TimeSince/TimeUntil, etc.
│   └── TimeHelper.cs         -> TimeSince/TimeUntil structs (if source uses time tracking, else skip)
├── 6-Shaders/
│   └── ShaderGuide.md        -> shader/material conventions (from .stub shader references)
└── 7-3D/
    ├── MODEL.md              -> model naming, scale, pivot, prefab structure from .stub
    ├── ANIM.md               -> animation clip naming, AnimatorController structure from .stub
    └── WORLD.md              -> scene org, level scale, terrain, lighting, layers from .stub

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
Write ALL files.`,
    { label: 'phase-All', phase: 'Generate Docs' }
  ),
])

const validDocs = results.filter(Boolean)
log(`Doc generation complete: ${validDocs.length}/6 agents succeeded`)

return {
  docsGenerated: validDocs.length,
  failed: 6 - validDocs.length,
  agents: results.map((r, i) => ({
    index: i,
    label: ['GOAL.md', 'NewAgent.md', 'Estimate+Portability', 'Coverage+Isolation', 'Optional+GameState', 'phase-All'][i],
    success: r !== null
  }))
}
