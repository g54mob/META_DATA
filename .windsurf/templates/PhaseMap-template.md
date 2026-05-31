# PhaseMap Template — Full Build Roadmap

> Copy this structure into `LEARN/{PROJECT}/PhaseMap.md`.
> Every phase is a self-contained vertical slice. Each system works standalone first, connects to others via GameEvents.

---

## Mandatory Sections

### 1. Overview Table

```markdown
## Overview

| Phase | Name | Weight | Cumulative | Difficulty | Status |
|-------|------|--------|------------|------------|--------|
| **A** | [Short description] | X% | X% | Easy/Medium/Hard | Planned/Done |
| **B** | [Short description] | X% | X% | Easy/Medium/Hard | Planned |
| ... | ... | ... | ... | ... | ... |
```

**Rules:**
- Weights must sum to 100%
- Phase size cap: max ~25 .cs files per phase
- Difficulty: Easy (<15 scripts, familiar patterns), Medium (15-25 scripts), Hard (25+ scripts OR complex patterns OR many cross-phase mods)
- Status: Planned → Generated → Typed → Done

---

### 2. Per-Phase Section (repeat for each phase)

```markdown
## Phase {X} — [Name] (X%)

### What It Looks Like

[3-5 line player-experience description. What the player sees and does.]

### Script Purpose

[Table or indented list showing every script with one-sentence purpose in first-person "I" voice]

### Files — `_-Systems/` Architecture

[ASCII tree showing the full folder structure for this phase:]
- `0-Core/` — GameEvents.cs (partial)
- `_-Systems/SystemName/` — with every .cs file listed and its role
- `2-Data/Enums/` — GlobalEnumsX.cs
- `4-Utils/` — PhaseXLOG.cs
- `5-Tests/` — test scripts + Manual/*.md

**Per file include:**
- Filename
- Role indicator (SO_, Field_, W, DataService, Orchestrator, SubManager, Bridge, Interface, Test, other)
- Dependencies in parentheses: `(deps: GameEvents, IShopMoney — zero system imports)`
- Portability indicator: ✅ PORTABLE or ❌ GAME-SPECIFIC
- Network Tier (if applicable): `Client` / `Server` / `Shared` / `—` (non-networked)
- Third-Party deps (if any): `(third-party: DOTween)` or `—`
- Save Integration (if applicable): `ISaveable` / `SaveData` / `—`

### Cross-Phase Modifications

| Earlier Phase File | What to Add | Why | Impact |
|--------------------|-------------|-----|--------|
| [file.cs] | [method/field/interface] | [why needed] | ❌/⚠️/🔴 |

### Vertical Slice Tests

| Test | What It Proves |
|------|---------------|
| [TestName] | [What compiles/runs correctly after this phase] |

### Gap Audit

| # | Item | Source File | Classification | Action |
|---|------|-------------|---------------|--------|
| 1 | [method/feature] | [original.cs] | Critical/Important | Add to this phase |
```

---

### 3. Dependency DAG

```markdown
## Dependency DAG

[ASCII art showing phase dependency arrows — ALL arrows point LEFT (no forward refs)]

phase-All ← A ← B ← B-1 ← C ← D ← E ← F ← G ← H ← I ← J

Specific cross-phase arrows:
- C depends on: A (IInteractable), B-1 (IDamageable, IScannable, IMagnetGrabbable)
- D depends on: A (IInteractable), B-1 (IBuildingToolContext)
- ...
```

---

### 4. 80% Rule Verification

```markdown
## 80% Rule Status

| Phase | Total .cs | Inside _-Systems/ | Outside | Percentage | Pass? |
|-------|-----------|-------------------|---------|-----------|-------|
| A | X | Y | Z | Y/X% | ✅/❌ |
| B | X | Y | Z | Y/X% | ✅/❌ |
```

---

## Rules

- Phase size cap: max ~25 files. Warn at 26-30, block at 31+ (split into sub-phases)
- 80% rule: at least 80% of .cs files inside `_-Systems/`
- Dependency DAG: ALL arrows point LEFT — no forward dependencies
- Every source file must appear in exactly one phase (cross-reference with CoverageMap.md)
- Each phase section must include: What It Looks Like, Script Purpose, Files tree, Cross-Phase Mods, Tests, Gap Audit
- "Script Purpose" uses first-person "I" voice for each script