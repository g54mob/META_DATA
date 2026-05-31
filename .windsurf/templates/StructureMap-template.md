# StructureMap Template — All DataServices

> Copy this structure into `LEARN/{PROJECT}/StructureMap.md`.
> Every DataService is pure C#. Testable via `new`. Zero scene, zero MonoBehaviour dependency.
> Collections use `ALL_CAPS` for lists, `DOC__` prefix for dictionaries.

---

## Mandatory Sections

### 1. Quick Reference Table

```markdown
## Quick Reference

| # | DataService | Phase | One-Liner | Status |
|---|-------------|-------|-----------|--------|
| 1 | `XxxDataService` | A | "I manage [what] as collections" | ✅ Done / ⬜ Planned |
| 2 | ... | ... | ... | ... |
```

---

### 2. Per-DataService Section (repeat for each)

```markdown
## N. XxxDataService (Phase X) — `_-Systems/XxxSystem/XxxDataService.cs`

> "I manage [what] — [key operations]."

### Collections

[Exact field declarations with types:]
```
List<SO_XxxDef>                              XXX_DEF
Dictionary<SO_XxxCategory, List<WXxx>>       DOC__category_wXxx
List<CartItem>                               CARTITEM
int                                          activeIndex
```

### Nested Types

[Any inner classes/structs — if none, write "None"]
```csharp
public class CartItem { WXxx wItem; int qty; }
```

### Separate Entities (if in same file)

[Classes that live in the same .cs file but are separate types]
```csharp
public class XxxSlot { IXxxItem item; int index; }
```

### Methods

| Group | Method | What It Does |
|-------|--------|-------------|
| Build | `BuildXxx(params)` | [One-line description] |
| Get | `GetXxx()` | [One-line description] |
| Add | `TryAddXxx(item)` | [One-line description] |
| Remove | `RemoveXxx(item)` | [One-line description] |
| Alter | `AlterXxxQty(item, newQty)` | [One-line description] |
| Boolean | `CanAffordXxx(amount)` | [One-line description] |
| Snapshot | `GetSnapShotForTest(header)` | Combines all PhaseXLOG formatters |

### GetSnapShotForTest Format

[Exact output format — show what the console prints when `GetSnapShotForTest("TEST")` is called:]

**Example 1 — Simple list:**
```
=== TEST ===
ITEM_DEF: [
  {name: "Iron Ore", price: 10, stackable: true},
  {name: "Gold Ore", price: 50, stackable: true}
]
```

**Example 2 — Dictionary of lists:**
```
=== TEST ===
DOC__category_wItem: {
  "Ores": [{name: "Iron Ore", qty: 5}, {name: "Gold Ore", qty: 2}],
  "Tools": [{name: "Pickaxe", qty: 1}]
}
```

**Example 3 — Nested types + multiple collections:**
```
=== TEST ===
SLOT: [
  {index: 0, item: "Iron Ore", qty: 5},
  {index: 1, item: null, qty: 0}
]
CARTITEM: [
  {wItem: "Iron Ore", qty: 3, totalPrice: 30}
]
activeIndex: 0
```

**Implementation pattern:**
```csharp
public string GetSnapShotForTest(string header)
{
    return $"=== {header} ===\n"
        + PhaseXLOG.LIST_X__TO__JSON("XXX_DEF", XXX_DEF)
        + PhaseXLOG.DOC_X__TO__JSON("DOC__category_wXxx", DOC__category_wXxx);
}
```

### ASCII Folder Tree

[Show the system this DataService belongs to:]
```
_-Systems/XxxSystem/
├── SO_XxxDef.cs
├── WXxx.cs
├── XxxDataService.cs       ← this
├── XxxOrchestrator.cs
├── XxxUI.cs
├── Field_Xxx.cs
├── Interface/
│   └── IXxxMoney.cs
└── Dependency.md
```
```

---

## Rules

DataService conventions are defined in [C# Conventions](../instructions/csharp-conventions.instructions.md). Key rules for this template:

- Every `List<T>` and `Dictionary<K,V>` that can be tested via `new` MUST live in a DataService (not in MonoBehaviours)
- Collections use `ALL_CAPS` naming for lists, `DOC__` prefix for dictionaries
- Every DataService must have `GetSnapShotForTest(string header)` method
- Every collection must have a corresponding `PhaseXLOG` method (`LIST_X__TO__JSON`, `DOC_X__TO__JSON`)
- DataService = pure C#. Zero Unity lifecycle. Testable via `var ds = new XxxDataService(); ds.BuildXxx(...);`
- Method groups: Build → Get → Add → Remove → Alter → Boolean → Snapshot

### SaveData Specs (if project has Save/Load)

For each DataService that participates in save/load, add a SaveData section:

```markdown
### SaveData — `XxxSaveData`

```csharp
[Serializable]
public class XxxSaveData
{
    public List<SlotSaveData> slots;
    public int selectedIndex;
    public float totalPlayTime;
}
```

| Field | Type | Maps To | Notes |
|-------|------|---------|-------|
| `slots` | `List<SlotSaveData>` | `SLOT` collection | Nested SaveData for each slot |
| `selectedIndex` | `int` | `activeIndex` | Currently selected index |
| `totalPlayTime` | `float` | Session timer | Accumulated play time |

**Serialization:** JSON via `JsonUtility.ToJson()` / `Newtonsoft.Json`
**Version:** Schema version N (increment on field changes)
```

**Rules:**
- SaveData mirrors DataService collections — one SaveData class per DataService with persistent state
- SaveData = pure C# `[Serializable]`, zero methods, zero MonoBehaviour
- Fields use primitives/strings/arrays/lists — no Unity types (use string IDs to map back to SO_)
- Nested SaveData allowed (e.g. `SlotSaveData` inside `InventorySaveData`)
- One-liner purpose uses first-person "I" voice
- Target: 2-5 public methods per DataService (minimal API surface)