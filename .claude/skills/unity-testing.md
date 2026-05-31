---
name: 'unity-testing'
description: 'Vertical slice testing patterns — data-first DEBUG_Check, UI-level tests, Test.md format, independence rules, mock strategies, test file organization for Unity rebuild projects'
---

# Unity Testing — Vertical Slice Patterns

> **Universal pattern — applies to ALL Unity projects in this workspace.**
> This skill defines how every system is tested independently.
> Two levels: **data-level** (plain C#, no scene) and **UI-level** (MonoBehaviour in scene).
> Each system's `_-Systems/XxxSystem/` folder contains its own `Test.md`.
> Examples below use MINEMGL classes — substitute with your project's equivalents.

---

## Core Testing Philosophy

1. **Every system testable independently** — no coupling to other systems required
2. **Data first** → UI second → integration last
3. **Interface contracts** eliminate coupling — mock via interface, not concrete class
4. **No forward dependencies** — test only what's built so far

---

## Two Levels of Testing

### Level 1: Data-Level (`DEBUG_Check`)

Tests anything in `2-Data/` by creating a **plain C# instance**. Zero dependency. No UI, no scene, no MonoBehaviour needed. DataService, DataWrapper, Entities — all testable this way.

**Location:** `phase-X/Scripts/5-Tests/DEBUG_CheckX.cs`

**Pattern:**

```csharp
[AddComponentMenu("MineMGL/Test/DEBUG_CheckX")]
public class DEBUG_CheckX : MonoBehaviour
{
    /// <summary> Tests ShopDataService logic — cart operations, afford check, category building.
    /// No UI, no scene objects needed. Just plain C# instances. </summary>
    void Start()
    {
        var dataService = new ShopDataService();
        var mockMoney = new MockIShopMoney();  // implements IShopMoney with fixed balance

        // → build categories from test data
        dataService.BuildCategories(testCategories);

        // → test cart add
        dataService.TryAddNewCartItem(testItem);
        Debug.Assert(dataService.GetCartCount() == 1);

        // → test afford check
        bool canAfford = dataService.CanAffordCartItems();
        Debug.Assert(canAfford == true);

        // → snapshot output for visual verification
        Debug.Log(dataService.GetSnapShotForTest("DEBUG_Check Cart Test"));
    }
}
```

**Key Rules:**
- Class MUST extend MonoBehaviour (drag onto empty GO to run)
- ALL logic tested via `new DataService()` — no Singleton access
- Mock interfaces with minimal inline implementations
- Use `Debug.Assert()` for pass/fail + `Debug.Log()` for snapshot output
- DataService's `GetSnapShotForTest(header)` dumps all state via PhaseXLOG formatters

### Level 2: UI-Level (`SystemNameTest.cs`)

Tests full UI flow with keyboard shortcuts. Placed in scene with all required prefabs wired.

**Location:** `phase-X/Scripts/5-Tests/SystemNameTest.cs` or `_-Systems/XxxSystem/XxxTest.cs` (if system-specific)

**Pattern:**

```csharp
[AddComponentMenu("MineMGL/Test/ShopUITest")]
public class ShopUITest : MonoBehaviour
{
    [SerializeField, TextArea(10, 30)]
    string _readme = "CONTROLS:\n" +
        "T = Open shop\n" +
        "Y = Add random item to cart\n" +
        "U = Purchase cart\n" +
        "I = Log snapshot\n\n" +
        "REQUIRES: ShopUI panel, EconomyManager (or mock), SO_ShopCategories in Resources";

    /// <summary> Each frame: routes test key presses to data service operations,
    /// then logs results so you can verify state changes visually in Console. </summary>
    void Update()
    {
        if (Input.GetKeyDown(KeyCode.T)) OpenShop();
        if (Input.GetKeyDown(KeyCode.Y)) AddRandomToCart();
        if (Input.GetKeyDown(KeyCode.U)) PurchaseCart();
        if (Input.GetKeyDown(KeyCode.I)) LogSnapshot();
    }
}
```

**Key Rules:**
- `[TextArea] _readme` field visible in Inspector — lists all controls + prerequisites
- `[AddComponentMenu]` for easy find in Unity
- Each key triggers one specific operation
- Console output shows state changes for visual verification
- NO dependency on other test scripts

---

## Test.md Format (Inside Each `_-Systems/` Folder)

Every system folder contains a `Test.md` (or `XxxTest.md`) that describes:

```markdown
# SystemName — Vertical Slice Test

## What This Tests
One sentence: what behavior this test verifies independently.

## Prerequisites (Scene Setup)
- List exact GameObjects, components, and inspector values needed
- List which Singletons must exist (UIManager, EconomyManager, etc.)
- List which SOs must be in Resources/

## NOT Required (Independence Proof)
- List systems that are NOT needed for this test
- Explain what is mocked or skipped

## Test Steps
1. Step-by-step user actions
2. Expected console output or visual result
3. Pass/fail criteria

## Keyboard Shortcuts (if UI-level test exists)
| Key | Action | Expected Result |
|-----|--------|----------------|
| T   | Open panel | Panel appears, cursor unlocks |
| Y   | Add item   | Cart count increases |

## Common Pitfalls
- List specific gotchas (e.g. "ForgetTing to set _defaultMoney > 0 on EconomyManager")
```

---

## Independence Rules

### What "Independently Testable" Means

A system is independently testable when:
1. You can **delete all other `_-Systems/` folders** and it still compiles (with interfaces/GameEvents present)
2. You can test its full behavior with **mock implementations** of any interfaces it uses
3. No `Singleton<OtherSystem>.Ins` calls exist (except FREE infrastructure: UIManager, DataManager)

### Mock Strategy

**Interface mocks** — minimal inline class implementing the interface:

```csharp
// Mock for testing ShopUISystem without real EconomyManager
class MockShopMoney : IShopMoney
{
    public float GetMoney() => 9999f;
    public bool CanAfford(float cost) => true;
    public void AddMoney(float amount) { }
}
```

**GameEvents** — fire manually in test:

```csharp
// Simulate another system firing an event
GameEvents.RaiseToolSwitched(mockTool);
// Verify: does the subscriber respond correctly?
```

### What Counts as FREE (Not a Dependency)

These don't need mocking — they're shared infrastructure available in all phases:
- `GameEvents` (static event bus)
- `Singleton<T>` base class
- `Singleton<UIManager>.Ins`
- `Singleton<DataManager>.Ins`
- `Utils.*` (static extensions)
- `TimeSince` / `TimeUntil` (structs)
- `GlobalEnumsX`
- `SPACE_UTIL`
- `INPUT.K`

---

## Test File Organization

```
phase-X/
└── Scripts/
    ├── _-Systems/
    │   ├── ShopUISystem/
    │   │   └── ShopTest.md              ← system-specific vertical slice
    │   ├── InteractionSystem/
    │   │   └── InteractionTest.md
    │   └── InventorySystem/
    │       └── InventoryTest.md
    └── 5-Tests/
        ├── DEBUG_CheckX.cs              ← data-level (plain C# instances)
        ├── SystemNameTest.cs            ← UI-level (keyboard shortcuts)
        └── Manual/
            ├── ElevatorDescentTest.md   ← manual visual verification
            ├── ToolViewModelTest.md
            └── GrabRopeTest.md
```

**Deciding where a test goes:**
- Data-level tests (`DEBUG_Check`) → always `5-Tests/`
- System-specific Test.md → inside that system's `_-Systems/XxxSystem/` folder
- Manual verification guides → `5-Tests/Manual/`
- UI-level test scripts that span multiple systems → `5-Tests/`

---

## Service-First Testing Workflow

When building a new system, test in this order:

```
1. DataService first
   └── Write DEBUG_Check that creates DataService via `new`
   └── Test all collection operations: Build, Get, Add, Remove, Query
   └── Verify via GetSnapShotForTest() output

2. Then wire UI
   └── Write UI-level test with keyboard shortcuts
   └── Test: Field_ instances populate correctly, buttons respond, data updates

3. Finally integration
   └── Connect to real GameEvents + other systems
   └── Verify cross-system communication works
   └── This is the LAST step, not the first
```

---

## PhaseXLOG — Snapshot Formatters for Tests

Every phase has a `PhaseXLOG.cs` in `4-Utils/` with static methods that format collections for console output:

```csharp
public static class PhaseALOG
{
    /// <summary> Formats category list as JSON for test snapshot output. </summary>
    public static string LIST_CATEGORY__TO__JSON(List<SO_ShopCategory> categories)
        => categories.Select(c => new { c.name, itemCount = c.Items.Count })
                     .ToNSJson(pretify: true);

    /// <summary> Formats cart items as JSON for test snapshot output. </summary>
    public static string LIST_CARTITEM__TO__JSON(List<CartItem> cart)
        => cart.Select(ci => new { ci.wItem.Def.name, ci.qty, ci.totalCost })
               .ToNSJson(pretify: true);
}
```

**DataService calls these via `GetSnapShotForTest()`:**

```csharp
public string GetSnapShotForTest(string header)
{
    var sb = new System.Text.StringBuilder();
    sb.AppendLine($"=== {header} ===");
    sb.AppendLine(PhaseALOG.LIST_CATEGORY__TO__JSON(CATEGORY));
    sb.AppendLine(PhaseALOG.LIST_CARTITEM__TO__JSON(CARTITEM));
    return sb.ToString();
}
```

---

## Vertical Slice Test Checklist (Per System)

When writing a test for a new system, verify:

- [ ] System compiles with NO other `_-Systems/` folders present (only interfaces + GameEvents)
- [ ] DataService testable via `new` — zero MonoBehaviour dependency
- [ ] Mock interfaces are minimal (implement only what's needed for the test)
- [ ] Test.md lists prerequisites AND explicitly states what's NOT required
- [ ] Keyboard shortcuts documented in `[TextArea] _readme` inspector field
- [ ] PhaseXLOG formatters exist for all collections in this phase
- [ ] `GetSnapShotForTest()` produces readable console output
- [ ] No `FindObjectOfType<>` or `Singleton<OtherSystem>.Ins` (except FREE infra)
- [ ] Test proves the system's one-sentence contract is fulfilled

---

## Common Testing Mistakes

| Mistake | Fix |
|---------|-----|
| Testing via `Singleton<X>.Ins` calls | Create mock interface implementation instead |
| Requiring full scene with all managers | List minimum prerequisites — mock the rest |
| Testing multiple systems in one test | Each test proves ONE system works alone |
| No snapshot output | Always call `GetSnapShotForTest()` — visual verification is fast |
| Skipping `Test.md` | MANDATORY for every `_-Systems/` folder — proves independence |
| Concrete class in test assertions | Assert against interface contracts, not internal state |
| Test depends on execution order | Each test must work regardless of which runs first |

---

## Domain-Specific Test Patterns

### Save/Load Round-Trip Test (20 projects)

```csharp
/// <summary> Tests that DataService state survives save → load cycle. </summary>
void DEBUG_Check_SaveLoadRoundTrip()
{
    // → build initial state
    var ds = new InventoryDataService();
    ds.BuildSlots(5);
    ds.TryAddItem(mockItemDef, slot: 0);

    // → snapshot before save
    string before = ds.GetSnapShotForTest("before save");

    // → save: DataService → SaveData → JSON
    var saveData = new InventorySaveData
    {
        slots = ds.GetSlots().map(s => new SlotSaveData
        {
            itemDefName = s.item?.name ?? "",
            qty = s.qty
        }).ToList()
    };
    string json = JsonUtility.ToJson(saveData);

    // → load: JSON → SaveData → new DataService
    var loaded = JsonUtility.FromJson<InventorySaveData>(json);
    var ds2 = new InventoryDataService();
    ds2.BuildSlots(5);
    ds2.RestoreFromSave(loaded);

    // → snapshot after load
    string after = ds2.GetSnapShotForTest("after load");

    // → compare
    LOG.AddLog(before, "json");
    LOG.AddLog(after, "json");
    LOG.AddLog($"Round-trip match: {before == after}", "result");
}
```

### FSM State Transition Test (14 projects)

```csharp
/// <summary> Tests that FSM transitions correctly and Exit() cleanup runs. </summary>
void DEBUG_Check_FSMTransitions()
{
    var stateMachine = new StateMachine();

    // → start in idle
    var idle = new MockIdleState();
    stateMachine.ChangeState(idle);
    LOG.AddLog($"Enter called: {idle.enterCalled}", "result");

    // → transition to chase
    var chase = new MockChaseState();
    stateMachine.ChangeState(chase);
    LOG.AddLog($"Idle.Exit called: {idle.exitCalled}", "result");
    LOG.AddLog($"Chase.Enter called: {chase.enterCalled}", "result");

    // → update delegates correctly
    stateMachine.Update();
    LOG.AddLog($"Chase.Update called: {chase.updateCalled}", "result");
}

// Mock state for testing
class MockIdleState : IState
{
    public bool enterCalled, updateCalled, exitCalled;
    public void Enter() => enterCalled = true;
    public void Update() => updateCalled = true;
    public void Exit() => exitCalled = true;
}
```

### Network RPC Mock Test (5 projects)

```csharp
/// <summary> Tests networked DataService logic without actual network.
/// Simulates: client request → server validation → broadcast. </summary>
void DEBUG_Check_NetworkedPurchase()
{
    // → simulate server-side DataService
    var serverDS = new ShopDataService();
    serverDS.Build(mockItems);
    serverDS.SetMoney(100f);

    // → simulate client request
    string itemID = "iron_pickaxe";
    int qty = 1;

    // → server validates
    bool canAfford = serverDS.CanAfford(itemID, qty);
    LOG.AddLog($"Can afford: {canAfford}", "result");

    // → server processes
    if (canAfford) serverDS.ProcessPurchase(itemID, qty);

    // → verify server state
    LOG.AddLog(serverDS.GetSnapShotForTest("after purchase"), "json");
}
```