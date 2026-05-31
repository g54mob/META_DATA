---
name: "unity-inventory"
description: "Inventory system architecture — slot-based DataService, item stacking, drag-drop orchestration, hotbar/equipment slots, weight/capacity limits, Field_Slot display, item transfer between containers, ISaveable integration for Unity rebuild projects"
---

# Unity Inventory — Inventory System Architecture

> **Universal pattern — applies to ALL Unity projects in this workspace.**
> This skill defines inventory architecture: slot-based data management, item stacking,
> UI orchestration (drag-drop, transfer), hotbar switching, equipment slots.
> 10+ projects have inventory systems (explicit or implicit via item management).
> Follows the SO_/Field_/DataService/Orchestrator pattern from this workspace's conventions.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│ _-Systems/InventorySystem/                                     │
│                                                                │
│  SO_ItemDef          → "I define what an item IS"              │
│  WItem               → "I wrap SO_ + mutable runtime state"   │
│  InventoryDataService → "I manage slots as a collection"       │
│  Field_Slot          → "I display one inventory slot"          │
│  InventoryOrchestrator → "I wire slots to data + handle input"│
│  InventoryUI         → "I open/close the inventory panel"     │
│  Interface/IItemContainer → "Contract for anything with slots" │
│                                                                │
│  Optional:                                                     │
│  EquipmentDataService → "I manage equipment slots separately"  │
│  HotbarOrchestrator   → "I manage quick-access hotbar"         │
│  DragDropHandler      → "I handle drag between containers"     │
└────────────────────────────────────────────────────────────────┘
```

---

## Data Layer

### SO_ItemDef — Pure Data Definition

```csharp
[CreateAssetMenu(menuName = "SO/SO_ItemDef", fileName = "SO_ItemDef")]
public class SO_ItemDef : ScriptableObject
{
    public string itemName = "Item";
    [TextArea(2, 3)] public string description;
    public Sprite icon;
    public GameObject pfWorldModel;
    public int maxStackSize = 1;      // 1 = no stacking
    public float weight = 1f;         // For weight-limited inventories
    public ItemCategory category;      // Enum: weapon, tool, consumable, material, etc.
    public bool isConsumable;
    public bool isEquippable;
}
```

### WItem — Runtime Wrapper

```csharp
/// <summary> Wraps SO_ItemDef with mutable session state (quantity, durability, etc.) </summary>
public class WItem
{
    public SO_ItemDef itemDef;
    public int quantity;
    public float durability;  // 0-1, optional

    public WItem(SO_ItemDef def, int qty = 1)
    {
        itemDef = def;
        quantity = qty;
        durability = 1f;
    }

    public bool IsStackable => itemDef.maxStackSize > 1;
    public bool CanAddToStack(int amount) => quantity + amount <= itemDef.maxStackSize;
}
```

---

## InventoryDataService — Pure C# Collection

```csharp
/// <summary> Purely C# collection service for inventory slots.
/// Build + Get + Add + Remove + Transfer + snapshot. Testable via new. </summary>
public class InventoryDataService
{
    #region private API
    WItem[] SLOTS;
    int _capacity;
    float _maxWeight;
    #endregion

    #region public API
    public InventoryDataService(int capacity, float maxWeight = float.MaxValue)
    {
        _capacity = capacity;
        _maxWeight = maxWeight;
        SLOTS = new WItem[capacity];
    }

    public int Capacity => _capacity;
    public WItem GetSlot(int index) => SLOTS[index];
    public bool IsSlotEmpty(int index) => SLOTS[index] == null;

    /// <summary> Tries to add item. Stacks first, then finds empty slot. Returns leftover qty. </summary>
    public int TryAdd(SO_ItemDef def, int quantity = 1)
    {
        int remaining = quantity;

        // Stack onto existing partial stacks first
        if (def.maxStackSize > 1)
        {
            for (int i = 0; i < _capacity && remaining > 0; i++)
            {
                if (SLOTS[i] != null && SLOTS[i].itemDef == def && SLOTS[i].CanAddToStack(1))
                {
                    int canAdd = Mathf.Min(remaining, def.maxStackSize - SLOTS[i].quantity);
                    SLOTS[i].quantity += canAdd;
                    remaining -= canAdd;
                }
            }
        }

        // Place in empty slots
        for (int i = 0; i < _capacity && remaining > 0; i++)
        {
            if (SLOTS[i] == null)
            {
                int stackAmount = Mathf.Min(remaining, def.maxStackSize);
                SLOTS[i] = new WItem(def, stackAmount);
                remaining -= stackAmount;
            }
        }

        return remaining;  // 0 = all added, >0 = overflow
    }

    public bool TryRemove(int slotIndex, int quantity = 1)
    {
        if (SLOTS[slotIndex] == null) return false;
        SLOTS[slotIndex].quantity -= quantity;
        if (SLOTS[slotIndex].quantity <= 0)
            SLOTS[slotIndex] = null;
        return true;
    }

    public void SwapSlots(int fromIndex, int toIndex)
    {
        (SLOTS[fromIndex], SLOTS[toIndex]) = (SLOTS[toIndex], SLOTS[fromIndex]);
    }

    public bool HasItem(SO_ItemDef def)
    {
        for (int i = 0; i < _capacity; i++)
            if (SLOTS[i]?.itemDef == def) return true;
        return false;
    }

