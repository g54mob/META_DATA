---
description: "Deep-analyse a project's LEARN/{PROJECT}/ folder (all phases, scripts, docs) and verify/update .windsurf/workflows/*.prompt.md to match reality. Use when: after completing multiple phases, when prompts feel stale, when audit flags wrong prompt instructions."
---

# /rebuild-prompts — Evolve Prompt Files from Real Code

> Reads every `.cs` and `.md` across all built phases, extracts what was ACTUALLY built (folder structures, file patterns, doc formats, test approaches, bridge placements, cross-phase mods), compares against what each `*.prompt.md` INSTRUCTS the agent to do, and fixes any mismatch.

> **This prompt does NOT modify project-specific files** (`LEARN/{PROJECT}/GOAL.md`, `LEARN/{PROJECT}/NewAgent.md`, phase scripts). It only updates the `.windsurf/workflows/*.prompt.md` workflow files.

> **Scope:** Every `.prompt.md` in `.windsurf/workflows/` is a target — `init`, `build-phase`, `audit-phase`, `decouple-check`, `cross-phase-mod`, `post-delivery-sync`, `update-goal-from-handtyped`, `add-system-to-phase`, `refactor-interface`, `evolve-shared-infra`, `rebuild-templates`, and this file itself.

---

## Setup

### 1. Ask for paths

Ask the user:
- "Where is the **learn folder** that houses all phase folders + GOAL.md + NewAgent.md + all `.cs` scripts?"
  - Default: `LEARN/{PROJECT}/` (future convention) or `learn/` (legacy single-project)
  - Set `{LEARN}` = user's answer
- "Where are the **prompt files** (`*.prompt.md`)?"
  - Default: `.windsurf/workflows/`

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


<!-- SPLIT: This workflow exceeds Windsurf's 12K char limit. Continues in /rebuild-prompts-2 -->

> **Continue:** Run `/rebuild-prompts-2` to proceed with gap report output, Phase 2 changes, and summary.
