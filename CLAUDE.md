# Project Guidelines

> This workspace rebuilds Unity3D games from decompiled/extracted source into clean, independently testable architectures.
> These rules apply to **every project** in the workspace — not just one game.

---

## Critical Behavior (EVERY interaction)

**In-depth detailed analysis is MANDATORY before every response.** Never give surface-level answers. Analyze thoroughly first — cross-reference against GOAL.md, check existing patterns, verify naming/structure/decoupling rules — then act. This applies to ALL chats and ALL commands without exception.

---

## Developer Context

- Professional Solo indie developer

---

## Workspace Structure

```
ROOT/
├── .claude/
│   ├── commands/
│   │   ├── init.md                   ← /init — bootstrap docs from raw source
│   │   ├── init-pro.md               ← /init-pro — workflow-powered /init (CLI-only, deterministic)
│   │   ├── build-phase.md            ← /build-phase — generate one phase
│   │   ├── audit-phase.md            ← /audit-phase — post-delivery audit
│   │   ├── source-fidelity-check.md  ← /source-fidelity-check — deep source analysis (ask mode)
│   │   ├── decouple-check.md         ← /decouple-check — coupling scan
│   │   ├── cross-phase-mod.md        ← /cross-phase-mod — earlier-phase deps
│   │   ├── post-delivery-sync.md     ← /post-delivery-sync — sync living docs
│   │   ├── update-goal-from-handtyped.md ← /update-goal-from-handtyped
│   │   ├── add-system-to-phase.md    ← /add-system-to-phase
│   │   ├── refactor-interface.md     ← /refactor-interface
│   │   ├── evolve-shared-infra.md    ← /evolve-shared-infra
│   │   ├── refresh-phase-docs.md     ← /refresh-phase-docs — regen phase docs
│   │   ├── refresh-learn-docs.md     ← /refresh-learn-docs — rebuild LEARN/ docs
│   │   ├── rebuild-templates.md      ← /rebuild-templates — backport conventions to templates
│   │   ├── rebuild-prompts.md        ← /rebuild-prompts — audit commands against real code
│   │   ├── audit-framework.md        ← /audit-framework — multi-project framework health
│   │   ├── implement-audit-todo.md   ← /implement-audit-todo — apply framework improvements from source
│   │   ├── project-overview.md       ← /project-overview — quick project analysis (chat only)
│   │   ├── move-system.md            ← /move-system — relocate system between phases
│   │   ├── merge-phase.md            ← /merge-phase — combine underpopulated phases
│   │   └── refresh-workspace-reg.md  ← /refresh-workspace-reg — rescan & rebuild registry
│   ├── skills/
│   │   ├── unity-testing.md          ← vertical slice test patterns, data-first DEBUG_Check
│   │   ├── unity-scene-setup.md      ← URP config, lighting profiles, materials, prefab placement
│   │   ├── unity-audio.md            ← pool-based SoundManager, SoundDefinitions, FMOD variant, genre profiles
│   │   ├── unity-animation.md        ← AnimatorControllers, code-driven rotation, Spine/DOTween variants
│   │   ├── unity-prefab-hierarchy.md ← prefab GO structure, universal patterns, genre variants
│   │   ├── unity-save-load.md        ← ISaveable, SaveData, SaveManager, JSON serialization, save slots
│   │   ├── unity-fsm.md              ← IState, StateMachine, AI/gameplay/UI state machines
│   │   ├── unity-day-night.md        ← DayNightCycle, TimePhase, lighting gradients, IDaytimeSensitive
│   │   ├── unity-ai-navigation.md    ← NavMeshAgent + FSM, patrol, A*Pathfinding variant
│   │   ├── unity-networking.md       ← FishNet/Photon, client/server tiers, RPC patterns
│   │   ├── unity-quest.md            ← SO_QuestDef, WQuest, objective tracking, quest UI
│   │   ├── unity-procedural-gen.md   ← SeededRandom, Perlin terrain, chunk generation
│   │   ├── unity-camera.md           ← Cinemachine VCams, manual camera rigs, screen shake
│   │   ├── unity-dialogue.md         ← DialogueManager, YarnSpinner/Ink/PixelCrushers, branching
│   │   ├── unity-input.md            ← New Input System, InputActions, rebinding, context switching
│   │   ├── unity-physics.md          ← Rigidbody, joints, ragdoll, raycasting, trigger zones
│   │   ├── unity-inventory.md        ← slot-based inventory, stacking, drag-drop, equipment
│   │   └── unity-grid-building.md    ← grid placement, ghost preview, validation, snapping
│   ├── templates/
│   │   ├── ARCHITECTURE-template.md  ← source code analysis format
│   │   ├── GOAL-general.md           ← universal architecture rules template
│   │   ├── NewAgent-general.md       ← universal agent instruction template
│   │   ├── GUIDE-template.md         ← per-phase GUIDE.md section format
│   │   ├── FLOW-template.md          ← per-phase FLOW.md section format
│   │   ├── Dependency-template.md    ← per-system Dependency.md format
│   │   ├── PhaseMap-template.md      ← PhaseMap.md structure
│   │   ├── StructureMap-template.md  ← StructureMap.md structure
│   │   ├── SystemPortabilityMap-template.md ← portability analysis format
│   │   ├── SystemIsolationAnalysis-template.md ← isolation analysis format
│   │   ├── CoverageMap-template.md   ← source coverage tracking format
│   │   ├── Estimate-template.md      ← typing timeline format
│   │   ├── OptionalFeatures-template.md ← optional features format
│   │   ├── GameStateSoFar-template.md ← progressive gameplay state guide format
│   │   └── surfer-template.md        ← reasoning log format
│   ├── instructions/
│   │   ├── csharp-conventions.md     ← C# rules (auto-applied to *.cs)
│   │   └── file-scan.md             ← two-tier scan strategy (surface + deep) for /init
│   ├── workflows/
│   │   ├── init-phase2-scan.js       ← deterministic Phase 2 scan (used by /init-pro)
│   │   └── init-phase4-docs.js       ← deterministic Phase 4 doc gen (used by /init-pro)
│   ├── MANUAL.md                     ← user reference for slash commands
│   └── ROADMAP.md                    ← framework maturity & future plans
├── .github/                          ← GitHub Copilot config (parallel — same content, different format)
├── .windsurf/                        ← Windsurf/Cascade config (parallel — same content, different format)
├── WORKSPACE-REG.md                  ← project registry (quick-lookup ONLY — for real work read MAIN-SOURCE/)
├── MAIN-SOURCE/
│   ├── {project}/                    ← raw source (READ-ONLY — never modify)
│   └── entire-{project}.stub        ← full file hierarchy including excluded assets
└── LEARN/
    └── {project}/                    ← generated docs + phase folders
        ├── ARCHITECTURE.md           ← comprehensive original source analysis
        ├── GOAL.md                   ← architecture bible (from GOAL-general.md + project specifics)
        ├── NewAgent.md               ← agent instructions + first prompt (from NewAgent-general.md)
        ├── PhaseMap.md               ← all phases, files, mods, vertical slice tests, gap audit
        ├── StructureMap.md           ← DataService specs per phase (collections, methods, nested types)
        ├── Estimate.md               ← timeline calibrated from actual typing speed
        ├── SystemPortabilityMap.md   ← L0/L1+ classification per system
        ├── CoverageMap.md            ← cross-reference: every source file → which phase covers it
        ├── OptionalFeatures.md       ← features outside 100% scope (polish, extras)
        ├── GameStateSoFar.md         ← progressive gameplay state (plain-English, what's playable now)
        ├── surfer.md                 ← reasoning log (append after each agent prompt)
        ├── handTyped(latest)/        ← user's ground-truth hand-typed code (optional, from user when done implementing the phases)
        ├── phase-All/                ← shared scripts (Singleton, GameEvents, UIManager, etc.)
        └── phase-{x}/               ← per-phase scripts + GUIDE.md + FLOW.md
```

