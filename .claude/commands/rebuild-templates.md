---
description: "Deep-analyse a project's LEARN/{PROJECT}/ folder (all phases, scripts, docs) and update .claude/templates/*-general.md AND *-template.md to reflect battle-tested conventions. Use when: after completing multiple phases, before starting a new project, whenever templates feel stale."
---

# /rebuild-templates — Evolve Universal Templates from Real Code

> Reads every `.cs` and `.md` across all built phases, extracts the actual conventions being used, compares against ALL template files (`*-general.md` + `*-template.md`), and backports proven patterns into them.

> **This prompt does NOT modify project-specific files** (`LEARN/{PROJECT}/GOAL.md`, `LEARN/{PROJECT}/NewAgent.md`). It only updates the universal `.claude/templates/` files that feed into `/init` for future projects.

> **Scope:** `GOAL-general.md`, `NewAgent-general.md`, `GUIDE-template.md`, `FLOW-template.md`, `Dependency-template.md` — ALL are first-class targets.

---

## Setup

### 1. Ask for paths

Ask the user:
- "Where is the **learn folder** that houses all phase folders + GOAL.md + NewAgent.md + all `.cs` scripts?"
  - Default: `LEARN/{PROJECT}/` (future convention) or `learn/` (legacy single-project)
  - Set `{LEARN}` = user's answer
- "Where are the **template files** (`*-general.md` and `*-template.md`)?"
  - Default: `.claude/templates/`

### 2. Verify structure

Confirm these exist:
- `{LEARN}/GOAL.md` — project-specific architecture bible
- `{LEARN}/NewAgent.md` — project-specific agent instructions
- At least 2 `{LEARN}/phase-*/` folders with `.cs` files inside
- `{TEMPLATES}/GOAL-general.md` — universal architecture template
- `{TEMPLATES}/NewAgent-general.md` — universal agent instruction template

Also read ALL other templates (analyse each for gaps against actual code):
- `{TEMPLATES}/ARCHITECTURE-template.md`
- `{TEMPLATES}/GUIDE-template.md`
- `{TEMPLATES}/FLOW-template.md`
- `{TEMPLATES}/Dependency-template.md`
- `{TEMPLATES}/PhaseMap-template.md`
- `{TEMPLATES}/StructureMap-template.md`
- `{TEMPLATES}/SystemPortabilityMap-template.md`
- `{TEMPLATES}/SystemIsolationAnalysis-template.md`
- `{TEMPLATES}/CoverageMap-template.md`
- `{TEMPLATES}/Estimate-template.md`
- `{TEMPLATES}/OptionalFeatures-template.md`
- `{TEMPLATES}/surfer-template.md`

Also read project docs for comparison:
- `{LEARN}/SystemIsolationAnalysis.md`
- `{LEARN}/SystemPortabilityMap.md`
- `{LEARN}/CoverageMap.md`
- `{LEARN}/OptionalFeatures.md`

### 3. Inventory all phases

List every `{LEARN}/phase-*/` folder. For each:
- Count `.cs` files recursively
- Count `_-Systems/*/` folders (system count)
- Note whether GUIDE.md, FLOW.md exist
- Note whether any `_-Systems/*/Dependency.md` exist

Report: `| Phase | Scripts | Systems | GUIDE | FLOW | Dependencies |`

---

## Phase 1 — Deep Convention Extraction (Read-Only)

> Read ALL code. Extract ACTUAL conventions. Do not skip files.

### 4. Extract `#region` ordering

Read every `.cs` file across all phases. For each, extract the `#region` names in declaration order. Group by script role:

| Role | Scripts Sampled | Actual `#region` Order Found |
|------|----------------|------------------------------|
| SubManager | ... | ... |
| Orchestrator | ... | ... |
| DataService | ... | ... |
| Field_ | ... | ... |
| DataWrapper (W) | ... | ... |
| MonoBehaviour (base class) | ... | ... |
| MonoBehaviour (multi-interface) | ... | ... |
| Manager (Singleton) | ... | ... |

Compare against `GOAL-general.md`'s `#region` order specification. Note every deviation.

### 5. Extract `using` import blocks

Read the first 15 lines of every `.cs` file. Extract the `using` import pattern:
- What namespaces appear?
- In what order?
- Is there a blank-line grouping pattern (System → UnityEngine → TMPro → Project)?
- Is there a project-specific namespace (e.g., `using SPACE_UTIL;`) used consistently?

Compare against `GOAL-general.md`. Note if the template documents this or not.

### 6. Extract field visibility patterns

Scan all `.cs` files for field declarations. Classify by script role:

