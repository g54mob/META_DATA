---
trigger: glob
description: System architecture — class responsibilities, folder structure, decoupling rules, GameEvents, Bridge patterns, system shapes, portability levels
globs: "**/*.cs"
---

# Architecture Patterns

## Folder Structure (Numbered for Unity Panel Sorting)

```
phase-All/                          → shared scripts — never duplicated
├── 0-Core/       Singleton.cs, GameEvents.cs
├── 1-Managers/   UIManager, DataManager
├── 2-Data/Enums/ GlobalEnumsAll.cs (TagType enum)
├── 4-Utils/      Utils.cs (single static class), TimeSince/TimeUntil

phase-{x}/
├── _-Systems/             PRIMARY — each feature in its own folder
│   └── XxxSystem/         ALL code for one feature:
│       ├── SO_*, Field_*, W*, DataService, Orchestrator, SubManager
│       ├── Interface/     Contracts this system OWNS
│       ├── Bridge/        Cross-system bridges (inside consumer-system)
│       └── Dependency.md  What this system imports/implements/owns
├── 0-Core/                GameEvents.cs (partial class — phase-specific)
├── 2-Data/Enums/          GlobalEnums{X}.cs — all phase enums in ONE file
└── 4-Utils/               Phase{X}LOG.cs only
```

## Class Responsibilities (Prefix = Pure Purpose)

| Role | Pure Purpose |
|------|-------------|
| **SO_** | Inspector-editable config. Only public fields. Zero methods. |
| **Field_** | Set UI visuals (SetData/SetState). No onClick. No logic. |
| **W** | Wrap SO_ with mutable session state. Minimal API. |
| **DataService** | Pure C# collection service. Build + Get + Add + Remove + snapshot. Testable via `new`. |
| **Orchestrator** | Wire Field_ to DataService. Instantiate, AddListener, Destroy. `DOC__X__Field` tracking. |
| **SubManager** | Open/close one UI panel. `isFirstEnable` pattern. Zero business logic. |
| **Manager** | Extends `Singleton<T>`. One domain's state. Minimal query API. |
| **Phase{X}LOG** | Snapshot-format DataService collections to JSON for test logging. |

## Decoupling Rules (CRITICAL)

Rules apply between `_-Systems/` folders. Scripts inside same system CAN be tightly coupled.

### Cross-System Communication — 4 Mechanisms (Priority Order)

1. **GameEvents** (fire-and-forget) — System A fires `Raise...()`. System B subscribes. Zero coupling.
2. **Interface / DIP** — System that NEEDS defines interface. System that PROVIDES implements.
3. **Bridge** (runtime context push) — MonoBehaviour subscribes to GameEvent and pushes context. Lives on non-portable side.
4. **`[SerializeField]`** (same-GO only) — Direct inspector ref. Intra-system only.

### Rules

- **GameEvents signatures use interfaces ONLY** — `Action<IInventoryItem>` not `Action<ConcreteClass>`
- **Every `Raise...()` must call `LogSubscribersCount()`**
- **`// when X >>` / `// << when X`** comment blocks wrap each event domain
- **Singleton reads ONLY** for queries, NEVER cross-system commands
- **Separate Open/Close events** per UI panel — NOT a toggle
- **ZERO `FindObjectOfType`** in MonoBehaviours
- **`// purpose:`** comment on EVERY `.Raise...()` call and `+=` subscription

## System Shapes

| Shape | What It Does | Portable? |
|-------|-------------|-----------|
| Spider | Sits alone, defines interfaces, receives implementations | Always |
| Hunter | Reaches OUT via `GetComponent<IXxx>()`, defines interfaces it needs | Always |
| Adapter | Implements interfaces defined by others | If interface-only deps |
| Broadcaster/Listener | Fires or subscribes to GameEvents only | Always |
| Infrastructure | Used by EVERY system (FREE) | N/A |

## Portability Levels

**L0** (zero deps, copy folder → compiles) → **L1+** (each import from another `_-Systems/` = +1).

**FREE (doesn't count):** GameEvents, Singleton<T>, UIManager, DataManager, Utils.*, TimeSince/TimeUntil, GlobalEnumsX, all phase-All/ infra.

## Core Scripts (phase-All Foundation — Always FREE)

- **`Singleton<T>`** — generic MB singleton base. Access via `Singleton<X>.Ins`
- **`GameEvents`** — static partial class. Core events in phase-All, phase extends via partial
- **`UIManager`** — `isAnyMenuOpen`, cursor lock/unlock, `CloseAllSubManager()`
- **`DataManager`** — shared visual data (materials, layer masks)
- **`GlobalEnumsAll.cs`** — `TagType` enum (grows across phases)
- **`Utils.cs`** — single static class for ALL utility code

## GlobalEnums Rules

- **ALL enums for a phase in ONE file** — `GlobalEnums{X}.cs`
- **Enum values ALWAYS camelCase** — `TagType.grabbable`, NEVER `Grabbable`
- **No magic strings** — tags, layers, animator params, game concepts all get enum values
- **Phase comments** mark when values were added: `// Phase D:`

## Custom Extensions Library (SPACE_UTIL)

| Extension | Replaces |
|-----------|----------|
| `.map()` | `Select()` |
| `.find()` | `FirstOrDefault()` |
| `.all()` | `All()` |
| `.any()` | `Any()` |
| `.sum()` | `Sum()` |
| `.flatMap()` | `SelectMany()` |
| `.gc<T>()` | `GetComponent<T>()` |
| `.toggle(val)` | `SetActive(val)` |
| `.destroyLeaves()` | destroy all children |
| `.colorTag(color)` | rich text color wrap |
| `.repeat(n)` | repeat char/string |
| `.ToNSJson(pretify)` | JSON serialize |
| `.formatMoney()` | currency display |
| `.HasTag(TagType)` | `CompareTag()` replacement |
| `.SetTag(TagType)` | `tag = "string"` replacement |

## Documentation Voice (CRITICAL)

- **`/// <summary>`** on EVERY class and EVERY method — class = first-person "I do X". Method = 2-line what happens inside.
- **`// →`** inline flow markers inside EVERY method body
- **`// purpose:`** on EVERY `.Raise...()` and `+=` subscription
- **`// >>` / `// <<`** block delimiters in Orchestrators
- Script summaries: first person "I" (the script talks to you)
