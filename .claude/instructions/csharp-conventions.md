---
name: 'C# Conventions'
description: 'Unity C# coding conventions — naming, capitalization, class roles, #region ordering, GameEvents patterns, decoupling rules, mandatory patterns, method naming, pitfalls, common agent mistakes'
applyTo: '**/*.cs'
---

# C# Conventions (Unity Architecture)

> Single source of truth for all C# coding rules. Referenced by prompts, templates, and always-on context.
> Full detail with gold-standard code examples lives in `.claude/templates/GOAL-general.md`.

> **⚠️ ALL naming and capitalization rules in this file are STRICTLY ENFORCED — no exceptions.**
> camelCase for enum values/fields/locals, PascalCase for classes/methods, `_camelCase` for SerializeField — every single convention below is critical. Violating even one (e.g. writing `None` instead of `none` for an enum value) is a defect that must be fixed immediately. When in doubt, check the tables below before writing any identifier.

---

## Core Principle

**Every script's purpose fits in one sentence. If it doesn't, split it until it does.**

## Folder Structure (CRITICAL — Numbered for Unity Panel Sorting)

```
phase-All/                          → shared scripts — never duplicated
├── 0-Core/       Singleton.cs, GameEvents.cs (core events)
├── 1-Managers/   UIManager, DataManager (+ project-specific managers as needed)
├── 2-Data/Enums/ GlobalEnumsAll.cs (TagType enum — grows across phases)
├── 3-MonoBehaviours/Physics/  Shared base classes (if needed)
├── 4-Utils/      Utils.cs (single static class — ALL utility code here), TimeSince/TimeUntil
├── 6-Shaders/    Centralized shader/material guides (if needed)
└── 7-3D/         MODEL.md, ANIM.md, WORLD.md — grows per phase

phase-{x}/
├── _-Systems/             PRIMARY — each feature in its own self-contained folder
│   └── XxxSystem/         ALL code for one feature lives here:
│       ├── SO_*, Field_*, W*, DataService, Orchestrator, SubManager
│       ├── Interface/     Contracts this system OWNS
│       ├── Bridge/        Cross-system runtime context bridges (placed inside consumer-system)
│       ├── Test.md        Vertical slice test for this system (beginner-friendly as possible)
│       └── Dependency.md  What this system imports/implements/owns
├── 0-Core/                GameEvents.cs (partial class — phase-specific events)
├── 2-Data/
│   ├── Interface/         Cross-system contracts NOT owned by any system (RARE)
│   └── Enums/             GlobalEnums{X}.cs — all phase enums in ONE file
├── 4-Utils/               Phase{X}LOG.cs only (snapshot formatters)
└── 5-Tests/               Standalone vertical slice tests
    └── Manual/            .md test guides for visual/hands-on verification
```

## Naming Conventions (CRITICAL)

| Kind | Convention | Example |
|------|-----------|---------|
| ScriptableObject | `SO_` prefix | `SO_ItemDef` |
| Display-only prefab handle | `Field_` prefix | `Field_Item` |
| DataWrapper | `W` prefix | `WItem` |
| Interface | `I` prefix | `IInteractable` |
| Dictionary lookups | `DOC__` prefix | `DOC__category_wItem` |
| List/collection fields | `ALL_CAPS` | `CATEGORY`, `ITEM_DEF` |
| `[SerializeField]` fields | `_` prefix, always private | `[SerializeField] float _speed` |
| Event handlers | `Handle...` | `HandleMoneyChanged` |
| GameEvents | `On...` + `Raise...` side by side | `OnMoneyChanged` / `RaiseMoneyChanged()` |
| Singleton access | `.Ins` | `Singleton<EconomyManager>.Ins` |
| Enum values | camelCase | `TagType.grabbable` |
| Prefab SerializeField refs | `_pf` + traditional prefix | `[SerializeField] GameObject _pfField_ShopItem` |
| State classes | `...State` suffix | `IdleState`, `ChaseState`, `PatrolState` |
| StateMachine classes | `...StateMachine` suffix | `NPCStateMachine`, `GamePhaseStateMachine` |
| SaveData classes | `...SaveData` suffix | `PlayerSaveData`, `InventorySaveData` |

**Prefix = no logic.** `SO_` = pure data. `Field_` = display only. `W` = session wrapper.

**Prefab ref naming:** `_pf` + the class prefix it spawns: `_pfField_Category`, `_pfField_ShopItem`, `_pfSO_ItemDef`. This tells you both that it's a prefab AND what component type it instantiates.

## File Naming (CRITICAL — STRICTLY ENFORCED)

