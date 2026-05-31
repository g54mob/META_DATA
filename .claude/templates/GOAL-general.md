# GOAL — Universal Architecture for Unity3D Game Rebuilds

> Every script is typed by hand. This file defines how — for **any** Unity3D game source.
> C# coding conventions (naming, capitalization, class roles, decoupling, patterns, pitfalls) are defined in [C# Conventions](../instructions/csharp-conventions.instructions.md). This file expands with gold-standard project examples and detailed architecture rationale.

---

## What

Rebuild **[PROJECT_NAME]** from its original decompiled/extracted source (`Scripts/Assembly-CSharp/`).

**Three goals, in order:**
1. **100% main-source behavior** — every feature the original game has, we have
2. **Clean architecture** — zero tight coupling between systems. Systems communicate via interfaces and GameEvents only. No direct class imports across system boundaries.
3. **Portable systems** — systems designed via `_-Systems/` architecture should work in ANY future Unity project with minimal changes. Some systems will be intentionally game-specific — that's fine.

This document is **project-agnostic**. Replace `[PROJECT_NAME]` with your game, `[PHASE_X]` with your current phase. The architecture, rules, conventions, and patterns below work for any Unity3D game rebuild — mining sim, RPG, tower defense, anything.

## Source of Truth

| What | Where |
|------|-------|
| Logic & behavior | `Scripts/Assembly-CSharp/*.cs` |
| Architecture rules | `learn/GOAL.md` (this file, project-specific copy) |
| Roadmap | `learn/PhaseMap.md` |
| DataService specs | `learn/StructureMap.md` |
| Original analysis | `learn/ARCHITECTURE.md` |
| Reasoning log | `learn/surfer.md` |
| User's actual code | `learn/handTyped(latest)/` — ground truth for coding style |
| Portability map | `learn/SystemPortabilityMap.md` — L0/L1+ per system |
| Cross-system audit | `learn/SystemIsolationAnalysis.md` — interfaces, bridges, events, concrete deps |
| Source coverage | `learn/CoverageMap.md` — every source file → which phase covers it |
| Optional extras | `learn/OptionalFeatures.md` — external package integration (e.g. Feel/MMFeedbacks) |

---

## Core Principle

**Every script's purpose fits in one sentence. If it doesn't, split it until it does.**
**Every script performs ONLY the service it was assigned — purely, nothing else.**

Every file must have a `→ "I do X"` one-liner. That one-liner is the script's contract. If the script does anything outside that sentence, it's doing too much — move it to the script whose sentence covers it.

```
SO_ItemDef             → "I define what an item IS"
WItem                  → "I track what happened to one item this session"
ItemDataService        → "I manage all item data as a collection"
Field_Item             → "I display one item row"
ItemOrchestrator       → "I wire UI fields to data and handle actions"
ItemUI                 → "I open and close the item panel"
BgUI                   → "I show/hide blur when menus change"
UIManager              → "I report menu state + close all panels when needed"
EconomyManager         → "I own currency"
GameEvents             → "I deliver messages between systems"
Singleton              → "I ensure one instance"
```

End goal: **main source (100%) behavior** with this architecture — consistent, decoupled, independently testable via vertical slice tests.

---

## What Makes This Architecture Different

Most Unity tutorials and source projects do things that break at scale. This architecture fixes the 6 biggest problems:

### 1. God-objects → One-sentence scripts

```
Typical Unity:  PlayerController.cs (888 lines) — movement, camera, grab, outline, bobbing, inventory input
This approach:  PlayerMovement.cs (walk/sprint/duck/jump/slope)
                PlayerCamera.cs (mouse look, FOV, bobbing)
                PlayerGrab.cs (SpringJoint + LineRenderer rope)
                FresnelHighlighter.cs (outline whatever player looks at)
                → each fits ONE sentence. Break one? Others still work.
```

### 2. FindObjectOfType everywhere → GameEvents + [SerializeField]

```
Typical Unity:  FindObjectOfType<PlayerInventory>().TryAddToInventory(tool)
                → crashes if PlayerInventory doesn't exist in scene
                → can't test tool without full inventory system

This approach:  GameEvents.RaiseToolPickupRequested(tool)
                → tool doesn't know inventory exists
                → inventory subscribes — or doesn't (zero crash)
                → test tool in empty scene, no inventory needed
```

### 3. UI logic mixed with data → DataService (pure C#, testable via `new`)

```
Typical Unity:  InventoryUIManager.cs (187 lines) — manages List<Tool>, handles slots,
                creates UI, handles drag-drop, manages keybinds, all in one MonoBehaviour.
                Can't test without scene + Canvas + prefabs.

This approach:  InventoryDataService (pure C# — slots, add, remove, switch, stack)
                Field_InventorySlot (display only — SetData, SetEmpty, SetHighlighted)
                InventoryOrchestrator (wires Field_ to DataService, AddListener)
                InventoryUI (SubManager — open/close only)
                → DataService testable via `new` instance, zero scene
                → Field_ testable by checking visual state
                → Orchestrator is the only place with AddListener
```

### 4. Toggle events → Separate Open/Close events

```
Typical Unity:  OnToggleInventory() — if open, close; if closed, open.
                Problem: UIManager can't close all panels because it doesn't know current state.

This approach:  OnOpenInventoryView + OnCloseInventoryView (separate events)
                → UIManager.CloseAllSubManager() just fires ALL Close events
                → SubManagers that are already closed? Event does nothing (safe)
                → No state tracking needed in UIManager
```

### 5. Singleton commands → Singleton reads only

```
Typical Unity:  Singleton<InventoryManager>.Instance.EquipTool(tool)
                → cross-system command = tight coupling

This approach:  Singleton<EconomyManager>.Ins.GetMoney()  → OK (read/query)
                GameEvents.RaiseToolEquipped(tool)         → OK (event, not command)
                Singleton<X>.Ins.DoSomething()             → NEVER (command = coupling)
```

### 6. Grouped by domain → Grouped by responsibility

```
Typical Unity:  Scripts/Inventory/ — has UI code, data code, MonoBehaviours, enums all mixed
                "Where does this go?" → answer is the domain name (vague)

This approach:  _-Systems/InventorySystem/ = ALL code for one feature, self-contained
                → SO_, Field_, DataService, Orchestrator, SubManager, Interface/, Bridge/
                → copy folder = complete feature. Read one folder = understand one system.
                Shared infra stays in numbered folders (0-Core/, 2-Data/Enums/, 4-Utils/)
```

---

## Foundation Templates

These two scripts go in `phase-All/0-Core/` and are the foundation for everything.

### Singleton.cs

```csharp
public abstract class Singleton<T> : MonoBehaviour where T : MonoBehaviour
{
    public static T Ins { get; private set; }

    protected virtual void Awake()
    {
        if (Ins == null) Ins = this as T;
        else if (Ins != this)
        {
            Debug.Log($"{typeof(T)} singleton already exists, destroying duplicate");
            Destroy(gameObject);
        }
    }
}
```

- First instance wins; duplicates destroyed
- Accessed via `Singleton<T>.Ins` (short for Instance)
- All Managers extend this

### GameEvents.cs — Partial Class Pattern

Each phase extends GameEvents in its own `0-Core/GameEvents.cs`. **Phase-All** has the core:

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

**Convention:** Each event domain is wrapped in `// when X >>` / `// << when X` comment blocks. Event + Raise are always side by side. Every Raise goes through `LogSubscribersCount` for debug tracing.

Phase-specific GameEvents:
```csharp
// phase-X/0-Core/GameEvents.cs
public static partial class GameEvents
{
    // when [domain event] >>
    public static event Action OnSomethingHappened;
    public static void RaiseSomethingHappened()
    {
        LogSubscribersCount(nameof(OnSomethingHappened), OnSomethingHappened);
        GameEvents.OnSomethingHappened?
            .Invoke();
    }
    // << when [domain event]
}
```

### DefaultExecutionOrder — Singleton Init Priorities

Use `[DefaultExecutionOrder]` on managers that other systems depend on during Awake:

```csharp
[DefaultExecutionOrder(-1000)]  // Must exist before anything logs
public class DebugManager : Singleton<DebugManager>

[DefaultExecutionOrder(-900)]   // Prefab lookups needed by everything
public class SaveLoadManager : Singleton<SaveLoadManager>

[DefaultExecutionOrder(-100)]   // Core gameplay systems
public class EconomyManager : Singleton<EconomyManager>
public class UIManager : Singleton<UIManager>

[DefaultExecutionOrder(0)]      // Default — most MonoBehaviours
```

**Rule:** Only add execution order when Awake-time dependencies exist. Most scripts don't need it — Start() already runs after all Awake calls.

---

## Folder Structure

Numbered for Unity project panel sorting. One-liner purpose per folder.

```
Scripts/phase-All/                      → "shared scripts that grow across phases — never duplicated"
├── 0-Core/
│   ├── Singleton.cs                    → "generic singleton base — first instance wins"
│   └── GameEvents.cs                   → "core events shared across ALL phases"
├── 1-Managers/
│   ├── UIManager.cs                    → "reports menu state + closes all panels + routes keyboard with priority"
│   └── EconomyManager.cs              → "owns currency"
├── 2-Data/
│   └── Enums/
│       └── GlobalEnumsAll.cs           → "TagType enum — Unity tags as enum, grows across phases"
├── 3-MonoBehaviours/
│   └── Physics/                        → "inherited base classes for physics objects (if needed)"
├── 4-Utils/
│   └── Utils.cs                        → "shared extensions (HasTag, SetTag, .map(), .gc<T>(), TimeSince/TimeUntil)"
├── 6-Shaders/                          → "centralized shader/material guides (if needed)"
└── 7-3D/                              → "centralized MODEL.md, ANIM.md, WORLD.md — grows per phase"

Scripts/phase-X/
│
├── _-Systems/                  → "PRIMARY — where the main code lives"
│   └── XxxSystem/              → "self-contained feature: ALL code for one system"
│       ├── SO_XxxDef.cs        → "config blueprint — only fields, zero methods"
│       ├── Field_Xxx.cs        → "display only — SetData/SetState, no onClick"
│       ├── WXxx.cs             → "wraps SO_ with mutable session state"
│       ├── XxxDataService.cs   → "collection service — Build/Get/Add/Remove/Snapshot"
│       ├── XxxOrchestrator.cs  → "wires Field_ to DataService, AddListener"
│       ├── XxxUI.cs            → "SubManager — open/close one UI panel (isFirstEnable)"
│       ├── Interface/          → "contracts this system OWNS — portable with the system"
│       ├── Bridge/             → "bridges that push runtime context TO this system"
│       ├── ...BaseSub/         → "subclasses of a base class (e.g. ToolBaseSub/)"
│       ├── Test.md             → "vertical slice test for this system"
│       └── Dependency.md       → "what this system imports, implements, owns"
│
├── 0-Core/                     → "GameEvents.cs (partial per phase) — nothing else"
│
├── 1-Managers/                 → "ONLY singletons NOT tied to any _-Systems/ feature (RARE)"
│
├── 2-Data/                     → "ONLY shared cross-system items (RARE)"
│   ├── Interface/              → "cross-system contracts NOT owned by any single system"
│   └── Enums/                  → "one GlobalEnumsX.cs per phase — all enums (no raw string tags)"
│
├── 3-MonoBehaviours/           → "ONLY scene logic not belonging to any system (RARE)"
│
├── 4-Utils/                    → "PhaseXLOG.cs only — snapshot formatters for DataService collections"
│   └── PhaseXLOG.cs            → "I format data collections to JSON for logging"
│
└── 5-Tests/                    → "standalone tests not inside a _-Systems/ folder"
    └── Manual/                 → ".md test guides for visual/hands-on verification"
```

**The rule: if a script belongs to a feature system, it goes INSIDE `_-Systems/XxxSystem/`.** The numbered folders (1-Managers/, 2-Data/, 3-MonoBehaviours/) are ONLY for scripts you are POSITIVELY CERTAIN don't belong to any system — this is RARE.

**80% rule (ENFORCED): at least 80% of scripts in any phase (excluding phase-All) MUST live inside `_-Systems/`.** The remaining ≤20% are shared infra only (GameEvents partial, PhaseXLOG, shared enums, cross-system interfaces). If a phase has fewer than 80% inside `_-Systems/`, audit every file outside it — most belong to a system.

### Key Principles

- **`_-Systems/` is where the main code lives.** SO_, Field_, DataWrapper, DataService, Orchestrator, SubManager, Interface, Bridge — all go INSIDE the system folder. The system is self-contained: read one folder and understand the whole feature.
- **Numbered folders are RARE shared infrastructure.** `0-Core/` = GameEvents only. `2-Data/Enums/` = shared enums. `2-Data/Interface/` = cross-system contracts not owned by any system. `3-MonoBehaviours/` = scene logic that genuinely doesn't belong to any system (rare — inherited base classes in phase-All are the main case). `4-Utils/` = only PhaseXLOG.cs.
- **Everything testable via `new` is pure C#.** DataWrapper, DataService, Entities are plain C# classes inside their system folder. Only `SO_` (inherits ScriptableObject) and `Field_` (inherits MonoBehaviour) have Unity dependency.
- **SubManagers live INSIDE their system.** ShopUI goes in `_-Systems/ShopUISystem/`, not in a separate `1-Managers/SubManager/` folder. Only put a SubManager outside if it doesn't belong to any feature.
- **All utility code lives in phase-All/4-Utils/Utils.cs.** No per-phase UtilsPhaseX.cs. Per-phase 4-Utils/ only has PhaseXLOG.cs for snapshot formatting.

### Why This Structure

**System-first, with shared infra in numbered folders.** Most Unity projects do `Scripts/Shop/`, `Scripts/Player/` — grouping by topic but scattering data/logic/UI across folders. This structure puts **everything for one feature in one folder** (`_-Systems/XxxSystem/`) while keeping truly shared infrastructure (GameEvents, enums, base classes) in numbered folders.

**What's strong:**
- `_-Systems/` self-containment — read one folder, understand the whole feature. Copy one folder, it compiles.
- Data independence — DataService, DataWrapper, Entities inside a system are testable via `new`, zero scene.
- Numbered folders for shared infra — Unity project panel shows dependency order visually.
- Natural MVP: Field_ = View, DataService = Model, Orchestrator = Presenter, SubManager = Controller.

**What to watch:**
- A system folder with 15+ files needs subfolders (`Field_/`, `SO_/`, `...BaseSub/`).
- Interfaces shared by 3+ systems may move to `2-Data/Interface/` instead of staying in one system.

### Where Does It Go?

