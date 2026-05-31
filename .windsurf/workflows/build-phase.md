---
description: Build a new phase from scratch — reads all reference docs, generates scripts + documentation. Use when starting a new phase, generating phase scripts, creating GUIDE.md FLOW.md Dependency.md
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`. Ask: "Which phase?" → `{PHASE}`

**In-depth detailed analysis is MANDATORY.** Cross-reference GOAL.md, check existing patterns, verify naming/structure/decoupling rules before generating any code.

## Context Load

2. Read `LEARN/{PROJECT}/GOAL.md` — architecture bible (all rules, naming, patterns, pitfalls, common mistakes)
3. Read `LEARN/{PROJECT}/NewAgent.md` — agent instructions (delivery checklist, mandatory patterns, 17 common mistakes)
4. Read `LEARN/{PROJECT}/PhaseMap.md` — target phase section (file list, folder placements, _-Systems/ assignments, cross-phase mods, vertical slice tests)
5. Read `LEARN/{PROJECT}/StructureMap.md` — DataService specs for this phase (exact collections, methods, nested types, GetSnapShotForTest format)
6. Read `LEARN/{PROJECT}/handTyped(latest)/` if exists — match user's actual conventions
7. Read completed phase folders — earlier phase patterns (GameEvents partial, cross-phase mods, Field_/DataService/Orchestrator triads)
8. Read ALL original source files from `MAIN-SOURCE/{PROJECT}/` for this phase. Read line-by-line — 100% source behavior must be preserved. Scan beyond PhaseMap listings for related functionality.
9. Read `LEARN/{PROJECT}/phase-All/` — shared FREE infra (Singleton, GameEvents core, UIManager, Utils, GlobalEnumsAll)

## C# Conventions

All rules in `.windsurf/rules/csharp-conventions.md` and `.windsurf/rules/architecture-patterns.md`. Full examples in `.windsurf/templates/GOAL-general.md`. Every script MUST follow — no exceptions.

## Skills Reference

Load relevant skill from `.windsurf/skills/` when the domain matches (testing, audio, animation, FSM, save-load, camera, physics, inventory, grid-building, etc.)

## Build

10. Create `0-Core/GameEvents.cs` — partial class with phase-specific events. `// when X >>` / `// << when X` blocks. LogSubscribersCount in every Raise. **Signatures use interfaces ONLY, never concrete classes.** Zero imports from `_-Systems/`.

11. Create `2-Data/Enums/GlobalEnums{PHASE}.cs` — ALL enums in ONE file. Values = **camelCase**. Include AnimParamType for Animator params.

12. For each system: create `_-Systems/XxxSystem/` with all scripts + `Dependency.md`:
    - `[AddComponentMenu]` on every MonoBehaviour
    - `/// <summary>` on every class (first person "I") and method (2-line)
    - `// →` flow markers in every method body
    - `// purpose:` on every Raise/Subscribe
    - `SO_` = pure data, zero methods
    - `Field_` = display only, SetData/SetState, no onClick, public refs (not [SerializeField])
    - `DataService` = pure C# collection service, testable via `new`
    - `Orchestrator` = DOC__X__Field, .destroyLeaves(), AddListener ONLY here, RefreshAllRequired()
    - `SubManager` = isFirstEnable pattern, zero business logic
    - `[SerializeField]` = always private `_camelCase`
    - Interface/ subfolder, Bridge/ subfolder
    - `Dependency.md` per system (format from `.windsurf/templates/Dependency-template.md`)
    - **80% rule: 80%+ of scripts inside `_-Systems/`**

13. Create `4-Utils/Phase{PHASE}LOG.cs` — `LIST_X__TO__JSON` for lists, `DOC_X__TO__JSON` for dicts. Use `.map()` + `.ToNSJson(pretify: true)`.

14. Add new utility methods to `phase-All/4-Utils/Utils.cs` if needed by 2+ scripts. No per-phase Utils files.

15. Create `5-Tests/` — DEBUG_Check data-level tests + Manual/*.md for visual verification.

## Documentation

16. **GUIDE.md** (from GUIDE-template.md): What It Looks Like Running, Folder Structure, Script Purpose, Hand-Typing Order with stop-and-test points, Vertical Slice Tests (beginner step-by-step with `| Field | Drag From |` tables), How It Works prose for complex systems, Art & Scene Work, Scene Setup, Modifications to Earlier Phases (exact diffs), Source vs Phase Diff table, Systems & Testability matrix.

17. **FLOW.md** (from FLOW-template.md): System Map (ASCII), Data Flows (story-style with **bold**/`code`/*italic*), Event Registry table, Portability Diagram.

18. Update `phase-All/` if new shared infra needed (TagType values, core events, Utils methods).

## Post-Delivery Checks (MANDATORY — auto-chain)

19. **Self-audit** (`/audit-phase`): method-by-method comparison against original source. Every public method, field, interface, event accounted for.

20. **Decouple check** (`/decouple-check`): scan each _-Systems/ for concrete cross-system imports. Classify FREE/interface/concrete. Fix concrete deps.

21. **Cross-phase mod check** (`/cross-phase-mod`): find references to earlier-phase methods that don't exist. Generate exact diffs with `// ← ADD`.

22. **Update GameStateSoFar.md**: append `## After phase-{PHASE}` — cumulative player experience in plain English (no class names).

23. **Append surfer.md**: Prompt N entry with Asked/Discoveries/Decisions/Changed.

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
- [ ] No `{ get; set; }` properties (use Get.../Set...() methods)
- [ ] DataService testable via `new` (no MonoBehaviour deps)
- [ ] PhaseXLOG method for every collection
- [ ] GetSnapShotForTest() calls all LOG methods
- [ ] 80%+ of scripts inside `_-Systems/`
- [ ] Enum values are camelCase
- [ ] Constants are camelCase (no CONSTANT_CASE)
- [ ] GameEvents signatures use interfaces only
- [ ] Uses custom extensions (.map, .gc<T>, .destroyLeaves, .toggle, .colorTag, .repeat)
- [ ] GUIDE.md, FLOW.md, Dependency.md all generated
- [ ] Manual test guides for visual/physics systems
