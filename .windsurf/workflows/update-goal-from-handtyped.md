---
description: "Sync GOAL.md with user's actual coding style after hand-typing Phase A"
---

# /update-goal-from-handtyped — Calibrate GOAL.md to User's Actual Style

> Run after the user hand-types **any** phase (not just Phase A). Each phase may introduce new patterns, naming deviations, or style evolution. Re-running this after each phase ensures GOAL.md stays calibrated to reality.

## Context

GOAL.md was created from the template with placeholder conventions. After the user hand-types real code in `LEARN/{PROJECT}/handTyped(latest)/`, we observe their ACTUAL patterns and update GOAL.md to match. **This prompt should be run after EVERY phase** — the user's style may evolve (Phase B may introduce prototype scripts, Phase C may introduce new Bridge patterns, etc.).

## Setup

1. Ask: "Which project?" → `{PROJECT}`

## Baseline

1b. Read `.windsurf/templates/GOAL-general.md` as the universal baseline. Use it to detect where the user's actual patterns deviate from the default conventions. This is NOT used as a generation template — only as a comparison reference.

## Steps

### 1. Read all hand-typed files

Scan `LEARN/{PROJECT}/handTyped(latest)/` recursively if it exists. If not, scan all completed phase folders in `LEARN/{PROJECT}/phase-*/` — use the actual delivered code as style reference. Read every `.cs` file.

### 2. Extract actual conventions

For each pattern below, document what the user ACTUALLY does (not what the template says):

**Code organization:**
- `#region` order: which sections, what names, what order?
- Blank lines: between regions? Between methods? Between fields?
- File structure: namespace? Using statements order?

**Naming:**
- `[SerializeField]` prefix: `_camelCase` confirmed?
- Private fields: camelCase confirmed?
- List fields: `ALL_CAPS` confirmed?
- Dictionary fields: `DOC__` confirmed?
- Boolean fields: `is` prefix?
- Enum values: camelCase confirmed?
- Method naming: Get/Set/Try/Can/Is/Handle/Raise patterns?

**Summaries:**
- `/// <summary>` style: multi-line? Single-line? First person "I"?
- Method summaries: 2-line? What info is included?
- Inline comments: `// →` markers? `// purpose:`?

**Patterns:**
- `isFirstEnable`: exact implementation?
- Event subscription: `+=` style? Lambda vs method reference?
- Extension usage: `.map()`, `.gc<T>()`, `.destroyLeaves()` etc.
- Custom utilities: `C.method()`, `INPUT.K.method()`, `LOG.AddLog()`?

**Formatting:**
- Brace style: K&R or Allman?
- Spacing: before `(` in method calls?
- Expression-bodied: when used, when not?

### 3. Update GOAL.md "User's Coding Style" section

Replace the template placeholder with actual observations. Include real code snippets from `handTyped(latest)/` as examples.

### 4. Update custom extensions list

List every extension method the user uses with:
- Method name
- What it replaces (standard C# equivalent)
- Where it's defined (Utils.cs or similar)

### 5. Note any deviations from template

If the user's style DIFFERS from what GOAL-general.md prescribes, document it:
- "Template says X, user does Y → follow user's style"
- These deviations are the ground truth for future agent phases

### 6. Extract game-specific architectural patterns

Beyond style, look for **architectural patterns** the user established that aren't in the template:
- New interaction flows (e.g., equip → unequip → drop → stack lifecycle)
- New Bridge usage patterns (push-on-equip, push-on-enter, etc.)
- Physics pipeline patterns (BasePhysicsObject hierarchy, collision layer routing)
- Multi-step data flows that should be documented as reusable patterns
- For each: describe the pattern, cite the specific scripts, explain when future phases should reuse it.
- Append to GOAL.md's "Game-Specific Patterns" section as `### [Pattern Name]` subsections.

### 7. Evaluate template format fit

Compare the user's preferred documentation format against GUIDE-template.md and FLOW-template.md:
- Does the user's GUIDE.md structure match the template, or did they reorganize sections?
- Does the user's FLOW.md use the prescribed story-style format, or prefer a different format?
- If the user's format is consistently different across multiple phases, note the deviation:
  - "User prefers [X format] over template's [Y format] → future agents should follow user's format"
- **Do not modify the templates directly** — instead, add a "Template Overrides" note in GOAL.md that agents should follow.

### 8. Summary

Output what was updated, any style deviations found, any new architectural patterns added, and any template format overrides noted.