---
description: Build a new phase from scratch — reads all reference docs, generates scripts + documentation. Use when starting a new phase, generating phase scripts, creating GUIDE.md FLOW.md Dependency.md
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`. Ask: "Which phase?" → `{PHASE}`

**In-depth detailed analysis is MANDATORY.** Cross-reference GOAL.md, check existing patterns, verify naming/structure/decoupling rules before generating any code.

## Context Load

2. Read `LEARN/{PROJECT}/GOAL.md` — architecture bible
3. Read `LEARN/{PROJECT}/NewAgent.md` — agent instructions, delivery checklist, common mistakes
4. Read `LEARN/{PROJECT}/PhaseMap.md` — target phase section (file list, folder placements)
5. Read `LEARN/{PROJECT}/StructureMap.md` — DataService specs for this phase
6. Read `LEARN/{PROJECT}/handTyped(latest)/` if exists — ground truth coding style
7. Read completed phase folders — earlier phase patterns
8. Read ALL original source files from `MAIN-SOURCE/{PROJECT}/` for this phase (every file in PhaseMap + related)
9. Read `LEARN/{PROJECT}/phase-All/` — shared FREE infra

## C# Conventions

All rules in `.windsurf/rules/csharp-conventions.md` and `.windsurf/rules/architecture-patterns.md`. Every script MUST follow — no exceptions.

## Skills Reference

Load relevant skill from `.windsurf/skills/` when working on that domain (testing, audio, animation, FSM, save-load, etc.)

## Build

10. Generate ALL `.cs` files listed in PhaseMap for this phase
11. Follow folder structure: `_-Systems/XxxSystem/` for each feature
12. For each system: SO_, Field_, W, DataService, Orchestrator, SubManager as needed
13. Generate `0-Core/GameEvents.cs` partial extension for this phase
14. Generate `2-Data/Enums/GlobalEnums{X}.cs` with ALL phase-specific enums
15. Generate `4-Utils/Phase{X}LOG.cs` with snapshot methods for all DataService collections

## Documentation

16. Generate `GUIDE.md` — beginner-friendly walkthrough (from GUIDE-template.md)
17. Generate `FLOW.md` — story-style data flows (from FLOW-template.md)
18. Generate `Dependency.md` for each system (from Dependency-template.md)

## Post-Build Validation (Auto-Chain)

19. Run `/audit-phase` — method-by-method source comparison
20. Run `/decouple-check` — scan for cross-system coupling
21. Run `/cross-phase-mod` — verify earlier-phase dependencies exist

## Delivery Checklist

- [ ] Every class has `/// <summary>` (first person "I")
- [ ] Every method has `/// <summary>` (2-line explanation)
- [ ] Every method body has `// →` flow markers
- [ ] Every `Raise...()` has `// purpose:` comment
- [ ] Every `+=` subscription has `// purpose:` comment
- [ ] `[AddComponentMenu]` on every MonoBehaviour
- [ ] No public methods/fields without external callers
- [ ] No defensive null checks on [SerializeField] refs
- [ ] No `FindObjectOfType` in MonoBehaviours
- [ ] DataService testable via `new` (no MonoBehaviour deps)
- [ ] PhaseXLOG method for every collection
- [ ] GetSnapShotForTest() calls all LOG methods
- [ ] 80%+ of scripts inside `_-Systems/`
- [ ] Enum values are camelCase
- [ ] Constants are camelCase (no CONSTANT_CASE)