- **Unity 6000.3 rule: filename MUST match classname** for any MonoBehaviour added via inspector (Unity's Add Component search indexes by filename)
- MonoBehaviours added via code (`AddComponent<T>()`) don't require this
- Non-MonoBehaviours (interfaces, entities, DataService) CAN share a file if tiny + tightly coupled
- One class per file is the DEFAULT — share only when types are <20 lines AND inseparable
- File names follow the same PascalCase as class names: `ShopDataService.cs`, `SO_ItemDef.cs`, `Field_Slot.cs`

## Using Import Block Order (CRITICAL)

```csharp
using System;
using System.Linq;
using System.Collections;
using System.Collections.Generic;

using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.UI;
using TMPro;

using SPACE_UTIL;
```

- System → UnityEngine → TMPro → `SPACE_UTIL` (project extensions — ALWAYS last)
- Blank line between groups
- Omit unused namespaces (skip `TMPro` if no TextMeshPro in this file)

## Capitalization Rules (CRITICAL — STRICTLY ENFORCED)

| Scope | Convention | Example |
|-------|-----------|--------|
| Class / Interface / Enum name | **PascalCase** | `ShopDataService`, `IInteractable`, `TagType` |
| Method / Event / Property | **PascalCase** | `GetMoney()`, `OnMoneyChanged`, `BuildCategories()` |
| Enum value | **camelCase** (CRITICAL — never PascalCase) | `TagType.grabbable`, `PieceType.ore` |
| `[SerializeField]` | **`_camelCase`** (ALWAYS private, never public) | `_speed`, `_playerCam` |
| Private/public non-serialized fields | **camelCase** | `money`, `isFirstEnable`, `isAnyMenuOpen` |
| Local variable | **camelCase** | `field`, `wItem`, `category` |
| List/Dictionary fields | **ALL_CAPS** / **`DOC__`** | `CATEGORY`, `DOC__category_wItem` |
| Constant (`const`) | **camelCase** (same as fields) | `hotbarSize`, `buildingWidth` |

**Zero tolerance for violations.** PascalCase class/method + camelCase everything else (fields, consts, locals, enum values, string identifiers) + `_camelCase` for serialized fields. No CONSTANT_CASE anywhere.

### Boolean Naming (CRITICAL)

**Fields (camelCase):** Boolean fields use `is`, `has`, `can`, `should` prefix in camelCase.
**Methods (PascalCase):** Boolean-returning methods use the SAME prefixes but in PascalCase.

```csharp
// ✅ Boolean FIELDS — camelCase (they are fields/variables)
bool isFirstEnable = true;
bool isLockedCurr;
bool isAnyMenuOpen;
bool hasUpgrade;
bool canAfford;
bool shouldHideCategory;

// ✅ Boolean METHODS — PascalCase (they are methods)
public bool IsEmpty() => ITEMS.Count == 0;
public bool HasTag(TagType tag) => ...;
public bool CanAffordCartItems() => GetCartTotalPrice() <= money;
public bool ShouldCategoryBeHidden(SO_ShopCategory cat) => ...;

// ✅ Boolean PARAMETERS — camelCase (they are parameters)
public void RaiseMenuStateChanged(bool isAnyMenuOpen) { ... }

// ❌ BAD — PascalCase on fields, camelCase on methods
bool IsLocked;           // WRONG — field, should be isLocked
public bool canAfford(); // WRONG — method, should be CanAfford()
```

**Key rule:** The `is/has/can/should` prefix tells you it returns `bool`. The casing tells you if it's a field (camelCase) or method (PascalCase). This is NOT optional — it's the primary way to distinguish fields from methods at a glance.

## Attribute Conventions (CRITICAL)

| Attribute | Applies To | Format | Example |
|-----------|-----------|--------|---------|
| `[AddComponentMenu]` | **EVERY** MonoBehaviour | `[AddComponentMenu("[PROJECT]/Category/Class")]` | `[AddComponentMenu("MineMGL/Tools/ToolPickaxe")]` |
| `[SerializeField]` | Every inspector ref | Always private with `_` prefix | `[SerializeField] float _speed` |
| `[CreateAssetMenu]` | Every SO_ class | menuName = "SO/...", fileName matches class | `[CreateAssetMenu(menuName = "SO/SO_ItemDef", fileName = "SO_ItemDef")]` |
| `[DefaultExecutionOrder]` | Managers needing early init | -1000 (DebugMgr), -100 (Managers), 0 (default) | `[DefaultExecutionOrder(-100)]` |
| `[Header]` | Inspector sections | Group related fields visually | `[Header("Move")] [SerializeField] float _walkSpeed` |
| `[Range]` | Numeric fields | Slider in inspector | `[Range(0, 1)] [SerializeField] float _volume` |
| `[TextArea]` | String fields | Multi-line editor | `[TextArea(2, 3)] public string descr` |
| `[HideInInspector]` | Public fields other systems write | Hide from inspector but keep public | `[HideInInspector] public Vector3 SumVelocity` |

### Multiline SerializeField Grouping (4+ Same Type)

When 4+ fields share the same type, group under ONE `[SerializeField]`:

```csharp
[SerializeField]
Color
    _canAffordColor = Color.limeGreen,
    _cannotAffordColor = Color.red * 0.8f,
    _selectedTabColor = new Color(0.3f, 0.6f, 1f),
    _normalTabColor = new Color(0.2f, 0.2f, 0.2f);
```

Single fields stay one line: `[SerializeField] float _speed;`

## Class Responsibilities (CRITICAL — Prefix = Pure Purpose)

| Role | Where | Pure Purpose |
|------|-------|-------------|
| **SO_** | _-Systems/XxxSystem/ | Inspector-editable config. Only public fields. Zero methods. |
| **Field_** | _-Systems/XxxSystem/ | Set UI visuals (SetData/SetState). No onClick. No logic. No singleton access. |
| **W (DataWrapper)** | _-Systems/XxxSystem/ | Wrap SO_ with mutable session state. Minimal API. |
| **DataService** | _-Systems/XxxSystem/ | Purely C# collection service. Build + Get + Add + Remove + snapshot. EVERY `List<T>` / `Dictionary<K,V>` testable via `new` MUST live here. |
| **Orchestrator** | _-Systems/XxxSystem/ | Wire Field_ to DataService. Instantiate, AddListener, Destroy. `DOC__X__Field` tracking. `RefreshAllRequired()` after mutations. |
| **SubManager** | _-Systems/XxxSystem/ | Open/close one UI panel. `isFirstEnable` pattern. Creates DataService on first enable. Zero business logic. |
| **Manager** | phase-All/1-Managers/ | Extends `Singleton<T>`. Owns one domain's state. Minimal query API. |
| **Phase{X}LOG** | 4-Utils/ | Snapshot-format each DataService collection to JSON for test logging (see PhaseXLOG section below). |
| **StateMachine** | _-Systems/XxxSystem/ | Holds `currentState`, `ChangeState()`. No game logic — only delegates to IState. |
| **IState** | _-Systems/XxxSystem/ | Enter/Update/Exit contract. One class per state. Constructor receives controller ref. |
| **SaveData** | _-Systems/XxxSystem/ | Pure C# `[Serializable]` class. JSON-serializable snapshot of one entity/system's persistent state. Zero MonoBehaviour, zero methods (data only). |
| **ISaveable** | _-Systems/XxxSystem/Interface/ | Contract for objects participating in save/load. Defines `GetSaveData()` + `LoadFromSave()`. Implemented by MonoBehaviours that own persistent state. |

**Everything belongs to a system → goes inside `_-Systems/`.** Numbered folders outside are ONLY for scripts you are POSITIVELY CERTAIN don't belong to any system (RARE). **80% rule: at least 80% of scripts in any phase (excluding phase-All) MUST live inside `_-Systems/`.** If a phase has fewer than 80% inside `_-Systems/`, question every file outside it — most belong to a system.

### SO_ Example (Pure Data — Zero Methods)

```csharp
[CreateAssetMenu(menuName = "SO/SO_ShopItemDef", fileName = "SO_ShopItemDef")]
public class SO_ShopItemDef : ScriptableObject
{
    public string itemDefName = "itemDefName";
    [TextArea(2, 3)]
    public string descr;
    public float defaultPrice;
    public bool isDefaultLocked = false;
    public Sprite sprite;
    public GameObject pfObject;
    public int maxStackableCount = 10;
}
```

### Field_ Example (Display Only — No Logic)

```csharp
public class Field_ShopItem : MonoBehaviour
{
    public TextMeshProUGUI _nameText, _descrText, _priceText, _buttonText;
    public Image _icon, _buttonBg;
    public Button _addToCartButton;

    public void SetData(string name, string descr, string price, string buttonText, Sprite sprite)
    {
        this._nameText.text = name;
        this._descrText.text = descr;
        this._priceText.text = price;
        this._buttonText.text = buttonText;
        this._icon.sprite = sprite;
    }
    public void SetButtonInteractable(bool isInteractable, string buttonText, Color normalCol, Color nonInteractableCol)
    {
        this._buttonBg.color = (isInteractable) ? normalCol : nonInteractableCol;
        this._addToCartButton.interactable = isInteractable;
    }
}
```

### DataService Example (Pure C# — Testable via `new`)

```csharp
/// <summary>
/// purely C# Collection Service.
/// (Build + Get + Add + Remove + (boolean questions) + snapshot) data.
/// </summary>
public class ShopDataService
{
    #region private API
    List<SO_ShopCategory> CATEGORY = new List<SO_ShopCategory>();
    Dictionary<SO_ShopCategory, List<WShopItem>> DOC__category_wShopItem;
    List<CartItem> CARTITEM = new List<CartItem>();
    #endregion
    #region Nested Type
    public class CartItem
    {
        public WShopItem wShopItem;
        public int qty;
    }
    #endregion
    #region public API
    public void BuildCategories(List<SO_ShopCategory> CATEGORY)
    {
        this.CATEGORY = CATEGORY;
        DOC__category_wShopItem = new Dictionary<SO_ShopCategory, List<WShopItem>>();
        foreach (var category in CATEGORY)
            DOC__category_wShopItem[category] = category.ITEM_DEF.map(def => new WShopItem(def)).ToList();
    }
    public List<SO_ShopCategory> GetCategories() => CATEGORY;
    public List<WShopItem> GetWShopItems(SO_ShopCategory category) => DOC__category_wShopItem[category];
    public bool CanAffordCartItems() => GetCartTotalPrice() <= Singleton<EconomyManager>.Ins.GetMoney();
    public float GetCartTotalPrice() => CARTITEM.sum(ci => ci.wShopItem.itemDef.defaultPrice * ci.qty);
    #endregion
    #region snapShot
    public string GetSnapShotForTest(string header = "when something happened")
    {
        return $@"
{'='.repeat(4) + header + '='.repeat(4)}
// CATEGORY
{PhaseALOG.LIST_CATEGORY__TO__JSON(CATEGORY)}
// DOC__category_wShopItem
{PhaseALOG.DOC_CATEGORY_ITEM__TO__JSON(DOC__category_wShopItem)}
// CARTITEM
{PhaseALOG.LIST_CARTITEM__TO__JSON(CARTITEM)}";
    }
    #endregion
}
```

### Orchestrator Example (DOC__ Tracking + RefreshAllRequired)

```csharp
public class ShopUIOrchestrator : MonoBehaviour
{
    #region Inspector Fields
    [SerializeField] Transform _categoryContainer, _shopItemContainer;
    [SerializeField] GameObject _pfField_Category, _pfField_ShopItem;
    [SerializeField] Button _purchaseButton;
    #endregion
    #region private API
    ShopDataService shopDataService;
    // DOC__ tracks data→Field_ mapping for refresh/destroy
    Dictionary<SO_ShopCategory, Field_ShopCategory> DOC__Category__Field = new();
    Dictionary<ShopDataService.CartItem, Field_ShopCartItem> DOC__CartItem__Field = new();

    void RepopulateShopItemsView()
    {
        // → clear old Field_ instances
        this._shopItemContainer.destroyLeaves();
        // → create new Field_ for each item
        foreach (var wShopItem in shopDataService.GetWShopItems(selectedCategory))
        {
            var field = GameObject.Instantiate(_pfField_ShopItem, _shopItemContainer).gc<Field_ShopItem>();
            field.SetData(wShopItem.itemDef.itemDefName, wShopItem.itemDef.descr, ...);
            // AddListener lives ONLY in Orchestrator
            field._addToCartButton.onClick.AddListener(() =>
            {
                CreateAndOrchestrateCartItemFields(wShopItem);
                RefreshAllRequired();
            });
        }
    }
    void RefreshAllRequired()
    {
        // → event-driven: called after EVERY data mutation, never in Update()
        _cartTotalPriceText.text = shopDataService.GetCartTotalPrice().formatMoney();
        _purchaseButton.interactable = shopDataService.CanAffordCartItems();
    }
    #endregion
    #region public API
    public void InitBuildOrchestrateAndSubscribe(ShopDataService shopDataService, List<SO_ShopCategory> CATEGORY)
    {
        this.shopDataService = shopDataService;
        RefreshAllRequired();
    }
    #endregion
}
```

### Small SubManagers — Inline Orchestrator (CRITICAL)

When a SubManager's orchestration is small (spawn/destroy a few buttons), Orchestrator logic lives **inline** in the SubManager using `#region Orchestrator`. No separate Orchestrator file needed. Only split when orchestration is large (150+ lines).

### Owner Chain Pattern (CRITICAL)

When a MonoBehaviour needs to expose inspector refs to child/sibling scripts (NOT cross-system), use expression-bodied read-only properties. This is the ONLY allowed property pattern besides the exceptions listed in Mandatory Patterns:

```csharp
#region Inspector Fields
[SerializeField] Camera _playerCam;
[SerializeField] Transform _viewModelContainer;
#endregion
#region public API — Owner chain (read by tools, orchestrator)
public Camera PlayerCam => _playerCam;
public Transform ViewModelContainer => _viewModelContainer;
#endregion
```

### Context Injection via `Set...Context()` (CRITICAL)

When a tool/object needs data from another system but must stay decoupled, use `Set...Context()` methods called by a Bridge. Consumer stores only primitives/transforms — NEVER a reference to the owner class:

```csharp
// Tool doesn't know PlayerMovement exists — only stores what it needs
public void SetOwnerContext(Camera cam, Transform viewModelContainer, Transform magnetToolPos)
{
    ownerCam = cam;
    ownerViewModelContainer = viewModelContainer;
    ownerMagnetToolPos = magnetToolPos;
}
```

### System Subfolder Convention (CRITICAL)

When a system has many files, group by role in subfolders:

| Subfolder | Contains | Example |
|-----------|----------|---------|
| `...BaseSub/` | Subclasses of a base class | `ToolBaseSub/ToolPickaxe.cs` |
| `Bridge/` | Bridge scripts connecting systems | `Bridge/ItemEquipBridge.cs` |
| `Field_/` | Multiple Field_ display MonoBehaviours | `Field_/Field_InventorySlot.cs` |
| `SO_/` | Multiple ScriptableObject definitions | `SO_/SO_BuildingDef.cs` |

Root of system folder keeps: base class, interfaces, DataService, non-MB shared code, Test.md, Dependency.md.

## Core Scripts (CRITICAL — phase-All Foundation)

These scripts live in `phase-All/` and are **mandatory infrastructure** for every project:

- **`Singleton<T>`** (`0-Core/Singleton.cs`) — generic MonoBehaviour singleton base. All Managers extend `Singleton<T>`. Access via `Singleton<X>.Ins`. Lives in `phase-All/0-Core/`, never duplicated.
- **`GameEvents`** (`0-Core/GameEvents.cs`) — static partial class. Core events (MenuStateChanged, etc.) defined in `phase-All/0-Core/GameEvents.cs`. Each phase EXTENDS via its own `partial class GameEvents` in `phase-{x}/0-Core/GameEvents.cs` — never modify the phase-All original. Signatures use **interfaces only** (`Action<IInventoryItem>`, never `Action<ConcreteClass>`). Zero imports from any `_-Systems/` folder.
- **`UIManager`** (`1-Managers/UIManager.cs`) — extends `Singleton<UIManager>`. Manages `isAnyMenuOpen` state, cursor lock/unlock, `CloseAllSubManager()`. Every SubManager in every phase reports open/close state to UIManager via GameEvents.
- **`DataManager`** (`1-Managers/DataManager.cs`) — extends `Singleton<DataManager>`. Shared visual data (materials, layer masks). FREE infra.
- **`GlobalEnumsAll.cs`** (`2-Data/Enums/`) — `TagType` enum (grows across phases, no raw string tags), shared enums. Each phase adds its own `GlobalEnums{X}.cs` for phase-specific enums.
- **`Utils.cs`** (`4-Utils/`) — single static class for ALL utility code (see Utils.cs section above).
- **`TimeSince`/`TimeUntil`** (`4-Utils/`) — structs with implicit float conversion, drop-in replacement for float timers.

**All of the above are FREE — using them does NOT count as a dependency.** Any script can reference these without affecting its portability level.

## GlobalEnums (CRITICAL — All Enums Centralized, camelCase Values)

**ALL enums for a phase live in ONE file.** No enum definitions scattered across individual scripts.

- **`GlobalEnumsAll.cs`** in `phase-All/2-Data/Enums/` — shared enums that grow across phases. `TagType` lives here.
- **`GlobalEnums{X}.cs`** in `phase-{x}/2-Data/Enums/` — all phase-specific enums in ONE file per phase. `AnimParamType` lives here.

### Rules

- **Enum values are ALWAYS camelCase (CRITICAL)** — `TagType.grabbable`, `PieceType.ore`, `AnimParamType.attack1`. NEVER PascalCase (`Grabbable`, `Ore`, `Attack1`). Zero exceptions.
- **One enum file per phase** — do NOT create separate files per enum. All enums for phase-A go in `GlobalEnumsA.cs`. All enums for phase-B go in `GlobalEnumsB.cs`.
- **TagType enum (CRITICAL)** — replaces ALL raw string tags. Use `HasTag(TagType.x)` / `SetTag(TagType.x)` extension methods. Never `CompareTag("string")` or `tag = "string"`. TagType grows across phases — new phases add values to `GlobalEnumsAll.cs`.
- **AnimParamType enum (CRITICAL)** — replaces ALL raw string Animator parameters. Define `AnimParamType { attack1, isRunning, speed }` in `GlobalEnums{X}.cs`. Use `_animator.SetTrigger(AnimParamType.attack1.ToString())` / `.SetBool(AnimParamType.isRunning.ToString(), val)`. Never `SetTrigger("attack1")` with magic strings.
- **No magic strings anywhere** — if a string identifies a tag, layer, animator param, or game concept, it gets an enum value.
- **String values and enum values that convert to strings are camelCase (CRITICAL)** — layer names, tag names, animator parameter names, and input action names are all camelCase whether stored as string constants or as enum values that get `.ToString()`. Examples: layer `"gameBackground"`, tag enum `TagType.grabbable`, animParam enum `AnimParamType.isRunning`, input action `"moveForward"`. This keeps Unity inspector names uniform with code identifiers.

```csharp
// GlobalEnumsAll.cs — grows across phases
public enum TagType { grabbable, interactable, enemy, player, ground }

// GlobalEnumsA.cs — phase-specific
public enum PieceType { ore, coal, iron, gold }
public enum AnimParamType { attack1, isRunning, speed, isGrounded }
public enum ConveyorDirection { forward, left, right }
```

### Enum Phase Comments (CRITICAL)

When enums grow across phases, mark values with `// Phase X:` comments:

```csharp
public enum TagType
{
    untagged,
    grabbable,
    markedForDestruction,
    // Phase D:
    conveyorBelt,
    // Phase E:
    hopper,
}
```

## Decoupling Rules (CRITICAL)

**Scope:** These rules apply to communication **between** systems (`_-Systems/` folders) — same phase or different phase. Scripts **inside** the same system folder CAN be tightly coupled to each other (direct class refs, shared state, etc.). The decoupling boundary is the system folder edge. This exists because every system is designed to be copy-paste portable to future Unity3D projects — internal cohesion is fine, external coupling is not.

### Cross-System Communication — 4 Mechanisms (Priority Order)

1. **GameEvents** (fire-and-forget, zero coupling) — System A fires `Raise...()`. System B subscribes. Neither knows the other exists.
2. **Interface / DIP** (caller-defines abstraction) — System that NEEDS defines interface. System that PROVIDES implements.
3. **Bridge** (runtime context push) — MonoBehaviour subscribes to GameEvent and pushes runtime context. Lives on non-portable side.
4. **`[SerializeField]`** (same-GO / parent-child only) — Direct inspector ref. Intra-system only. NEVER across `_-Systems/` folders.

### Rules

- **GameEvents** for cross-system communication — static partial class, each phase extends in own `0-Core/GameEvents.cs`
- **GameEvents signatures use interfaces, NEVER concrete classes** — `Action<IInventoryItem>` not `Action<BaseHeldTool>`. GameEvents.cs has zero imports from any `_-Systems/` folder. Common violation: `Action<SO_ShopCategory>` or `Action<WItem>` — use an interface instead
- **Every `Raise...()` must call `LogSubscribersCount()`** — logs `[GameEvents] OnX raised for -> N subscribers` for debug tracing
- **`// when X >>` / `// << when X`** comment blocks wrap each event domain in GameEvents
- **`[SerializeField]`** for same-GO references — always private
- **Owner chain** for parent-child references
- **Singleton reads ONLY** for queries (`Singleton<X>.Ins.GetValue()`), NEVER cross-system commands
  - Exception: `Singleton<UIManager>.Ins.CloseAllSubManager()` is acceptable
- **Separate Open/Close events** per UI panel — NOT a toggle
- **ZERO `FindObjectOfType`** in MonoBehaviours — use above alternatives
- **`// purpose:`** comment on EVERY `.Raise...()` call and `+=` subscription
- **Cross-phase file changes** — prefer `partial` extend over direct modify. Only direct-modify when `[SerializeField]` or inheritance requires it. Every phase GUIDE.md lists modifications in a table: `| File | Change | Why |`

### FSM Decoupling Rules

- **States → StateMachine only** — states reference their parent StateMachine/controller to call `ChangeState()`. States NEVER import or reference other state classes directly.
- **State transitions via ChangeState()** — `_stateMachine.ChangeState(new IdleState(_controller))`, never `_otherState.Enter()` directly.
- **External systems → GameEvents for state changes** — if other systems need to know about state changes, the StateMachine fires `GameEvents.RaiseStateChanged(stateId)`. External systems NEVER call `ChangeState()` directly.
- **FSM lives inside one `_-Systems/` folder** — all states for one controller live in the same system folder (or `StateSub/` subfolder).

### Save/Load Decoupling Rules

- **SaveManager fires GameEvents** — `OnSaveStart`, `OnSaveComplete`, `OnLoadComplete`. No direct calls to ISaveable from gameplay scripts.
- **ISaveable is an interface contract** — systems implement ISaveable independently. SaveManager iterates all registered ISaveables without knowing concrete types.
- **SaveData classes are pure C#** — no MonoBehaviour inheritance, no Unity refs. Only primitives, strings, arrays, lists, nested SaveData.
- **DataService ↔ SaveData mapping** — SaveData mirrors DataService collections. `GetSaveData()` snapshots DataService → SaveData. `LoadFromSave(SaveData)` restores DataService from SaveData.

### GameEvents Example (phase-All Core)

```csharp
/// <summary> I deliver messages between systems. Each phase adds events via partial class.
/// Every Raise logs subscriber count for debugging. </summary>
public static partial class GameEvents
{
    // when menu state changes >>
    public static event Action<bool> OnMenuStateChanged;
    public static void RaiseMenuStateChanged(bool isAnyMenuOpen)
    {
        LogSubscribersCount(nameof(OnMenuStateChanged), OnMenuStateChanged);
        GameEvents.OnMenuStateChanged?
            .Invoke(isAnyMenuOpen);
    }
    // << when menu state changes

    // when all sub-managers must close >>
    public static event Action OnCloseAllSubManagers;
    public static void RaiseCloseAllSubManagers()
    {
        LogSubscribersCount(nameof(OnCloseAllSubManagers), OnCloseAllSubManagers);
        GameEvents.OnCloseAllSubManagers?
            .Invoke();
    }
    // << when all sub-managers must close

    /// <summary> Logs how many subscribers an event has — helps catch missing/extra subscriptions. </summary>
    static void LogSubscribersCount(string name, Delegate del)
    {
        int count = del?.GetInvocationList()?.Length ?? 0;
        Debug.Log($"[GameEvents] {name} raised for -> {count} subscribers".colorTag("lime"));
    }
}
```

### GameEvents Example (Phase-Specific Partial Extension)

```csharp
// phase-A/0-Core/GameEvents.cs — extends the partial class, never modifies phase-All
public static partial class GameEvents
{
    // when shop opens >>
    public static event Action OnOpenShopView;
    public static void RaiseOpenShopView()
    {
        LogSubscribersCount(nameof(OnOpenShopView), OnOpenShopView);
        GameEvents.OnOpenShopView?
            .Invoke();
    }
    // << when shop opens

    // when shop closes >>
    public static event Action OnCloseShopView;
    public static void RaiseCloseShopView()
    {
        LogSubscribersCount(nameof(OnCloseShopView), OnCloseShopView);
        GameEvents.OnCloseShopView?
            .Invoke();
    }
    // << when shop closes

    // when money changes >>
    public static event Action<float> OnMoneyChanged;
    public static void RaiseMoneyChanged(float newAmount)
    {
        LogSubscribersCount(nameof(OnMoneyChanged), OnMoneyChanged);
        GameEvents.OnMoneyChanged?
            .Invoke(newAmount);
    }
    // << when money changes
}
```

### Interface Summary Format (CRITICAL)

Every interface gets a `<summary>` documenting ownership and both sides:

```csharp
/// <summary>
/// Contract for anything that can sit in an inventory slot — tools, building crates, future items.
/// InventoryDataService stores IInventoryItem (not BaseHeldTool), so the inventory system is
/// decoupled from the tool hierarchy. A test can create a mock without needing MonoBehaviour.
///
/// Who implements me: BaseHeldTool (Phase B), BuildingCrate (Phase D), any future storable.
/// Who uses me: InventoryDataService (InventorySlot.item), InventoryOrchestrator.
/// </summary>
public interface IInventoryItem { ... }
```

### Multi-Tier Interface Design (CRITICAL)

When ONE system has **many consumers** (5+ scripts), split interface by **access pattern** — not by domain:

| Tier | Purpose | Example |
|------|---------|---------|
| **Identity** | "What am I?" — read-only queries | `IProcessIdentity` — `GetResourceType()`, `GetSellValue()` |
| **Mutation** | "Transform me" — state-changing ops | `IProcessConvertible` — `TryCrush()`, `ConvertToPlate()` |
| **Progress** | "Add per-frame value" — gradual | `IProcessProgressable` — `AddPolish(delta)` |
| **Tracking** | "Track membership" | `IBasketTrackable` — `AddBasket(basket)`, `RemoveBasket(basket)` |

Each consumer only needs `GetComponent<>` for the tier it uses. Result: 14 machines, 0 concrete imports.

### Bridge Pattern Examples (CRITICAL)

Bridge scripts live on the **non-portable side** — the consumer never imports the provider's concrete class.

**Event-Push Bridge (most common):**
```csharp
// Lives in: non-portable provider side (e.g. EconomySystem)
public class MoneyBridge : MonoBehaviour
{
    [SerializeField] MonoBehaviour _moneyProvider; // drag EconomyManager GO
    void Start()
    {
        if (_moneyProvider is IShopMoney money)
            // purpose: push money provider interface into ShopSystem
            GameEvents.RaiseMoneyProviderReady(money);
    }
}
// Consumer (ShopUI) subscribes: GameEvents.OnMoneyProviderReady += (m) => money = m;
```

**Static-Accessor Bridge:**
```csharp
// Lives in: consumer side that needs the ref
public class PoolSpawnerBridge : MonoBehaviour
{
    [SerializeField] MonoBehaviour _poolManagerRef;
    public static IPoolSpawner Spawner { get; private set; }
    void Start() => Spawner = _poolManagerRef as IPoolSpawner;
}
// Consumer reads: PoolSpawnerBridge.Spawner?.Spawn(prefab, pos);
```

## Mandatory Patterns (CRITICAL)

- **`isFirstEnable` pattern (MANDATORY on ALL SubManagers)** — first OnEnable: subscribe to open/close events, build DataService, init orchestrator, self-disable (`SetActive(false)`), set flag false, `return` early. Subsequent OnEnable: `RaiseMenuStateChanged(true)`. OnDisable: `RaiseMenuStateChanged(false)`. This pattern exists because Awake/OnEnable order across GOs is NOT guaranteed — isFirstEnable makes initialization safe regardless of execution order

```csharp
bool isFirstEnable = true;
private void OnEnable()
{
    if (isFirstEnable)
    {
        // → subscribe to open/close events, build data, init orchestrator
        // purpose: open/close this SubManager's panel
        GameEvents.OnOpenShopView += () => this.gameObject.SetActive(true);
        GameEvents.OnCloseShopView += () => this.gameObject.SetActive(false);
        this.gameObject.SetActive(false); // → self-disable after setup
        isFirstEnable = false;
        return; // → skip RaiseMenuStateChanged on first enable
    }
    // purpose: cursor lock/unlock for player controller
    GameEvents.RaiseMenuStateChanged(isAnyMenuOpen: true);
}
private void OnDisable()
{
    // purpose: cursor lock/unlock for player controller
    GameEvents.RaiseMenuStateChanged(isAnyMenuOpen: false);
}
```

- **`partial class GameEvents`** — each phase extends in own 0-Core/GameEvents.cs, never modify earlier phase files
- **`[AddComponentMenu]`** on every MonoBehaviour
- **No defensive null checks** on inspector refs — let it crash (traceable). `?.` and `??` for runtime null-coalescing are fine (concise code) — this rule only bans verbose `if (x != null)` guards on `[SerializeField]` refs
- **No C# property accessors** — `{ get; set; }` forbidden, use explicit `Get.../Set...()` methods
  - Exceptions: `[Serializable]` entities, SO_ (pure data), interface contracts, static collections, Owner chain `=> _field`, UIManager `isAnyMenuOpen`, Bridge static accessor, protected write-only setters
- **TagType enum** — no raw string tags. Use `HasTag(TagType.x)` / `SetTag(TagType.x)` extension methods. Never `CompareTag("string")` or `tag = "string"`. Tags live in `GlobalEnumsAll.cs` and grow across phases
- **AnimParamType enum** — no raw strings for Animator parameters. Define `AnimParamType { attack1, isRunning, speed }` in `GlobalEnumsX.cs`. Use `_animator.SetTrigger(AnimParamType.attack1.ToString())` / `.SetBool(AnimParamType.isRunning.ToString(), val)`. Never `SetTrigger("attack1")` with magic strings
- **DataService + Phase{X}LOG + GetSnapShotForTest()** — for EVERY collection in EVERY DataService
- **Minimal Methods** — fewer = less to type, less to break. Target: SubManager 0-1 public, Orchestrator 1-3, DataService 2-5, Field_ 1-3, Manager 2-4
- **Manager vs MonoBehaviour rule** — if it extends `Singleton<T>`, it goes in `1-Managers/` (takes precedence over PhaseMap listings)
- **C# allowed:** `$""`, `?.`, `??`, `=>`, ternary, LINQ, `var`, custom extensions, expression-bodied members (`=>`). **Prefer `=>` for one-liner methods/properties** — keeps code concise. **NOT allowed:** `Span<T>`, `ValueTuple` deconstruction. **`async/await`:** forbidden by default. Allowed ONLY when the project uses networking middleware that requires async patterns (FishNet, Photon, Netcode for GameObjects). When allowed, follow these rules: (1) async methods return `UniTask` or `Task`, never `async void` except Unity event handlers, (2) use `CancellationToken` from `destroyCancellationToken` on MonoBehaviours, (3) never `await` inside Update/FixedUpdate — use coroutines or polling instead, (4) wrap network calls in try/catch for disconnect handling.
- **`.NET 2.0+ limitation (CRITICAL):`** `yield return` inside a `try/catch` block inside `IEnumerator` is **not allowed** by the compiler. Move the `yield` outside the `try/catch`, or restructure: try/catch the fallible logic first, store the result, then `yield return` the value after the block
- **Use `System.Linq` aggressively (CRITICAL)** — `.Select()`, `.Where()`, `.Any()`, `.First()`, `.ToDictionary()`, `.ToList()`, `.OrderBy()`, `.Count()`, `.Sum()` etc. to keep code concise. Prefer LINQ one-liners over manual `foreach` accumulation. Also use project custom LINQ-style extensions: `.map()`, `.all()`, `.sum()`, `.flatMap()`, `.find()`, `.forEach()`.

```csharp
// ❌ BAD — manual foreach accumulation
var result = new List<string>();
foreach (var item in items)
{
    if (item.isUnlocked)
        result.Add(item.name);
}

// ✅ GOOD — LINQ one-liner
var result = items.Where(i => i.isUnlocked).Select(i => i.name).ToList();

// ✅ GOOD — custom extensions (.map = Select, .all = All)
var snapshot = CATEGORY.map(c => new { c.categoryName, c.sprite.name });
bool allLocked = items.all(i => i.isLockedCurr);
float total = CARTITEM.sum(ci => ci.wShopItem.itemDef.defaultPrice * ci.qty);

// ✅ GOOD — build dictionaries with LINQ
var DOC = items.ToDictionary(i => i.id, i => new WItem(i));

// ✅ GOOD — boolean checks
bool hasAny = items.Any(i => i.qty > 0);
var first = items.FirstOrDefault(i => i.isSelected);
```

- **MonoBehaviour classes = minimal** — only when Unity lifecycle/physics is truly required. Pure C# classes (DataService, DataWrapper, entities) are preferred. If logic doesn't need Update/Start/OnEnable, it doesn't need MonoBehaviour
- **Public API obsession (CRITICAL — HIGHEST PRIORITY)** — before making ANY method OR field public, ask: "does another script ACTUALLY call/read this?" If no → private. If only subclasses → protected. This applies to BOTH methods AND fields. Default = private. Public is the EXCEPTION, not the rule. Audit every public member after writing. If in doubt, make it private — you can always promote later, but public is permanent API surface

## PhaseXLOG — How It Works (CRITICAL)

**Pure purpose:** Snapshot-format each DataService collection to JSON for test logging and debugging.

**One static class per phase** in `4-Utils/Phase{X}LOG.cs`. Contains one method per collection:

- **`LIST_X__TO__JSON(List<T> X)`** — for `List<>` collections
- **`DOC_X__TO__JSON(Dictionary<K,V> DOC)`** — for `Dictionary<>` collections

**Pattern:** Each method uses `.map()` to project items into an anonymous type (selecting only the fields useful for debugging), then calls `.ToNSJson(pretify: true)` to produce formatted JSON output.

```csharp
public static string LIST_CATEGORY__TO__JSON(List<SO_ShopCategory> CATEGORY)
{
    var snapshot = CATEGORY.map(category => new
    {
        category.categoryName,
        ITEM_DEF = category.ITEM_DEF.map(def => new { def.itemDefName, def.defaultPrice }),
    });
    return snapshot.ToNSJson(pretify: true);
}
```

**DataService integration:** Every DataService has a `#region snapShot` with `GetSnapShotForTest()` that calls ALL its PhaseXLOG methods:

```csharp
public string GetSnapShotForTest(string header = "when something happened")
{
    return $@"
{'='.repeat(4) + header + '='.repeat(4)}
// CATEGORIES
{PhaseALOG.LIST_CATEGORY__TO__JSON(CATEGORY)}
// ITEMS BY CATEGORY
{PhaseALOG.DOC_CATEGORY_ITEM__TO__JSON(DOC__category_wShopItem)}";
}
```

**Testing:** `DEBUG_Check` test scripts create DataService via `new`, call `Build()`, mutate, then log snapshot via `LOG.AddLog(dataService.GetSnapShotForTest("after mutation"), "json")`. This makes every collection testable without Unity runtime.

## System-Based Architecture (CRITICAL — `_-Systems/`)

`_-Systems/` is the PRIMARY structure — where the main code lives. ALL feature code goes inside:

```
_-Systems/
└── SystemName/
    ├── SO_*, Field_*, W*, DataService, Orchestrator, SubManager
    ├── Interface/         ← interfaces this system OWNS
    ├── Bridge/            ← bridges that push runtime context TO this system
    ├── Test.md            ← vertical slice test for this system
    └── Dependency.md      ← what this system imports, implements, owns
```

Numbered folders (2-Data/, 3-MonoBehaviours/) are ONLY for scripts you are POSITIVELY CERTAIN don't belong to any system (RARE). **80% rule applies here too** — if more than 20% of phase scripts are outside `_-Systems/`, something is wrong.
All utility code lives in phase-All/4-Utils/Utils.cs — no per-phase UtilsPhaseX.cs.

### System Shapes (CRITICAL)

| Shape | What It Does | Portable? | Example |
|-------|-------------|-----------|--------|
| 🕷️ **Spider** | Sits alone, extends interface "legs" outward. DEFINES interfaces, RECEIVES implementations. Never reaches out. | ✅ Always | ShopUI defines `IShopMoney` |
| 🔍 **Hunter** | Reaches OUT to the world via `GetComponent<IXxx>()`. DEFINES interfaces it needs, actively scans for implementors. | ✅ Always | ToolSystem scans via `GetComponent<IEquippable>()` |
| 🔌 **Adapter** | IMPLEMENTS interfaces defined by Spiders or Hunters. Plugs into other systems' sockets. | ✅ If interface-only deps | BuildingSystem implements 7 interfaces |
| 📡 **Broadcaster/Listener** | Fires or subscribes to GameEvents only. No interfaces needed. Pure event-driven. | ✅ Always | MiningSystem fires `OnOreMined` |
| 🌍 **Infrastructure** | Used by EVERY system. Doesn't count as dependency. | N/A (FREE) | GameEvents, UIManager, Singleton<T>, Utils |

**Spider vs Hunter** — both own interfaces, but direction is opposite:
- **Spider** passively receives (Bridge PUSHES interface impl into the system)
- **Hunter** actively scans (`GetComponent<IMyInterface>()` to find implementors on scene objects)

**Hybrids are normal** — most systems combine shapes:
- InventorySystem = 🕷️ Spider (defines `IInventoryItem`) + 📡 Listener (subscribes to pickup events)
- BuildingSystem = 🔌 Adapter (implements multiple interfaces) + 📡 Broadcaster (fires placement events)

### Portability Levels

**L0** (zero deps, copy folder → compiles) → **L1+** (each import from another `_-Systems/` = +1). Interface deps = portable ✅. Concrete deps = must fix ❌.

**FREE (doesn't count as dependency):** GameEvents, Singleton<T>, UIManager, DataManager, Utils.*, TimeSince/TimeUntil, GlobalEnumsX, all phase-All/ infra.

### System Reusability (CRITICAL)

**Every system is designed to be copy-paste portable to future projects.** L0 systems (zero deps) can be dropped into any Unity project — copy the folder, it compiles. L1+ systems with interface-only deps are still portable (bring the interface). Systems with concrete deps are game-specific and must be refactored before reuse. **This is the WHY behind every decoupling rule** — interfaces over concrete, GameEvents over direct calls, Bridge over cross-imports. If a system can't be copied to a new project without editing, the architecture failed.

### Utils.cs (CRITICAL — Centralized Utility)

**ALL reusable utility/game functions live in `phase-All/4-Utils/Utils.cs`** — one single static class. If a helper is used by 2+ scripts across any phase, it goes here as a new `#region` section. Each phase grows Utils.cs by adding regions. **No per-phase UtilsPhaseX.cs** — per-phase `4-Utils/` only contains `PhaseXLOG.cs` for snapshot formatting.

**Extension methods for primitive/value types also live in Utils.cs.** If you need an extension on `string`, `float`, `int`, `Vector2`, `Vector3`, or any other value/prototype type, build it as a `static` extension inside Utils.cs. Extension method names use **camelCase** (e.g. `.formatMoney()`, `.colorTag()`, `.xz()`, `.abs()`, `.round()`). This keeps all reusable extensions discoverable in one place.

## Documentation Voice (CRITICAL — Summaries & Inline Comments)

- **`/// <summary>` on EVERY class and EVERY method (CRITICAL)** — class = first-person extensive "I do X, I am used by Y, I fire Z events". Method = 2-line explanation of what actually happens inside (side effects, events fired, state changes). No exceptions.
- **`// →` inline flow markers (CRITICAL)** inside EVERY method body — trace what each step does
- **`// purpose:`** comment on EVERY `.Raise...()` call and every `+=` subscription — no exceptions
- **`// >>` / `// <<` block delimiters** in Orchestrators for multi-step blocks (create/orchestrate sections)
- **GUIDE.md** — beginner-friendly, conversational. Written so someone who has never seen this codebase can follow it.
- **FLOW.md** — story-style data flows. **bold** = visible change, *italic* = context, `code` = exact reference. NOT swim lanes.
- **Script summaries** — first person "I" (the script talks to you)
- **Test instructions** — assume the reader has never opened Unity — every click, every field, every GO is explicit

## Script Structure (CRITICAL)

- `#region` order (MANDATORY): Inspector Fields → private API (combines fields + helpers into ONE region) → Public API → Extra → Unity Life Cycle (LAST)
- DataService-specific order: private API → Nested Type → public API → snapShot
- Class summary: conversation-style first person "I" — what I do, who uses me, events
- Method summary: 2-line English explaining what actually happens inside
- `// →` inline flow markers inside every method body
- **`// >>` / `// <<` block delimiters** in Orchestrators for multi-step blocks (create/orchestrate sections)
- No blank lines between `#endregion` and next `#region`
- Multi-interface classes: replace "Public API" with per-interface regions (`#region IInventoryItem`)

### MonoBehaviour #region Order

```csharp
#region Inspector Fields       // ← [SerializeField] refs (MonoBehaviours only)
#endregion
#region private API            // ← runtime state + internal helpers (combined into one region)
#endregion
#region Public API             // ← or subdivide: #region IInventoryItem, #region IInteractable
#endregion
#region Extra                  // ← nice-to-have + future-phase stubs (audio, save/load) — typed last, skippable
#endregion
#region Unity Life Cycle       // ← Awake, Start, OnEnable, Update, etc. — LAST
#endregion
```

### DataService #region Order

```csharp
#region private API            // ← collection fields (CATEGORY, DOC__x_y, etc.)
#endregion
#region Nested Type            // ← public nested entity classes (CartItem, etc.)
#endregion
#region public API             // ← Build, Get, Add, Remove, boolean questions
#endregion
#region snapShot               // ← GetSnapShotForTest() calling PhaseXLOG
#endregion
```

## Method Naming Patterns

| Prefix | Meaning | Return |
|--------|---------|--------|
| `Get...` | Read/query data | value |
| `Set...` | Write/assign data | void |
| `Try...` | Attempt (may fail) | bool |
| `Can...` | Check capability | bool |
| `Is...` | Check state | bool |
| `Has...` | Ownership check | bool |
| `Should...` | Policy predicate | bool |
| `Build...` | Initialize collections | void |
| `Refresh...` | Update UI after mutation | void |
| `Handle...` | Event handler callback | void |
| `Raise...` | Fire GameEvent | void |
| `Perform...` | Execute action | void |
| `Toggle...` | Flip state | void |

## Custom Extensions Library (CRITICAL)

Project uses `SPACE_UTIL` namespace. Use these instead of verbose standard API:

| Extension | Replaces | Example |
|-----------|----------|---------|
| `.map()` | `Select()` | `items.map(i => new { i.name })` |
| `.find()` | `FirstOrDefault()` | `items.find(i => i.id == id)` |
| `.all()` | `All()` | `items.all(i => i.isLocked)` |
| `.any()` | `Any()` | `items.any(i => i.qty > 0)` |
| `.sum()` | `Sum()` | `items.sum(i => i.price)` |
| `.flatMap()` | `SelectMany()` | `DOC.Values.flatMap(v => v)` |
| `.forEach()` | side-effect iteration | `items.forEach(i => i.Reset())` |
| `.gc<T>()` | `GetComponent<T>()` | `go.gc<Field_Item>()` |
| `.toggle(val)` | `SetActive(val)` | `panel.toggle(false)` |
| `.destroyLeaves()` | destroy all children | `container.destroyLeaves()` |
| `.getRandom()` | random element | `list.getRandom()` |
| `.colorTag(color)` | rich text color wrap | `"text".colorTag("red")` |
| `.repeat(n)` | repeat char/string | `'='.repeat(4)` |
| `.ToNSJson(pretify)` | JSON serialize | `obj.ToNSJson(pretify: true)` |
| `.GetOrCreate(key, def)` | dict get-or-create | `dict.GetOrCreate(key, new())` |
| `.formatMoney()` | currency display | `400f.formatMoney()` → `"$400.00"` |
| `.formatMoneyShort()` | short currency | `1500f.formatMoneyShort()` |
| `.xz()` | extract XZ as Vector3 | `pos.xz()` |
| `.abs()` | absolute value | `value.abs()` |
| `.round()` | float rounding | `value.round()` |
| `.HasTag(TagType)` | `CompareTag()` replacement | `go.HasTag(TagType.grabbable)` |
| `.SetTag(TagType)` | `tag = "string"` replacement | `go.SetTag(TagType.enemy)` |
| `INPUT.K.InstantDown(key)` | `GetKeyDown()` | `INPUT.K.InstantDown(KeyCode.E)` |
| `INPUT.K.HeldDown(key)` | `GetKey()` | `INPUT.K.HeldDown(KeyCode.W)` |
| `INPUT.M.InstantDown(btn)` | mouse button down | `INPUT.M.InstantDown(0)` |
| `INPUT.UI.SetCursor(bool)` | cursor lock/visibility | `INPUT.UI.SetCursor(true)` |
| `C.method(this)` | log method name | `Debug.Log(C.method(this))` |
| `LOG.AddLog(data, type)` | structured logging | `LOG.AddLog(snapshot, "json")` |
| `LOG.H(name)` / `LOG.HEnd()` | log header sections | `LOG.H("MapData")` |

## 13 Common Pitfalls

1. **SetActive cascading** — parent disables ALL children. Use siblings for independent panels.
2. **Scene instance vs prefab** — drag from Hierarchy, not Project panel.
3. **raycastTarget** — ghost=false, slot bg=true, icon=false.
4. **Swap contents not objects** — swap `.item` field, not entire slot.
5. **Missing layers** — `LayerMask.NameToLayer` returns -1 silently.
6. **LayerMask at Nothing** — defaults to 0, all raycasts return empty.
7. **Cross-phase mods not applied** — compile error or silent failure.
8. **Dual collider setup** — trigger + physical on separate child GOs.
9. **Static lists surviving domain reload** — second Play press has stale null refs.
10. **Execution order attributes** — `[DefaultExecutionOrder]` on managers, don't remove.
11. **Giant switch statement for state logic** — use IState pattern with separate classes per state. Switch is only OK for ≤3 trivial states.
12. **SaveData fields inside MonoBehaviour** — extract to separate pure C# `[Serializable]` SaveData class. MonoBehaviour implements ISaveable and returns SaveData from `GetSaveData()`.
13. **PlayerPrefs for complex game state** — PlayerPrefs is for settings (volume, keybinds) only. Use file-based JSON for game saves.

## 35 Common Agent Mistakes

1. Any `FindObjectOfType` in MonoBehaviours → use `[SerializeField]`, Owner chain, or GameEvents
2. Public methods nobody calls externally → audit every public method
3. Missing `// purpose:` on Raise/Subscribe calls → mandatory on every single one
4. Tight coupling (Script A directly calls Script B across systems) → decouple via GameEvents
5. Defensive null checks on inspector refs → let it crash
6. RefreshAll() in Update() (polling) → make it event-driven
7. DataService that needs Unity physics/lifecycle → question if it should be a DataService
8. Missing `isFirstEnable` pattern on SubManagers → every SubManager MUST use it
9. Toggle instead of separate Open/Close events → every UI panel needs SEPARATE events
10. Using `Input.GetKeyDown` directly in SubManagers → SubManagers don't handle input
11. Methods on SO_ classes → SO_ = pure data, zero methods. Move to consumer or SO_XxxExt
12. Singleton in `3-MonoBehaviours/` instead of `1-Managers/` → Singleton<T> = always 1-Managers/
13. Collections left in MonoBehaviour instead of DataService → extract to DataService
14. Missing PhaseXLOG methods → every collection gets its own LOG method
15. Missing `RefreshAllRequired()` in Orchestrator → after every data mutation, refresh UI
16. Missing `DOC__X__Field` in Orchestrator → must track data→Field_ mapping
17. Not using user's custom extensions → use `.map()`, `.gc<T>()`, `.destroyLeaves()`, `.toggle()`, `.ToNSJson(pretify: true)`, `.getRandom()`, `.colorTag()`, `.repeat()` etc. (see Custom Extensions Library section)
18. Bridge script placed on the portable side → Bridges live on the non-portable / game-specific side
19. `Interface/` subfolder not used when system has 2+ interfaces → single interface = root. Two or more = `Interface/` subfolder
20. Using `FindObjectOfType` instead of `FindObjectsByType` → obsolete in Unity 6000.3. Use `FindObjectsByType<T>(FindObjectsSortMode.None)` — ONLY in Bridge `Start()` for push-to-all
21. Wrong bridge pattern chosen → 5 variants exist (event-push, event-response, push-to-all, event-chain, static-accessor). Match data-flow direction
22. `#region Private Fields` instead of `#region private API` → correct name is `private API` (lowercase, combined)
23. Field_ uses `[SerializeField]` instead of public fields → Field_ scripts use **public** refs (set by Orchestrator at runtime via `.gc<T>()`), not `[SerializeField]`
24. State classes referencing each other directly → states communicate via `StateMachine.ChangeState()`, never `new OtherState()` inside a state
25. Missing Exit() cleanup in FSM states → every Enter() allocation/subscription MUST have matching cleanup in Exit()
26. SaveData class with methods/logic → SaveData = pure `[Serializable]` data fields only, zero methods. Serialization helpers belong in SaveManager
27. Save/Load bypassing GameEvents → SaveManager fires `OnSaveStart`/`OnSaveComplete`/`OnLoadComplete` via GameEvents. No direct calls to ISaveable from gameplay scripts
28. CONSTANT_CASE on consts → C# convention is `UPPER_SNAKE` but OUR convention is camelCase for ALL consts/fields. Never `MAX_AMOUNT`, always `maxAmount`. The standard C# habit must be suppressed
29. Preserving original source's public access level → when rebuilding from decompiled source, ALWAYS apply minimal-public-API rule. Original had `public int evilCount`? Ask: "does another script ACTUALLY read this?" If no → private + getter only if needed
30. Preserving original source's defensive null checks → original code often guards `[SerializeField]` refs with `if (x == null) return`. Strip these during rebuild — our convention says let it crash for traceability
31. Missing `// →` in "simple" constructors/methods → the rule says EVERY method body, including constructors that are just field assignments. No exceptions for "too simple"
32. Missing `/// <summary>` on batch-generated items → when generating multiple stubs (virtual methods, enum types), each MUST get its own summary. A single block comment above the batch is NOT sufficient
33. PhaseXLOG method names not following `LIST_`/`DOC_` prefix → method must be `LIST_X__TO__JSON` for List collections and `DOC_X_Y__TO__JSON` for Dictionary collections. Never bare `X__TO__JSON`
34. Unnecessary MonoBehaviour inheritance → class extends MonoBehaviour but doesn't use ANY Unity feature (`[SerializeField]`, lifecycle hooks, coroutines, physics callbacks, needs to exist on a GameObject). Convert to plain C# class. MonoBehaviour is ONLY for scripts that genuinely need Unity lifecycle or scene presence. Pure C# classes (DataService, DataWrapper, entities, helpers, calculators, formatters, validators) are ALWAYS preferred
35. File naming ≠ class naming for inspector-added MonoBehaviours → Unity 6000.3 requires filename MUST match classname for any MonoBehaviour added via Add Component menu (inspector search indexes by filename). Code-added MBs (`AddComponent<T>()`) are exempt from this rule