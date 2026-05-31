---
description: "Safely evolve interfaces across multiple phases"
---

# /refactor-interface — Evolve Interfaces Across Phases

> Run when an interface needs to change and multiple systems/phases depend on it. Identifies all consumers, generates diffs, and updates cross-phase docs.

## Context

The user has realized that `[INTERFACE_NAME]` (defined in `[PHASE_X]/[SYSTEM_NAME]/Interface/`) needs to change. This interface may be implemented by systems in multiple phases.

## Prerequisites

Ask the user for:
1. **Which interface?** `[INTERFACE_NAME]`
2. **What's changing?** (new method, removed method, signature change, renamed)
3. **Why?** (what problem does this solve)

## Steps

### 1. Evaluate the refactor

Before generating diffs, assess whether this is the RIGHT change:
- **Is the interface well-scoped?** Does it have a single clear purpose, or is it becoming a god-interface?
- **Could a new interface be better?** Sometimes adding a NEW interface is cleaner than modifying an existing one (preserves backward compat).
- **Is a Bridge better?** If the change is about pushing runtime context, a Bridge class might be more appropriate than an interface change.
- **Are there alternatives?** Could GameEvents solve this without touching the interface at all?
- Output a brief recommendation: "Proceed with refactor" / "Consider alternative: [suggestion]" / "Split interface first"
- If the recommendation is NOT to proceed, explain why and stop. Let the user decide.

### 2. Find all references

Search all phase folders for:
- Files that **define** this interface (`interface IMyInterface`)
- Files that **implement** this interface (`: IMyInterface`)
- Files that **use** this interface (`GetComponent<IMyInterface>()`, `Action<IMyInterface>`)
- GameEvents that reference this interface

Output a reference table:
| File | Phase | Relationship | What it does with the interface |
|------|-------|-------------|-------------------------------|

### 2. Assess breaking impact

For each consumer:
- Will this change **compile-break** the consumer? (method removed/renamed/signature changed)
- Will this change **silently break** behavior? (same signature but different semantics)
- Is the consumer in a **completed phase** (user has hand-typed it)?

Output impact table:
| Consumer | Phase | Status | Breaking? | Fix Required |
|----------|-------|--------|-----------|-------------|

### 3. Generate diffs for each affected file

For each file that needs updating:
- Show BEFORE and AFTER code blocks
- Mark changes with `// ← CHANGED` or `// ← ADD` or `// ← REMOVED`
- Explain why each change is needed

### 4. Update Dependency.md files

For every `_-Systems/` folder that implements or uses the changed interface:
- Rewrite Dependency.md from scratch following `.windsurf/templates/Dependency-template.md` (never patch)
- Update portability levels if deps changed

### 5. Update living docs

- **PhaseMap.md**: Update modifications tables for affected phases
- **GUIDE.md**: Update "Modifications to Earlier Phases" sections
- **FLOW.md**: Update event registry if event signatures changed
- **SystemPortabilityMap.md**: Recalculate if portability changed
- **SystemIsolationAnalysis.md**: Update Interface Ownership Map (owner, implementors), Communication Matrix (if coupling type changed), and Coupling Hotspots (if connectivity changed). This is critical — interface refactors directly change the isolation topology.
- **surfer.md**: Append decision rationale (include the evaluation from step 1)

### 6. Summary

Output:
- What changed and why
- All affected files with diffs
- Breaking vs non-breaking changes
- Portability impact
- Recommended hand-typing order for the changes