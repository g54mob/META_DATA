---
mode: agent
description: "Deep-analyse a project's LEARN/{PROJECT}/ folder (all phases, scripts, docs) and verify/update .github/prompts/*.prompt.md to match reality. Use when: after completing multiple phases, when prompts feel stale, when audit flags wrong prompt instructions."
---

# /rebuild-prompts — Evolve Prompt Files from Real Code

> Reads every `.cs` and `.md` across all built phases, extracts what was ACTUALLY built (folder structures, file patterns, doc formats, test approaches, bridge placements, cross-phase mods), compares against what each `*.prompt.md` INSTRUCTS the agent to do, and fixes any mismatch.

> **This prompt does NOT modify project-specific files** (`LEARN/{PROJECT}/GOAL.md`, `LEARN/{PROJECT}/NewAgent.md`, phase scripts). It only updates the `.github/prompts/*.prompt.md` workflow files.

> **Scope:** Every `.prompt.md` in `.github/prompts/` is a target — `init`, `build-phase`, `audit-phase`, `decouple-check`, `cross-phase-mod`, `post-delivery-sync`, `update-goal-from-handtyped`, `add-system-to-phase`, `refactor-interface`, `evolve-shared-infra`, `rebuild-templates`, and this file itself.

---

## Setup

### 1. Ask for paths

Ask the user:
- "Where is the **learn folder** that houses all phase folders + GOAL.md + NewAgent.md + all `.cs` scripts?"
  - Default: `LEARN/{PROJECT}/` (future convention) or `learn/` (legacy single-project)
  - Set `{LEARN}` = user's answer
- "Where are the **prompt files** (`*.prompt.md`)?"
  - Default: `.github/prompts/`

### 2. Verify structure

Confirm these exist:
- `{LEARN}/GOAL.md` — project-specific architecture bible
- `{LEARN}/NewAgent.md` — project-specific agent instructions
- At least 2 `{LEARN}/phase-*/` folders with `.cs` files inside
- `{PROMPTS}/` folder with at least 5 `.prompt.md` files

### 3. Inventory the project

**Phase inventory:**

| Phase | Scripts | Systems | GUIDE | FLOW | Dependency.md count | Tests | Manual Tests | Prototypes |
|-------|---------|---------|-------|------|---------------------|-------|-------------|------------|

**Learn root docs inventory:**

| Doc | Exists? |
|-----|---------|
| GOAL.md | ? |
| NewAgent.md | ? |
| PhaseMap.md | ? |
| StructureMap.md | ? |
| Estimate.md | ? |
| SystemPortabilityMap.md | ? |
| SystemIsolationAnalysis.md | ? |
| CoverageMap.md | ? |
| OptionalFeatures.md | ? |
| surfer.md | ? |
| ARCHITECTURE.md | ? |

---

## Phase 1 — Deep Extraction (Read-Only)

> Read ALL code and docs. Extract what was ACTUALLY built. Do not skip files.

### 4. Extract actual system folder structure

For every `_-Systems/XxxSystem/` across all phases, list:
- All files at root
- All subfolders (Interface/, Bridge/, BaseSub/, Field_/, SO_/, etc.)
- Whether `Test.md` exists inside the system folder
- Whether `Dependency.md` exists inside the system folder

Produce:

```
| System | Phase | Files at Root | Subfolders | Has Test.md? | Has Dependency.md? |
```

**Key question for prompts:** Do prompts tell agents to create per-system `Test.md`? Does real code have them?

### 5. Extract actual test patterns

Scan all phases for test files:

**5-Tests/ folder contents:**

| Phase | .cs test files | Manual/ subfolder? | Manual .md files |
|-------|---------------|-------------------|-----------------|

**Per-system Test.md:**

| Phase | Systems with Test.md inside _-Systems/ | Systems WITHOUT |
|-------|---------------------------------------|----------------|

**Key question for prompts:** What does `build-phase.prompt.md` step 12 say about Test.md? What does `add-system-to-phase.prompt.md` step 2 say? Do they match reality?

### 6. Extract actual prototype patterns

Scan all phases for `prototype/` folders:

| Phase | Has prototype/? | Files | Naming pattern |
|-------|----------------|-------|---------------|

**Key question for prompts:** Does `build-phase.prompt.md` step 12b always generate prototypes? Which phases actually have them? Are prototypes early-phase only?

### 7. Extract actual Dependency.md format

Read ALL `Dependency.md` files across all phases. For each, extract section headings:

| System | Phase | Sections Found |
|--------|-------|---------------|

Specifically track:
- Which have "Scene Setup" sections?
- Which follow the 3-zone diagram format from `Dependency-template.md`?
- Which have "Key Architecture" sections?
- Which have "Future Phase Modifications" sections?
- Which have "Checklist" sections?

**Key question for prompts:** Does `build-phase.prompt.md` specify Scene Setup in Dependency.md or in GUIDE.md? What does reality show?

### 8. Extract actual GUIDE.md format

Read ALL `GUIDE.md` files across all phases. For each, extract section headings:

| Phase | Sections Found |
|-------|---------------|

