---
description: "/rebuild-templates continuation (part 2/3) — micro-conventions, gap report, stop for confirmation. Run /rebuild-templates first."
---

<!-- SPLIT: Part 2 of /rebuild-templates — exceeds Windsurf's 12K char limit when combined -->

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


> **Continue:** Run `/rebuild-templates-3` to proceed with applying approved changes.