```
FIRST QUESTION: Does it belong to a feature system?
  → YES (almost always) → _-Systems/FeatureName/
    SO_, Field_, DataService, DataWrapper, Orchestrator, SubManager,
    Interface/, Bridge/, Entities, Test.md, Dependency.md
    — ALL go inside the system folder.

ONLY if it does NOT belong to any specific system (RARE):
Is it a partial GameEvents extension?       → 0-Core/
Is it a shared cross-system interface?      → 2-Data/Interface/
Is it a phase enum (TagType, etc.)?         → 2-Data/Enums/GlobalEnumsX.cs
Is it a shared base class (Physics/)?       → phase-All/3-MonoBehaviours/
Is it a PhaseXLOG snapshot formatter?       → 4-Utils/
Is it a standalone test?                    → 5-Tests/
Is it a singleton used by ALL systems?      → phase-All/1-Managers/
```

**Default answer = `_-Systems/`.** Ask "does this belong to a system?" first. The numbered folders are the exception, not the rule. Remember the **80% rule** — only place a script outside `_-Systems/` when you are positively certain it doesn't belong to ANY system.

### Manager vs MonoBehaviour — The `Singleton<T>` Rule

**If a script extends `Singleton<T>`, it goes in `1-Managers/`.** No exceptions. This takes precedence over PhaseMap.md listings.

The deciding question: **"Does this script own shared state that other scripts query?"**

| Goes in `1-Managers/` | Goes in `3-MonoBehaviours/` |
|---|---|
| Extends `Singleton<T>` | Does NOT extend `Singleton<T>` |
| Other scripts read its state (`.Ins.GetX()`) | Only manages its own GO |
| One instance in the scene | Multiple instances allowed |

**Common mistake:** PhaseMap.md may list a singleton under `3-MonoBehaviours/` because the file list was written before folder rules were finalized. **Always cross-check against this rule.** GOAL.md is the authority — PhaseMap is the roadmap.

---

## Naming

### Prefix / Field Conventions

| Kind | Convention | Example |
|------|-----------|---------|
| ScriptableObject | `SO_` prefix | `SO_ItemDef`, `SO_Category` |
| Display-only prefab handle | `Field_` prefix | `Field_Item`, `Field_Slot` |
| DataWrapper | `W` prefix | `WItem`, `WQuest` |
| Interface | `I` prefix | `IInteractable`, `IDamageable` |
| Dictionary lookups | `DOC__` prefix | `DOC__category_wItem`, `DOC__Slot__Field` |
| List/collection fields | `ALL_CAPS` | `CATEGORY`, `ITEM_DEF`, `SLOT` |
| `[SerializeField]` fields | `_` prefix, always private | `[SerializeField] float _defaultValue` |
| Private non-serialized | `camelCase` | `money`, `isAnyMenuOpen`, `xRot` |
| Boolean fields | `is` prefix | `isFirstEnable`, `isDead`, `isLockedCurr` |
| Constants | `CONSTANT_CASE` | `HOTBAR_SIZE`, `TOTAL_SIZE` |
| Event handlers | `Handle...` | `HandleMoneyChanged` |
| GameEvents | `On...` + `Raise...` side by side | `OnMoneyChanged` / `RaiseMoneyChanged()` |
| Singleton access | `.Ins` | `Singleton<EconomyManager>.Ins` |

**Prefix = no logic.** `SO_` = pure data. `Field_` = display only. `W` = session wrapper. No prefix = has logic.

### Class / Type Naming Suffixes

| Kind | Suffix/Prefix | Example |
|------|--------------|---------|
| Base class | `Base` prefix | `BaseHeldTool`, `BasePhysicsObject` |
| Manager (Singleton) | `Manager` suffix | `EconomyManager`, `UIManager` |
| SubManager (UI panel) | `UI` suffix | `ShopUI`, `InventoryUI`, `SettingsUI` |
| DataService | `DataService` suffix | `ShopDataService`, `InventoryDataService` |
| Orchestrator | `Orchestrator` suffix | `ShopUIOrchestrator`, `InventoryOrchestrator` |
| Bridge | `Bridge` suffix | `ItemEquipBridge`, `CamContextBridge` |
| System folder | `System` or feature name | `ToolSystem/`, `MiningSystem/`, `ShopUISystem/` |
| Extension class | `Ext` suffix (co-located) | `SO_ItemDefExt` (in same file as `SO_ItemDef`) |

### Method Naming Patterns

| Prefix | Meaning | Return | Example |
|--------|---------|--------|---------|
| `Get...` | Read/query data | value | `GetMoney()`, `GetCategories()` |
| `Set...` | Write/assign data | void | `SetData()`, `SetState()` |
| `Try...` | Attempt action (may fail) | bool | `TryAdd()`, `TryMerge()` |
| `Can...` | Check capability | bool | `CanAfford()`, `CanStack()` |
| `Is...` | Check state | bool | `IsNewlyUnlocked()`, `IsEmpty()` |
| `Should...` | Policy predicate | bool | `shouldCategoryBeHiddenInView()` |
| `Has...` | Ownership check | bool | `HasTag()`, `HasItem()` |
| `Toggle...` | Flip state | void | `ToggleNoclip()` |
| `Handle...` | Event handler (callback) | void | `HandleMoneyChanged()` |
| `Perform...` | Execute action | void | `PerformAttack()` |
| `Raise...` | Fire GameEvent | void | `RaiseMoneyChanged()` |
| `Build...` | Initialize collections | void | `BuildCategories()`, `BuildSlots()` |
| `Refresh...` | Update UI after mutation | void | `RefreshAllRequired()`, `RefreshSlot()` |

### Capitalization Summary

| Scope | Convention | Example |
|-------|-----------|---------|
| Class / Interface | PascalCase | `ShopDataService`, `IInteractable` |
| Method | PascalCase | `GetMoney()`, `BuildCategories()` |
| Enum name | PascalCase | `InteractionType`, `TagType` |
| Enum value | **camelCase** (CRITICAL) | `TagType.grabbable`, `PieceType.ore` |
| `[SerializeField]` | `_camelCase` | `_speed`, `_playerCam` |
| Private field | camelCase | `money`, `isFirstEnable` |
| Local variable | camelCase | `field`, `wItem`, `category` |
| List field | CONSTANT_CASE | `CATEGORY`, `SLOT`, `CARTITEM` |
| Dictionary field | `DOC__key_value` | `DOC__category_wShopItem` |
| Constant | CONSTANT_CASE | `HOTBAR_SIZE` |
| Static config constant | `CONSTANT_CASE` on DataService | `public static int HOTBAR_SIZE = 5;` |

### File Naming Rules

- **Unity 6000.3 rule: filename MUST match classname** for any MonoBehaviour added via inspector. Unity's Add Component search only indexes classes whose name matches the `.cs` filename.
- MonoBehaviours added via code (`AddComponent<T>()`) don't need this.
- Non-MonoBehaviours (interfaces, entities, DataService) CAN share a file.
- One class per file is the default. Share a file only when types are tiny AND tightly coupled (e.g. SO_ + SO_Ext in same file).

**TagType enum — no raw string tags.** Unity tags go in `TagType` enum (inside `phase-All/2-Data/Enums/GlobalEnumsAll.cs`). Never use `CompareTag("string")` or `tag = "string"`. Use extension methods:
- `collider.HasTag(TagType.X)` — replaces `CompareTag("X")`
- `gameObject.SetTag(TagType.X)` — replaces `tag = "X"`
- New tags added to the enum as phases grow

---

## Script Structure

`#region` blocks. Every class, method, interface, and enum gets a **beginner-friendly summary + inline flow markers**.

**All summaries are reference-only** — you read them while typing to understand the flow. You do NOT type them. When hand-typing, keep your own one-liner.

**`#region` order (MANDATORY — match hand-typed code exactly):**

```
#region Inspector Fields       ← [SerializeField] refs (MonoBehaviours only)
#endregion
#region private API            ← runtime state + internal helpers (combined into one region)
#endregion
#region Public API             ← or subdivide: #region IInventoryItem, #region IInteractable
#endregion
#region Extra                  ← // nice-to-have: features — typed last, skippable
#endregion
#region Unity Life Cycle       ← Awake, Start, OnEnable, Update, etc. — LAST
#endregion
```

**`#region` style rules:**
- No blank lines between `#endregion` and next `#region`
- **`private API` combines fields + helpers** — don't split into separate "Private Fields" and "Private API" regions. The hand-typed code uses a single `#region private API` for both.
- **Multi-interface classes:** replace generic "Public API" with **per-interface regions**: `#region IInventoryItem`, `#region IInteractable`, `#region ISaveLoadableObject`. Each interface gets its own region.
- **Domain subdivisions** inside private API are allowed: `#region private API — pickup / equip / drop`
- **Region suffix annotations** explain WHO uses it or WHAT domain: `#region public API — Owner chain (read by tools, orchestrator, camera)`, `#region Protected State — subclasses use ownerCam for raycast`, `#region Tool Actions — virtual, subclasses override`
- `#region Extra` holds `// nice-to-have:` features — typed last, skippable
- `#region Nested Type` for nested types inside their parent class
- `#region snapShot` for DataService's `GetSnapShotForTest()` method
- `#region constructor` for DataWrapper/entity constructors
- `#region extension` for extension classes co-located in the same file
- `#region constants` for public const fields in base classes (e.g. `public const float STANDARD_LINEAR_DAMPING = 0.2f;`)

**When to OMIT regions entirely:**
- Pure data classes with only public fields and no methods (e.g. `InventorySlot`, `CartItem`) — too small for regions
- Interfaces (just the method signatures)
- Enum files
- Tiny scripts under ~20 lines

**Base class inheritance `#region` additions:**
- `#region Protected State` — fields subclasses READ (e.g. `protected Camera ownerCam;`)
- `#region Protected Write` — fields subclasses SET (e.g. `protected string toolName { set => _name = value; }`)
- These go between Inspector Fields and private API.

**DataService-specific `#region` order** (different from MonoBehaviours):
```
#region private API            ← collection fields (CATEGORY, DOC__x_y, etc.)
#endregion
#region Nested Type            ← public nested entity classes (CartItem, etc.)
#endregion
#region public API             ← Build, Get, Add, Remove, boolean questions
#endregion
#region snapShot               ← GetSnapShotForTest() calling PhaseXLOG
#endregion
```

### Class Summary — conversation-style, first person "I"

**Short form (simple scripts, SubManagers, Field_):**
```csharp
/// <summary>
/// reports menu state + closes all panels + routes keyboard input with priority
/// </summary>
public class UIManager : Singleton<UIManager>
```

**Full narrative form (complex MonoBehaviours, Orchestrators, base classes):**
```csharp
/// <summary>
/// I'm the main player controller — I handle WASD movement, sprinting, ducking, jumping,
/// slope sliding, gravity, and noclip fly mode (V key). I'm a Singleton so tools and other
/// systems access my camera, ViewModelContainer, and HoldPosition via Owner chain properties.
/// I subscribe to OnMenuStateChanged to freeze input when any menu is open.
///
/// Who uses me: Every tool (via Owner chain), PlayerCamera (bob speed), PlayerGrab (camera ref).
/// Events I subscribe to: OnMenuStateChanged (freeze/unfreeze input).
/// </summary>
public class PlayerMovement : Singleton<PlayerMovement>
```

### Method Summary — 2-line English explaining what happens inside + `// →` inline steps

**Which methods MUST have `/// <summary>`:**
- All public methods on DataService, Managers, base classes — callers need to understand the full effect
- Interface implementation methods — document what this specific implementation does
- Extension methods and utility methods — document what they replace or simplify
- Unity lifecycle methods (Start, Update, OnEnable) — explain what THIS script does in the hook
- Complex private methods with non-obvious logic

**Which methods can skip `/// <summary>` (use `// →` inline markers instead):**
- Simple one-liner getters: `public float GetMoney() => currMoney;` — name is self-documenting
- Field_ setter methods: `public void SetData(...)` — name + params tell the story
- Short private helpers under 5 lines — `// →` inside the body suffices
- Lambdas and inline event handlers

**Public methods** — slightly more comprehensive (external callers need to understand the full effect):
```csharp
/// <summary> [2-line explanation of the full effect — what happens inside,
/// not just the method name being called. Include side effects, events fired, state changes]. </summary>
public void DoThing(Param param)
{
    // → [describe what actually happens at this step]
    ...
    // → [describe next logical step]
    ...
}
```

**Private methods** — same pattern, describes what actually happens:
```csharp
/// <summary> [2-line explanation of internal logic — what it computes, spawns, fires, modifies.
/// If a method call does 5 things, list those 5 things]. </summary>
void InternalStep(Vector3 position)
{
    // → [step 1]
    ...
    // → [step 2]
    ...
}
```

### Interface Summary — Owner/Implementor/Caller Format

Every interface gets a `<summary>` documenting ownership and both sides of the contract:

```csharp
/// <summary>
/// "[Headline metaphor]" — [plain English what this interface represents].
/// [SystemName] (Phase X) OWNS this interface ([emoji] [Shape]).
/// Implementors: [ClassName] (Phase X).
/// Callers: [Class1], [Class2], [Class3] (Phase Y).
/// </summary>
public interface IProcessIdentity
{
    ResourceType GetResourceType();
    PieceType GetPieceType();
    bool GetIsPolished();
    void Delete();
}
```

**Narrative variant (complex interfaces with decoupling rationale):**
```csharp
/// <summary>
/// Contract for anything that can sit in an inventory slot — tools, building crates, future items.
/// InventoryDataService stores IInventoryItem (not BaseHeldTool), so the inventory system is
/// decoupled from the tool hierarchy. A test can create a mock IInventoryItem without needing
/// BaseHeldTool, PlayerMovement, Rigidbody, or any MonoBehaviour.
///
/// Who implements me: BaseHeldTool, BuildingCrate (Phase D), any future storable item.
/// Who uses me: InventoryDataService (InventorySlot.item), InventoryOrchestrator.
/// </summary>
public interface IInventoryItem
```

**Mandatory fields in interface summary:**
- Headline metaphor in quotes OR plain English design intent (why this interface exists)
- Which system OWNS (defines) this interface + its shape emoji
- Who IMPLEMENTS it (with phase number)
- Who CALLS `GetComponent<IXxx>()` or receives it via event/bridge (with phase number)
- **Decoupling rationale** — what dependencies this interface AVOIDS (optional but recommended)

### Enum Summary — what each value means in context

```csharp
/// <summary> [What this enum represents] — [who checks it] uses this to [purpose].
/// [Value1] = [meaning]. [Value2] = [meaning]. [Who subscribes] to [which event]
/// and [what changes] based on this. </summary>
public enum MyState
{
    Normal = 0,
    Limited = 1,
    Blocked = 2
}
```

