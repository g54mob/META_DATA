---
description: Post-delivery self-audit — method-by-method source comparison + architecture rule check + pitfall scan + common mistakes check. Use after any delivery, verifying source fidelity, checking architecture violations, doc consistency.
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`. Ask: "Which phase?" → `{PHASE}`

## Context Load

2. Read `LEARN/{PROJECT}/GOAL.md` — rules to audit against
3. Read `LEARN/{PROJECT}/PhaseMap.md` — expected files and structure
4. Read all generated scripts in `LEARN/{PROJECT}/phase-{PHASE}/`
5. Read ALL corresponding original source files from `MAIN-SOURCE/{PROJECT}/`

## Audit Steps

### 1. Source Fidelity (method-by-method)

For EACH generated script, compare against original source:
- Every public method in source → exists in generated code
- Method signatures match (params, return types)
- Core logic preserved (formulas, conditionals, loops)
- Edge cases handled (null checks in source → preserved if runtime null)
- Constants/magic numbers match original values

### 2. Architecture Rule Check

- [ ] Naming: camelCase consts, camelCase enum values, PascalCase methods, _camelCase SerializeField
- [ ] No CONSTANT_CASE anywhere
- [ ] Class responsibilities: SO_ = pure data, Field_ = display only, DataService = pure C#
- [ ] Decoupling: no cross-system concrete imports, GameEvents uses interfaces only
- [ ] Region order: Inspector Fields → private API → Public API → Extra → Unity Life Cycle
- [ ] isFirstEnable on all SubManagers
- [ ] [AddComponentMenu] on all MonoBehaviours
- [ ] No { get; set; } properties (exceptions noted)
- [ ] Public API minimal — every public member has external caller

### 3. Documentation Check

- [ ] `/// <summary>` on every class (first person "I")
- [ ] `/// <summary>` on every method (2-line)
- [ ] `// →` flow markers in every method body
- [ ] `// purpose:` on every Raise/Subscribe
- [ ] GUIDE.md exists and is beginner-friendly
- [ ] FLOW.md exists with story-style data flows
- [ ] Dependency.md for each system

### 4. Pitfall Scan

- [ ] No FindObjectOfType in MonoBehaviours
- [ ] No defensive null checks on inspector refs
- [ ] No RefreshAll in Update (polling)
- [ ] No collections in MonoBehaviour (should be DataService)
- [ ] No methods on SO_ classes
- [ ] PhaseXLOG method for every collection
- [ ] DOC__X__Field tracking in every Orchestrator

## Output

Generate a report with:
- **PASS**: Rules followed correctly
- **FAIL**: Violations found (file:line + what's wrong + fix)
- **MISSING**: Expected content not present
- Fix all FAIL items immediately
