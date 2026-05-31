---
description: "/rebuild-prompts continuation (part 2/2) — gap report output, apply approved changes, self-check, summary. Run /rebuild-prompts first."
---

<!-- SPLIT: Part 2 of /rebuild-prompts — exceeds Windsurf's 12K char limit when combined -->

## Phase 1 Output — Prompt Gap Report

### 17. Produce per-prompt gap report

For EACH prompt file, produce:

```markdown
# Prompt Rebuild Report — {PROJECT}

## Phases Analysed
| Phase | Scripts | Systems |

---

## init.prompt.md

### Correct ✅
(Steps that match reality)

| Step | What It Says | Evidence It's Correct |
|------|-------------|----------------------|

### Wrong ❌
(Steps that contradict what LEARN/{PROJECT}/ actually built)

| Step | What Prompt Says | What Code Actually Does | Fix |
|------|-----------------|------------------------|-----|

### Missing ➕
(Things LEARN/{PROJECT}/ does that the prompt doesn't instruct)

| Gap | Evidence | Should Add? |
|-----|---------|-------------|

---

## build-phase.prompt.md

### Correct ✅
| Step | What It Says | Evidence |

### Wrong ❌
| Step | What Prompt Says | What Code Actually Does | Fix |

### Missing ➕
| Gap | Evidence | Should Add? |

---

## audit-phase.prompt.md

### Correct ✅
| Step | What It Says | Evidence |

### Wrong ❌
(Focus on: false positive violations — rules that would flag correct code)

| Step | Rule | Would Flag | But It's Actually Correct | Fix |
|------|------|-----------|--------------------------|-----|

### Missing ➕
| Gap | Evidence | Should Add? |

---

## decouple-check.prompt.md
(same structure)

## cross-phase-mod.prompt.md
(same structure)

## post-delivery-sync.prompt.md
(same structure)

## update-goal-from-handtyped.prompt.md
(same structure)

## add-system-to-phase.prompt.md
(same structure)

## refactor-interface.prompt.md
(same structure)

## evolve-shared-infra.prompt.md
(same structure)

## rebuild-templates.prompt.md
(same structure)
```

### 18. Severity classification

For each gap found, classify:

| Severity | Meaning | Example |
|----------|---------|---------|
| **🔴 High** | Agent would produce WRONG output or flag CORRECT code | Audit checks wrong #region names |
| **🟡 Medium** | Agent would miss something or use stale labels | Bridge variant names don't match canonical 5 |
| **🟢 Low** | Minor inconsistency, optional feature | Prototypes over-specified for later phases |

### 19. STOP — Present report and wait for confirmation

Output the complete per-prompt gap report. Then:

> **"Here's what I found across all prompt files. Review each prompt's gaps. Tell me:**
> 1. **Which fixes to approve** (by prompt name + step number)
> 2. **Which to skip** (intentional differences, one-off exceptions)
> 3. **Which to modify** (you want the fix but worded differently)
>
> **I will NOT modify any prompt file until you confirm."**

---

## Phase 2 — Apply Approved Changes

> Only proceeds after user confirms which changes to apply.

### 20. Apply changes to init.prompt.md

For each approved change:
- Fix wrong scaffolding references (e.g., misplaced Manager locations)
- Add missing files to scaffolding lists
- Update step numbers if steps are added/removed
- Ensure phase-All/ scaffolding matches what was actually built

### 21. Apply changes to build-phase.prompt.md

For each approved change:
- Fix per-system deliverable list (Test.md, Bridge/ subfolder, Scene Setup location)
- Clarify prototype generation scope (early phases vs later phases)
- Update GameEvents format instructions to match actual code
- Fix bridge placement instructions
- Clarify Manual test guide expectations

### 22. Apply changes to audit-phase.prompt.md

For each approved change:
- Fix `#region` names in violation checks to match actual code conventions
- Add exceptions to `[SerializeField]` and property checks (Field_, DataWrapper, UIManager, Bridge, DataManager)
- Add `FindObjectsByType` distinction from `FindObjectOfType`
- Ensure violation checks would NOT flag correct LEARN/{PROJECT}/ code as violations

**Critical validation:** After applying changes, mentally run the audit rules against 3 representative scripts from LEARN/{PROJECT}/ (one Field_, one DataService, one Bridge). Confirm ZERO false positives.

### 23. Apply changes to decouple-check.prompt.md

For each approved change:
- Update bridge variant classification to use the 5 canonical names
- Add `FindObjectsByType` to scan targets with correct classification
- Update bridge placement rule references

### 24. Apply changes to cross-phase-mod.prompt.md