### Unity Lifecycle Methods — ALSO get summaries

Start, Update, Awake, OnEnable, OnDisable, OnCollisionEnter, OnTriggerEnter, OnDestroy, FixedUpdate — **every lifecycle method gets a 2-liner summary** explaining what it does in context. Don't just say "called by Unity" — explain what this specific script does in this hook.

```csharp
/// <summary> Every frame: [what this script specifically does in Update — input, state checks,
/// movement, visual updates, etc.]. </summary>
private void Update()

/// <summary> When something [collides/enters trigger]: [what this script checks and does —
/// filters, thresholds, resulting actions]. </summary>
private void OnCollisionEnter(Collision collision)
```

### Inline Flow Markers — `// →` inside method body

Every logical step inside a method gets a `// →` comment describing **what actually happens at that point** — not just the method name being called, but what it does.

```csharp
/// <summary> [2-line summary of full method behavior]. </summary>
public void ProcessItem(float delay = 2f)
{
    // → detach from holder so it stops affecting this item
    if (CurrentHolder != null) CurrentHolder.Release(Rb);
    // → tag so other triggers skip this item
    gameObject.tag = "MarkedForDestruction";
    // → after delay: add value to economy, fire event for tracking, return to pool
    StartCoroutine(DelayThenProcess(delay));
}
```

### Block Delimiters — `// >> text` / `// << text`

For multi-step logical blocks within a method (especially Orchestrators), wrap with `// >>` / `// <<` delimiters to mark where a conceptual block starts and ends:

```csharp
void CreateAndOrchestrateCartItemFields(WShopItem wShopItem)
{
    // create >>
    var cartItem = shopDataService.TryAddNewCartItem(wShopItem);
    if (DOC__CartItem__Field.ContainsKey(cartItem)) { return; }
    var fieldCartItem = GameObject.Instantiate(_pfCartItem, _cartItemContainer).gc<Field_ShopCartItem>();
    DOC__CartItem__Field[cartItem] = fieldCartItem;
    // << create

    // Orchestrate >>
    fieldCartItem._qtyInputField.onEndEdit.AddListener(str => { ... });
    fieldCartItem._removeButton.onClick.AddListener(() => { ... });
    // << Orchestrate
}
```

**Also used in GameEvents:** `// when X >>` / `// << when X` wraps each event+Raise pair.

### Multiline SerializeField Grouping

When multiple fields share the same type, group them under ONE `[SerializeField]` attribute with the type on a separate line:

```csharp
[SerializeField]
Color
    _canAffordColor = Color.limeGreen,
    _cannotAffordColor = Color.red * 0.8f,
    _selectedTabColor = new Color(0.3f, 0.6f, 1f),
    _normalTabColor = new Color(0.2f, 0.2f, 0.2f);
```

Reduces visual noise when you have 4+ fields of the same type. Single fields stay on one line: `[SerializeField] float _speed;`

Nested types go inside the class that owns them.

---

## Minimal Methods

**Top priority.** Every script typed by hand — fewer methods = less to type, less to break.

- **Public API:** only expose what another script absolutely needs to call
- **Private methods:** only create when logic is reused or genuinely needs isolation — otherwise inline it
- **Don't over-fragment.** If a 5-line block is used once, keep it inline.

**Target method counts by script type:**
```
SubManager:      0-1 public (lifecycle only), 0 private
Orchestrator:    1-3 public (Init, Build, Rebuild), 3-6 private (only what's needed)
DataService:     2-5 public (Build, Get, Add, Remove, Snapshot), 0-2 private
Field_:          1-3 public (SetData, SetState), 0 private
Manager:         2-4 public (Get, Add, Can), 0-2 private
MonoBehaviour:   0 public (ideally), 1-4 private handlers
```

---

## Class Responsibilities — Pure Purpose with Live Code

Every role has ONE pure purpose. The code below is from actual hand-typed files — this is the standard.

### `SO_` — Pure Data Blueprint (_-Systems/XxxSystem/)

**Pure purpose:** Inspector-editable config. **Only public fields. Zero methods. Zero logic.**

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

If the original source has helper methods on an SO (e.g. `GetPrefab()`, `GetType()`), move them to the **consumer** (DataService, Orchestrator, or Utils.cs in phase-All). The SO just exposes public fields.

**DIP Exception:** When an SO_ needs to delegate to an interface provider (e.g. `IShopItemProvider`), it may have simple getter methods that check a provider and fall back to own fields. This is a valid pattern — the SO still has NO business logic, just delegation:

```csharp
[CreateAssetMenu(menuName = "SO/SO_ShopItemDef", fileName = "SO_ShopItemDef")]
public class SO_ShopItemDef : ScriptableObject
{
    [SerializeField] string _itemDefName;
    [SerializeField] float _defaultPrice;
    // ... fields ...

    [Header("External Provider (DIP — caller-defines pattern)")]
    [Tooltip("Drag any SO that implements IShopItemProvider")]
    [SerializeField] Object _externalProvider;
    [SerializeField] bool _useExternalProvider;

    #region public API
    public string GetName()
    {
        if (_useExternalProvider && _externalProvider is IShopItemProvider p)
            return p.GetItemName();
        return _itemDefName;
    }
    public float GetDefaultPrice() => _defaultPrice;
    #endregion
}
```

**When to use DIP variant:** The SO has [SerializeField] private fields with `Get...()` accessors, AND optionally delegates to an interface. This keeps the SO's fields private (encapsulated) while providing clean read access. Both patterns are valid — choose based on whether the SO needs delegation or is truly just public data.

### `Field_` — Display Only (_-Systems/XxxSystem/)

**Pure purpose:** Set UI visuals. `SetData()` / `SetButtonInteractable()` — sets `.text`, `.color`, `.sprite`, `.interactable`. **Nothing else. No onClick. No logic. No singleton access.**

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

The Button is a **public ref** — Orchestrator reads it to `AddListener`. Field_ never wires its own clicks.

### `W` — DataWrapper (_-Systems/XxxSystem/)

**Pure purpose:** Wrap an SO with mutable session state. **SO = what it IS. W = what happened to it.**

```csharp
public class WShopItem
{
    public SO_ShopItemDef itemDef;
    public bool isLockedCurr;
    public int timesPurchased = 0;

    #region constructor
    public WShopItem(SO_ShopItemDef itemDef)
    {
        this.itemDef = itemDef;
        isLockedCurr = itemDef.isDefaultLocked;
        timesPurchased = 0;
    }
    #endregion

    #region public API
    public bool IsNewlyUnlocked() => ((isLockedCurr == false) && timesPurchased == 0) && (itemDef.isDefaultLocked == true);
    #endregion
}
```

Minimal API. The constructor copies default state from the SO. One-liner helpers only.

### DataService (_-Systems/XxxSystem/) — **EVERY collection lives here**

**Pure purpose:** Purely C# Collection Service. `Build + Get + Add + Remove + boolean questions + snapshot`. **Every `List<T>` and `Dictionary<K,V>` in the system belongs in a DataService, not in a MonoBehaviour.**

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

    // boolean questions about data
    public bool shouldCategoryBeHiddenInView(SO_ShopCategory category)
    {
        return (category.hideIfAllItemsLocked) && DOC__category_wShopItem[category].all(w => w.isLockedCurr);
    }
    public float GetCartTotalPrice() => CARTITEM.sum(ci => ci.wShopItem.itemDef.defaultPrice * ci.qty);
    public bool CanAffordCartItems() => GetCartTotalPrice() <= Singleton<EconomyManager>.Ins.GetMoney();
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

**Key patterns:**
- **`ALL_CAPS`** for List fields: `CATEGORY`, `CARTITEM`
- **`DOC__x_y`** for Dictionary fields: `DOC__category_wShopItem`
- **Nested types** inside DataService: `CartItem`
- **`#region snapShot`** calls PhaseXLOG for EVERY collection
- **Boolean questions**: `shouldCategoryBeHiddenInView`, `CanAfford` — pure logic, testable
- **`.map()`, `.find()`, `.all()`, `.sum()`** — SPACE_UTIL extensions reduce verbosity

**RULE: If a MonoBehaviour has ANY `List<T>` or `Dictionary<K,V>` that could be tested via `new`, extract it into a DataService.** Don't leave collections buried in Managers or MonoBehaviours.

Common candidates:
- **Collection management** — any `List<T>` / `Dictionary<K,V>` with Build/Get/Add/Remove operations
- **Lookup/query** — descriptions by type, progress by ID, headers by path
- **Formatting** — colored strings, money formatting, requirement text
- **Validation** — placement checks (pure math), afford checks, requirement checks

**When NOT to create a DataService — keep in MonoBehaviour:**
- Operations need Unity physics (Rigidbody, AddForce, OverlapSphere)
- Operations need Unity lifecycle (Update, FixedUpdate, Destroy, Instantiate)
- Data is transient frame state (velocity, counters) not a persistent collection

### PhaseXLOG (4-Utils/) — **ONE LOG method per collection**

**Pure purpose:** Snapshot-format each collection to JSON for test logging. **Every collection in the DataService gets its own LOG method.**

```csharp
public static class PhaseALOG
{
    public static string LIST_CATEGORY__TO__JSON(List<SO_ShopCategory> CATEGORY)
    {
        var snapshot = CATEGORY.map(category => new
        {
            category.categoryName,
            category.hideIfAllItemsLocked,
            sprite = category.sprite.name,
            ITEM_DEF = category.ITEM_DEF.map(def => new
            {
                def.itemDefName,
                def.defaultPrice,
                def.isDefaultLocked,
            }),
        });
        return snapshot.ToNSJson(pretify: true);
    }
    public static string DOC_CATEGORY_ITEM__TO__JSON(Dictionary<SO_ShopCategory, List<WShopItem>> DOC)
    {
        var snapshot = DOC.map(kvp => new
        {
            kvp.Key.categoryName,
            ITEM_DEF = kvp.Value.map(wItem => new
            {
                wItem.itemDef.name,
                wItem.isLockedCurr,
                wItem.timesPurchased,
            }),
        });
        return snapshot.ToNSJson(pretify: true);
    }
    public static string LIST_CARTITEM__TO__JSON(List<ShopDataService.CartItem> CARTITEM)
    {
        var snapshot = CARTITEM.map(cartItem => new
        {
            cartItem.wShopItem.itemDef.name,
            cartItem.qty,
        });
        return snapshot.ToNSJson(pretify: true);
    }
}
```

**Naming:** `LIST_X__TO__JSON` for lists, `DOC_X__TO__JSON` for dictionaries. All use `.map()` to anonymous type + `.ToNSJson(pretify: true)`. DataService's `GetSnapShotForTest()` calls ALL LOG methods with `=` header.

### Utils.cs (phase-All/4-Utils/) — **Single static class, grows across phases**

**Pure purpose:** All utility extensions + static helpers in ONE file in `phase-All/`. No per-phase UtilsPhaseX.cs. Grouped by `#region` per domain.

```csharp
public static class Utils
{
    #region Money
    public static string formatMoney(this float money) => $"${money:#,##0.00}";
    public static string formatMoneyShort(this float money) => $"${money:#,##0.##}";
    #endregion
    #region Physics
    public static void IgnoreAllCollisions(GameObject goA, GameObject goB, bool ignore) { ... }
    public static void SimpleExplosion(Vector3 center, float radius, float force) { ... }
    public static void SetLayerRecursively(GameObject go, int layer) { ... }
    #endregion
    #region Random
    public static T WeightedRandomPick<T>(List<T> list, Func<T, float> weightSelector) { ... }
    #endregion
}
```

**RULE: All reusable utility code goes in phase-All/4-Utils/Utils.cs.** If logic appears in 2+ scripts across ANY phase, add a `#region` section here. Each phase grows Utils.cs by adding new regions. Per-phase 4-Utils/ only has `PhaseXLOG.cs` for snapshot formatting — nothing else.

### Orchestrator (_-Systems/XxxSystem/) — Wires Field_ to DataService

**Pure purpose:** Instantiate Field_ prefabs, `AddListener`, Destroy. Reads from DataService. Refreshes on events only — **never `Update()`**.

```csharp
public class ShopUIOrchestrator : MonoBehaviour
{
    #region Inspector Fields
    [SerializeField] Transform _categoryContainer, _shopItemContainer, _cartItemContainer;
    [SerializeField] GameObject _pfCategory, _pfShopItem, _pfCartItem;
    [SerializeField] Button _purchaseButton;
    #endregion

    #region private API
    ShopDataService shopDataService;
    // DOC__ tracks data↔Field_ mapping for refresh/destroy
    Dictionary<SO_ShopCategory, Field_ShopCategory> DOC__Category__Field = new();
    Dictionary<ShopDataService.CartItem, Field_ShopCartItem> DOC__CartItem__Field = new();

    void RepopulateShopItemsView()
    {
        this._shopItemContainer.destroyLeaves(); // clear old Field_ instances

        foreach (var wShopItem in shopDataService.GetWShopItems(selectedCategory))
        {
            var field = GameObject.Instantiate(_pfShopItem, _shopItemContainer).gc<Field_ShopItem>();
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
        // event-driven: called after EVERY data mutation, never in Update()
        _cartTotalPriceText.text = shopDataService.GetCartTotalPrice().formatMoney();
        _purchaseButton.interactable = shopDataService.CanAffordCartItems();
    }
    #endregion

    #region public API
    public void InitBuildOrchestrateAndSubscribe(ShopDataService shopDataService, List<SO_ShopCategory> CATEGORY)
    {
        this.shopDataService = shopDataService;
        RefreshAllRequired();
        BuildAndOrchestrateCategoryView();
        OrchestratePurchaseButton();
        SubscribeMoneyAndItemUnlock();
    }
    #endregion
}
```

**Key Orchestrator patterns:**
- **`DOC__X__Field`** — Dictionary mapping data → Field_ instance (for refresh/destroy)
- **`.destroyLeaves()`** — clear container before repopulating
- **`.gc<T>()`** — GetComponent after Instantiate
- **`AddListener`** — ONLY lives in Orchestrator, never in Field_
- **`RefreshAllRequired()`** — called after every data mutation (event-driven, not polling)
- **`// create >>` / `// << create`** and **`// Orchestrate >>` / `// << Orchestrate`** comment blocks

### Managers (1-Managers/)

**Pure purpose:** Singleton MonoBehaviour. Owns one domain's state. Minimal query API.

