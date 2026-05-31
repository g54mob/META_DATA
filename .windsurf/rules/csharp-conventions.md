---
trigger: glob
description: Unity C# coding conventions — naming, capitalization, class roles, region ordering, mandatory patterns, method naming, pitfalls, common mistakes
globs: "**/*.cs"
---

# C# Conventions (Unity Architecture)

> Single source of truth for all C# coding rules. Full detail with gold-standard examples in `.claude/templates/GOAL-general.md`.

> **ALL naming and capitalization rules are STRICTLY ENFORCED — no exceptions.**

## Core Principle

**Every script's purpose fits in one sentence. If it doesn't, split it until it does.**

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

## Capitalization Rules (CRITICAL — STRICTLY ENFORCED)

| Scope | Convention | Example |
|-------|-----------|--------|
| Class / Interface / Enum name | **PascalCase** | `ShopDataService`, `IInteractable` |
| Method / Event / Property | **PascalCase** | `GetMoney()`, `OnMoneyChanged` |
| Enum value | **camelCase** (NEVER PascalCase) | `TagType.grabbable`, `PieceType.ore` |
| `[SerializeField]` | **`_camelCase`** (ALWAYS private) | `_speed`, `_playerCam` |
| Private/public non-serialized fields | **camelCase** | `money`, `isFirstEnable` |
| Local variable | **camelCase** | `field`, `wItem` |
| Constant (`const`) | **camelCase** (same as fields) | `hotbarSize`, `buildingWidth` |

**Zero tolerance for CONSTANT_CASE.** No ALL_CAPS constants anywhere. camelCase for everything that isn't a class/method.

## Boolean Naming (CRITICAL)

- **Fields (camelCase):** `is`, `has`, `can`, `should` prefix — `isFirstEnable`, `hasUpgrade`
- **Methods (PascalCase):** Same prefixes — `IsEmpty()`, `HasTag()`, `CanAfford()`

## Attribute Conventions

| Attribute | Rule |
|-----------|------|
| `[AddComponentMenu]` | **EVERY** MonoBehaviour — `[AddComponentMenu("[PROJECT]/Category/Class")]` |
| `[SerializeField]` | Always private with `_` prefix |
| `[CreateAssetMenu]` | Every SO_ class — `menuName = "SO/..."` |

## Using Import Block Order

System → UnityEngine → TMPro → `SPACE_UTIL` (project extensions — ALWAYS last). Blank line between groups.

## Mandatory Patterns (CRITICAL)

- **`isFirstEnable` pattern** on ALL SubManagers
- **`partial class GameEvents`** — each phase extends in own 0-Core/GameEvents.cs
- **`[AddComponentMenu]`** on every MonoBehaviour
- **No defensive null checks** on inspector refs — let it crash
- **No C# property accessors** `{ get; set; }` — use explicit `Get.../Set...()` methods
- **TagType enum** — no raw string tags
- **AnimParamType enum** — no raw string Animator parameters
- **DataService + PhaseXLOG + GetSnapShotForTest()** for EVERY collection
- **Use LINQ aggressively** — `.Select()`, `.Where()`, `.Any()`, `.ToDictionary()` over manual foreach
- **Use custom extensions** — `.map()`, `.gc<T>()`, `.destroyLeaves()`, `.toggle()`, `.ToNSJson()`, `.colorTag()`, `.repeat()`
- **Public API obsession** — before making ANY method/field public, ask: "does another script ACTUALLY call this?" Default = private

## Method Naming Patterns

| Prefix | Return | Prefix | Return |
|--------|--------|--------|--------|
| `Get...` | value | `Build...` | void |
| `Set...` | void | `Refresh...` | void |
| `Try...` | bool | `Handle...` | void |
| `Can...` | bool | `Raise...` | void |
| `Is.../Has...` | bool | `Perform...` | void |

## Script Structure (#region order)

- MonoBehaviour: `Inspector Fields` → `private API` → `Public API` → `Extra` → `Unity Life Cycle` (LAST)
- DataService: `private API` → `Nested Type` → `public API` → `snapShot`
- No blank lines between `#endregion` and next `#region`

## 10 Common Pitfalls

1. SetActive cascading — parent disables ALL children
2. Scene instance vs prefab — drag from Hierarchy
3. raycastTarget — ghost=false, slot bg=true, icon=false
4. Swap contents not objects
5. Missing layers — `LayerMask.NameToLayer` returns -1 silently
6. LayerMask at Nothing — defaults to 0
7. Cross-phase mods not applied
8. Dual collider setup — trigger + physical on separate child GOs
9. Static lists surviving domain reload
10. Execution order attributes

## 17 Common Agent Mistakes

1. `FindObjectOfType` in MonoBehaviours — use [SerializeField], Owner chain, or GameEvents
2. Public methods nobody calls externally
3. Missing `// purpose:` on Raise/Subscribe calls
4. Tight coupling across systems — decouple via GameEvents
5. Defensive null checks on inspector refs
6. RefreshAll() in Update() (polling)
7. DataService that needs Unity physics/lifecycle
8. Missing `isFirstEnable` pattern on SubManagers
9. Toggle instead of separate Open/Close events
10. Methods on SO_ classes — SO_ = pure data, zero methods
11. Singleton in `3-MonoBehaviours/` instead of `1-Managers/`
12. Collections in MonoBehaviour instead of DataService
13. Missing PhaseXLOG methods
14. Missing `RefreshAllRequired()` in Orchestrator
15. Missing `DOC__X__Field` in Orchestrator
16. Not using custom extensions
17. Bridge on portable side — Bridges live on non-portable side