Track specifically:
- "Key Architecture" — which phases have it?
- "Cross-Phase Interfaces Implemented" — which phases?
- "Modifications to Earlier Phases" — which phases?
- "Source vs Phase Diff" — which phases?
- "Scene Setup" — which phases have it in GUIDE vs Dependency.md?

**Key question for prompts:** Does `build-phase.prompt.md` require these sections? Does `audit-phase.prompt.md` check for them?

### 9. Extract actual FLOW.md format

Read ALL `FLOW.md` files across all phases. For each, extract section headings + order:

| Phase | Section 1 | Section 2 | Section 3 | ... |
|-------|-----------|-----------|-----------|-----|

**Key question for prompts:** Is section ordering consistent? Do prompts enforce a specific order?

### 10. Extract actual GameEvents.cs patterns

Read every `GameEvents.cs` across all phases. Extract:

| Phase | LogSubscribersCount param order | Invoke prefix (GameEvents.OnX? vs OnX?) | Comment style | Inline comment? |
|-------|-------------------------------|----------------------------------------|---------------|----------------|

**Key question for prompts:** Does `build-phase.prompt.md` step 10 match the actual invoke pattern?

### 11. Extract actual Bridge patterns

Find ALL `*Bridge.cs` files. For each:

| Bridge | Phase | System | In Bridge/ subfolder? | Pattern variant | Lives on provider/consumer/non-portable side? |
|--------|-------|--------|-----------------------|----------------|----------------------------------------------|

Classify into the 5 canonical variants (or discover NEW variants not yet catalogued):
1. **Event-push** — Inspector-wired → cast to interface → fire GameEvent on Start
2. **Event-response** — Subscribe to GameEvent → call interface method on received object
3. **Push-to-all** — `FindObjectsByType<T>()` on Start → loop + push self
4. **Event-chain** — Subscribe to GameEvent → fire ANOTHER GameEvent with `this`
5. **Static-accessor** — Inspector-wired → `static IXxx Provider { get; private set; }`

**Key question for prompts:** Do prompts use the correct 5 variant names? Do they specify the correct placement rule?

### 12. Extract actual cross-phase modification patterns

Read all "Modifications to Earlier Phases" sections in GUIDE.md files. Also scan for cross-phase patterns:

| Phase | Modifies | What | Type (new interface impl, new field, new method, partial extend) |
|-------|----------|------|---------------------------------------------------------------|

**Key question for prompts:** Does `cross-phase-mod.prompt.md` scan for new interface implementations? Or only methods/fields/enums?

### 13. Extract actual phase-All/ scaffolding

List everything in `{LEARN}/phase-All/`:

```
phase-All/
├── 0-Core/          → [list files]
├── 1-Managers/      → [list files]
├── 2-Data/Enums/    → [list files]
├── 3-MonoBehaviours/ → [list files + subfolders]
├── 4-Utils/         → [list files]
├── 6-Shaders/       → [list files]
├── 7-3D/            → [list files]
└── _-Systems/       → [empty or has content?]
```

**Key question for prompts:** Does `init.prompt.md` step 26 match what actually exists? Any files listed that shouldn't be there (e.g., EconomyManager in phase-All)?

### 14. Extract actual 4-Utils/ patterns

List all files in `4-Utils/` for each phase:

| Phase | Files in 4-Utils/ |
|-------|-------------------|

**Key question for prompts:** Are there per-phase `UtilsPhaseX.cs` files? Or only `PhaseXLOG.cs`? What does `build-phase.prompt.md` step 15 say?

### 15. Extract actual audit rule patterns

Read all `.cs` files and discover which patterns the code uses that `audit-phase.prompt.md` step 6 would **incorrectly flag** as violations. Focus on:

- `#region` names: what does the code actually call its regions vs what does the audit prompt check for?
- Field visibility: which script roles use `public` fields without `[SerializeField]`? Would the audit flag them?
- Property usage: which script roles use `{ get; set; }` or `=> _field`? Are they legitimate exceptions?
- `FindObjectsByType` vs `FindObjectOfType`: does the audit distinguish between them?
- Any other pattern the code uses correctly that the audit would treat as a violation?

Produce:

| Pattern | Used In | Violation per audit prompt? | Actually correct? |
|---------|---------|---------------------------|-------------------|
| (discover from code) | ... | ... | ... |

**Key question:** How many false positives would the current audit prompt produce on correct code?

### 16. Extract actual `#region` ordering

Read representative scripts from each role. Extract actual `#region` order:

| Role | Script | Actual #region order |
|------|--------|---------------------|

**Key question for prompts:** Does `audit-phase.prompt.md` step 6 check for the correct `#region` names and order?

---

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

Read `.github/MANUAL.md`. Update it to reflect any prompt changes:
- **Workflow Reference table** — verify every prompt's "What It Does" description is still accurate after fixes
- **Typical Flow section** — update if any prompt chaining changed
- **Prompts listing** — update step counts if steps were added/removed
- **Add `/rebuild-prompts`** to the workflow if not already listed

Read `.github/copilot-instructions.md`. Verify it is still aligned:
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