```csharp
[DefaultExecutionOrder(-100)]
public class EconomyManager : Singleton<EconomyManager>
{
    [SerializeField] float _defaultMoney = 400f;

    #region private API
    float money = 0f;
    #endregion

    #region public API
    public float GetMoney() => money;
    public void AddMoney(float deltaMoney) { money += deltaMoney; GameEvents.RaiseMoneyChanged(money); }
    public bool CanAfford(float price) => price <= money;
    #endregion

    #region Unity Life Cycle
    protected override void Awake() { base.Awake(); money = _defaultMoney; }
    #endregion
}
```

3 public methods. That's it. `GetMoney()`, `AddMoney()`, `CanAfford()`.

### SubManagers (_-Systems/XxxSystem/)

**Pure purpose:** Open/close one UI panel + init only. Creates DataService on first enable. Zero business logic.

```csharp
public class ShopUI : MonoBehaviour
{
    [SerializeField] List<SO_ShopCategory> _CATEGORY;
    [SerializeField] ShopUIOrchestrator _orchestrator;

    ShopDataService shopDataService = new ShopDataService();

    bool isFirstEnable = true;
    private void OnEnable()
    {
        if (isFirstEnable)
        {
            shopDataService.BuildCategories(this._CATEGORY);
            this._orchestrator.InitBuildOrchestrateAndSubscribe(shopDataService, this._CATEGORY);
            GameEvents.OnOpenShopView += () => this.gameObject.SetActive(true);
            GameEvents.OnCloseShopView += () => this.gameObject.SetActive(false);
            this.gameObject.SetActive(false);
            isFirstEnable = false;
        }
        GameEvents.RaiseMenuStateChanged(isAnyMenuOpen: true);
    }
    private void OnDisable() => GameEvents.RaiseMenuStateChanged(isAnyMenuOpen: false);
}
```

SubManager owns the DataService instance. Orchestrator receives it via `Init()`.

### DEBUG_Check (5-Tests/) — Data-Level Testing

**Pure purpose:** Test DataService via `new` — zero scene, zero UI. Feed test data via `[SerializeField]`, mutate, log snapshots.

```csharp
public class DEBUG_Check : MonoBehaviour
{
    [SerializeField] List<SO_ShopCategory> _CATEGORY;

    void Start() => StartCoroutine(STIMULATE());

    IEnumerator STIMULATE()
    {
        while (true)
        {
            if (INPUT.K.HeldDown(KeyCode.LeftAlt) && INPUT.M.InstantDown(0))
            {
                ShopDataService dataService = new ShopDataService();
                dataService.BuildCategories(this._CATEGORY);
                // → add random items, mutate quantities, test edge cases
                dataService.TryAddNewCartItem(dataService.GetWShopItems(_CATEGORY[0]).getRandom());
                dataService.IncreaseCartItemQty(dataService.GetCartItems()[0], 100);
                LOG.AddLog(dataService.GetSnapShotForTest("after mutations"), "json");
                // → test negative qty removal
                dataService.IncreaseCartItemQty(dataService.GetCartItems()[0], -200);
                LOG.AddLog(dataService.GetSnapShotForTest("after negative"), "json");
            }
            yield return null;
        }
    }
}
```

**Pattern:** `[SerializeField]` feeds SO_ test data from inspector → `new DataService()` → Build → mutate → `LOG.AddLog(snapshot, "json")`. Tests edge cases (negative qty, re-add, overflow).

### MonoBehaviours (_-Systems/ or 3-MonoBehaviours/)
World objects, systems, player. Each has minimal public API (ideally zero). Most MonoBehaviours live inside their `_-Systems/` folder. Only shared base classes (e.g. `BasePhysicsObject`) go in `phase-All/3-MonoBehaviours/`.

### Tests (5-Tests/)
**Two levels of testing:**
1. **Data-level** (`DEBUG_Check`) — tests DataService by creating a plain C# `new` instance. Zero dependency.
2. **UI-level** (system-specific test scripts) — tests full UI flow with keyboard shortcuts.

Each test is independent. Lists prerequisites in summary.

---

## Decoupling

- **`GameEvents`** — static event bus. Event + Raise grouped by domain with `// when X >>` `// << when X` comment blocks.
  Each Raise calls `LogSubscribersCount()`: `[GameEvents] OnX raised for -> N subscribers`
- **Every `.Raise...()` call must have a `// purpose:` one-liner** explaining why it's fired and who listens:
  ```csharp
  // purpose: cursor lock/unlock for player controller
  GameEvents.RaiseMenuStateChanged(isAnyMenuOpen: true);
  
  // purpose: HUD updates display text
  GameEvents.RaiseResourceChanged(amount);
  ```
- **GameEvents use interfaces in signatures, NEVER concrete classes:** `Action<IInventoryItem>` not `Action<BaseHeldTool>`. This means GameEvents.cs has zero imports from any `_-Systems/` folder.
  > **⚠️ COMMON VIOLATION:** Using `Action<SO_ShopCategory>` or `Action<WItem>` instead of an interface. If an event needs to pass data FROM a system, define an interface in that system's `Interface/` folder and use it: `Action<IShopCategory>`. Concrete SO_/W types in event signatures leak system internals across boundaries.
- **Interfaces** — for abstraction (`IInteractable`, `IDamageable`)
- **Singleton reads** — only for queries (`Singleton<Manager>.Ins.GetValue()`), never cross-system commands
  **Exception:** `Singleton<UIManager>.Ins.CloseAllSubManager()` is acceptable — UIManager is the centralized panel controller.
- **Never** let Script A directly call into unrelated Script B
- **Event-driven refresh** — never poll in `Update()`. Refresh only when state changes.

### Cross-Phase File Changes

When a new phase needs to add to an existing file:

- **`GameEvents` (static class)** → use `partial class`. Each phase adds its own events in its own `0-Core/GameEvents.cs`. No modification to earlier phase's file.
- **MonoBehaviours with `[SerializeField]`** → must be **directly modified** because inspector fields can't be added via partial across files. Document in GUIDE.md exactly what to change and why.
- **Rule:** prefer `partial` extend over direct modify. Only modify when `[SerializeField]` or inheritance requires it.
- **Every phase GUIDE.md** lists modifications in a table: `| File | Change | Why |`

---

## No Defensive Null Checks

Let it crash. The crash is traceable.
Inspector refs, core singletons, `Field_` components — your responsibility to wire.
Don't hide bugs behind `?.` or `if (x != null)`.

**Exception:** `?.Invoke()` on GameEvents (events can have zero subscribers).

---

## Unity Lifecycle Order

```
Scene loads, GO is active:

  Awake()           ← once, first. Singleton registration, GetComponent caching.
      ↓
  OnEnable()        ← fires immediately after Awake (same frame).
      ↓               Fires BEFORE Start. Fires every time GO re-enables.
  Start()           ← once, after ALL Awake + OnEnable across scene.
      ↓               Safe to read other singletons. Build data, init, subscribe.
  Update()          ← every frame
  LateUpdate()      ← every frame, after all Update()
      ↓
  OnDisable()       ← fires when GO disabled (SetActive false) or destroyed
  OnDestroy()       ← fires when GO destroyed (scene unload or Destroy())

Re-enable (SetActive true):
  OnEnable()        ← fires again (Start does NOT re-run)
      ↓
  Update() resumes

Key facts:
  - Awake + OnEnable fire together BEFORE Start
  - Start runs ONCE — never again even if re-enabled
  - OnEnable fires EVERY enable (first time + every re-enable)
  - Destroy() auto-cleans onClick/UnityEvent listeners
  - SetActive(false) does NOT clean listeners

CRITICAL: execution order of Awake/OnEnable is NOT guaranteed across GOs.
  - Single component: Awake → OnEnable → Start (guaranteed for THAT component)
  - ACROSS GOs: completely unpredictable order
  - Only Start() is guaranteed to run AFTER ALL Awake+OnEnable across the entire scene
  - This is why isFirstEnable exists — safe regardless of execution order
```

### Why `isFirstEnable` — Not Awake/Start

**Problem:** Awake + OnEnable execution order across GOs is not guaranteed. If SubManager A's OnEnable fires before Manager B's Awake, referencing B crashes. Start() runs after all Awake — but Start only runs once, so you can't use it for re-enable subscribe/announce logic.

**Solution:** `isFirstEnable` flag in OnEnable. First call: do setup (subscribe, build, self-disable, return early). Subsequent calls: announce menu state. This way:
- Setup happens in OnEnable (guaranteed to fire)
- No dependency on Awake order of other GOs
- Re-enable works naturally (isFirstEnable is false, goes straight to announce)
- No Start() needed for subscriptions — everything lives in OnEnable

### SubManager Pattern — `isFirstEnable`

```csharp
bool isFirstEnable = true;
private void OnEnable()
{
    if (isFirstEnable)
    {
        // subscribe to open/close events, build data, init orchestrator
        GameEvents.OnOpenThisView += () => this.gameObject.SetActive(true);
        GameEvents.OnCloseThisView += () => this.gameObject.SetActive(false);
        this.gameObject.SetActive(false); // self-disable after setup
        isFirstEnable = false;
        return; // skip RaiseMenuStateChanged on first enable
    }
    GameEvents.RaiseMenuStateChanged(isAnyMenuOpen: true);
}
private void Update()
{
    // NOTE: replace Input.GetKeyDown with your project's input wrapper if available
    if (Input.GetKeyDown(KeyCode.Escape))
        this.gameObject.SetActive(false);
}
private void OnDisable()
{
    GameEvents.RaiseMenuStateChanged(isAnyMenuOpen: false);
}
```

### Usage Table

| Hook | Use For | Pair With |
|------|---------|-----------|
| `Awake()` | Singleton registration, `GetComponent` caching | — |
| `Start()` | Build data, init orchestrator, subscribe events, disable self | `OnDestroy()` |
| `OnEnable()` | `RaiseMenuStateChanged(true)`, event subs for toggled panels | `OnDisable()` |
| `OnDisable()` | `RaiseMenuStateChanged(false)`, unsub events | — |
| `Destroy()` | Auto-cleans onClick/UnityEvent listeners | — |

---

## C# Features (Unity 6000.3+ / .NET 2.0+)

**Allowed — use actively to reduce verbosity:**
- `$""` — string interpolation everywhere
- `?.` — null-conditional: `obj?.Method()`, `spawned?.Rb`
- `??` — null-coalescing: `result ?? fallback`
- `=>` — expression-bodied methods/properties: `public float GetValue() => BaseValue * multiplier;`
- Ternary `? :` — inline conditionals: `isDucking ? _duckSpeed : _walkSpeed`
- LINQ — `.Select()`, `.Where()`, `.Any()`, `.All()`, `.First()`, `.FirstOrDefault()`, `.Last()`, `.Count()`, `.OrderBy()`, `.GroupBy()`, `.Distinct()`, `.ToDictionary()`, `.ToList()`, `.FindAll()`
- Custom extensions — `.map()`, `.find()`, `.all()`, `.sum()`, `.gc<T>()`, `.destroyLeaves()`, `.toggle()`, `.getRandom()`, `.colorTag()`, `.repeat()`, `.ToNSJson()`, `.GetOrCreate()` from shared Utils.cs
- `var` — for obvious types

**Reduce verbosity wherever possible:**
- `if (x != null) x.DoThing()` → `x?.DoThing()` when it's a single call
- Manual `foreach` accumulation → `.sum(selector)` extension
- Keep `if (x == null) return;` guard clauses when the block does multiple things

**Not allowed:** `async/await` (use coroutines), `Span<T>`, `Memory<T>`, `ValueTuple` deconstruction

---

## Save/Load Architecture

**When the project has persistent game state (20/29 projects do), use this pattern.**

### Core Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ISaveable` | `_-Systems/SaveSystem/Interface/` | Contract — `GetSaveData()`, `LoadFromSave(string json)` |
| `SaveData` classes | `_-Systems/XxxSystem/` (alongside DataService) | Pure C# `[Serializable]` snapshot of persistent state |
| `SaveManager` | `phase-All/1-Managers/` | `Singleton<SaveManager>` — file I/O, slot management, version tracking |
| `AutoSaveManager` | `phase-All/1-Managers/` | Timer-based auto-save via coroutine |

### ISaveable Contract

```csharp
/// <summary>
/// Contract for any object that participates in save/load.
/// Who implements me: any MonoBehaviour with persistent state (machines, inventory, quests).
/// Who uses me: SaveManager iterates all registered ISaveables.
/// </summary>
public interface ISaveable
{
    string SaveID { get; }
    string GetSaveData();          // → returns JSON string of SaveData
    void LoadFromSave(string json); // → restores state from JSON
    bool ShouldBeSaved();           // → skip if default/empty state
}
```

### SaveData Pattern (Pure C# — Zero MonoBehaviour)

```csharp
[Serializable]
public class InventorySaveData
{
    public List<SlotSaveData> slots;
    public int selectedIndex;
}

[Serializable]
public class SlotSaveData
{
    public string itemDefName;  // → maps back to SO_ via lookup
    public int qty;
}
```

### SaveManager GameEvents

```csharp
// phase-{x}/0-Core/GameEvents.cs
public static partial class GameEvents
{
    // when save starts >>
    public static event Action OnSaveStart;
    public static void RaiseSaveStart() { ... }
    // << when save starts

    // when save completes >>
    public static event Action OnSaveComplete;
    public static void RaiseSaveComplete() { ... }
    // << when save completes

    // when load completes >>
    public static event Action OnLoadComplete;
    public static void RaiseLoadComplete() { ... }
    // << when load completes
}
```

### Rules

- **PlayerPrefs = settings only** (volume, keybinds, window size). Never game state.
- **JSON default** — `JsonUtility.ToJson()` for simple data, `Newtonsoft.Json` for complex hierarchies.
- **Save versioning** — `SaveManager.SAVE_VERSION` int. Increment on schema change. Migration chain: `MigrateV1ToV2()`, `MigrateV2ToV3()`.
- **SaveData ↔ DataService** — SaveData mirrors DataService collections. `GetSaveData()` snapshots, `LoadFromSave()` restores.
- **File location** — `Application.persistentDataPath + "/Saves/"`.

---

## FSM Architecture

**When the project has stateful AI, game phases, or complex UI flows (14/29 projects), use this pattern.**

### Core Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `IState` | `_-Systems/XxxSystem/Interface/` | Contract — `Enter()`, `Update()`, `Exit()` |
| State classes | `_-Systems/XxxSystem/` or `StateSub/` | One class per state, implements IState |
| `StateMachine` | `_-Systems/XxxSystem/` | Holds `currentState`, `ChangeState()` |

### IState Contract

```csharp
public interface IState
{
    void Enter();
    void Update();
    void Exit();
}
```

### StateMachine Class

