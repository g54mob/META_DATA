# Estimate Template — Hand-Typing Timeline

> Copy this structure into `LEARN/{PROJECT}/Estimate.md`.
> Calibrated from actual typing speed once first phase is hand-typed.
> Before calibration: use default rates (15/30/60 min per simple/medium/complex script).

---

## Mandatory Sections

### 1. Current Status

```markdown
## Current Status

| Asset | Status | Details |
|-------|--------|---------|
| `handTyped(latest)/phase-x` | ✅ Typed / ❌ Not typed | [N scripts, ground-truth code] |
| `phase-x(Generated)/` | ✅ Generated / ❌ Not generated | [Agent output, not yet typed] |
| Phase X–Y | ❌ Not generated | Need agent generation → then hand-typing |

**Completed: ~Nh (breakdown). Next: [what's next].**
```

---

### 2. Per-Phase Estimate Table

```markdown
## Per Phase — Actual Script Counts

| Phase | Base | +Gap | **Total .cs** | Manual .md | Difficulty | What's New / Hard | Est. Hours | Est. Days |
|-------|------|------|--------------|-----------|-----------|-------------------|-----------|-----------|
| **A** | N | — | **N** | N | Easy | [key challenge] | Nh | N days |
| **B** | N | +N | **N** | N | Hard | [key challenge] | Nh | N days |
```

**Column rules:**
- **Base** = scripts from PhaseMap before gap audit
- **+Gap** = additional scripts from gap audit (Critical + Important)
- **Total .cs** = Base + Gap = files to hand-type
- **Manual .md** = test guide documents (not typed as code)
- **What's New / Hard** = specific technical challenges (splits, complex patterns, many cross-phase mods)
- **Est. Hours** = calibrated from actual data or defaults
- **Est. Days** = hours / daily hours available
```

---

### 3. Calibration Section

```markdown
## Calibration — Why These Numbers

**Data point:** Phase [X] = N scripts in Nh. Pure typing+testing rate = ~Nh / N scripts = **~N min/script average**.

| Script Complexity | Examples | Avg Time |
|-------------------|---------|----------|
| **Simple** (enums, stubs, interfaces, SOs, entities) | [examples] | ~15 min |
| **Medium** (DataService, DataWrapper, Field_, Utils, tests) | [examples] | ~30 min |
| **Complex** (MonoBehaviours, Orchestrators, Managers, Player*) | [examples] | ~60 min |

[Phase breakdown example: N simple × 15min + N medium × 30min + N complex × 60min = total]
```

---

### 4. Speed Advantages

```markdown
## Why It's Faster Now

| Advantage | Impact |
|-----------|--------|
| Architecture locked | No design sessions. GOAL.md defines everything. |
| Agent generates first | Full code + GUIDE + FLOW ready. ~30% faster. |
| Patterns repeat | [Which phases share patterns] |
| DataService first | Type → test with DEBUG_Check → wire UI. Bugs caught early. |
| ... | ... |
```

---

### 5. Schedule + Timeline

```markdown
## Weekly Schedule

Weekday: ~N hours/day × 5 = N hours
Weekend: ~N hours/day × 2 = N hours
Weekly total: ~N hours

## Timeline

| Phase | Start | End | Notes |
|-------|-------|-----|-------|
| A | [date] | [date] | ✅ Done |
| B | [date] | [date] | In progress / Planned |
```

---

## Rules

- Update after EVERY hand-typed phase (recalibrate from actual time)
- Default rates before calibration: Simple=15min, Medium=30min, Complex=60min
- Add ~20% overhead for scene setup, testing, debugging
- Agent generation saves ~30% vs designing from scratch
- Track gap audit additions separately (they add scope after initial plan)
- Never estimate without counting actual scripts first