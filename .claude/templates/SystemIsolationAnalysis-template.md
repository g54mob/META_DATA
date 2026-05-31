# SystemIsolationAnalysis Template — Full Architecture Deep Dive

> Copy this structure into `LEARN/{PROJECT}/SystemIsolationAnalysis.md`.
> Covers all systems: interfaces, GameEvents, bridges, cross-system dependencies.
> **Goal:** Maximize system portability while preserving 100% functionality.

---

## Mandatory Sections

### 1. Executive Summary

```markdown
## Executive Summary

### Current State

| Metric | Value |
|--------|-------|
| Total systems (built + planned) | N |
| Systems built | N |
| Systems planned | N |
| **L0 portable (built)** | **N / total = X%** |
| L1+ interface-only (built) | N / total = X% |
| Concrete deps remaining (built) | N / total = X% |
| Total interfaces | N |
| Total bridges | N |
| Total GameEvents | N |

### Architecture Health: ✅/⚠️/❌ [RATING]

[2-3 sentences on overall health, key patterns working, remaining issues]

### Key Patterns Working

1. [Pattern name] — [how it's used, what it enables]
2. ...
```

---

### 2. Complete System Inventory (per phase)

```markdown
## Complete System Inventory

### Phase X — [Name]

| System | L | Shape | Scripts | Interfaces Owned | Interfaces Implemented |
|--------|---|-------|---------|-------------------|----------------------|
| **SystemName** | N | [emoji] [shape] | N | IXxx, IYyy | IZzz (Phase Y) |
```

---

### 3. Interface Ownership Map

```markdown
## Interface Ownership Map

| # | Interface | Owner System | Phase | Implementors |
|---|-----------|-------------|-------|-------------|
| 1 | IXxx | SystemA | A | SystemB (Phase B), SystemC (Phase C) |
```

---

### 4. GameEvents Communication Matrix

```markdown
## GameEvents Communication Matrix

| Event | Signature | Phase | Fired By | Subscribed By |
|-------|-----------|-------|----------|---------------|
| OnXxxRequested | Action<IXxx> | A | SystemA | SystemB, SystemC |
```

**Rules:**
- Signatures use interfaces ONLY (never concrete classes)
- Every event must have at least one subscriber (dead events = remove)
- Cross-phase events listed with their original phase

---

### 5. Bridge Pattern Inventory

```markdown
## Bridge Pattern Inventory

| # | Bridge | Lives In | Pattern | Pushes Context To | Phase |
|---|--------|----------|---------|-------------------|-------|
| 1 | MoneyBridge | EconomySystem | event-push | ShopUISystem | A |
```

**Pattern variants:**
- **event-push** — subscribes to GameEvent → pushes context to target system
- **event-response** — listens + responds with data
- **push-to-all** — FindObjectsByType in Start() for one-time init
- **event-chain** — bridge triggers secondary event
- **static-accessor** — static property with `{ get; private set; }`

---

### 6. Cross-System Dependency Graph

```markdown
## Cross-System Dependency Graph

[ASCII art showing all systems as nodes, connections as edges:]
- Solid line = interface dependency (portable)
- Dashed line = GameEvent (fire-and-forget)
- Bold/red = concrete dependency (MUST FIX)

Example:
SystemA ──IXxx──→ SystemB
SystemA ╌╌OnEvent╌╌→ SystemC
SystemD ══CONCRETE══→ SystemE (❌)
```

---

### 7. Isolation Issues Found

```markdown
## Isolation Issues Found

| # | Issue | System | Severity | Fix |
|---|-------|--------|----------|-----|
| 1 | [concrete dep description] | SystemX | 🔴/🟡/🟢 | [interface/event/bridge fix] |
```

---

### 8. Reusable System Catalog

```markdown
## Reusable System Catalog

[Systems that can be copy-pasted into any Unity project with zero/minimal changes:]

| System | What You Get | Copy These Files | Also Need |
|--------|-------------|-----------------|-----------|
| ShopUISystem | Full shopping UI with cart | _-Systems/ShopUISystem/ | Any IShopMoney implementation |
```

---

## Rules

- Update whenever `/decouple-check` runs in aggregate mode
- Update whenever `/refresh-learn-docs` runs
- Every interface, every event, every bridge must be cataloged
- Concrete deps are ALWAYS flagged with fix plan
- Architecture health rating: ✅ EXCELLENT (>80% L0), ⚠️ GOOD (60-80% L0), ❌ NEEDS WORK (<60% L0)
- Reusable catalog = the "value proposition" of the architecture — which systems can ship to other projects