For each approved change:
- Add "new interface implementations on existing classes" to scan targets
- Ensure the scan covers all cross-phase modification types found in LEARN/{PROJECT}/

### 25. Apply changes to post-delivery-sync.prompt.md

For each approved change:
- Add GUIDE/FLOW section structure drift checks
- Update doc sync steps to match actual doc formats

### 26. Apply changes to update-goal-from-handtyped.prompt.md

For each approved change:
- Add UtilsPhaseX vs centralized Utils conflict detection
- Add decision point prompts for conflicting conventions

### 27. Apply changes to add-system-to-phase.prompt.md

For each approved change:
- Fix per-system deliverable references (Test.md → 5-Tests/)
- Update bridge and interface subfolder guidance

### 28. Apply changes to refactor-interface.prompt.md

For each approved change:
- Update interface refactoring to reference multi-tier interface patterns
- Ensure evaluation step considers the proven split-by-access-pattern approach

### 29. Apply changes to evolve-shared-infra.prompt.md

For each approved change:
- Update phase-All/ analysis to match actual structure
- Add any missing analysis targets

### 30. Apply changes to rebuild-templates.prompt.md

For each approved change:
- Update extraction steps if new convention areas were discovered
- Ensure the template rebuild doesn't conflict with prompt instructions

### 31. Self-check — rebuild-prompts.prompt.md

Review THIS file (rebuild-prompts.prompt.md) against the findings:
- Are the extraction steps (4-16) comprehensive enough to catch all gaps?
- Should new extraction areas be added based on what was discovered?
- Update if needed.

### 32. Update MANUAL.md and copilot-instructions.md

Read `.windsurf/MANUAL.md`. Update it to reflect any prompt changes:
- **Workflow Reference table** — verify every prompt's "What It Does" description is still accurate after fixes
- **Typical Flow section** — update if any prompt chaining changed
- **Prompts listing** — update step counts if steps were added/removed
- **Add `/rebuild-prompts`** to the workflow if not already listed

Read `.windsurf/copilot-instructions.md`. Verify it is still aligned:
- **Prompts listing in workspace structure** — verify every `.prompt.md` is listed
- **Architecture Conventions summary** — if any prompt fix changed what conventions are enforced (e.g., new exceptions to rules, new mandatory patterns), update the conventions summary to match

### 33. Summary report

After all changes applied:

```markdown
## Changes Applied

| Prompt File | Steps Modified | Steps Added | Steps Removed |
|------------|----------------|-------------|---------------|

## False Positive Validation

Ran updated audit rules against 3 representative LEARN/{PROJECT}/ scripts:

| Script | Role | Violations Before Fix | Violations After Fix | False Positives Eliminated |
|--------|------|----------------------|---------------------|---------------------------|

## What to Do Next

1. Run `/audit-phase` on a completed phase — verify zero false positives on correct code
2. Run `/build-phase` on next phase — verify it produces the correct deliverables
3. Re-run `/rebuild-prompts` after completing 2-3 more phases to catch further evolution
```

---

## Analysis Checklist (Quick Reference)

The 13 extraction areas this prompt checks against prompts:

| # | Area | What to Extract from LEARN/{PROJECT}/ | Which Prompts It Affects |
|---|------|----------------------------|-------------------------|
| 1 | System folder structure | Subfolders, Test.md presence, Dependency.md presence | build-phase, add-system-to-phase |
| 2 | Test patterns | 5-Tests/ contents, Manual/, per-system Test.md | build-phase, audit-phase, add-system-to-phase |
| 3 | Prototype patterns | Which phases have prototype/, naming, scope | build-phase |
| 4 | Dependency.md format | Sections per system, Scene Setup location | build-phase, audit-phase |
| 5 | GUIDE.md format | Evolved sections vs template spec | build-phase, audit-phase, post-delivery-sync |
| 6 | FLOW.md format | Section ordering across phases | build-phase, audit-phase, post-delivery-sync |
| 7 | GameEvents format | Invoke style, comment style, param order | build-phase |
| 8 | Bridge patterns | 5 variants, placement rule, subfolder usage | build-phase, decouple-check, audit-phase |
| 9 | Cross-phase mods | Interface impls vs method/field additions | cross-phase-mod |
| 10 | phase-All scaffolding | What actually exists vs what init creates | init |
| 11 | 4-Utils patterns | PhaseXLOG only vs UtilsPhaseX files | build-phase, update-goal-from-handtyped |
| 12 | Audit false positives | #region names, field visibility, property exceptions | audit-phase |
| 13 | Doc types | Which root .md files exist vs what init generates | init, post-delivery-sync |