    public int GetItemCount(SO_ItemDef def)
    {
        int count = 0;
        for (int i = 0; i < _capacity; i++)
            if (SLOTS[i]?.itemDef == def) count += SLOTS[i].quantity;
        return count;
    }

    public float GetCurrentWeight()
    {
        float total = 0f;
        for (int i = 0; i < _capacity; i++)
            if (SLOTS[i] != null) total += SLOTS[i].itemDef.weight * SLOTS[i].quantity;
        return total;
    }

    public bool IsOverWeight() => GetCurrentWeight() > _maxWeight;
    public bool IsFull() => System.Array.TrueForAll(SLOTS, s => s != null);
    #endregion

    #region snapshot
    public string GetSnapShotForTest(string header = "inventory state")
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine($"==== {header} ====");
        for (int i = 0; i < _capacity; i++)
        {
            if (SLOTS[i] != null)
                sb.AppendLine($"  [{i}] {SLOTS[i].itemDef.itemName} x{SLOTS[i].quantity}");
            else
                sb.AppendLine($"  [{i}] EMPTY");
        }
        return sb.ToString();
    }
    #endregion
}
```

---

## UI Layer

### Field_Slot — Display Only

```csharp
public class Field_Slot : MonoBehaviour
{
    [SerializeField] Image _icon;
    [SerializeField] TMP_Text _quantityText;
    [SerializeField] Image _highlightBg;
    [SerializeField] GameObject _emptyState;

    public void SetData(Sprite icon, int quantity, bool isStackable)
    {
        _emptyState.SetActive(false);
        _icon.gameObject.SetActive(true);
        _icon.sprite = icon;
        _quantityText.gameObject.SetActive(isStackable && quantity > 1);
        _quantityText.text = quantity.ToString();
    }

    public void SetEmpty()
    {
        _icon.gameObject.SetActive(false);
        _quantityText.gameObject.SetActive(false);
        _emptyState.SetActive(true);
    }

    public void SetHighlighted(bool highlighted)
    {
        _highlightBg.enabled = highlighted;
    }
}
```

### Orchestrator Pattern

```csharp
public class InventoryOrchestrator : MonoBehaviour
{
    [SerializeField] Transform _slotContainer;
    [SerializeField] GameObject _pfField_Slot;

    InventoryDataService _dataService;
    Field_Slot[] _fieldSlots;

    public void Initialize(InventoryDataService dataService)
    {
        _dataService = dataService;
        _fieldSlots = new Field_Slot[dataService.Capacity];
        for (int i = 0; i < dataService.Capacity; i++)
        {
            var go = Instantiate(_pfField_Slot, _slotContainer);
            _fieldSlots[i] = go.GetComponent<Field_Slot>();
        }
        RefreshAll();
    }

    public void RefreshAll()
    {
        for (int i = 0; i < _dataService.Capacity; i++)
        {
            WItem item = _dataService.GetSlot(i);
            if (item != null)
                _fieldSlots[i].SetData(item.itemDef.icon, item.quantity, item.IsStackable);
            else
                _fieldSlots[i].SetEmpty();
        }
    }
}
```

---

## Hotbar (Quick-Access Slots)

```csharp
public class HotbarDataService
{
    WItem[] HOTBAR_SLOTS;
    int _activeIndex;
    public const int HOTBAR_SIZE = 5;

    public void SwitchSlot(int index)
    {
        _activeIndex = Mathf.Clamp(index, 0, HOTBAR_SIZE - 1);
    }

    public void ScrollSlot(int direction)
    {
        _activeIndex = (_activeIndex + direction + HOTBAR_SIZE) % HOTBAR_SIZE;
    }

    public WItem GetActiveItem() => HOTBAR_SLOTS[_activeIndex];
    public int ActiveIndex => _activeIndex;
}
```

---

## Save Integration

```csharp
[System.Serializable]
public class InventorySaveData
{
    public SlotSaveEntry[] slots;

    [System.Serializable]
    public class SlotSaveEntry
    {
        public string itemDefName;  // SO_ asset name for lookup
        public int quantity;
        public float durability;
    }
}

// In ISaveable implementation:
public InventorySaveData GetSaveData()
{
    var data = new InventorySaveData();
    data.slots = new InventorySaveData.SlotSaveEntry[_dataService.Capacity];
    for (int i = 0; i < _dataService.Capacity; i++)
    {
        var item = _dataService.GetSlot(i);
        data.slots[i] = item != null
            ? new InventorySaveData.SlotSaveEntry
              { itemDefName = item.itemDef.name, quantity = item.quantity, durability = item.durability }
            : null;
    }
    return data;
}
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Inventory logic in UI MonoBehaviour | DataService = pure C#, UI = display only |
| Items stored as GameObjects | Store as data (WItem) — instantiate GO only when needed |
| No stacking logic | Stack onto partial stacks first, then empty slots |
| Drag-drop modifies data directly | Go through DataService.SwapSlots() — orchestrator refreshes |
| Weight check after add | Check BEFORE add — reject if would exceed |
| SaveData references SO_ directly | Save by name string, reload via lookup dictionary |
| Hardcoded slot count | DataService takes capacity param — configurable |