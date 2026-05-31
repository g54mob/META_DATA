---
description: "/rebuild-templates continuation (part 3/3) — apply approved changes to templates. Run /rebuild-templates-2 first."
---

<!-- SPLIT: Part 3 of /rebuild-templates — exceeds Windsurf's 12K char limit when combined -->

## Phase 2 — Apply Approved Changes

> Only proceeds after user confirms which changes to apply.

### 22. Apply changes to GOAL-general.md

For each approved change targeting `GOAL-general.md`:
- Find the exact section in the template
- Apply the change (fix wrong rule, add missing pattern, expand vague section, remove stale content)
- Preserve the template's generic/universal voice — NO project-specific names
  - Replace specific system names with generic equivalents: `ShopUISystem` → `[FeatureSystem]`
  - Replace specific interface names with patterns: `IProcessIdentity` → `IFeatureIdentity`
  - Replace specific script names: `MoneyBridge` → `[ProviderBridge]`
- Keep all `[PROJECT_NAME]` and `[PHASE_X]` placeholders intact

**Generalization rules for code examples:**
- Bridge examples: use generic names (`IMyProvider`, `MyProviderBridge`, `FeatureSystem`)
- Interface examples: use generic tiers (`IFeatureIdentity`, `IFeatureConvertible`, `IFeatureProgressable`)
- DataService examples: can keep ShopDataService (it's already in the template as the gold standard)
- GameEvents examples: use generic event names (`OnFeatureStateChanged`, `OnProviderReady`)

### 23. Apply changes to NewAgent-general.md

For each approved change targeting `NewAgent-general.md`:
- Add new Common Agent Mistakes with sequential numbering
- Add new checklist sections
- Update expected doc list
- Preserve universal voice

### 24. Apply changes to GUIDE-template.md

For each approved change targeting `GUIDE-template.md`:
- Add new mandatory sections with format specification
- Add examples showing the expected output
- Ensure section order matches what evolved in real phase GUIDE.md files
- Add any new inline conventions (e.g., system shapes + portability level in folder structure)

### 25. Apply changes to FLOW-template.md

For each approved change targeting `FLOW-template.md`:
- Update/add mandatory sections
- Ensure portability diagram, event registry, and system map specs match real FLOW.md files

### 26. Apply changes to Dependency-template.md

For each approved change targeting `Dependency-template.md`:
- Add new sections discovered in real Dependency.md files (e.g., Scene Setup)
- Update the 3-zone diagram format if real code evolved it
- Ensure checklist items match current architecture rules

### 27. Summary report

After all changes applied:

```markdown
## Changes Applied

| Template File | Sections Modified | Sections Added | Sections Removed |
|--------------|-------------------|----------------|-----------------|

## Verification

For each modified template, confirm:
- [ ] All `[PROJECT_NAME]` / `[PHASE_X]` placeholders preserved
- [ ] No project-specific names leaked in (no "MineMGL", no "OrePiece", no "ShopUI")
- [ ] Code examples use generic names
- [ ] Section numbering/ordering still makes sense
- [ ] No contradictions introduced between sections

## What to Do Next

1. Run `/init` on your next project — it will use the updated templates
2. Optionally re-run `/post-delivery-sync` on current project to sync `LEARN/{PROJECT}/GOAL.md` with updated template
3. Re-run `/rebuild-templates` after completing 2-3 more phases to capture further evolution
```

### 28. Update MANUAL.md and copilot-instructions.md

Read `.windsurf/MANUAL.md`. Update it to reflect the current state of ALL prompts:

- **Workflow Reference table** — verify every prompt is listed with accurate "When to Use" and "What It Does"
- **Typical Flow section** — verify the flow diagrams show correct chaining (e.g., `/build-phase` auto-runs audit/decouple/cross-phase)
- **Prompts listing in folder structure** — verify every `.prompt.md` file is listed with step count
- **If any prompt was added, renamed, or had its scope changed** during this rebuild, update the corresponding MANUAL.md entries
- **Ensure MANUAL.md is comprehensive enough** that a user who has never seen this workspace can understand what each prompt does, when to use it, and how they chain together

Read `.windsurf/copilot-instructions.md`. Verify it is still aligned:
- **Prompts listing in workspace structure** — verify every `.prompt.md` is listed
- **Architecture Conventions summary** — if any template change altered what conventions are enforced (e.g., new rules, changed exceptions, removed stale patterns), update the conventions summary to match
- **Folder Structure** — verify the phase-All/ and phase-{x}/ trees still match the updated templates

---

## Analysis Checklist (Quick Reference)

The 17 convention areas this prompt extracts from code:

| # | Area | What to Extract | Compare Against |
|---|------|----------------|----------------|
| 1 | `#region` order | All `#region` names per script, grouped by role | GOAL-general.md `#region` specification |
| 2 | `using` imports | First 15 lines of every `.cs` | GOAL-general.md (if documented) |
| 3 | Field visibility | `[SerializeField]`, `public`, `protected`, `[HideInInspector]` by role | GOAL-general.md SerializeField rule |
| 4 | Property usage | `{ get; set; }`, `=> _field`, derived properties by role | GOAL-general.md no-property rule + exceptions |
| 5 | Bridge patterns | All `*Bridge.cs` — variant + placement | GOAL-general.md Bridge Pattern section |
| 6 | Interface conventions | Location, `<summary>` format, multi-tier sets | GOAL-general.md interface rules |
| 7 | GameEvents format | Parameter order, invoke prefix, comment style | GOAL-general.md foundation code |
| 8 | System subfolders | All subfolder names under `_-Systems/*/` | GOAL-general.md subfolder table |
| 9 | Inheritance chains | Multi-level base class locations | GOAL-general.md (if documented) |
| 10 | GUIDE.md format | Section headings across all phases | GUIDE-template.md |
| 11 | FLOW.md format | Section headings across all phases | FLOW-template.md |
| 12 | Dependency.md format | Section headings across all systems | Dependency-template.md |
| 13 | Custom extensions | All `.method()` calls matching extension patterns | GOAL-general.md extensions list |
| 14 | Doc types | All `.md` in LEARN/{PROJECT}/ root | Template expected docs list |
| 15 | Naming conventions | ALL_CAPS, DOC__, Field_ fields, extensions in same file | GOAL-general.md naming rules |
| 16 | Weighted/entity patterns | `[Serializable]` entities with Weight + Utils overloads | GOAL-general.md (if documented) |
| 17 | Micro-conventions | Summaries, `_` prefix, camelCase enums, `// →` markers, attributes, debug logging, code style | GOAL-general.md script structure + naming + C# features |