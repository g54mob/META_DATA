# FLOW Template — Per-Phase Flow Document Format

> Copy this into each `phase-X/FLOW.md`. Replace all bracketed placeholders.
> Every section is MANDATORY.

---

## Mandatory Sections (in this exact order)

### 1. `## Portability Diagram`

```markdown
## Portability Diagram

### FREE Infrastructure (doesn't count as dependency)
GameEvents, Singleton<T>, UIManager, DataManager, Utils.*, TimeSince/TimeUntil, GlobalEnumsX

### L0 — Truly Portable (zero _-Systems/ imports)
- [SystemA] — [what it does, why it's L0]
- [SystemB] — [what it does, why it's L0]

### L1+ — Counted Dependencies
- [SystemC] (L2) — imports ◆IInterfaceA◆ from SystemA, ◆IInterfaceB◆ from SystemB
  → Still portable ✅ (interface deps only — copy 2 interface files)

### Game-Specific (❌ Concrete Dependencies)
- [SystemD] — imports ConcreteClass from SystemE (must copy entire system)

### Portability Scorecard

| System | Level | Shape | Deps | Portable? |
|--------|-------|-------|------|-----------|
| [SystemA] | L0 | 🕷️ Spider | — | ✅ |
| [SystemB] | L0 | 📡 Broadcaster | — | ✅ |
| [SystemC] | L2 | 🔌 Adapter | IInterfaceA, IInterfaceB | ✅ interface-only |
| [SystemD] | L5 | 🔌+📡 | ConcreteClass | ❌ game-specific |
```

---

### 2. `## Event Registry`

```markdown
## Event Registry

| Event | Type | Fired By | Subscribed By | Purpose |
|-------|------|----------|---------------|---------|
| OnMenuStateChanged(bool) | Action<bool> | ShopUI, InventoryUI | UIManager, PlayerMovement | cursor lock/unlock |
| OnToolPickupRequested(tool) | Action<IInventoryItem> | BaseHeldTool | InventoryOrchestrator | add tool to inventory |
| OnToolEquipped(tool) | Action<IInventoryItem> | InventoryOrchestrator | PlayerGrab | set tool.Owner context |
```

**Rules:**
- Every GameEvent in this phase — no imaginary events
- Type column uses `Action<IInterface>` (never concrete classes)
- Must match actual `GameEvents.cs` code
- Purpose = same as `// purpose:` comment in code

---

### 3. `## System Map`

ASCII box diagram showing all systems and their connections:

```markdown
## System Map

``
┌─────────────────────┐     OnToolPickup     ┌──────────────────────┐
│   ToolSystem (L0)   │ ─────────────────── → │  InventorySystem (L0) │
│   🔍 Hunter         │                       │  🕷️ Spider            │
│                     │     OnToolEquipped     │                      │
│   defines:          │ ← ─────────────────── │  defines:            │
│   IInteractable     │                       │  IInventoryItem      │
│   IDamageable       │                       │                      │
└─────────────────────┘                       └──────────────────────┘
         │                                              │
         │ GetComponent<IDamageable>()                  │ [SerializeField]
         ▼                                              ▼
┌─────────────────────┐                       ┌──────────────────────┐
│  MiningSystem (L2)  │                       │  Field_InventorySlot │
│  🔌 Adapter         │                       │  (display only)      │
│  implements:        │                       └──────────────────────┘
│  IDamageable        │
│  IScannable         │
└─────────────────────┘
``
```

**Rules:**
- Every system as a box with: name, portability level, shape emoji
- **Shape count notation** for multi-role systems: `🔌 Adapter (×8) + 📡 Broadcaster` — shows how many interfaces a system implements
- Connections labelled: GameEvent name, interface name, or [SerializeField]
- Direction arrows: → for event flow, ← for interface implementation
- No direct class imports between systems (if you see one, it's a coupling bug)
- Cross-system connections listed after all boxes if the diagram gets complex

---

### 4. `## Data Flows`

One per major user action. Written as **conversation-style prose**, NOT swim lanes or ASCII tables.

```markdown
## Data Flows

### Flow 1 — [Action Name]

The player **[visible action]** near a `[ScriptName]` [where/what].
`[DetectionScript]` [how it detects — raycast, trigger, overlap] and
**[visible result of detection]**.

The [object] *doesn't know anything about [other system]* — it just fires
`GameEvents.Raise[Event](this)`.

`[SubscriberScript]` is subscribed. It receives the [data] and asks
`dataService.[Method]()`, which **[what the data operation does]**.

The [script] calls `[method]` — the **[visible change the player sees]**.
Then it calls `[next method]` — [what happens next].

Finally, `RefreshAll[Something]()` updates all [N] `Field_[Name]` displays.
**[Specific visual state]** shows [what]. [Others] show [default state].
```

**Formatting rules:**
- **bold** = visible change the player sees ("the pickaxe **disappears from the ground**")
- *italic* = context or internal note ("the tool *doesn't know about inventory*")
- `code` = exact script/method/field reference
- Written as a story — readable narrative, NOT tables or diagrams
- Each flow = one major user action (pickup, switch, drop, open menu, drag-drop, purchase, etc.)
- Trace the FULL path: player action → detection → event → subscriber → data change → UI refresh → what player sees
- Every GameEvent reference must match the Event Registry table above

### Networked Flow Variant (if project has multiplayer)

For networked projects, data flows must show Client→Server→Clients path:

```markdown
### Flow N — [Networked Action Name]

**Client** — The player **[visible action]** on the local client.
`[ClientScript]` validates locally (optimistic prediction) and calls
`[ServerRpc] Send[Action]()` — this request goes to the **server**.

**Server** — `[ServerScript]` receives the RPC. It validates authoritatively:
`dataService.[ValidationMethod]()` checks [what]. If invalid, the server
**rejects** — the client's prediction rolls back.

If valid, the server updates authoritative state and calls
`[ObserversRpc] Broadcast[Action]()` — this goes to **all clients**.

**All Clients** — Each client receives the broadcast. They update their local
`dataService.[Method]()` and refresh UI. The initiating client sees
**[confirmation visual]**. Other clients see **[remote player's action]**.
```

**Networked flow rules:**
- Always show three phases: Client → Server → All Clients
- Mark authority: who validates, who owns state
- Show optimistic prediction + rollback when applicable
- Note which data is `SyncVar` vs RPC-carried

---

## Voice & Tone

- Conversational — explain to someone who's never seen this codebase
- Technical terms kept (`SpringJoint`, `GetComponent`, `raycast`) but briefly explained when first used
- Explain WHY the architecture works this way, not just WHAT happens
- The reader should understand the full system interconnection by reading FLOW.md