```csharp
public class StateMachine
{
    private IState _currentState;

    public void ChangeState(IState newState)
    {
        _currentState?.Exit();
        _currentState = newState;
        _currentState?.Enter();
    }

    public void Update()
    {
        _currentState?.Update();
    }
}
```

### State Implementation Pattern

```csharp
public class IdleState : IState
{
    private readonly NPCController _controller;

    public IdleState(NPCController controller) => _controller = controller;

    public void Enter() { _controller.Animator.SetBool(AnimParamType.isMoving.ToString(), false); }
    public void Update()
    {
        if (_controller.HasTarget())
            _controller.StateMachine.ChangeState(new ChaseState(_controller));
    }
    public void Exit() { }
}
```

### When to Use FSM vs Alternatives

| Complexity | Pattern | Example |
|-----------|---------|---------|
| ≤3 trivial states | Enum + switch | Door (open/closed/locked) |
| 4-10 states with transitions | IState + StateMachine | NPC AI, game phases |
| 10+ states with complex trees | Consider BehaviorTree | Colony sim AI |

### Rules

- **One class per state** — never giant switch statements for 4+ states.
- **States → StateMachine only** — states call `_stateMachine.ChangeState()`, never reference other state classes.
- **Constructor injection** — states receive controller reference via constructor, not `FindObjectOfType`.
- **Exit() cleanup** — every subscription/allocation in `Enter()` MUST be cleaned up in `Exit()`.
- **Enum state IDs (optional)** — for external observation: `public StateID CurrentStateID { get; }` alongside IState.

---

## Input Architecture

**When the project uses Unity's new Input System (16/29 projects).**

### Pattern

- `InputAction` assets in `phase-All/` — shared across phases.
- One `InputReader` MonoBehaviour reads InputAction callbacks → fires GameEvents.
- Systems subscribe to GameEvents, never directly to InputAction.
- Rebinding stored via `PlayerPrefs` (settings-tier data).

```csharp
// InputReader.cs — lives in phase-All/1-Managers/
public class InputReader : Singleton<InputReader>
{
    [SerializeField] InputActionAsset _inputActions;

    private void OnEnable()
    {
        _inputActions["Move"].performed += ctx =>
            GameEvents.RaiseMoveInput(ctx.ReadValue<Vector2>());
        _inputActions["Interact"].performed += ctx =>
            GameEvents.RaiseInteractInput();
    }
}
```

---

## Third-Party Integration

**When the project uses external packages (25/29 do — DOTween, FMOD, A*Pathfinding, Cinemachine, etc.).**

### Rules

- **Wrap third-party APIs behind interfaces** — system code calls `IAudioManager.PlaySound()`, not `RuntimeManager.PlayOneShot()` directly.
- **Isolate to one system** — third-party imports confined to ONE `_-Systems/` folder. Other systems interact via interfaces/GameEvents.
- **Note in Dependency.md** — every system using a third-party library documents it: `| Third-Party | DOTween | Tween animations |`.
- **CoverageMap tracks it** — third-party wrapper coverage in CoverageMap.md.

---

## LEGO Independence

Each system works **standalone first**, connects later via GameEvents.
A script must **never** require an unfinished system to compile or run.

```
Type DataService → test with DEBUG_Check (no UI, no scene)
Type SubManager + Orchestrator → test with system-specific test (no other systems)
Type MonoBehaviour → test independently
Connect via GameEvents → full phase works
```

---

## Vertical Slice Tests

**Two levels per system:**
1. **Data-level** — test DataService logic without UI (`DEBUG_Check` — plain `new` instance, zero scene)
2. **UI-level** — test full system flow with keyboard shortcuts

**Each test must have ALL of these:**
- **Internal prerequisites** — which scripts must be typed first to compile
- **External prerequisites** — exact scene setup: which GOs, which components, what to assign in inspector
- **NOT required** — explicitly list which OTHER systems are NOT needed (proves LEGO independence)
- **Controls** — keyboard shortcuts for manual testing
- **Checklist** — pass/fail items to verify

**Each test is a standalone scene.** Create a fresh empty scene, follow the prerequisites, and the test works without any other system present. If a test requires another system to run, it's not independent — fix the architecture.

**Each Test script (.cs) must contain:**
- Summary comment with: prerequisites, NOT required, "How to test" steps, controls
- `// purpose:` on every `Raise` call and `+=` subscription
- Console logging via GameEvents subscription
- Minimal code — the test is a bootstrap. The actual system handles its own logic.
- No duplicate logic — fire GameEvents to trigger actions, never call methods directly.

**Manual Test Guides (`5-Tests/Manual/*.md`):**
When a system requires visual/hands-on verification (UI flows, 3D animations, physics, visual effects, audio), create a `.md` file in `5-Tests/Manual/` with:

- **Prerequisites** — exactly which singletons, prefabs, and test scripts must exist in the scene
- **Setup Guide** — beginner-level step-by-step Unity Editor instructions:
  - Every GO to create, what to name it, where to parent it
  - Every component to add, with exact `[SerializeField]` values and wiring (which field → which GO)
  - Prefab hierarchy: every child GO with its components, RectTransform anchors/sizes, Image colors, raycastTarget flags
  - Inspector values: defaults, ranges, layer masks, tags
  - Wiring tables: `| Field | Drag From |` format for complex components
  - Final hierarchy tree showing parent-child relationships
- **How It Works (System Flow)** — before the DO/EXPECT test steps, explain the system's **end-to-end data flow** in conversation-style plain English. This is the heart of the manual test — it teaches the reader the full architecture of the system being tested. Break it into labelled paragraphs per major action (e.g. "Scene loads:", "Tool pickup:", "Drag-drop:", "Open/close:"). Each paragraph traces the full path:
  - Which script method is called first
  - Which GameEvent fires (and which scripts are subscribed)
  - Which GOs become `SetActive(true/false)` and why
  - Which component fields change
  - Which Unity lifecycle callbacks trigger as a result
  - What the player sees on screen as the end result
  - The reader should understand the architecture by reading the manual test
- **Manual Test Flow** — numbered DO/EXPECT steps:
  - Each step: one player action (press key, wait, drag, click)
  - Each EXPECT: exactly what the screen/console should show — **bold** for visual changes, `code` for console messages
  - Also explain WHAT HAPPENS BEHIND THE SCENES for each step: which script method runs, which GameEvent fires, which GOs activate/deactivate
  - Cover: initial state → primary action → edge cases → error conditions
- **Summary Checklist** — pass/fail items at the end
- **Self-contained** — assumes zero prior knowledge. No "see GUIDE.md" shortcuts.

