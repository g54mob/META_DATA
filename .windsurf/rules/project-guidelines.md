---
trigger: always_on
description: Core project guidelines — workspace structure, key rules, developer context, command reference. Applied to every interaction.
---

# Project Guidelines

> This workspace rebuilds Unity3D games from decompiled/extracted source into clean, independently testable architectures.
> These rules apply to **every project** in the workspace — not just one game.

## Critical Behavior (EVERY interaction)

**In-depth detailed analysis is MANDATORY before every response.** Never give surface-level answers. Analyze thoroughly first — cross-reference against GOAL.md, check existing patterns, verify naming/structure/decoupling rules — then act. This applies to ALL chats and ALL command prompts without exception.

## Developer Context

- Professional Solo indie developer

## Workspace Structure

```
ROOT/
├── .windsurf/
│   ├── rules/                        ← always-on + glob-scoped rules
│   ├── workflows/                    ← slash-command workflows
│   └── skills/                       ← domain knowledge (unity-testing, etc.)
├── .claude/                          ← Claude Code config (parallel)
├── .github/                          ← GitHub Copilot config (parallel)
├── MAIN-SOURCE/
│   ├── {project}/                    ← raw source (READ-ONLY — never modify)
│   └── entire-{project}.stub        ← full file hierarchy including excluded assets
└── LEARN/
    └── {project}/                    ← generated docs + phase folders
        ├── ARCHITECTURE.md           ← comprehensive original source analysis
        ├── GOAL.md                   ← architecture bible
        ├── NewAgent.md               ← agent instructions + first prompt
        ├── PhaseMap.md               ← all phases, files, mods, vertical slice tests
        ├── StructureMap.md           ← DataService specs per phase
        ├── Estimate.md               ← timeline calibrated from actual typing speed
        ├── SystemPortabilityMap.md   ← L0/L1+ classification per system
        ├── CoverageMap.md            ← source file → phase coverage
        ├── OptionalFeatures.md       ← features outside 100% scope
        ├── GameStateSoFar.md         ← progressive gameplay state
        ├── surfer.md                 ← reasoning log
        ├── phase-All/                ← shared scripts (Singleton, GameEvents, UIManager, etc.)
        └── phase-{x}/               ← per-phase scripts + GUIDE.md + FLOW.md
```

## Key Rules

- **Before writing ANY `.cs` file**, read `.windsurf/rules/csharp-conventions.md` context if not already aware.
- `MAIN-SOURCE/` is **read-only** — all generated output goes under `LEARN/`.
- `{PROJECT}` and `{PHASE}` are placeholders — **ask the user** for values before proceeding.
- Each phase depends only on earlier phases, **never forward**.
- Phase size cap: max ~25 files per phase.
- 80% rule: at least 80% of scripts per phase inside `_-Systems/`.

## Architecture Templates

- **`.windsurf/rules/architecture-patterns.md`** — class responsibilities, decoupling, system shapes
- **`.claude/templates/GOAL-general.md`** — full universal architecture rules with gold-standard examples
- **`.claude/templates/NewAgent-general.md`** — universal agent instruction template

## Skills (Domain Knowledge)

Non-code domain knowledge is packaged as skills in `.windsurf/skills/`. Reference with `@skill-name`:

| Skill | When Relevant |
|-------|---------------|
| `unity-testing` | Writing tests, Test.md, DEBUG_Check |
| `unity-scene-setup` | Building scenes, placing prefabs, lighting |
| `unity-audio` | Implementing sound, wiring SoundDefinitions |
| `unity-animation` | Creating clips, AnimatorControllers, motion |
| `unity-prefab-hierarchy` | Structuring prefab GOs, tool models, machines |
| `unity-save-load` | Save/load, persistence, ISaveable |
| `unity-fsm` | State machines, AI states, IState |
| `unity-day-night` | Day/night cycle, time progression |
| `unity-ai-navigation` | AI pathfinding, NavMesh, patrol |
| `unity-networking` | Multiplayer, RPCs, SyncVars |
| `unity-quest` | Quest system, objectives, journal |
| `unity-procedural-gen` | Procedural terrain, chunk generation |
| `unity-camera` | Camera rigs, Cinemachine, screen shake |
| `unity-dialogue` | Dialogue systems, NPC conversations |
| `unity-input` | Player input, InputActions, rebinding |
| `unity-physics` | Rigidbody, joints, ragdoll, raycasting |
| `unity-inventory` | Item slots, stacking, equipment, drag-drop |
| `unity-grid-building` | Grid placement, building systems, ghost preview |

## Workflows Quick Reference

| Workflow | Purpose |
|----------|---------|
| `/init` | Bootstrap all docs from raw source |
| `/build-phase` | Generate one phase (scripts + docs) |
| `/audit-phase` | Post-delivery self-audit |
| `/source-fidelity-check` | Deep source analysis (ask mode) |
| `/decouple-check` | Coupling scan |
| `/cross-phase-mod` | Earlier-phase diffs |
| `/post-delivery-sync` | Sync docs after hand-typing |
| `/refresh-phase-docs` | Regen phase docs |
| `/refresh-learn-docs` | Rebuild all LEARN/ docs |
| `/audit-framework` | Multi-project framework health |
| `/project-overview` | Quick project analysis (chat only) |