## Living Documents

The following `LEARN/{project}/` docs are **living** — they get modified over time as the project progresses through phases, not just at `/init`:

| Document | Updated By | When |
|----------|-----------|------|
| `PhaseMap.md` | `/post-delivery-sync`, `/add-system-to-phase`, `/move-system`, `/merge-phase`, `/refresh-learn-docs` | After each phase typed, system added/moved/merged |
| `StructureMap.md` | `/post-delivery-sync`, `/add-system-to-phase`, `/refresh-learn-docs` | After each phase typed, DataService shape changes |
| `SystemPortabilityMap.md` | `/audit-phase`, `/decouple-check`, `/move-system`, `/merge-phase`, `/refresh-learn-docs` | After delivery audit, coupling fixes, system moves |
| `SystemIsolationAnalysis.md` | `/audit-phase`, `/refresh-learn-docs` | After delivery audit, interface/bridge changes |
| `CoverageMap.md` | `/post-delivery-sync`, `/add-system-to-phase`, `/move-system`, `/merge-phase`, `/refresh-learn-docs` | After files added/moved/renamed |
| `Estimate.md` | `/post-delivery-sync`, `/refresh-learn-docs` | After each phase typed (actuals vs estimates) |
| `GameStateSoFar.md` | `/post-delivery-sync` | After each phase typed (what's now playable) |
| `GOAL.md` | `/update-goal-from-handtyped` | After user types code, calibrating style section |
| `surfer.md` | Every command | Append-only — new entry per agent prompt |
| `OptionalFeatures.md` | `/post-delivery-sync`, `/refresh-learn-docs` | After features get implemented or integration points change |

**Rule:** Never treat these as frozen after `/init`. They represent the *current* state of the project, not the initial plan.

---

## Key Rules

- **Before writing ANY `.cs` file**, read `.claude/instructions/csharp-conventions.md` if not already loaded this session.
- `MAIN-SOURCE/` is **read-only** — all generated output goes under `LEARN/`.
- `WORKSPACE-REG.md` is a **shallow index** — use it only for quick lookups (scale, genre, skill tags, status). For any real analysis (`/init`, `/build-phase`, `/audit-phase`, `/source-fidelity-check`, `/decouple-check`, etc.) always do in-depth reading of `MAIN-SOURCE/{project}/` directly.
- `{PROJECT}` and `{PHASE}` are placeholders — **ask the user** for values before proceeding.
- Each phase depends only on earlier phases, **never forward**.
- `/build-phase` auto-chains `/audit-phase`, `/decouple-check`, and `/cross-phase-mod` as its final steps.
- Phase size cap: max ~25 files per phase.
- 80% rule: at least 80% of scripts per phase inside `_-Systems/`.

## Architecture Templates

**`.claude/templates/GOAL-general.md`** contains the **universal architecture rules** — folder structure, naming, class responsibilities, decoupling, lifecycle, C# features, testing, pitfalls, gold-standard doc examples. When `/init` creates a project's `GOAL.md`, it copies from this template and customizes with project-specific details.

**`.claude/templates/NewAgent-general.md`** contains the **universal agent instruction template** — first prompt, delivery checklist, common mistakes, mandatory patterns, reference files table. When `/init` creates a project's `NewAgent.md`, it copies from this template and customizes.

---

## Architecture Conventions (Universal)

All C# coding conventions — naming, capitalization, class roles, folder structure, decoupling, mandatory patterns, script structure, method naming, pitfalls, and common agent mistakes — are defined in:

- **`.claude/instructions/csharp-conventions.md`** — auto-applied to all `.cs` files
- **`.claude/templates/GOAL-general.md`** — full detail with gold-standard code examples

## Skills (Domain Knowledge)

Non-code domain knowledge is packaged as skills in `.claude/skills/`. Commands reference skills explicitly when the task matches the skill's description:

| Skill | When Relevant | Provides |
|-------|---------------|----------|
| `unity-testing` | Writing tests, Test.md, DEBUG_Check | Vertical slice workflow, mock strategy, test file org |
| `unity-scene-setup` | Building scenes, placing prefabs, lighting | URP setup, lighting profiles, layers, per-phase world layout |
| `unity-audio` | Implementing sound, wiring SoundDefinitions | Pool architecture, FMOD variant, genre audio profiles |
| `unity-animation` | Creating clips, AnimatorControllers, motion | AnimParamType rules, Spine/DOTween variants, blend trees |
| `unity-prefab-hierarchy` | Structuring prefab GOs, tool models, machines | Universal patterns, genre variants, collider zones |
| `unity-save-load` | Save/load, persistence, ISaveable | SaveData, SaveManager, JSON, save slots, migration |
| `unity-fsm` | State machines, AI states, IState | StateMachine class, state patterns, transition rules |
| `unity-day-night` | Day/night cycle, time progression | DayNightCycle, TimePhase, IDaytimeSensitive |
| `unity-ai-navigation` | AI pathfinding, NavMesh, patrol | NavMeshAgent + FSM, A*Pathfinding variant |
| `unity-networking` | Multiplayer, RPCs, SyncVars | FishNet/Photon patterns, client/server tiers |
| `unity-quest` | Quest system, objectives, journal | SO_QuestDef, WQuest, objective tracking |
| `unity-procedural-gen` | Procedural terrain, chunk generation | SeededRandom, Perlin noise, chunk patterns |
| `unity-camera` | Camera rigs, Cinemachine, screen shake | VCam setup, manual rigs, FOV transitions |
| `unity-dialogue` | Dialogue systems, NPC conversations, branching | DialogueManager, YarnSpinner/Ink/PixelCrushers integration |
| `unity-input` | Player input, InputActions, rebinding, action maps | New Input System, Rewired variant, context switching |
| `unity-physics` | Rigidbody, joints, ragdoll, raycasting | Forces, trigger zones, physics materials, pool reset |
| `unity-inventory` | Item slots, stacking, equipment, drag-drop | Slot DataService, WItem wrapper, hotbar, save integration |
| `unity-grid-building` | Grid placement, building systems, ghost preview | Grid/free-form/node placement, validation, connection points |

---

## Commands Quick Reference

| Command | Purpose | Frequency |
|---------|---------|-----------|
| `/init` | Bootstrap all docs from raw source | Once per project |
| `/init-pro` | Workflow-powered /init (deterministic, CLI-only) | Once per project (Massive+) |
| `/build-phase` | Generate one phase (scripts + docs) | Once per phase |
| `/audit-phase` | Post-delivery self-audit | Auto after /build-phase |
| `/source-fidelity-check` | Deep source analysis (ask mode) | As needed |
| `/decouple-check` | Coupling scan | Auto after /build-phase |
| `/cross-phase-mod` | Earlier-phase diffs | Auto after /build-phase |
| `/post-delivery-sync` | Sync docs after hand-typing | After each phase typed |
| `/update-goal-from-handtyped` | Calibrate GOAL.md to style | After each phase typed |
| `/add-system-to-phase` | Add missing system | As needed |
| `/refactor-interface` | Evolve interface across phases | Rare |
| `/evolve-shared-infra` | Audit phase-All/ health | Every 2-3 phases |
| `/refresh-phase-docs` | Regen phase docs | After edits |
| `/refresh-learn-docs` | Rebuild all LEARN/ docs | After major changes |
| `/rebuild-templates` | Backport patterns to templates | After 3+ phases |
| `/rebuild-prompts` | Audit commands against code | After 3+ phases |
| `/audit-framework` | Multi-project framework health | Before new genre |
| `/implement-audit-todo` | Apply framework improvements | After audit |
| `/project-overview` | Quick project analysis (chat only) | Anytime |
| `/move-system` | Relocate system between phases | As needed |
| `/merge-phase` | Combine underpopulated phases | As needed |
| `/refresh-workspace-reg` | Rescan & rebuild registry | After new projects |