**The Manual/*.md must be comprehensive enough for a beginner** who has never used Unity to follow AND must teach the internal flow. It's not just "click → see result" — it's "click → this script fires → this event reaches this subscriber → this GO activates → you see this on screen."

### Common Pitfalls — Things Manual Tests MUST Warn About

> These are real bugs from production. Every Manual/*.md must check for applicable ones.

**1. SetActive Cascading** — parent disables ALL children. Any GO that must stay visible must be a **sibling**, not a child.

**2. Scene Instance vs Project Prefab** — `[SerializeField]` must reference scene instances (drag from Hierarchy), not prefab assets (drag from Project).

**3. raycastTarget on UI Elements** — ghost/overlay Images: `false`. Slot backgrounds: `true`. Icons/labels: `false`.

**4. Swap Contents Not Objects** — swap the data field, not the entire slot object — index-based properties break otherwise.

**5. Missing Layers — Silent Failure** — `LayerMask.NameToLayer("X")` returns `-1` if missing, Unity sets layer 0 with NO error.

**6. LayerMask Fields Left at "Nothing"** — defaults to 0, all raycasts/overlaps return empty → logic silently skips.

**7. Cross-Phase Mods Not Applied** — later phases add methods/fields to earlier scripts. Missing → compile error or silent failure.

**8. Dual Collider Setup** — trigger + physical on separate child GOs. Missing trigger → `OnTriggerEnter` never fires.

**9. Static Lists Surviving Domain Reload** — `static List<T>` survives between Play sessions → stale null refs on second Play.

**10. Execution Order Attributes** — `[DefaultExecutionOrder]` on managers. Removing → physics/init order bugs.

---

## Hand-Typing Order

1. `#region` blocks (empty skeleton)
2. Inspector Fields (the data shape)
3. Private fields (state)
4. Unity Lifecycle (Start, OnEnable, OnDisable)
5. Public API (only what's needed — least possible)
6. Private API (only what's needed — least possible)
7. **Compile → Test → Next script**

---

## GUIDE.md Per Phase

**GUIDE.md is beginner-friendly** — conversational voice. Written so someone who has never seen this codebase can follow it. Explains *why* each script exists, not just *what* it is.

Every phase folder has a `GUIDE.md` with:
- **What it looks like when running** (detailed, conversational — describe the player experience)
- **Folder structure** (including `_-Systems/` with one-liner purpose per file)
- **Script Purpose** — one sentence per script (if it doesn't fit one sentence, split it)
- **Hand-typing order** (compile groups with stop-and-test points)
- **Vertical Slice Tests** — beginner-friendly step-by-step for each `.cs` test:
  - Conversational intro explaining what this test proves
  - "What you need to type first" / "What you DON'T need"
  - Scene setup (numbered: create GO, add component, wire fields with `| Field | Drag From |` tables)
  - "How to test" table: `| Key | What it does | What you should see |`
  - "Full test flow" (ordered steps for complex tests: do X → expect Y → do Z)
  - Checklist — pass/fail items
- **Art & Scene Work (Non-Script)** — everything the user needs to create:
  - Animation assets: clip names, AnimatorController state machines, transitions
  - Audio: clips needed, triggers
  - Prefab hierarchies: tool prefab (WorldModel/ViewModel children), UI prefab (Field_ GO hierarchy)
  - Layers & Tags required
  - SO assets to create
- **Scene setup** (step-by-step — every GO, every component, every `[SerializeField]` wiring)
- **Modifications to Earlier Phases** — NOT just a table. Include:
  - File path (which phase's script)
  - What to change (ADD / REPLACE / MODIFY)
  - **Exact code in fenced blocks** with `// ← ADD` markers
- **Source vs Phase diff** (what original did vs what we changed)
- **Systems & Testability** (at the end):
  - Individual Systems table: name, scripts, how decoupled (which GameEvents)
  - Testability Matrix: which `.cs` test and `Manual/*.md` covers each system
  - Final count: X systems, Y scripts, Z tests, W manual tests. Zero tight coupling.

Every phase folder also has a `FLOW.md` with:
- **System Map** — ASCII box diagram: all systems, what each owns, connections via GameEvents/[SerializeField]
- **Data Flows** — one per major user action. Written in **conversation-style plain English** with `code refs`, **bold** for key moments, *italics* for context. NOT swim lanes — readable prose.
- **Event Registry** — table: every GameEvent in that phase, who fires, who subscribes
- **Portability Diagram** — which systems are L0, which are L1+, dependency arrows
- Every connection = GameEvent or [SerializeField]. Direct cross-system calls = tight coupling = refactor.

---

## 7-3D — Models, Animations, World Layout (centralized in phase-All)

`phase-All/7-3D/` contains three `.md` files that cover **ALL phases** in one place — not per-phase. Each file has sections per phase (`## Phase X`) so everything grows in one document. These are **beginner-friendly visual guides**.

**`MODEL.md`** — every 3D mesh this phase needs:
- Name, rough shape description (e.g. "rectangular box 0.5m × 0.3m × 0.2m")
- Component hierarchy: which child GOs have MeshFilter, MeshCollider, Rigidbody
- Vertex count range (low-poly target for tools, machines, etc.)
- Prefab hierarchy tree (same format as Manual/*.md setup guides)
- Multiple mesh variants where applicable

**`ANIM.md`** — every animation clip + AnimatorController:
- **Animation Clips**: name, duration, what moves (which transform, what property, keyframes)
- **AnimatorController State Machine**: ASCII graph showing states + transitions
- **Parameters**: use `AnimParamType` enum (like `TagType`) — never raw strings for trigger/bool/float names
  ```csharp
  // in GlobalEnumsX.cs
  public enum AnimParamType { attack1, isRunning, speed }
  // usage: _animator.SetTrigger(AnimParamType.attack1.ToString());
  ```
- **Transition rules**: HasExitTime, ExitTime, TransitionDuration, conditions
- **Wiring**: which script field connects to which Animator

**`WORLD.md`** — how the world looks in this phase:
- Room/area layout with ASCII top-down map
- Where key prefabs are placed (spawn points, machines, objects)
- Lighting setup (directional light, point lights, ambient)
- Camera position for test scenes
- Layer/tag setup specific to this phase's world
- Visual reference: "what the player sees when they walk in"

---

## Gold Standard — What GUIDE.md and FLOW.md Actually Sound Like

These are the concrete voice and format targets. Copy this tone.

### GUIDE.md — "What It Looks Like When Running"

Conversational. Describe the player experience, not the code:

```
Full FPS controller: walk, sprint, duck, jump, slope sliding.
Look around with mouse, FOV widens when sprinting.

Walk up to a dropped pickaxe on the ground → press E → it goes
into your hotbar. Press 1-0 to switch tools. Scroll wheel cycles.
Active tool shows as a view model (first-person hands).

Hold right-click on a physics cube → SpringJoint grabs it,
a LineRenderer rope connects you to the object. Move mouse to
drag it around. Click again to release. Object bounces naturally.

Each system testable independently.
```

### GUIDE.md — Vertical Slice Test (beginner-friendly)

```
### DEBUG_CheckB — InventoryDataService (Data-Level)

> This test proves InventoryDataService works as pure C# — zero scene, zero UI, zero tools.
> One GO, press keys, check the console. If this passes, your data layer is solid.

**What you need to type first:** `InventoryDataService.cs`, `GlobalEnumsB.cs`
**What you DON'T need:** Player, tools, UI, shop, interaction — nothing.

**Step-by-step scene setup:**
1. Create a new empty scene
2. Create an Empty GO → name it `DEBUG_CheckB`
3. Add the `DEBUG_CheckB` component to it
4. No inspector wiring needed — the test creates its own DataService via `new`
5. Press Play

| Key | What it does | What you should see in Console |
|-----|-------------|-------------------------------|
| Space | Builds 40 slots | JSON with 40 slots, all empty |
| U | TryAdd a mock tool | Logs which slot the tool was added to |
| P | Log full snapshot | JSON with all slot states |

**Checklist:**
- [ ] Space → 40 slots created
- [ ] U → tool placed in first empty slot
- [ ] Zero console errors
```

### FLOW.md — Data Flow (conversation-style prose, NOT swim lanes)

```
## Flow 1 — Tool Pickup

The player **presses E** near a `ToolPickaxe` on the ground. `InteractionSystem`
raycasts from the camera and **hits the pickaxe's collider**.

The pickaxe *doesn't know anything about inventory* — it just fires
`GameEvents.RaiseToolPickupRequested(this)`.

`InventoryOrchestrator` is subscribed. It receives the tool and asks
`dataService.TryAdd(tool)`, which **finds the first empty slot** and stores it.

The orchestrator calls `tool.gameObject.SetActive(false)` — the **pickaxe
disappears from the ground**. Then it calls `SwitchToSlot(0)` — the pickaxe
appears as a *first-person held tool* in front of the camera.

Finally, `RefreshAllSlots()` updates all 40 `Field_InventorySlot` displays.
**Slot 0** shows the pickaxe icon, highlighted. Slots 1-39 show empty.
```

Notice: **bold** = visual change, *italic* = context, `code` = exact reference. Written as a story, not a table.

### FLOW.md — Event Registry (table format)

```
| Event | Fired By | Subscribed By |
|-------|----------|---------------|
| OnMenuStateChanged(bool) | InventoryUI, ShopUI | UIManager, PlayerMovement, PlayerCamera |
| OnToolPickupRequested(tool) | BaseHeldTool.Interact("Take") | InventoryOrchestrator |
| OnToolEquipped(tool) | InventoryOrchestrator | PlayerGrab (sets tool.Owner) |
```

### GUIDE.md — Source vs Phase Diff (what original did vs what we changed)

```
| What | Original Did | What We Did | Why |
|------|-------------|-------------|-----|
| Player controller | Single 888-line file | Split into 4 scripts | Each fits one sentence |
| Inventory data | Plain List in UI manager | InventoryDataService (pure C#) | Testable via new |
| Tool pickup | FindObjectOfType<Inventory>() | GameEvents.RaiseToolPickupRequested | Decoupled |
| Outline logic | Inside PlayerController.Update() | FresnelHighlighter (self-contained) | One sentence per script |
```

### GUIDE.md — Systems & Testability (at the end)

```
| System | Scripts | Decoupled Via |
|--------|---------|---------------|
| Player Movement | PlayerMovement, PlayerCamera | OnMenuStateChanged |
| Inventory | InventoryUI, Orchestrator, DataService, Field_ | OnToolPickup, OnToolEquipped |

| System | .cs Test | Manual/*.md | Needs other systems? |
|--------|----------|-------------|---------------------|
| Inventory (data) | DEBUG_Check | — | Nothing — plain C# new |
| Player Movement | MovementTest | — | No inventory, no tools |

7 systems, 37 scripts, 5 .cs tests, 4 manual tests. Zero tight coupling.
```

---

## Phased Approach — How to Break Down Any Game

### Step 1: Analyse the Original Source

Read every file in `Scripts/Assembly-CSharp/`. Create `learn/ARCHITECTURE.md` documenting:
- All singleton managers and their responsibilities
- All systems and how they interconnect
- Data flow diagrams for major mechanics
- Key design patterns used
- Third-party dependencies

### Step 2: Create Phase Map

Break the game into phases ordered by dependency (what must exist before what can work). Each phase:
- Has a clear domain boundary (one subsystem or feature area)
- Lists all scripts that belong to it
- Lists modifications to earlier phase files
- Lists vertical slice tests
- Is independently testable

**Phase ordering principles:**
1. Foundation first (core, economy, UI framework)
2. Player systems next (controller, inventory, tools)
3. World/game mechanics (game-specific systems)
4. Content systems (quests, progression, unlocks)
5. Persistence (save/load — touches everything, so last before polish)
6. Polish (audio, settings, menus, debug)

### Step 3: Create StructureMap

For each phase, define exact DataService specs:
- Collections (types, field names)
- Methods (signatures, what they do)
- Nested types
- Test snapshots

### Step 4: Build Phase by Phase

For each phase:
1. Read original source for all files in this phase
2. Apply architecture rules (split god-objects, extract DataServices, decouple via events)
3. Generate all scripts + GUIDE.md + FLOW.md + tests
4. Post-delivery self-audit (method-by-method source comparison)

---

## Splitting Rules

- **Split when one sentence isn't enough.** Large original files → multiple focused scripts.
- **Don't split when the file is small + single purpose.** 20-line files stay as-is.
- **Original god-objects WILL need splitting.** Expect similar splits for any large file with multiple responsibilities.

### Splitting Judgment

```
SPLIT — Large UI controller (260+ lines doing 4 things):
  → SubManager (toggle only)
  → Orchestrator (wire Field_)
  → DataService (collections)
  WHY: 4 distinct responsibilities.

SPLIT — Large player controller (800+ lines doing 10 things):
  → Movement, Camera, Grab, Highlight, etc.
  WHY: each fits one sentence. Camera bob has nothing to do with grab physics.

DON'T SPLIT — Small MonoBehaviour (20-100 lines, one purpose):
  WHY: already one sentence. Splitting creates tiny files with no benefit.

DON'T SPLIT — MonoBehaviour where data is inseparable from Unity physics:
  WHY: DataService would be an empty wrapper — no testable logic to extract.
```

---

## Inheritance

- **Keep the original inheritance chain** unless it's genuinely unnecessary. Chains exist because later phases depend on shared base types.
- **Interfaces go inside `_-Systems/XxxSystem/Interface/`** when owned by that system. Only use `2-Data/Interface/` for cross-system contracts not owned by any single system (rare). Stub them if the full implementation comes in a later phase.

---

## UIManager — Grows Per Phase

UIManager → "I report menu state + close all panels + route keyboard input with priority"

Three responsibilities that evolve:

| Responsibility | What |
|---------------|------|
| **Report state** | `isAnyMenuOpen` property — scripts read it |
| **Close all panels** | `CloseAllSubManager()` — fires all Close events |
| **Route keyboard with priority** | ESC/Tab — only opens panel if others aren't blocking |

**Rules:**
- UIManager NEVER calls SetActive on SubManagers — fires Close events, SubManagers disable themselves
- Opening from world (terminal) = GameEvents (decoupled)
- Opening from keyboard = UIManager routes with priority (centralized)
- Closing = UIManager fires all Close events (centralized)
- Each phase adds 1-2 lines to CloseAllSubManager() and optionally a key check in Update()

---

## Tight Coupling Red Flags — NEVER Do These

```
❌ FindObjectOfType<AnyType>()          → use [SerializeField], Owner chain, or GameEvents
❌ Singleton<X>.Ins.DoSomething()        → fire GameEvents.Raise...(), let X subscribe
   (Exception: Singleton reads for queries like .Ins.GetValue() are OK)
❌ Script A calls Script B's method directly (cross-system)
                                         → fire GameEvents, B subscribes
❌ MonoBehaviour accesses another via FindObjectOfType
                                         → use [SerializeField] or Owner.GetComponent<>()
```

---

## Public API Obsession — The #1 Priority

**Before making ANY method public, ask: "does another script ACTUALLY call this?"**
If no → it's private. If only subclasses → it's protected. If only same class → inline it.

```
❌ WRONG: public void Release() on GrabController
   → nobody calls it externally. State changes via GameEvents. Make it private.

❌ WRONG: public void TryAddItem() on Orchestrator
   → only called from own event handler. Make it private.

❌ WRONG: public void ToggleLight() on ToolHat
   → only called from own OnEnable/OnDisable. Make it private.

❌ WRONG: public GameObject WorldModel on BaseHeldTool
   → only this class and subclasses use it. Make it [SerializeField] or protected.

✅ RIGHT: public void Init() on Orchestrator
   → SubManager calls it during setup. Genuinely external.

✅ RIGHT: public virtual void PrimaryAction() on BaseTool
   → Input system calls active.PrimaryAction(). Genuinely external.

✅ RIGHT: public float GetCurrency() on EconomyManager
   → multiple scripts query currency. Genuinely external.
```

**After writing every script, audit: can any public method be made private/protected?**

---

## Small SubManagers with Inline Orchestrator

When a SubManager's orchestration is small (just spawn/destroy a few buttons), the Orchestrator logic can live **inline** in the SubManager using `#region Orchestrator(Since its just one tab)`.
No separate Orchestrator file needed. Only split when orchestration is large (150+ lines).

---

## User's Coding Style — CUSTOMIZE THIS

> **This section must be filled in per project.** Read `learn/handTyped(latest)/` and document the user's actual conventions here.

**Template — replace with your observations:**
```
#region blocks (not // ─── comments)
W prefix for DataWrappers (WItem, not Item)
DOC__ prefix for Dictionary lookups
ALL_CAPS for List/collection fields
.Ins for Singleton access (not .Instance)
// purpose: one-liner on every .Raise...() and += subscription
// when X >> / // << when X comment blocks in GameEvents.cs
No blank lines between #endregion and next #region
```

**Custom utility extensions the user has (list them here):**
```
.map()           → same as .Select()       (transforms collection)
.find()          → same as .FirstOrDefault() (search collection)
.all()           → same as .All()          (check all items match)
.sum()           → same as .Sum()          (aggregate values)
.gc<T>()         → same as .GetComponent<T>() (shorthand)
.toggle(value)   → same as .SetActive(value)
.destroyLeaves() → destroy all child GOs of a transform
.getRandom()     → pick random element from list
.colorTag()      → wrap string in rich text color tags
.repeat(n)       → repeat char/string n times
.HasTag()        → enum-based CompareTag (TagType)
.SetTag()        → enum-based tag assignment (TagType)
.ToNSJson()      → JSON serialize with pretify option
.GetOrCreate()   → dictionary get-or-create-default
.flatMap()       → same as .SelectMany()    (flatten nested collections)
.forEach()       → side-effect iteration
.formatMoneyShort() → money display formatting (e.g., "12,345")
C.method(this)   → structured debug logging: logs [ClassName.MethodName] with colored tag
INPUT.K.InstantDown(KeyCode) → input wrapper (replaces raw Input.GetKeyDown)
INPUT.K.HeldDown(KeyCode)    → input wrapper (replaces raw Input.GetKey)
INPUT.M.InstantDown(int)     → mouse button wrapper (replaces raw Input.GetMouseButtonDown)
INPUT.UI.SetCursor(isFpsMode) → cursor lock/visibility toggle
// ... add user's actual extensions
```

Use these extensions in generated code — don't reinvent them with standard API.

---

## Phase Overview — CUSTOMIZE THIS

> **Fill in per project.** Template:

| Phase | Name | Weight | Difficulty | Description |
|-------|------|--------|------------|-------------|
| A | [Foundation + UI] | X% | Easy | [what this phase covers] |
| B | [Player Systems] | X% | Hard | [what this phase covers] |
| C | [Primary Mechanic] | X% | Medium | [what this phase covers] |
| ... | ... | ... | ... | ... |

---

## System-Based Architecture (`_-Systems/`)

`_-Systems/` is the PRIMARY home for code — where almost all scripts live. Every feature with 3+ tightly coupled files gets a self-contained system folder containing ALL its code: SO_, Field_, DataWrapper, DataService, Orchestrator, SubManager, Interface/, Bridge/, Entities, Test.md, Dependency.md. `_-Systems/` sorts above `0-Core/` in Unity's Project panel.

```
phase-X/Scripts/
├── _-Systems/
│   ├── SystemA/
│   │   ├── SO_A.cs, Field_A.cs, WA.cs, ADataService.cs, AOrchestrator.cs, AUI.cs
│   │   ├── Interface/            ← interfaces this system OWNS
│   │   │   └── IMyContract.cs
│   │   ├── Bridge/               ← bridges that push runtime context TO this system
│   │   │   └── MyBridge.cs
│   │   ├── ...BaseSub/           ← subclasses of a base class (e.g. ToolBaseSub/)
│   │   ├── Field_/               ← Field_ display MonoBehaviours (if multiple)
│   │   ├── SO_/                  ← ScriptableObject definitions (if multiple)
│   │   ├── Test.md               ← test guide for this system
│   │   └── Dependency.md         ← what this system imports, implements, owns
│   └── SystemB/
│       ├── ...
│       └── Dependency.md
├── 0-Core/                       ← GameEvents.cs (partial class)
├── 2-Data/Enums/                 ← GlobalEnumsX.cs
├── 4-Utils/                      ← PhaseXLOG.cs only (snapshot formatters)
└── 5-Tests/                      ← standalone tests not inside a system
```

### Hybrid Structure Rules

- **`_-Systems/FeatureName/`** — the PRIMARY home for code. If a feature has **3+ tightly coupled files**, bundle them together: SO_, Field_, DataWrapper, DataService, Orchestrator, SubManager, Interface/, Bridge/, Entities, Test.md, Dependency.md — **ALL inside**. The system is self-contained — read one folder, understand the whole feature. Copy the folder, it compiles.
- **Most scripts go inside `_-Systems/`.** SO_, Field_, DataService, DataWrapper, Orchestrator, SubManager all belong to a feature. Putting them in numbered folders outside the system is wrong unless they genuinely serve multiple systems.
- **`0-Core/`, `2-Data/Enums/`, `4-Utils/`** — shared infrastructure that stays layer-based. GameEvents (partial per phase), shared enums, and PhaseXLOG.
- **`2-Data/Interface/`** — ONLY for interfaces not owned by any single system (rare). Most interfaces live INSIDE their system's `Interface/` subfolder.
- **`5-Tests/`** — for test scripts that don't belong to a specific `_-Systems/` folder.
- **Each `_-Systems/` folder contains:** code files + Test.md + Dependency.md. Non-MonoBehaviour classes (interfaces, entities, DataService) can share a file. Inspector-added MonoBehaviours MUST have filename == classname (Unity 6000.3) — put them in named subfolders.

### System Independence Rules

- **Systems communicate ONLY via interfaces and GameEvents.** No direct class imports between systems. If System A needs to call System B, they share an interface or fire a GameEvent.
- **GameEvents use interfaces, not concrete classes.** All events use `Action<IMyInterface>`, never `Action<ConcreteClass>`. This means GameEvents.cs has zero imports from any system.
- **Portable systems own their interfaces AND are fully isolated.** When you copy a system folder to another project, EVERYTHING it needs is inside. The ONLY allowed external dependencies for a portable system are: GameEvents, UIManager, Utils, GlobalEnumsX, and other infra listed as FREE.

### Observable System Shapes

> Every system in the project falls into one or more of these 5 shapes.
> Most systems are **hybrids**. Use these as a reference when designing new systems.

| Shape | Emoji | What It Does | Portable? | Example |
|-------|-------|-------------|-----------|---------|
| **Spider** | 🕷️ | Sits alone, extends interface "legs" outward. DEFINES interfaces, RECEIVES implementations. Never reaches out. | ✅ Always | ShopUI defines IShopMoney |
| **Hunter** | 🔍 | Reaches OUT to the world via `GetComponent<IXxx>()`. DEFINES interfaces it needs, actively scans for implementors. | ✅ Always | ToolSystem scans via GetComponent |
| **Adapter** | 🔌 | IMPLEMENTS interfaces defined by Spiders or Hunters. Plugs into other systems' sockets. | ✅ If interface-only deps | BuildingSystem implements 7 interfaces |
| **Broadcaster/Listener** | 📡 | Fires or subscribes to GameEvents only. No interfaces needed. Pure event-driven. | ✅ Always | MiningSystem fires OnOreMined |
| **Infrastructure** | 🌍 | Used by EVERY system. Doesn't count as dependency. | N/A | GameEvents, UIManager, Singleton\<T\>, Utils |

**Key: Spider vs Hunter** — both own interfaces, but the direction is opposite.
Spider passively receives (Bridge PUSHES interface impl into system).
Hunter actively scans (`GetComponent<IMyInterface>()` to find implementors).

**Hybrids are normal** — most systems combine shapes:
- InventorySystem = 🕷️ Spider (defines IInventoryItem) + 📡 Listener (subscribes to pickup events)
- BuildingSystem = 🔌 Adapter (implements multiple interfaces) + 📡 Broadcaster (fires placement events)

**Game-specific systems** (❌ Concrete) have unavoidable direct class imports — game-specific by PURPOSE, not by design flaw.

### Cross-System Communication Patterns

**4 connection mechanisms, ordered by preference:**

**1. GameEvents (fire-and-forget, zero coupling)**
- System A fires `GameEvents.RaiseX()`. System B subscribes. Neither knows the other exists.
- Used by: 📡 Broadcasters + Listeners, and as secondary pattern on almost every system.

**2. Interface / DIP (caller-defines abstraction)**
- The system that NEEDS something defines the interface. The system that PROVIDES implements it.
- Used by: 🕷️ Spiders (define + receive) and 🔍 Hunters (define + scan). 🔌 Adapters implement.

**3. Bridge (runtime context push)**
- A MonoBehaviour subscribes to a GameEvent and pushes runtime context from one system into another.
- Used when: systems need references (camera, transforms) that can't be passed via static events.
- Bridge lives on the **non-portable / game-specific side** — regardless of whether that's consumer or provider. If SystemA is L0 portable and SystemB is game-specific, the bridge lives in SystemB.

**4. [SerializeField] (same-GO / parent-child only)**
- Direct inspector reference. Intra-system only. NEVER across `_-Systems/` folders.

**Anti-patterns (NEVER use):**
- ❌ `FindObjectOfType<ConcreteClass>()` — NEVER in MonoBehaviours. Use GameEvents or [SerializeField].
  - **Exception:** `FindObjectsByType<T>(FindObjectsSortMode.None)` is acceptable in Bridge `Start()` for one-time initialization pushes (Push-to-All bridge variant). This is the Unity 2023+ replacement — returns all instances, runs once, not per-frame.
- ❌ `Singleton<ConcreteFromOtherSystem>.Ins.DoSomething()` — use interface or GameEvent
- ❌ Direct class import across `_-Systems/` folders — use interface (DIP pattern)
- ❌ Concrete class in GameEvent signatures — use `Action<IMyInterface>` not `Action<ConcreteClass>`

### Specific Interface Design Rules

- **Interface methods take minimal parameters.** Object decides its own behavior internally.
- **`[AddComponentMenu("[PROJECT_NAME]/Category/ClassName")]`** on every MonoBehaviour.
- **Unity 6000.3 rule: filename MUST match classname** for any MonoBehaviour added via inspector. Unity's Add Component search only indexes classes whose name matches the `.cs` filename. MonoBehaviours added via code (`AddComponent<T>()`) don't need this.

### System Subfolder Convention

When a system has many MonoBehaviours that need individual files, group them in named subfolders:

### Multi-Tier Interface Design

When one system has **many consumers** (5+ scripts using its objects), split the interface by **access pattern** — not by domain:

| Tier | Purpose | Example |
|------|---------|---------|
| **Identity** | "What am I?" — read-only queries | `IProcessIdentity` — GetResourceType(), GetPieceType(), GetSellValue(), Delete() |
| **Mutation** | "Transform me" — state-changing operations | `IProcessConvertible` — TryCrush(), ConvertToPlate(), ConvertToRod() |
| **Progress** | "Add per-frame value" — gradual accumulation | `IProcessProgressable` — AddPolish(delta), AddSieveValue(delta) |
| **Tracking** | "Track membership" — bidirectional writes | `IBasketTrackable` — AddBasket(basket), RemoveBasket(basket) |

**Why split?** Each consumer only needs `GetComponent<>` for the tier it uses:
- CrusherMachine needs `IProcessConvertible` only (mutate)
- SorterMachine needs `IProcessIdentity` only (read type)
- PolishingMachine needs `IProcessProgressable` only (gradual)

**Result:** 14 machines, ZERO `GetComponent<ConcreteClass>()`. All use 7-20 line interface files. Entire system is L4 portable with interface-only deps.

**When to use:** A Spider system's objects are consumed by 5+ scripts across multiple phases. A single interface would be bloated — split by what consumers actually need to do. Place all tier interfaces in `Interface/` subfolder since there are 2+.

### System Subfolder Convention

| Subfolder | Contains | Example |
|-----------|----------|---------|
| `...BaseSub/` | Subclasses of a base class | `ToolBaseSub/ToolPickaxe.cs` |
| `Bridge/` | Bridge scripts connecting systems | `Bridge/ItemEquipBridge.cs` |
| `Field_/` | Field_ display MonoBehaviours (if multiple) | `Field_/Field_InventorySlot.cs` |
| `SO_/` | ScriptableObject definitions (if multiple) | `SO_/SO_BuildingDef.cs` |

Root of system folder keeps: base class, interfaces, DataService, non-MB shared code, Test.md, **Dependency.md**.

### Portability Levels

**Portability = how many other `_-Systems/` folders must you copy to use this system.**

**FREE (doesn't count as a dependency):** `GameEvents`, `Singleton<T>` base, `Singleton<UIManager>.Ins`, `Singleton<DataManager>.Ins`, `Utils.*` (static), `TimeSince`/`TimeUntil` (structs), `GlobalEnumsX`, shared infra in `phase-All/`. Using any of these = still L0.

**L0 — Truly Portable:** zero imports from any other `_-Systems/`. Copy this folder → it compiles and works in any Unity project. Interfaces this system OWNS live inside. Bridges that CONNECT TO this system live outside (in the non-portable consumer).

**L1+ — Counted Dependencies:** each import from another `_-Systems/` = +1 level. Two kinds of dep:
- **Interface dep** (lightweight) — just copy the interface `.cs` file (7-20 lines). System is still practically portable. ✅
- **Concrete dep** (heavy) — must copy the entire source system + all its deps. NOT portable. ❌

**Portable = L0, or L1+ where ALL deps are interface-only.** If ANY dep is concrete → game-specific.

**Goal:** maximize L0 → if dep unavoidable, keep it interface-only → concrete is last resort.

When `/init` creates `SystemPortabilityMap.md`, fill in this table for your project:
```
| System | Phase | Level | Dep Type | What It Imports | Portable? |
|--------|-------|-------|----------|-----------------|-----------|
```

### Bridge Pattern — 5 Proven Variants

When two systems need runtime context but can't import each other, a Bridge connects them.

**Placement rule:** Bridge lives on the **non-portable / game-specific side** — regardless of whether that's consumer or provider. If SystemA is L0 portable and SystemB is game-specific, the bridge lives in SystemB.

#### Variant 1: Event-Push Bridge (most common)
Inspector-wired MonoBehaviour → cast to interface → fire GameEvent on Start. Consumer subscribes.
```csharp
// Lives in: the non-portable provider side (e.g. EconomySystem)
public class MoneyBridge : MonoBehaviour
{
    [SerializeField] MonoBehaviour _moneyProvider; // drag EconomyManager GO
    void Start()
    {
        if (_moneyProvider is IShopMoney money)
            GameEvents.RaiseMoneyProviderReady(money);
        else
            Debug.LogError("[MoneyBridge] _moneyProvider does not implement IShopMoney!");
    }
}
// Consumer (ShopUI) subscribes: GameEvents.OnMoneyProviderReady += (m) => money = m;
```
**When to use:** Provider implements interface. Consumer needs the interface ref once at startup.

#### Variant 2: Event-Response Bridge
Subscribe to a GameEvent → call interface method on the received object.
```csharp
// Lives in: the non-portable side (e.g. ToolSystem)
public class ItemEquipBridge : MonoBehaviour
{
    [SerializeField] MonoBehaviour _playerRef; // has Camera, ViewModelContainer
    void Start()
    {
        var cam = _playerRef.gc<Camera>();
        // purpose: push player context into newly equipped item
        GameEvents.OnItemEquipped += (item) =>
            item.SetOwnerContext(cam, container, magnetPos);
    }
}
```
**When to use:** Event carries an interface ref that needs runtime context pushed into it.

#### Variant 3: Push-to-All Bridge (FindObjectsByType)
Find all instances of a type on Start → push self (as interface) into each.
```csharp
// Lives in: the non-portable provider side (e.g. OreSystem)
public class OreSpawnerBridge : MonoBehaviour, ISpawner
{
    void Start()
    {
        var miners = FindObjectsByType<AutoMiner>(FindObjectsSortMode.None);
        foreach (var miner in miners) miner.SetSpawner(this);
    }
    // ISpawner implementation wraps pool + limit checks
}
```
**When to use:** Multiple consumers already exist in scene. Provider pushes itself to all on Start. `FindObjectsByType` (NOT `FindObjectOfType`) is acceptable here — one-time scene scan in bridge Start().

#### Variant 4: Event-Chain Bridge
Subscribe to GameEvent → fire ANOTHER GameEvent with `this` cast to interface.
```csharp
// Lives in: the non-portable adapter side (e.g. BuildingSystem)
public class BuildingToolBridge : MonoBehaviour, IBuildingToolContext
{
    void Start()
    {
        // purpose: when building tool equipped, announce context to BuildingManager
        GameEvents.OnItemEquipped += (item) =>
        {
            if (item.GetGameObject() == gameObject)
                GameEvents.RaiseBuildingToolContextReady(this);
        };
    }
}
```
**When to use:** Bridge IS the interface implementor. Needs to announce itself via event when a condition is met.

#### Variant 5: Static-Accessor Bridge
Inspector-wired → cast → expose via static property. Consumers read directly.
```csharp
// Lives in: the consumer side that needs the ref (e.g. ProcessingSystem)
public class PoolSpawnerBridge : MonoBehaviour
{
    [SerializeField] MonoBehaviour _poolManagerRef;
    public static IPoolSpawner Spawner { get; private set; }
    void Start() => Spawner = _poolManagerRef as IPoolSpawner;
}
// Consumer reads: PoolSpawnerBridge.Spawner?.Spawn(prefab, pos);
```
**When to use:** Many scripts in ONE system need the same interface ref. Static avoids passing through constructors.

Bridge sits on a scene GO. Inspector wires the provider. Consumer never imports provider's concrete class.

### Context Injection via `Set...Context()` Methods

When a tool/object needs data from another system but must remain decoupled, use a `Set...Context()` method called by a Bridge:

```csharp
// In BaseHeldTool (ToolSystem — doesn't know about PlayerMovement):
/// <summary> Receives camera + viewmodel container from ItemEquipBridge.
/// Tool never knows PlayerMovement exists — only stores the transforms it needs. </summary>
public void SetOwnerContext(Camera cam, Transform viewModelContainer, Transform magnetToolPos)
{
    ownerCam = cam;
    ownerViewModelContainer = viewModelContainer;
    ownerMagnetToolPos = magnetToolPos;
}
```

**Pattern:** The Bridge subscribes to a GameEvent, extracts the needed data from the owner system, and pushes it into the consumer via `Set...Context()`. The consumer stores only the primitives/transforms it needs — never a reference to the owner class.

### Bridge Summary Convention

Bridge scripts must include in their class summary:
1. What it bridges (which two systems)
2. That it's the ONLY connection between them
3. Why it lives in THIS system (which dependency it has)

```csharp
/// <summary>
/// Bridges inventory equip events to items that need player context.
/// This is the ONLY script that connects PlayerSystem to ToolSystem.
/// Lives in ToolSystem (not PlayerSystem) because it references IInventoryItem.
/// </summary>
[AddComponentMenu("MineMGL/Bridge/ItemEquipBridge")]
public class ItemEquipBridge : MonoBehaviour
```

### Dependency.md — Mandatory Per System

**Every `_-Systems/XxxSystem/` folder MUST have a `Dependency.md`.** Created from scratch when the system is first built. **Rewritten from scratch** whenever the system is modified (new files, new deps, interface changes). Never incrementally patched — always regenerated with fresh in-depth analysis.

**Requires in-depth analysis before writing:** read every `.cs` file in the system, trace every `using`, every `Singleton<X>.Ins`, every `GetComponent<I>()`, every `GameEvents.On/Raise` call. Cross-reference against portability rules.

**Sections (all mandatory):**

| Section | What |
|---------|------|
| **Header** | `# SystemName — L{n} ✅/❌ Portable/Game-Specific` |
| **Identity table** | Phase, Level, Scripts, Owns Interface, External _-Systems/ Deps |
| **FREE Requirements** | Table: GameEvents, UIManager, GlobalEnums, Utils, shared infra — From + Why |
| **Internal File Dependency Graph** | 3-zone left-border ASCII diagram (see format below) |
| **Future Phase Modifications** | Table: Phase, What Changes, Breaking? (❌/⚠️/🔴) |
| **Verdict** | One line: COMPLETE / MOSTLY COMPLETE / PARTIAL / PERMANENTLY COMPLETE |
| **Checklist** | Pass/fail items for portability + architecture rules |

**Diagram format — 3-zone left-border-only (no right border):**

```
  ┌── SystemName/ ────────────────────────────────
  │
  │  INTERNAL
  │  FileA → FileB → FileC (show internal deps)
  │
  ├── BOUNDARY ───────────────────────────────────
  │
  │  ◆ IOwnedInterface ◆ (defined here)
  │    or: IMPLEMENTS: ◆ IExternalInterface ◆ ←── SourceSystem
  │
  ├── EXTERNAL ───────────────────────────────────
  │
  │  IN:  ← EventName ── who fires
  │  OUT: → EventName ── who subscribes
  │  IMPLEMENTED BY: (for owned interfaces)
  │  CONCRETE DEPS: (for game-specific systems)
  │
  └───────────────────────────────────────────────
```

- **INTERNAL** — files inside the system and how they depend on each other
- **BOUNDARY** — interfaces this system owns (◆ defined here ◆) or implements (◆ from other system ◆)
- **EXTERNAL** — GameEvents IN/OUT, who implements owned interfaces, concrete deps
- **Left border only** — no right-side alignment issues, works in any font/viewer

### DataManager — Shared Visual Data (phase-All)

Like UIManager but for shared data (status light materials, layer masks). Any system reads `Singleton<DataManager>.Ins.GreenLightMaterial` — FREE infra.

### Utils.cs — Single Static Class (phase-All)

All utility functions in ONE file, organized by `#region` per domain:

```
#region Tag Helpers          ← HasTag(TagType), SetTag(TagType) — extension methods on GameObject
#region Physics              ← IgnoreAllCollisions(goA, goB), SimpleExplosion, SetLayerRecursively
#region Math                 ← RoundVector3, TruncateVector3
#region Time / Save Display  ← GetDisplaySaveTime (locale-aware)
#region Vector3              ← IsValidPosition
#region Weighted Random      ← WeightedRandomPick (overloads per weighted entity type)
```

Each phase grows Utils.cs by adding new `#region` sections. Per-phase `4-Utils/` only has `PhaseXLOG.cs` — nothing else.

**Companion file: `IEnumerableUtilsPhaseAll.cs`** — LINQ-style extensions matching SPACE_UTIL conventions:
```csharp
public static float sum<T>(this IEnumerable<T> source, Func<T, float> selector) => ...
public static int sum<T>(this IEnumerable<T> source, Func<T, int> selector) => ...
public static TValue GetOrCreate<TKey, TValue>(this Dictionary<TKey, TValue> dict, TKey key) where TValue : new() => ...
```
This is a separate file in `phase-All/4-Utils/` alongside Utils.cs — collection extensions that don't fit in the single static class.

**Weighted Random Pattern** — reusable across systems:
```csharp
[Serializable]
public class WeightedXxxChance
{
    public GameObject prefab;  // or specific type
    public float weight;
}
// Companion Utils overload in Utils.cs:
public static GameObject WeightedRandomPick(List<WeightedXxxChance> options) { ... }
```
Each system defines its own `[Serializable]` weighted entity + adds a `Utils.WeightedRandomPick()` overload.

### TimeSince / TimeUntil — Time Helper Structs (phase-All)

Drop-in replacements for float timers with implicit conversion:
```csharp
TimeSince _timeSinceHit = 0f;     // reset to "now"
if (_timeSinceHit > 2f) { ... }   // true after 2 seconds

TimeUntil _ready = 3f;            // ready in 3 seconds
if (_ready) { ... }               // implicit bool — true when done
```

---

## Additional Conventions (proven across 5+ phases)

### `/// <summary>` on EVERY class and EVERY method
No exceptions. Class summaries use first-person "I". Method summaries are 2-line effect descriptions. Lifecycle methods explain what THIS script does in this hook. One-liner `Get/Set` can use inline `/// <summary> ... </summary>`.

**Summary completeness by class type:**
- **DataService, Manager, base class, Orchestrator:** every public + every complex private method
- **Interface methods:** document at the interface definition, not at each implementation
- **Field_ setter methods:** optional — `SetData(name, descr, sprite)` is self-documenting
- **Simple one-liner getters:** `public float GetMoney() => currMoney;` — name suffices
- **All scripts:** use `// →` inline flow markers inside method bodies regardless of summary presence

### Enum Phase Comments
When an enum grows across phases, mark values with `// Phase X:` comments:
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

### Boolean Check Style
Both `== false` and `!` prefix are acceptable — use whichever reads clearer in context:
```csharp
if (wShopItem.isLockedCurr == false) { ... }  // ✅ OK — explicit
if (!wShopItem.isLockedCurr) { ... }           // ✅ OK — concise
```

### `[SerializeField]` is ALWAYS private
Never `[SerializeField] public`. External access via explicit `Get...()` / `Set...()` methods only.

**Exceptions — plain `public` fields are correct on:**
- **Field_** scripts — Orchestrator wires `field._button.onClick.AddListener(...)` at runtime. Use public with `_` prefix:
  ```csharp
  public TextMeshProUGUI _nameText, _descrText;
  public Button _addToCartButton;
  ```
- **DataWrappers / entities** (W classes, InventorySlot, CartItem) — plain public fields, no Get/Set:
  ```csharp
  public SO_ShopItemDef itemDef;
  public bool isLockedCurr;
  public int timesPurchased = 0;
  ```
- **`[HideInInspector] public`** — for fields other systems must write but shouldn't show in Inspector (e.g., conveyor velocity accumulation):
  ```csharp
  [HideInInspector] public Vector3 SumVelocity;
  ```

### No C# property accessors
Never `{ get; set; }` or `{ get => ...; set => ... }`. Always explicit `Get...()` / `Set...()`. Properties look like fields but hide logic — Get/Set makes access cost visible.

**Exceptions (properties ARE allowed here):**
- `[Serializable]` entities and pure data classes (public fields OK)
- `SO_` (pure data — public fields, zero methods)
- Interface contracts (define Get/Set signatures)
- Static collections
- **DataWrappers / entities** — public fields + expression-bodied derived properties OK:
  ```csharp
  public bool isHotBar => index < InventoryDataService.HOTBAR_SIZE;
  ```
- **Owner chain `=> _field`** — read-only shorthand for parent refs (documented in Owner Chain section)
- **UIManager `isAnyMenuOpen { get; private set; }`** — singleton read state for a universally-queried flag. ONLY acceptable on Singleton managers where Get/Set would be absurdly verbose.
- **Bridge static accessor** — `public static IXxx Provider { get; private set; }` on static-accessor bridges
- **`protected` write-only properties** for base class inheritance: `protected string toolName { set => _name = value; }`

### Enum values use camelCase
`TagType.grabbable`, `PieceType.ore`, `OreLimitState.slightlyLimited`. NOT PascalCase.

**Exception:** ID-type enums with explicit int values may use PascalCase for readability:
```csharp
public enum SavableObjectID
{
    INVALID = 0,
    ToolBuilder = 401,
    HammerBasic = 402,
    Lantern = 403,
}
```
This is rare — only for serialization/save-load identifiers. Standard enums always use camelCase.

### Attribute Conventions (consolidated)

| Attribute | Applies To | Purpose | Example |
|-----------|-----------|---------|--------|
| `[AddComponentMenu]` | **Every** MonoBehaviour | Organize Add Component menu | `[AddComponentMenu("MineMGL/Tools/ToolPickaxe")]` |
| `[SerializeField]` | **Every** inspector ref | Always private | `[SerializeField] float _speed` |
| `[CreateAssetMenu]` | Every SO_ class | Create instances from Asset menu | `[CreateAssetMenu(menuName = "SO/SO_ItemDef", fileName = "SO_ItemDef")]` |
| `[DefaultExecutionOrder]` | Managers needing early init | Control Awake/OnEnable order | `[DefaultExecutionOrder(-100)]` |
| `[Header]` | Inspector sections | Group fields visually | `[Header("Move")] [SerializeField] float _walkSpeed` |
| `[Range]` | Numeric fields | Slider in inspector | `[Range(0, 1)] [SerializeField] float _volume` |
| `[TextArea]` | String fields | Multi-line editor | `[TextArea(2, 3)] public string descr` |
| `[Tooltip]` | Any field | Hover info in inspector | `[Tooltip("Max stack size")] public int maxStack` |
| `[HideInInspector]` | Public fields other systems write | Hide from Inspector but keep public | `[HideInInspector] public Vector3 SumVelocity` |

**Categories for [AddComponentMenu]:** `Tools/`, `Managers/`, `UI/`, `Bridge/`, `Mining/`, `Ore/`, `Processing/`, `Sorting/`, `Inventory/`, `Building/`, `Physics/`, `Interactive/`, `Test/`

**Format:** `[AddComponentMenu("[PROJECT_NAME]/Category/ClassName")]` — use the project name (e.g. `MineMGL`), not a generic label. Categories match the system domain.

### Owner Chain — Public Read-Only Shortcut

When a MonoBehaviour needs to expose inspector refs to child scripts (NOT cross-system):

```csharp
public class PlayerMovement : Singleton<PlayerMovement>
{
    [SerializeField] Camera _playerCam;
    [SerializeField] Transform _viewModelContainer;

    // → Owner chain: child scripts read via owner.PlayerCam (no import needed)
    public Camera PlayerCam => _playerCam;
    public Transform ViewModelContainer => _viewModelContainer;
}
```

**Rule:** `=> _field` expression-bodied is the ONLY allowed property pattern. It's read-only, no hidden logic, just shorthand for a `Get...()` method. This is the **exception** to the "no properties" rule — it's justified because the alternative (`public Camera GetPlayerCam() => _playerCam;`) is unnecessarily verbose for read-only parent refs.

### Inheritance Chains — phase-All Base Classes

Multi-level inheritance lives split between phase-All (shared) and system folders (concrete):

```
phase-All/3-MonoBehaviours/Physics/
  BasePhysicsObject.cs         ← conveyor velocity, rigidbody caching, constants
    └── BaseSellableItem.cs    ← sell value, virtual GetSellValue()

phase-X/_-Systems/ToolSystem/
  BaseHeldTool.cs              ← extends BaseSellableItem, implements 4+ interfaces
    └── ToolBaseSub/
        ToolPickaxe.cs, ToolMagnet.cs, ToolBuilder.cs...
```

**Rules:**
- Shared base classes that multiple systems inherit → `phase-All/3-MonoBehaviours/`
- Game-specific base class used by ONE system's subclasses → inside `_-Systems/XxxSystem/`
- Use `#region Protected State` for fields subclasses read (`protected Camera ownerCam;`)
- Use `#region Protected Write` for fields subclasses set (`protected string toolName { set => _name = value; }`)
- Base classes expose constants: `public const float STANDARD_LINEAR_DAMPING = 0.2f;`

### Standard using Import Block

Every script uses this exact import order:
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
Omit unused namespaces (e.g., skip `TMPro` if no TextMeshPro references). `SPACE_UTIL` is always last — it's the project's extension library containing `.map()`, `.gc<T>()`, `.colorTag()`, `C.method()`, `INPUT.K`, etc.

### SO_ Extension Class Pattern
When an SO_ needs helper methods used by 2+ consumers:
```csharp
public class SO_ItemDef : ScriptableObject { public float Price; }  // pure data
public static class SO_ItemDefExt                                    // co-located in SAME file
{
    public static string GetFormattedPrice(this SO_ItemDef def) => $"${def.Price:0.00}";
}
// caller: _def.GetFormattedPrice() — extension syntax, SO stays pure
```

**Generalized rule:** Extension classes can be co-located in the same file as ANY class — not just SO_. For example, `MoneyExtension` in the same file as `EconomyManager`. Use `#region extension` to wrap them. The pattern works whenever helper methods would clutter the main class.

### 10 Common Pitfalls

1. **SetActive cascading** — parent disables ALL children. Siblings, not children, for independent panels.
2. **Scene instance vs prefab** — drag from Hierarchy, not Project panel.
3. **raycastTarget** — ghost=false, slot bg=true, icon=false.
4. **Swap contents not objects** — swap `.item` field, not entire slot.
5. **Missing layers** — `LayerMask.NameToLayer` returns -1 silently.
6. **LayerMask at Nothing** — defaults to 0, all raycasts return empty.
7. **Cross-phase mods not applied** — compile error or silent failure.
8. **Dual collider setup** — trigger (OnTriggerEnter) + physical (surface) on separate child GOs.
9. **Static lists surviving domain reload** — second Play press has stale null refs.
10. **Execution order attributes** — `[DefaultExecutionOrder]` on managers, don't remove.

---

## For Future Agents — Lessons Learned

### Always Do First
1. **Read the original source file** in `Scripts/Assembly-CSharp/` before writing any script. Match the behavior 100%.
2. **Read GOAL.md** (this file) for architecture rules + naming conventions.
3. **Read the target phase section in PhaseMap.md** for file list + modifications table.
4. **Check existing phases** for patterns — earlier phases are reference implementations.

### MANDATORY: Post-Delivery Self-Audit
After producing all files for a phase, do a method-by-method comparison: read every original source file line-by-line, check every public method, every field, every interface implementation against what you produced. List any gaps. Fix them before delivering. This is non-negotiable — agents typically miss 5-15% on first delivery.

### Self-Init Lifecycle
Every UI SubManager uses the `isFirstEnable` pattern. See SubManager Pattern section above.

### What Gets Proven Phase by Phase

Track what architecture patterns have been validated. Update this as you go:

| Pattern | Proven In | Status |
|---------|-----------|--------|
| DataService tested via plain C# instance | [Phase ?] | ❌ |
| Orchestrator pattern (wire Field_ + AddListener) | [Phase ?] | ❌ |
| SubManager self-init (isFirstEnable) | [Phase ?] | ❌ |
| `partial` GameEvents across phase folders | [Phase ?] | ❌ |
| Field_ display-only components | [Phase ?] | ❌ |
| Vertical slice tests per system | [Phase ?] | ❌ |
| God-object splitting (large → multiple focused scripts) | [Phase ?] | ❌ |
| Inheritance chain (Base → Mid → Concrete) | [Phase ?] | ❌ |
| Interface ownership (Spider/Hunter/Adapter shapes) | [Phase ?] | ❌ |
| Bridge pattern (5 variants: event-push, event-response, push-to-all, event-chain, static-accessor) | [Phase ?] | ❌ |
| Portability levels (L0–L5 with interface-only deps) | [Phase ?] | ❌ |
| `_-Systems/` folder isolation with Dependency.md | [Phase ?] | ❌ |
| 3-tier process interfaces (IProcessIdentity/Convertible/Progressable) | [Phase ?] | ❌ |
| DataManager (shared visual data as FREE infra) | [Phase ?] | ❌ |
| Utils.cs consolidated (single static class) | [Phase ?] | ❌ |
| TimeSince/TimeUntil time helper structs | [Phase ?] | ❌ |
| Cross-DataService communication | [Phase ?] | ❌ |
| Scene switching + OnDestroy cleanup | [Phase ?] | ❌ |
| Save/load serialization of DataService state | [Phase ?] | ❌ |
| Domain subfolders in 3-MonoBehaviours/ | [Phase ?] | ❌ |