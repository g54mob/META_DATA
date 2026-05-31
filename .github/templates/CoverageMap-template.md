# CoverageMap Template — Source File Coverage Tracking

> Copy this structure into `LEARN/{PROJECT}/CoverageMap.md`.
> Every source file mapped to exactly one phase. 100% coverage = no gaps.

---

## Mandatory Sections

### 1. Phase File Counts

```markdown
## Phase File Counts

| Phase | .cs Files | Systems | Coverage Status |
|-------|-----------|---------|----------------|
| phase-All | N | — (FREE infra) | ✅ |
| Phase A | N | N (names) | ✅ |
| Phase B | N | N (names) | ✅ |
| ... | ... | ... | ... |
| **Total** | **N** | **N** | **N/Total = X%** |
```

---

### 2. Per-Phase File Lists

```markdown
## What Each Phase Covers (file-by-file)

### Phase X (N files)

Covers: `OriginalClassName.cs`(→NewName), `AnotherFile.cs`, ...

[List EVERY source file covered by this phase, with rename mapping if the rebuilt name differs:]
- `OriginalName.cs` → `NewName.cs` (rename) or split into `NewA.cs` + `NewB.cs`
- Files that stay the same name: just list them
```

**Rules:**
- Every source file from `MAIN-SOURCE/{PROJECT}/` must appear in exactly ONE phase section
- If a file is split during rebuild, show: `OriginalName.cs`(→split: NewA+NewB+NewC)
- If a file is merged, show: `FileA.cs`+`FileB.cs`(→merged: Combined.cs)
- If renamed, show: `OldName.cs`(→NewName.cs)

---

### 3. Unassigned Files (Gap Section)

```markdown
## Files NOT Covered — Future Phases

### Phase X — [System Name] (~N files)

| # | File | Lines | Priority |
|---|------|-------|----------|
| 1 | `FileName.cs` | ~N | Critical/Important/Nice-to-have |
```

---

### 4. Coverage Summary

```markdown
## Coverage Summary

- **Total source files:** N
- **Covered (assigned to a phase):** N (X%)
- **Unassigned:** N (X%) — listed in "Files NOT Covered" section
- **Multi-assigned (ERROR):** N — [list any file assigned to multiple phases]
```

---

### 5. Interface Inventory

```markdown
## Interface Inventory

| # | Interface | Owner System | Phase | Implementors (System → Phase) |
|---|-----------|-------------|-------|-------------------------------|
| 1 | `IInteractable` | InteractionSystem | A | OreSystem→C, ToolSystem→B |
| 2 | `IDamageable` | ToolSystem | B-1 | MiningNode→C, StaticBreakable→C |
```

Every interface defined across all phases. Who owns it, who implements it.
**Note:** This is the quick-reference version. `SystemIsolationAnalysis.md` has the deep-dive with communication matrix and coupling analysis.

---

### 6. Bridge Inventory

```markdown
## Bridge Inventory

| # | Bridge | Lives In (System) | Pushes Context To | Phase |
|---|--------|-------------------|-------------------|-------|
| 1 | `CamContextBridge` | CameraSystem | PlayerGrab, FresnelHighlighter | B |
```

Every Bridge class. Where it lives, what systems consume it.

---

### 7. GameEvents Registry

```markdown
## GameEvents Registry

| # | Event | Phase Defined | Raised By | Subscribed By |
|---|-------|--------------|-----------|---------------|
| 1 | `OnMoneyChanged` | All | EconomyManager | ShopOrchestrator(A), ToolOrchestrator(B) |
```

Complete event communication map across all phases.

---

### 8. SO_ and Field_ Inventory (optional but recommended)

```markdown
## SO_ Inventory

| # | SO_ Type | System | Phase | Fields |
|---|----------|--------|-------|--------|
| 1 | `SO_ItemDef` | ShopSystem | A | name, price, icon, category |

## Field_ Inventory

| # | Field_ Type | System | Phase | Displays |
|---|-------------|--------|-------|----------|
| 1 | `Field_ShopItem` | ShopSystem | A | icon, name, price, buy button |
```

---

## Rules

- 100% coverage is the goal — every source file mapped to exactly one phase
- No file should appear in multiple phases (flag as ERROR if found)
- Include line counts for unassigned files (helps estimate remaining work)
- Priority classification: Critical (core gameplay), Important (noticeable absence), Nice-to-have (polish)
- Rename mappings are essential — they're the Rosetta Stone between original and rebuilt code
- Update this file whenever: `/init` runs, `/add-system-to-phase` runs, `/refresh-learn-docs` runs

### 9. Third-Party Integration Coverage

```markdown
## Third-Party Integration Coverage

| # | Library | Used By Systems | Wrapper Interface | Wrapper System | Phase | Depth |
|---|---------|----------------|-------------------|----------------|-------|-------|
| 1 | DOTween | BuildingSystem, UISystem | ITweenProvider | TweenSystem | All | Deep |
| 2 | FMOD | — (replaces SoundManager) | IAudioManager | AudioSystem | All | Pervasive |
| 3 | A*Pathfinding | NPCSystem | IPathfinder | NavigationSystem | B | Deep |
```

**Depth levels:**
- **Shallow** — 1-2 scripts, direct use OK (no wrapper needed)
- **Deep** — 5+ scripts, wrapped behind interface
- **Pervasive** — framework-level, defines architecture patterns

**Rules:**
- Every third-party library detected in the source must be listed
- Libraries used by 3+ systems MUST have a wrapper interface
- Libraries used by 1-2 scripts may use direct imports (note "no wrapper" in table)
- Note which libraries are compile-time requirements vs runtime-only
```