| Pattern | Where Found | Script Role | Count |
|---------|-------------|-------------|-------|
| `[SerializeField] private` | ... | MonoBehaviour, Manager | ... |
| `public` (no attribute) | ... | Field_, DataWrapper, entity | ... |
| `[HideInInspector] public` | ... | BasePhysicsObject, etc. | ... |
| `protected` | ... | Base classes | ... |
| `protected ... { set => }` | ... | Base classes (write-only) | ... |
| `public static` constants | ... | DataService config | ... |

Compare against `GOAL-general.md`'s `[SerializeField]` and property rules. Note which exceptions are documented vs which are missing.

### 7. Extract property usage

Find all `{ get; set; }`, `{ get; private set; }`, `=> _field`, and expression-bodied property patterns:

| Pattern | File | Script Role | Purpose |
|---------|------|-------------|---------|
| `=> _field` | ... | Singleton (Owner chain) | Read-only inspector ref |
| `{ get; private set; }` | ... | UIManager, Bridge | Singleton read state / static accessor |
| `=> derivedExpression` | ... | Entity / DataWrapper | Derived computed field |

Compare against `GOAL-general.md`'s no-property rule and its exceptions list.

### 8. Extract Bridge implementations

Find all `*Bridge.cs` files across all phases. For each:

| Bridge | Phase | System | Pattern Variant | Placement (provider/consumer?) |
|--------|-------|--------|----------------|-------------------------------|

Classify each into one of these variants (or discover NEW variants):
1. **Event-push** — Inspector-wired → cast to interface → fire GameEvent on Start
2. **Event-response** — Subscribe to GameEvent → call interface method on received object
3. **Push-to-all** — `FindObjectsByType<T>()` on Start → loop + push self to each
4. **Event-chain** — Subscribe to GameEvent → fire ANOTHER GameEvent with `this` as interface
5. **Static-accessor** — Inspector-wired → `static IXxx Provider { get; private set; }` on Start

Determine the ACTUAL placement rule: does bridge live on consumer side? provider side? non-portable side?

Compare against `GOAL-general.md`'s Bridge Pattern section.

### 9. Extract interface conventions

Find all `interface I*` declarations across all phases. For each:

| Interface | Owner System | Phase | Location (root vs Interface/) | Has Owner/Implementor/Caller doc? |
|-----------|-------------|-------|-------------------------------|-----------------------------------|

Extract patterns:
- When is `Interface/` subfolder used vs root of system? (correlate with interface count per system)
- Do interfaces have `<summary>` with Owner/Implementor/Caller documentation?
- Are there multi-tier interface sets (e.g., Identity/Mutation/Progress tiers on same implementor)?

Compare against `GOAL-general.md`'s interface rules and System Subfolder Convention table.

### 10. Extract GameEvents format

