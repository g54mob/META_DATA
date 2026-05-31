# SystemPortabilityMap Template — System Portability Analysis

> Copy this structure into `LEARN/{PROJECT}/SystemPortabilityMap.md`.
> In-depth analysis of ALL systems: behavior, portability level, interfaces, bridges, concrete deps.
> **Goal:** Maximize portable L0 systems reusable in any future Unity3D project.

---

## Mandatory Sections

### 1. System Shapes Legend

```markdown
## System Shapes

> 5 distinct "shapes" describe how every system connects to others:
>
> 🕷️ **Spider** — defines interfaces. Others implement them. Passive, maximally portable.
> 🔍 **Hunter** — reaches OUT via `GetComponent<IXxx>()`. Defines interfaces it needs, scans for implementors.
> 🔌 **Adapter** — IMPLEMENTS interfaces defined by Spiders or Hunters. Plugs into other systems' sockets.
> 📡 **Broadcaster / Listener** — fires or subscribes to GameEvents. No interfaces. Pure event-driven.
> 🌍 **Infrastructure** — used by EVERY system. Doesn't count as a dependency (FREE).
```

---

### 2. Master Table

```markdown
## Master Table

| # | System | Phase | L | Shape | Why this shape | Portable |
|---|--------|-------|---|-------|---------------|----------|
| 1 | [SystemName] | [X] | [0-N] | [emoji] [shape] | [Why — what interfaces/events] | ✅/⚠️/❌ |
```

**Column rules:**
- **L** = portability level. L0 = zero `_-Systems/` imports. Each interface/concrete import = +1.
- **Shape** = one or more shape emojis + name. Multi-role: `🔌 Adapter (×N) + 📡 Broadcaster`
- **Why** = what makes it this shape (interfaces defined/implemented, events fired/subscribed)
- **Portable** = ✅ (L0 or interface-only deps), ⚠️ (fixable concrete dep), ❌ (game-specific, concrete deps intentional)

---

### 3. Shape Distribution

```markdown
### Shape Distribution

| Shape | Count | Systems |
|-------|-------|---------|
| 🕷️ Spider | N | [list] |
| 🔍 Hunter | N | [list] |
| 🔌 Adapter | N | [list] |
| 📡 Broadcaster/Listener | N | [list] |
| ❌ Concrete | N | [list] |
| 🌍 Infrastructure | — | GameEvents, UIManager, DataManager, Utils, TimeSince/TimeUntil, Singleton, GlobalEnums |
```

---

### 4. Per-System Deep Dive (repeat for each system)

```markdown
## Per-System Deep Dive

### N. SystemName — L{n} ✅/❌ FINALIZED/PLANNED

**What it does:** [3-5 sentences: player triggers → what happens → what fires → what subscribes → visible result]

**Portability:** [Why this level. What you'd need to copy for it to compile in a new project.]

**Interfaces owned (N):**
- `IInterfaceName` — [who calls it, who implements it, what bridge wires it]

**Interfaces implemented (N):**
- `IInterfaceName` (from SystemX, Phase Y) — [what methods, why this system implements it]

**GameEvents fired:**
- `OnEventName` — [what triggers it, who subscribes]

**GameEvents subscribed:**
- `OnEventName` — [fired by whom, what this system does in response]

**Bridges (N):**
- `BridgeName` — [pattern variant, what it pushes, why needed]

**Concrete deps:** NONE or [ConcreteClass from SystemX — reason, fix plan]

**Finalized:** ✅/❌ [notes on what future phases add]
```

---

### 5. Aggregate Stats

```markdown
## Aggregate Stats

| Metric | Value |
|--------|-------|
| Total systems | N |
| L0 portable | N / total = X% |
| L1+ interface-only | N / total = X% |
| Concrete deps remaining | N / total = X% |
| Total interfaces | N |
| Total bridges | N |
| Total GameEvents | N |
```

---

## Rules

### What's FREE (does NOT count toward portability level)

| Category | Items | Why FREE |
|----------|-------|----------|
| Core infra | `Singleton<T>`, `GameEvents` (static partial) | Framework — every project has these |
| Managers | `UIManager`, `DataManager` | Shared singletons — always present |
| Utilities | `Utils.*`, `TimeSince`, `TimeUntil` | Static helpers — no state coupling |
| Enums | `GlobalEnumsAll`, `GlobalEnumsX`, `TagType` | Value types — no object references |
| Extensions | `.map()`, `.gc<T>()`, `.HasTag()`, `.SetTag()` | Static extension methods |

### What COUNTS toward level (each = +1)

| Counts | Example | Why it counts |
|--------|---------|---------------|
| Interface from another `_-Systems/` | `IInteractable` from InteractionSystem | Cross-system contract |
| Concrete class from another `_-Systems/` | `SO_ShopCategory` from ShopSystem | ❌ Tight coupling — must fix |
| Bridge from another `_-Systems/` | `CamContextBridge` from CameraSystem | Runtime context dependency |

### General rules

- **Interface dep = portable** — copy the .cs interface file and it compiles
- **Concrete dep = must fix** — unless intentionally game-specific (world flavoring, debug tools)
- Every system gets a deep dive section with: what it does, portability rationale, interfaces, events, bridges, concrete deps
- Shape count notation for multi-role: `🔌 Adapter (×8) + 📡 Broadcaster`
- "Finalized" means no future phase will change this system's architecture (only additive subscribers)