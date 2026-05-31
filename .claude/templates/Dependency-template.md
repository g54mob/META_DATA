# Dependency Template — Per-System Dependency Analysis

> Copy this into each `_-Systems/XxxSystem/Dependency.md`.
> **Rewrite from scratch** every time the system is built or modified. Never incrementally patch.
> Requires in-depth analysis: read every `.cs` in the system, trace every `using`, every `Singleton<X>.Ins`, every `GetComponent<I>()`, every `GameEvents.On/Raise`.

---

## Format

```markdown
# SystemName — L{n} ✅/❌ Portable/Game-Specific

| Property | Value |
|----------|-------|
| Phase | [X] |
| Level | **L{n}** |
| Shape | [emoji] **[ShapeName]** (×N) + [emoji] **[ShapeName]** |
| Scripts | [List all .cs files in this system] |
| Owns Interface | [IMyInterface or "none"] |
| Implements | [IExternalInterface (Phase Y) or "none"] |
| Concrete deps | **NONE** or [ConcreteClass from SystemX] |
| Network Tier | **Client** / **Server** / **Shared** / **—** (non-networked) |
| Third-Party | [Library name or "none"] |

> **NOTE:** [Optional note about deviations, renames, or architectural decisions]

---

## FREE Requirements

| Infra | From | Why |
|-------|------|-----|
| GameEvents | phase-All + phase-X 0-Core/ | [which events: OnX, OnY] |
| Singleton<UIManager> | phase-All 1-Managers/ | CloseAllSubManager() |
| GlobalEnumsX | phase-X 2-Data/Enums/ | [which enums: TagType, InteractionType] |
| Utils | phase-All 4-Utils/ | [which methods: HasTag, SimpleExplosion] |
| TimeSince | phase-All 4-Utils/ | cooldown timer |

> All FREE — do NOT count toward portability level.

---

## Internal File Dependency Graph

```
  ┌── SystemName/ ────────────────────────────────
  │
  │  INTERNAL
  │  SO_Xxx ← WXxx (wraps SO)
  │  WXxx ← XxxDataService (manages collection)
  │  XxxDataService ← XxxOrchestrator (reads data, creates Field_)
  │  XxxOrchestrator ← XxxUI (SubManager calls Init)
  │  Field_Xxx (display only, no deps)
  │
  ├── BOUNDARY ───────────────────────────────────
  │
  │  OWNS:
  │  ◆ IMyInterface ◆ → implemented by [SystemY/ClassZ] (Phase Y)
  │
  │  IMPLEMENTS:
  │  ◆ IExternalInterface ◆ ←── defined in [SystemA/Interface/] (Phase A)
  │
  ├── EXTERNAL ───────────────────────────────────
  │
  │  IN:  ← OnEventFromOther ── fired by [SourceScript]
  │  OUT: → OnMyEvent ── subscribed by [ListenerScript]
  │
  │  IMPLEMENTED BY: (for owned interfaces)
  │  ◆ IMyInterface ◆ → [SystemY/ConcreteClass] (Phase Y)
  │
  │  CONCRETE DEPS: (only if game-specific)
  │  [ConcreteClass] from [SystemX] — reason: [why interface wasn't possible]
  │
  └───────────────────────────────────────────────
```

**Diagram rules:**
- Left border only (no right-side alignment)
- 3 zones: INTERNAL → BOUNDARY → EXTERNAL
- INTERNAL: show file dependency arrows (who imports who within the system)
- BOUNDARY: interfaces OWNED (◆ defined here ◆) or IMPLEMENTED (◆ from elsewhere ◆)
- EXTERNAL: GameEvents IN/OUT with source/subscriber, interface implementors, concrete deps

---

## Future Phase Modifications

| Phase | What Changes | Breaking? |
|-------|-------------|-----------|
| [Y] | Add [SerializeField] for new feature | ⚠️ Direct modify (inspector field) |
| [Z] | New GameEvent subscription | ❌ Non-breaking (partial class) |
| [W] | Implement new interface | ❌ Non-breaking (additive) |
| [V] | Rename method / change signature | 🔴 Breaking — all callers must update |

---

## Scene Setup (CONDITIONAL)

> **Include this section when ANY of these are true:**
> - System has a Singleton Manager that must exist in scene before Play
> - System has 3+ `[SerializeField]` refs requiring manual inspector wiring
> - System requires specific Layers, Tags, or Physics settings in Project Settings
> - System has prefabs that must be pre-placed in the Hierarchy (not just instantiated at runtime)
> - System has `[DefaultExecutionOrder]` that causes silent failure if missing
>
> **Omit when ALL of these are true:**
> - System is pure C# (DataService-only, no MonoBehaviours)
> - System has 0-2 simple `[SerializeField]` refs (covered adequately in GUIDE.md)
> - System has no layer/tag/physics requirements
>
> **When in doubt, include it.** A redundant Scene Setup section wastes 30 seconds of reading.
> A missing one wastes 30 minutes of debugging.

> Step-by-step guide for wiring this system in the Unity scene. Written so someone who has never opened this project can follow it.

### Required GameObjects

```
| # | GO Name | Parent | Components | Notes |
|---|---------|--------|-----------|-------|
| 1 | [SystemName]Manager | Canvas/ | [SubManager], [Orchestrator] | UI root for this system |
| 2 | [CategoryContainer] | [SystemName]Manager/ | VerticalLayoutGroup | Holds instantiated Field_ prefabs |
| 3 | ... | ... | ... | ... |
```

### SerializeField Wiring

```
| Script | Field | Drag From | Notes |
|--------|-------|-----------|-------|
| [SubManager] | _orchestrator | [Orchestrator GO in Hierarchy] | Same GO or child |
| [SubManager] | _CATEGORY | [SO_ assets from Project panel] | Drag ALL category SOs |
| [Orchestrator] | _categoryContainer | [CategoryContainer in Hierarchy] | Transform ref |
| [Orchestrator] | _pfCategory | [Field_Category PREFAB from Project] | Prefab, NOT scene instance |
| ... | ... | ... | ... |
```

### Layer / Tag Setup

```
| Item | Type | Value | Used By |
|------|------|-------|---------|
| [LayerName] | Layer | [number] | [which scripts use LayerMask] |
| [TagType.xxx] | Tag (enum) | — | [which scripts check HasTag] |
```

### ScriptableObject Assets to Create

```
| SO Type | How Many | Example Names | Where to Create |
|---------|----------|--------------|----------------|
| SO_CategoryDef | [N] | "Ores", "Tools" | Assets/Resources/[SystemName]/ |
| ... | ... | ... | ... |
```

### Prefabs to Create

```
| Prefab | Base GO | Key Components | Used By |
|--------|---------|---------------|---------|
| Field_[Xxx] | UI Image | Field_[Xxx] script, Button (if interactive) | [Orchestrator] instantiates |
| ... | ... | ... | ... |
```

### Verification Steps

1. Enter Play mode
2. [Trigger the system — e.g., press Tab to open shop]
3. Verify: [expected visual result]
4. Verify: Console shows `[GameEvents] On[Event] raised for -> N subscribers`
5. [Additional verification steps specific to this system]

---

## Verdict

**[COMPLETE / MOSTLY COMPLETE / PARTIAL / PERMANENTLY COMPLETE]** — [2-3 sentences explaining WHY this verdict].

Examples:
- "COMPLETE — All conversion methods from source present. Every machine uses interface-only deps. Zero concrete imports."
- "MOSTLY COMPLETE — Missing edge case: auto-sell timer from source. Will add in Phase F."
- "PERMANENTLY COMPLETE — Infrastructure system. No future phases modify it."

---

## Checklist

Verify against [C# Conventions](../instructions/csharp-conventions.instructions.md):

- [ ] All files inside `_-Systems/SystemName/` (nothing scattered in numbered folders)
- [ ] `[AddComponentMenu]` on every MonoBehaviour
- [ ] Zero `FindObjectOfType` calls
- [ ] GameEvents use interfaces, not concrete classes
- [ ] All collections in DataService (not in MonoBehaviours)
- [ ] `// purpose:` on every Raise and Subscribe
- [ ] `isFirstEnable` on SubManager (if applicable)
- [ ] Separate Open/Close events (if UI panel)
- [ ] DOC__X__Field tracking in Orchestrator (if applicable)
- [ ] PhaseXLOG method for every collection
- [ ] GetSnapShotForTest() calls all LOG methods
- [ ] Portability level is accurate (re-counted all deps)
- [ ] Interface deps are interface-only (not concrete)
- [ ] No direct class imports from other _-Systems/ folders
```

---

## Shape Reference

| Shape | Emoji | What It Does |
|-------|-------|-------------|
| Spider | 🕷️ | Defines interfaces, receives implementations. Never reaches out. |
| Hunter | 🔍 | Defines interfaces, actively scans via `GetComponent<IXxx>()`. |
| Adapter | 🔌 | Implements interfaces defined by Spiders/Hunters. |
| Broadcaster/Listener | 📡 | Fires or subscribes to GameEvents only. |
| Infrastructure | 🌍 | Used by ALL, doesn't count as dependency. |

## Portability Level Reference

| Level | Meaning |
|-------|---------|
| L0 | Zero imports from other _-Systems/. Copy folder → compiles. |
| L1+ | Each import from another _-Systems/ = +1. Interface dep = ✅ portable. Concrete dep = ❌ game-specific. |
| FREE | GameEvents, Singleton<T>, UIManager, DataManager, Utils.*, GlobalEnumsX, TimeSince/TimeUntil. |

## Verdict Reference

| Verdict | Meaning |
|---------|---------|
| COMPLETE | All functionality done, all tests pass, all future phase mods documented. |
| MOSTLY COMPLETE | 90%+ done, minor gaps documented, no blocking issues. |
| PARTIAL | Core functionality works but significant features missing. |
| PERMANENTLY COMPLETE | System is finished — no future phases modify it. |