Read every `GameEvents.cs` (phase-All + each phase's `0-Core/`). Extract:
- `LogSubscribersCount` parameter order: `(nameof(OnX), OnX)` or `(OnX, nameof(OnX))`?
- Invoke style: `GameEvents.OnX?.Invoke(...)` or `OnX?.Invoke(...)`?
- Comment block style: `// when X >>` / `// << when X` or `// purpose:`?
- `.colorTag("lime")` in log helper or not?

Compare against `GOAL-general.md`'s Foundation Templates GameEvents code.

### 11. Extract system subfolder patterns

List all subfolder names found under any `_-Systems/*/`:

| Subfolder | Occurrences | Systems That Use It |
|-----------|-------------|---------------------|

Compare against `GOAL-general.md`'s System Subfolder Convention table.

### 12. Extract inheritance chains

Find all `: BaseClassName` declarations. Trace multi-level chains:

```
BaseA (phase-All/3-MonoBehaviours/)
  └── BaseB (phase-All/3-MonoBehaviours/)
        └── ConcreteC (phase-X/_-Systems/XxxSystem/)
              └── SubD (phase-X/_-Systems/XxxSystem/BaseSub/)
```

Note: where does each level live (phase-All shared vs system folder)?

Compare against `GOAL-general.md` — does it document inheritance chain conventions?

### 13. Extract GUIDE.md format

Read every `{LEARN}/phase-*/GUIDE.md`. Extract section headings per phase:

| Phase | Sections Found |
|-------|---------------|

Compare against `GUIDE-template.md`'s mandatory sections list. Note sections that appear in real GUIDEs but not in the template.

### 14. Extract FLOW.md format

Read every `{LEARN}/phase-*/FLOW.md`. Extract section headings per phase:

| Phase | Sections Found |
|-------|---------------|

Compare against `FLOW-template.md`'s mandatory sections list.

### 15. Extract Dependency.md format

Read every `{LEARN}/phase-*/_-Systems/*/Dependency.md`. Extract section headings:

| System | Sections Found |
|--------|---------------|

Compare against `Dependency-template.md`'s mandatory sections list. Note sections in real Dependency docs not in template (e.g., Scene Setup).

### 16. Extract custom extensions used

Grep all `.cs` files for method calls matching project extension patterns (`.map()`, `.find()`, `.all()`, `.gc<T>()`, `.destroyLeaves()`, `.colorTag()`, `.formatMoneyShort()`, `C.method()`, `INPUT.K.InstantDown()`, `INPUT.UI.SetCursor()`, `.flatMap()`, `.forEach()`, `.ToNSJson()`, `.GetOrCreate()`, etc.)

| Extension | Occurrences | In Template's Extensions List? |
|-----------|-------------|-------------------------------|

### 17. Extract doc types in LEARN/{PROJECT}/ root

List all `.md` files in `{LEARN}/` root:

| Doc | Exists? | Mentioned in Templates? |
|-----|---------|------------------------|

Check specifically for: `SystemIsolationAnalysis.md`, `OptionalFeatures.md`, `CoverageMap.md`, `SystemPortabilityMap.md`.

### 18. Extract naming conventions

Scan for:
- ALL_CAPS list/dictionary fields — any used for static config constants too?
- `DOC__` dictionary prefixes — consistently used?
- `Field_` public field naming — `_prefix` on public fields?
- Extension classes — co-located in same file as the extended class?

### 19. Extract micro-conventions (coding style detail)

This is the fine-grained pass. Read a representative sample of scripts from EVERY role (SO_, Field_, W, DataService, Orchestrator, SubManager, Manager, MonoBehaviour, Bridge, base class) and extract these minute details:

**Summary & Documentation:**

| Convention | What to Check | Example |
|-----------|---------------|----------|
| Class `<summary>` | Does every class have one? Is it first-person "I"? | `/// <summary> I manage inventory slots... </summary>` |
| Method `<summary>` | Does every method have one? Is it 2-line effect description? | `/// <summary> Builds TOTAL_SIZE empty slots... </summary>` |
| One-liner `<summary>` | Are simple Get/Set methods inline? | `/// <summary> base sell value </summary>` |
| Interface `<summary>` | Owner/Implementor/Caller format? Headline metaphor? | `/// "What am I?" — [SystemName] (Phase X) OWNS...` |
| `// →` flow markers | Inside every method body? | `// → store refs for raycasting + parenting` |
| `// purpose:` comments | On every `.Raise...()` and `+=` subscription? | `// purpose: ItemEquipBridge subscribes → calls SetOwnerContext` |
| `// when X >>` / `// << when X` | GameEvents block comment bookends? | `// when shop view is toggled >>` |
| `// nice-to-have:` | In `#region Extra` blocks? | `// nice-to-have: noclip fly mode` |

**Naming & Casing:**

| Convention | What to Check | Example |
|-----------|---------------|----------|
| `_` prefix on `[SerializeField]` | Always? Private + underscore? | `[SerializeField] float _speed` |
| camelCase enum values | Not PascalCase? | `TagType.grabbable`, `PieceType.ore` |
| `W` prefix (no underscore) | DataWrappers? | `WShopItem`, `WItem` |
| `SO_` prefix | ScriptableObjects? | `SO_ShopItemDef` |
| `Field_` prefix | Display-only? | `Field_ShopItem` |
| `DOC__x__y` double underscore | Dictionaries mapping data→Field? | `DOC__Category__Field` |
| `Handle...` for event handlers | Consistent? | `HandleMoneyChanged` |
| `On...` / `Raise...` for events | Side by side? | `OnMoneyChanged` + `RaiseMoneyChanged()` |
| `Get.../Set...` explicit methods | Instead of properties? | `GetMoney()`, `SetIsInWater(bool)` |
| `.Ins` singleton access | Not `.Instance`? | `Singleton<UIManager>.Ins` |

**Attributes:**

| Convention | What to Check | Example |
|-----------|---------------|----------|
| `[AddComponentMenu]` | On EVERY MonoBehaviour? Categories consistent? | `[AddComponentMenu("ProjectName/Tools/ToolPickaxe")]` |
| `[CreateAssetMenu]` | On every SO_? | `[CreateAssetMenu(menuName = "SO/SO_ItemDef")]` |
| `[DefaultExecutionOrder]` | On which managers? What values? | `[DefaultExecutionOrder(-100)]` |
| `[Header]` grouping | How are inspector fields grouped? | `[Header("Move")] [SerializeField] float _walkSpeed` |
| `[TextArea]` | On which string fields? | `[TextArea] [SerializeField] string _description` |
| `[Tooltip]` | Used? How often? | `[Tooltip("Max stack size")] public int maxStack` |
| `[HideInInspector]` | On which public fields? | `[HideInInspector] public Vector3 SumVelocity` |

**Code Style:**

| Convention | What to Check | Example |
|-----------|---------------|----------|
| Ternary usage | Inline conditionals? | `isDucking ? _duckSpeed : _walkSpeed` |
| `?.` null-conditional | On optional refs? | `_feedback?.PlayFeedbacks()` |
| `$""` interpolation | Everywhere vs concat? | `$"{category.name}: {count}"` |
| `=>` expression-bodied | On one-liner methods? | `public float GetMoney() => currMoney;` |
| LINQ vs manual loops | Which is used for what? | `.map()` for transforms, `foreach` for side-effects |
| `var` usage | For obvious types only? | `var slot = SLOT[index];` |
| Guard clause style | `if (x == null) return;` vs `x?.Do()`? | ... |
| Debug logging style | `C.method(this)` + `.colorTag("lime")`? | `Debug.Log(C.method(this));` |
| `isFirstEnable` exact pattern | Variable name, placement, structure? | `bool isFirstEnable = true;` at field level |

For each convention area, produce:

```
| Convention | Template Documents It? | Code Actually Does | Consistent Across Phases? | Sample Files |
|-----------|----------------------|--------------------|--------------------------|--------------|
```

---

## Phase 1 Output — Gap Report

### 20. Produce categorized gap report

Organize all findings into this structure:

```markdown
# Template Rebuild Report — {PROJECT}

## Phases Analysed
| Phase | Scripts | Systems |

## A. Critical — Template Says X, Code Does Y
(Rules that are WRONG in the template — code contradicts them consistently)

| # | Convention | Template Says | Code Actually Does | Files Proving It | Fix |
|---|-----------|---------------|--------------------|-----------------|----|

## B. Missing — Code Proves Pattern, Template Doesn't Mention It
(Patterns used across 2+ phases that the template should teach)

| # | Pattern | Where Proven | Why It Should Be in Template |
|---|---------|-------------|------------------------------|

## C. Underdocumented — Template Mentions It, But Too Vague
(Template has a sentence, code has a rich proven pattern)

| # | Topic | Template Coverage | What Code Actually Shows |
|---|-------|------------------|-------------------------|

## D. Stale — Template Documents Something Not Used
(Conventions in template that no code follows — candidates for removal)

| # | Convention | In Template At | Evidence It's Unused |
|---|-----------|---------------|---------------------|

## E. Doc Format Gaps — Template Specs vs Actual Docs
(GUIDE/FLOW/Dependency template specs that don't match what evolved)

| # | Template File | Missing Section | Seen In Which Phase Docs |
|---|--------------|----------------|-------------------------|

## F. NewAgent-general.md Gaps
(Agent instruction gaps: missing mistakes, missing checklists)

| # | Gap | Evidence |
|---|-----|---------|

## G. Internal Contradictions in LEARN/{PROJECT}/
(Project-specific issues: conventions that contradict themselves)

| # | Issue | Where | What's Wrong |
|---|-------|-------|-------------|
```

### 21. STOP — Present report and wait for confirmation

Output the complete gap report. Then:

> **"Here's what I found. Review each section. Tell me:**
> 1. **Which changes to approve** (by section letter + item number)
> 2. **Which to skip** (one-off exceptions, not universal patterns)
> 3. **Which to modify** (you want the change but worded differently)
>
> **I will NOT modify any template file until you confirm."**

---

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

Read `.claude/MANUAL.md`. Update it to reflect the current state of ALL commands:

- **Workflow Reference table** — verify every prompt is listed with accurate "When to Use" and "What It Does"
- **Typical Flow section** — verify the flow diagrams show correct chaining (e.g., `/build-phase` auto-runs audit/decouple/cross-phase)
- **Prompts listing in folder structure** — verify every `.prompt.md` file is listed with step count
- **If any prompt was added, renamed, or had its scope changed** during this rebuild, update the corresponding MANUAL.md entries
- **Ensure MANUAL.md is comprehensive enough** that a user who has never seen this workspace can understand what each prompt does, when to use it, and how they chain together

Read `CLAUDE.md`. Verify it is still aligned:
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