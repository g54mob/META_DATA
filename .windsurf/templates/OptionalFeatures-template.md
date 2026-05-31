# OptionalFeatures Template — External Package Integration Guide

> Copy this structure into `LEARN/{PROJECT}/OptionalFeatures.md`.
> Features that enhance gameplay but are NOT required for core functionality.
> The game works 100% without these — they add polish, juice, and visual quality.
> Each feature is additive, null-safe, and removable without breaking anything.

---

## Mandatory Sections

### 1. Per-Feature Entry

```markdown
## N. [Feature Category] ([Package/Approach])

> **Package:** [Name + size, or "Built-in" if no external package]
> **Doc:** [link to documentation, or "N/A"]
> **What it does:** [One-line description]
> **Integration pattern:** `[SerializeField] Type _field;` + `_field?.Method();`
> **Null-safe:** `?.` means does nothing if not wired. Game runs identically without it.

**All metadata fields above are MANDATORY.** If no external package, write `Package: Built-in`. If no doc link, write `Doc: N/A`.

---

### Phase X — [System/Context]

#### X.N — [Feature Name] ([what it adds])

**Script:** `phase-X/Scripts/path/to/File.cs`
**Where:** Inside `MethodName()`, after [specific location]

```csharp
// ADD: field
[SerializeField] Type _fieldName;

// ADD: after [context] (line ~N)
_fieldName?.Method(params);
```

**Lines changed:** +N (N fields + N calls)

**Configuration (in inspector):**

| # | Setting/Component | Values | What It Does |
|---|-------------------|--------|-------------|
| 1 | [component/setting] | [values] | [effect] |

**Requires in scene:** [Any additional GameObjects/components needed]

**Gameplay impact:** ⭐/⭐⭐/⭐⭐⭐ LOW/MEDIUM/HIGH — [Why it matters]
```

---

## Rules

- Every feature MUST be null-safe (`?.` operator) — game runs identically without it
- Integration = minimal: 1-3 lines per script (field + call)
- Group by phase (same order as PhaseMap)
- Include exact script path, exact method, exact line location
- Gameplay impact rating: ⭐ LOW (barely noticeable), ⭐⭐ MEDIUM (nice), ⭐⭐⭐ HIGH (transforms feel)
- Never add features that require architectural changes — only additive `[SerializeField]` + `?.Call()`
- If a feature needs more than 3 lines per script, it belongs in `#region Extra` in the main phase, not here
- Keep integration pattern visible: reader should be able to add this in <5 minutes per script