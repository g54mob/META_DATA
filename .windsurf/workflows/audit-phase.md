---
description: "Post-delivery self-audit — method-by-method source comparison + architecture rule check + pitfall scan + common mistakes check + decoupling verification. Use when: after any delivery, verifying source fidelity, checking architecture violations, doc consistency, interface/bridge communication validity"
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`. Ask: "Which phase?" → `{PHASE}`
2. Read `LEARN/{PROJECT}/GOAL.md` — architecture rules (needed for violation checks)
3. Read `LEARN/{PROJECT}/NewAgent.md` — delivery checklist + common mistakes list (needed for mistake checks)

## C# Conventions

All rules referenced in the violation checks and mistake checks below are defined in [C# Conventions](../rules/csharp-conventions.md). Use that file as the authoritative source for every rule.

## Skills Reference

Load the relevant skill when auditing domain-specific areas:

- **[unity-testing](../skills/unity-testing/SKILL.md)** — when verifying test completeness (§9), Test.md format, DEBUG_Check patterns, mock strategy
- **[unity-scene-setup](../skills/unity-scene-setup/SKILL.md)** — when verifying scene setup docs, layer/tag correctness, lighting/material references
- **[unity-audio](../skills/unity-audio/SKILL.md)** — when auditing sound system usage (pool patterns, distance culling, LoopingSoundPlayer wiring)
- **[unity-animation](../skills/unity-animation/SKILL.md)** — when verifying AnimParamType usage (no raw strings), animation-to-gameplay sync timing, motion patterns
- **[unity-prefab-hierarchy](../skills/unity-prefab-hierarchy/SKILL.md)** — when verifying prefab GO structure, ViewModel/WorldModel splits, collider zone naming, connection point patterns
- **[unity-save-load](../skills/unity-save-load/SKILL.md)** — when auditing save/load completeness, ISaveable contracts, SaveData purity, round-trip integrity
- **[unity-fsm](../skills/unity-fsm/SKILL.md)** — when auditing state machines, IState implementations, Exit() cleanup, transition correctness
- **[unity-networking](../skills/unity-networking/SKILL.md)** — when auditing network authority, RPC patterns, SyncVar usage, client/server separation
- **[unity-day-night](../skills/unity-day-night/SKILL.md)** — when auditing time system, day/night transitions, IDaytimeSensitive implementations
- **[unity-camera](../skills/unity-camera/SKILL.md)** — when auditing camera rigs, Cinemachine setup, screen shake, FOV transitions
- **[unity-dialogue](../skills/unity-dialogue/SKILL.md)** — when auditing dialogue systems, NPC conversations, third-party dialogue integration
- **[unity-ai-navigation](../skills/unity-ai-navigation/SKILL.md)** — when auditing NPC pathfinding, NavMesh agent config, FSM state transitions, patrol/chase patterns
- **[unity-quest](../skills/unity-quest/SKILL.md)** — when auditing quest/objective tracking, QuestSO definitions, completion callbacks, quest save/load
- **[unity-procedural-gen](../skills/unity-procedural-gen/SKILL.md)** — when auditing procedural generation, seed reproducibility, chunk loading, biome assignment
- **[unity-input](../skills/unity-input/SKILL.md)** — when auditing input handling, InputActions configuration, rebinding persistence, action map switching
- **[unity-physics](../skills/unity-physics/SKILL.md)** — when auditing physics setup, Rigidbody config, joint connections, ragdoll activation, raycast layers
- **[unity-inventory](../skills/unity-inventory/SKILL.md)** — when auditing inventory slot logic, stacking rules, drag-drop wiring, equipment constraints
- **[unity-grid-building](../skills/unity-grid-building/SKILL.md)** — when auditing building placement, grid validation, ghost material setup, footprint rotation

## Source Fidelity (100% behavior match — including nice-to-haves)

4. For every original source file in `MAIN-SOURCE/{PROJECT}/` mapped to this phase:
   - Read original line-by-line
   - Compare every public method, field, property, interface implementation against `LEARN/{PROJECT}/phase-{PHASE}/`
   - Compare every event subscription/raise, coroutine, Unity lifecycle hook
   - Compare every constant, threshold, timing value, default state
   - Compare every nice-to-have feature (visual polish, audio triggers, animation callbacks, particle effects, UI juice) — these MUST be present in `#region Extra` even if typed last
   - Log gaps: `| Original Method/Field | Status (✅/❌/⚠️) | Notes |`
   - ✅ = present and correct, ❌ = missing, ⚠️ = present but different behavior
5. Fix all ❌ gaps before proceeding. Document all ⚠️ with reason for difference.

**CRITICAL: Nice-to-have features are NOT optional for source fidelity.** The original source has them, so our rebuild must have them — placed in `#region Extra` and typed last, but they MUST exist. "100% main-source behavior" means ALL behavior, not just core mechanics.

## Unlisted Functionality Discovery

5b. **Go beyond the mapped files.** Read ALL source files in `MAIN-SOURCE/{PROJECT}/` that belong to this phase's DOMAIN (not just those listed in PhaseMap). Look for:
   - Source files in the same namespace/folder that PhaseMap didn't assign to any phase
   - Methods, coroutines, or event handlers inside mapped files that were overlooked (edge cases, fallback logic, secondary behaviors)
   - Nice-to-have features (visual effects, audio triggers, animation callbacks, UI polish) buried in source that OptionalFeatures.md missed
   - Conditional logic paths (e.g., `if (hasUpgrade)`, `if (isMultiplayer)`) that hint at features no phase covers

   For each discovery, classify:
   - **Critical** — source has it, without it the phase behavior is incomplete
   - **Important** — source has it, adds meaningful gameplay behavior
   - **Nice-to-have** — polish/visual/audio, goes in `#region Extra` (STILL MUST BE PRESENT — just typed last)

   Output: `| Source File | Method/Feature | Classification | Currently Covered? | Action |`
   - Action = "Add to this phase" / "Add to later phase [which]" / "Add to OptionalFeatures.md" / "Already covered"

5c. **Update living docs** with discoveries:
   - Critical/Important items missing from this phase → flag for immediate fix
   - Items belonging to later phases → update PhaseMap.md + CoverageMap.md
   - Nice-to-haves → append to OptionalFeatures.md with integration points AND ensure `#region Extra` exists in the target script
   - Update StructureMap.md if new DataService collections or methods were discovered

## Architecture Rule Violations

6. Scan every `.cs` in `LEARN/{PROJECT}/phase-{PHASE}/` for violations of [C# Conventions](../rules/csharp-conventions.md). Key items to check:
   - `FindObjectOfType` → replace with [SerializeField] / Owner chain / GameEvents
   - Public methods nobody external calls → demote to private/protected
   - Missing `// purpose:` on every `.Raise...()` and `+=` subscription
   - SO_ with methods → move to consumer or SO_XxxExt
   - `[SerializeField] public` → make private + Get/Set
   - `{ get; set; }` → Get/Set methods (exceptions: interfaces, [Serializable], SO_, static collections, Singleton `.Ins`, Bridge static accessors `{ get; private set; }`, UIManager/DataManager read-only properties, DataWrapper expression-bodied properties)
   - Singleton not in `1-Managers/` → move to 1-Managers/
   - Raw string tags (CompareTag, tag =) → HasTag(TagType.x) / SetTag(TagType.x)
   - Missing `[AddComponentMenu]` on MonoBehaviour → add
   - Missing `[CreateAssetMenu]` on SO_ classes → add with `menuName = "SO/SO_XxxDef", fileName = "SO_XxxDef"`
   - Defensive null checks on inspector refs → remove (let it crash)
   - Missing `#region` blocks → add (Inspector Fields, private API, Unity Lifecycle, public API). Note: actual convention is lowercase `private API` / `public API` (combined), NOT "Private Fields" / "Public API" separately
   - Missing class summary (first-person "I") → add
   - Missing `// →` inline flow markers → add
   - GameEvents signatures using concrete classes → must use interfaces only (`Action<IInventoryItem>` not `Action<BaseHeldTool>`). GameEvents.cs must have zero imports from `_-Systems/`
   - Raw string Animator parameters (`SetTrigger("attack")`) → use `AnimParamType` enum in `GlobalEnumsX.cs`
   - Using `!` prefix for boolean checks — both `!` and `== false` are acceptable (keep code concise)
   - **Import order violation** → must follow: System → UnityEngine → TMPro → SPACE_UTIL (blank line between groups, omit unused)
   - **Missing `LogSubscribersCount()`** in `Raise...()` methods → every Raise MUST call `LogSubscribersCount(nameof(OnX), OnX)` before invoking
   - **Missing `// when X >>` / `// << when X`** comment blocks wrapping each event+Raise pair in GameEvents.cs
   - **CONSTANT_CASE on `const` fields** → our convention is camelCase for ALL consts. Only `List<T>`/`Dictionary<K,V>` field NAMES use ALL_CAPS. Never `MAX_AMOUNT`, always `maxAmount`
   - **Manual foreach instead of LINQ/custom extensions** → use `.map()`, `.find()`, `.all()`, `.sum()`, `.flatMap()`, `.forEach()`, `.gc<T>()`, `.destroyLeaves()`, `.toggle()`, `.getRandom()` where equivalent
   - **Unnecessary MonoBehaviour inheritance** — for every class extending MonoBehaviour, verify it ACTUALLY uses at least ONE Unity feature: `[SerializeField]`, Unity lifecycle (Update/Start/OnEnable/OnDisable/Awake), coroutines, physics callbacks (OnCollision/OnTrigger), or needs to exist on a GameObject for scene wiring. If NONE apply → convert to plain C# class. Pure C# classes (DataService, DataWrapper, entities, helpers, calculators, formatters) are ALWAYS preferred over MonoBehaviour. Ask: "does this class need to be on a GameObject?" If no → plain C#
   - **File naming ≠ class naming for inspector-added MonoBehaviours** → Unity 6000.3 requires filename MUST match classname for any MonoBehaviour added via Add Component menu. Mismatch = invisible in inspector search
   - **80% rule violation** → if fewer than 80% of phase scripts are inside `_-Systems/`, audit every file outside it

## 35 Common Agent Mistakes Check

7. Specifically check for each of these mistakes (from NewAgent.md — full rules in [C# Conventions](../rules/csharp-conventions.md)):
   1. Any `FindObjectOfType` in MonoBehaviours
   2. Public methods nobody calls externally — audit EVERY public method: "Who calls this?"
   3. Missing `// purpose:` on Raise/Subscribe calls
   4. Tight coupling (Script A directly calls Script B across systems)
   5. Defensive null checks on inspector refs
   6. `RefreshAll()` in `Update()` (polling instead of event-driven)
   7. DataService that needs Unity physics/lifecycle (shouldn't be a DataService)
   8. Missing `isFirstEnable` pattern on SubManagers
   9. Toggle instead of separate Open/Close events per UI panel
   10. `Input.GetKeyDown` directly in SubManagers (SubManagers don't handle input)
   11. Methods on SO_ classes (SO_ = pure data, zero methods)
   12. Singleton in `3-MonoBehaviours/` instead of `1-Managers/`
   13. Collections (`List<T>` / `Dictionary<K,V>`) left in MonoBehaviour instead of DataService
   14. Missing PhaseXLOG methods for collections
   15. Missing `RefreshAllRequired()` in Orchestrator after data mutations
   16. Missing `DOC__X__Field` tracking in Orchestrator
   17. Not using user's custom extensions (`.map()`, `.gc<T>()`, `.destroyLeaves()`, `.toggle()`, `.ToNSJson(pretify: true)`, `.getRandom()`, `.colorTag()`, `.repeat()`, `.find()`, `.all()`, `.sum()`, `.flatMap()`, `.forEach()`, `.formatMoneyShort()`, `.GetOrCreate()` etc.)
   18. Bridge script placed on the portable side → Bridges live on the non-portable / game-specific side
   19. `Interface/` subfolder not used when system has 2+ interfaces → single interface = root, two or more = `Interface/` subfolder
   20. Using `FindObjectOfType` instead of `FindObjectsByType` → obsolete in Unity 6000.3. Use `FindObjectsByType<T>(FindObjectsSortMode.None)` — ONLY in Bridge `Start()` for push-to-all
   21. Wrong bridge pattern chosen → 5 variants exist (event-push, event-response, push-to-all, event-chain, static-accessor). Match data-flow direction
   22. `#region Private Fields` instead of `#region private API` → correct name is `private API` (lowercase, combined fields + helpers)
   23. Field_ uses `[SerializeField]` instead of public fields → Field_ scripts use **public** refs (Orchestrator wires at runtime), not `[SerializeField]`
   24. State classes referencing each other directly → states communicate via `StateMachine.ChangeState()`, never `new OtherState()` inside a state
   25. Missing Exit() cleanup in FSM states → every Enter() allocation/subscription MUST have matching cleanup in Exit()
   26. SaveData class with methods/logic → SaveData = pure `[Serializable]` data fields only, zero methods
   27. Save/Load bypassing GameEvents → SaveManager fires `OnSaveStart`/`OnSaveComplete`/`OnLoadComplete` via GameEvents
   28. CONSTANT_CASE on consts → our convention is camelCase for ALL consts/fields. Never `MAX_AMOUNT`, always `maxAmount`. Only collection-name fields (CATEGORY, SLOT) use ALL_CAPS
   29. Preserving original source's public access level → ALWAYS apply minimal-public-API rule during rebuild. Original `public int x`? Ask "does another script read this?" If no → private
   30. Preserving original source's defensive null checks → strip `if (x == null) return` guards on `[SerializeField]` refs. Let it crash for traceability
   31. Missing `// →` in "simple" constructors/methods → the rule says EVERY method body, including constructors that are just field assignments
   32. Missing `/// <summary>` on batch-generated items → when generating multiple stubs (virtual methods, enum types), each MUST get its own summary
   33. PhaseXLOG method names not following `LIST_`/`DOC_` prefix → must be `LIST_X__TO__JSON` for Lists and `DOC_X_Y__TO__JSON` for Dictionaries
   34. **Unnecessary MonoBehaviour inheritance** — class extends MonoBehaviour but doesn't use ANY Unity feature ([SerializeField], lifecycle, coroutines, physics callbacks, needs to exist on GO). Convert to plain C# class. Common offenders: helpers, calculators, formatters, validators, data-holding classes, state machines that don't need Update()
   35. **File naming ≠ class naming** — inspector-added MonoBehaviour filename doesn't match classname. Unity 6000.3 Add Component search won't find it. Only code-added MBs (`AddComponent<T>()`) are exempt

## 13 Common Pitfalls Check

8. For each pitfall, scan if any script in this phase is susceptible:
   1. **SetActive cascading** — any parent GO disabling that would affect independent child panels? Use siblings.
   2. **Scene instance vs prefab** — any `[SerializeField]` that might get a prefab dragged instead of scene instance?
   3. **raycastTarget** — any UI Image/Text where raycastTarget should be false (ghost overlays, icons)?
   4. **Swap contents not objects** — any slot/inventory logic that swaps GameObjects instead of data fields?
   5. **Missing layers** — any `LayerMask.NameToLayer` that could return -1 silently?
   6. **LayerMask at Nothing** — any LayerMask field defaulting to 0 (all raycasts empty)?
   7. **Cross-phase mods not applied** — any method/field referenced from an earlier phase that doesn't exist yet?
   8. **Dual collider setup** — any GO needing both trigger and physical colliders on same GO?
   9. **Static lists surviving domain reload** — any static List/Dictionary that could have stale refs on second Play?
   10. **Execution order attributes** — any manager missing `[DefaultExecutionOrder]` that other Awake calls depend on?
   11. **Giant switch statement for state logic** — use IState pattern with separate classes per state. Switch is only OK for ≤3 trivial states.
   12. **SaveData fields inside MonoBehaviour** — extract to separate pure C# `[Serializable]` SaveData class. MonoBehaviour implements ISaveable and returns SaveData from `GetSaveData()`.
   13. **PlayerPrefs for complex game state** — PlayerPrefs is for settings (volume, keybinds) only. Use file-based JSON for game saves.

## Domain-Specific Completeness Checks

8b. **Save/Load Completeness** (if phase has save/load):
   - [ ] Every DataService with persistent state has a matching `SaveData` pure C# class
   - [ ] SaveData has NO methods, NO MonoBehaviour refs — only serializable fields
   - [ ] ISaveable.Save() maps DataService → SaveData; ISaveable.Load() maps SaveData → DataService
   - [ ] SaveManager fires GameEvents (OnSaveRequested/OnLoadCompleted), not direct calls
   - [ ] Round-trip test exists: build state → save → load → compare snapshots

8c. **FSM Completeness** (if phase has state machines):
   - [ ] Every state implements IState with Enter(), Update(), Exit()
   - [ ] Exit() cleans up subscriptions, timers, coroutines (not just Enter() logic)
   - [ ] States reference only their owner (NPCController, etc.), not other states directly
   - [ ] Transitions go through StateMachine.ChangeState(), not direct state field assignment
   - [ ] No giant switch/case for state behavior in a single class — one class per state

8d. **Network Authority** (if phase has multiplayer):
   - [ ] State mutations only on server (ServerRpc / [Server] methods)
   - [ ] Client-only code has no write access to game state
   - [ ] DataService access is server-authoritative — clients read SyncVars or receive ObserversRpc
   - [ ] Network-specific using statements isolated to NetworkTier scripts, not in DataService

## MonoBehaviour Necessity & Inheritance Depth Audit

8e. **For every class extending MonoBehaviour in this phase**, perform this two-part audit:

### Part 1: MonoBehaviour Justification (is MB truly required?)

For EACH MonoBehaviour, identify which Unity features it actually uses:

| Unity Feature | Justifies MB? | Example |
|---|---|---|
| `[SerializeField]` fields wired in inspector | ✅ YES | Orchestrator with `_pfField_Item` |
| Unity lifecycle (Update/Start/OnEnable/Awake) | ✅ YES | Player controller with Update() movement |
| Coroutines (`StartCoroutine`) | ✅ YES | Timed sequences, delayed actions |
| Physics callbacks (OnCollision/OnTrigger) | ✅ YES | Pickup zone, damage area |
| Needs to exist on a GameObject (AddComponent, GetComponent target) | ✅ YES | Field_ that Orchestrator finds via .gc<T>() |
| Inherits from Singleton<T> (must be on GO) | ✅ YES | Managers |
| None of the above | ❌ CONVERT | Should be plain C# class |

**For each unjustified MB, suggest the correct alternative:**

```
DECISION TREE — What should this class be instead?
─────────────────────────────────────────────────────────────────
Does it hold/manage collections (List<T>, Dictionary<K,V>)?
  → DataService (pure C#, testable via new)

Does it wrap an SO_ with mutable session state?
  → DataWrapper (pure C#, W prefix)

Is it a nested entity (CartItem, InventorySlot, QuestStep)?
  → Nested class inside DataService (pure C#)

Does it compute/validate/format without any Unity API?
  → Static method in Utils.cs, or standalone pure C# class

Does it define state behavior (Enter/Update/Exit)?
  → IState implementation (pure C#, no MB needed)

Does it hold serializable save data?
  → SaveData class (pure C# [Serializable])

Is it a base class that only defines virtual methods + protected fields?
  → KEEP AS MB only if subclasses need lifecycle. Otherwise → pure C# abstract class
```

Output: `| Class | MB Justified? | Unity Features Used | Suggestion (if unjustified) |`

### Part 2: Inheritance Chain Depth Audit (is this chain necessary?)

For every inheritance chain in this phase (A : MonoBehaviour, B : A, C : B, D : B, etc.), map the FULL tree and ask these questions:

**Step 1: Map the chain**
```
Example:
MonoBehaviour
  └── BasePhysicsObject          (phase-All — Rigidbody caching, conveyor velocity)
        └── BaseSellableItem     (phase-All — sell value, ISellable)
              └── BaseHeldTool   (phase-B — equip/unequip, IInventoryItem, camera context)
                    ├── ToolPickaxe    (phase-B — mining raycast)
                    ├── ToolMagnet     (phase-B — grab physics)
                    └── ToolBuilder    (phase-D — placement logic)
```

**Step 2: For each level, ask "Does this level ADD Unity features the parent doesn't have?"**

| Level | Class | Adds Unity Feature? | Adds Virtual Methods? | Adds Interfaces? | Verdict |
|---|---|---|---|---|---|
| 0 | MonoBehaviour | (base) | — | — | Required by Unity |
| 1 | BasePhysicsObject | ✅ Rigidbody, FixedUpdate | ✅ | — | Justified |
| 2 | BaseSellableItem | ❌ No new Unity features | ✅ GetSellValue() | ✅ ISellable | ⚠️ QUESTION |
| 3 | BaseHeldTool | ✅ [SerializeField], coroutines | ✅ | ✅ IInventoryItem | Justified |
| 4 | ToolPickaxe | ✅ Update (raycast), OnTrigger | — | — | Justified |

**Step 3: For each ⚠️ QUESTION level, suggest flattening:**

```
FLATTENING DECISION:
─────────────────────────────────────────────────────────────────
Does this level ONLY add:
  - Virtual methods (no Unity features)?
  - Interface implementations (no Unity features)?
  - Protected fields that don't need [SerializeField]?

IF YES → Can these be:
  1. MERGED UP into the parent class? (add the virtual methods there)
  2. EXTRACTED to an interface? (ISellable already exists — just implement it one level up)
  3. COMPOSED via a helper class? (inject a PriceCalculator instead of inheriting)

IF NO (it genuinely needs to be a separate MB level) → Keep, but document WHY:
  - "BaseSellableItem exists because 3+ different systems inherit sell behavior
     independently of BasePhysicsObject users"
```

**Step 4: Check for these common unnecessary chain patterns:**

| Pattern | Problem | Fix |
|---|---|---|
| A : MB, B : A, C : B — but B adds ZERO Unity features | Unnecessary inheritance level | Merge B's logic into A (if one consumer) or extract to interface/composition |
| Multiple classes inherit from a "base" that only has 1 virtual method | Over-engineering for one override | Inline the logic, use a delegate/strategy, or just duplicate 3 lines |
| Deep chain (4+ levels) where middle levels are "just organizational" | Maintenance nightmare, hard to trace | Flatten — Unity was designed for shallow hierarchies + composition |
| Base class exists only to hold [SerializeField] fields that children read | Unnecessary coupling | Use Owner chain pattern instead (child reads parent via `=> _field`) |
| Abstract base with `protected` fields that could be [SerializeField] in each child | Premature abstraction | Each child declares its own [SerializeField] — more explicit, less coupled |

**Step 5: Justified chains — document WHY**

If the chain IS correct, briefly document the justification:
- "3 levels justified: physics layer → sell layer → tool layer. Each adds Unity features. Subclasses override at the tool level only."
- "Flattening would duplicate 80+ lines of Rigidbody setup across 6 tool types."

Output:
```
## Inheritance Chain Audit
| Chain Root | Depth | Levels | Unjustified Levels | Suggestion |

## Flattening Recommendations
| Current Chain | Issue | Proposed Change | Lines Saved/Impact |
```

## Decoupling & Interface/Bridge Communication Verification

8f. **For EVERY system in this phase**, perform a full decoupling audit in this order:

### Step 1: Classify Each System's Shape

For every `_-Systems/` folder in this phase, identify its shape(s) by reading ALL its code:

| Shape | Emoji | Priority | How to Identify |
|-------|-------|----------|-----------------|
| **Spider** | 🕷️ | 1 (highest) | DEFINES interfaces in `Interface/`, passively RECEIVES implementations via Bridge. Never reaches out. |
| **Hunter** | 🔍 | 2 | DEFINES interfaces, actively SCANS via `GetComponent<IXxx>()` on scene objects. |
| **Adapter** | 🔌 | 3 | IMPLEMENTS interfaces defined by other systems. Plugs into others' sockets. |
| **Broadcaster/Listener** | 📡 | 4 | Fires/subscribes GameEvents only. No interface ownership or implementation. |
| **Infrastructure** | 🌍 | N/A | Used by ALL systems — GameEvents, UIManager, Singleton\<T\>, Utils. Not counted as dep. |

**Priority = portability preference.** Spider is the most portable shape (defines contract, never reaches out). Systems SHOULD use the highest-priority shape that fits their needs.

Output: `| System | Shape(s) | Owns Interfaces | Implements Interfaces | GameEvents (Fire/Subscribe) |`

### Step 2: Validate Shape Matches Communication Pattern

For each system, verify its ACTUAL communication matches its classified shape:

- **🕷️ Spider** must:
  - [ ] Define interfaces in `Interface/` subfolder (or root if only 1)
  - [ ] NEVER use `GetComponent<IXxx>()` to find implementors (that's Hunter behavior)
  - [ ] Receive implementations via Bridge push or GameEvent delivery — always passive
  - [ ] Have zero outward knowledge of who implements its interfaces

- **🔍 Hunter** must:
  - [ ] Define interfaces it needs (same as Spider)
  - [ ] Use `GetComponent<IXxx>()` or `GetComponentInChildren<IXxx>()` to find implementors on GOs it encounters
  - [ ] Only scan objects it already has a reference to (raycasts, collisions, [SerializeField]) — not `FindObjectOfType`
  - [ ] Never require Bridge for interface delivery (it finds them itself)

- **🔌 Adapter** must:
  - [ ] ONLY implement interfaces, never define its own (unless it's a hybrid)
  - [ ] Import ONLY the interface `.cs` file, never the concrete system that defines it
  - [ ] Be removable without affecting the Spider/Hunter that defines the interface

- **📡 Broadcaster/Listener** must:
  - [ ] Communicate ONLY via GameEvents (fire and/or subscribe)
  - [ ] Have zero interface ownership or implementation
  - [ ] Be fully removable — only effect is events stop firing or subscribers lose data

### Step 3: Shape Elevation Analysis (can this system be MORE portable?)

For each system, ask: **"Could this system use a higher-priority shape?"**

```
CURRENT → CAN IT ELEVATE?
────────────────────────────────────────────────────────────────────────
📡 Listener using GetComponent<ConcreteClass>?
  → ELEVATE to 🔍 Hunter: define interface, scan via GetComponent<IXxx>
  → WHY: removes concrete dep, system becomes L0 portable

🔍 Hunter actively scanning scene-wide (FindObjectsByType)?
  → ELEVATE to 🕷️ Spider: define interface, have Bridge push refs in
  → WHY: Spider never reaches out — more portable, testable without scene

🔌 Adapter importing concrete class from another system?
  → ELEVATE to 🔌 Adapter (interface-only): import only the .cs interface file
  → WHY: interface-only dep = still practically portable

📡 Broadcaster passing concrete class in GameEvent signature?
  → ELEVATE to 📡 Broadcaster (interface-based): use Action<IXxx>
  → WHY: GameEvents.cs stays clean, zero _-Systems/ imports

ANY system with Singleton<OtherSystem>.Ins.DoAction()?
  → ELEVATE to 📡 Listener: fire GameEvent instead, let other system subscribe
  → WHY: command-style singleton = tight coupling
```

**CRITICAL: "Keep as-is" is a valid suggestion.** If the current shape is already optimal, document WHY:
- "Spider → cannot elevate further (already highest priority)"
- "Hunter → elevation to Spider would require Bridge for every physics raycast hit — excessive complexity for no portability gain"
- "Adapter with concrete dep → game-specific by PURPOSE (this system only makes sense in this game), elevation provides no value"
- "Broadcaster with concrete Action<SO_Xxx> → this event is phase-internal only, never crosses system boundaries, concrete is acceptable"

Output: `| System | Current Shape | Can Elevate? | To What? | Suggestion | Reasoning |`

### Step 4: Verify Communication Infrastructure

   **Interface ownership check:**
   - [ ] Every interface lives in the system that DEFINES the contract (Spider owns it), NOT the system that implements it
   - [ ] Interface signatures use minimal parameters — object decides its own behavior internally
   - [ ] No interface has methods that leak internal implementation details of the implementor
   - [ ] Multi-tier interfaces (Identity/Mutation/Progress/Tracking) used when 5+ consumers exist
   - [ ] Cross-system interfaces (shared by 3+ systems, not owned by any one) correctly live in `2-Data/Interface/`

   **Bridge validity check:**
   - [ ] Every Bridge lives on the NON-PORTABLE side (game-specific system, not the L0 system)
   - [ ] Bridge pattern matches the data-flow direction:
     - Event-Push: provider implements interface → Bridge fires GameEvent with ref → consumer subscribes
     - Event-Response: Bridge subscribes to GameEvent → calls interface method on received object
     - Push-to-All: Bridge uses `FindObjectsByType` in Start() → pushes self to all consumers
     - Event-Chain: Bridge subscribes to GameEvent A → fires GameEvent B with `this` as interface
     - Static-Accessor: Bridge exposes `public static IXxx Provider { get; private set; }`
   - [ ] Bridge class summary documents: what it bridges, that it's the ONLY connection, why it lives HERE
   - [ ] No Bridge uses `FindObjectOfType` (obsolete) — only `FindObjectsByType<T>(FindObjectsSortMode.None)`
   - [ ] Bridge `Set...Context()` pushes only primitives/transforms, never concrete class references

   **GameEvents decoupling check:**
   - [ ] GameEvents.cs (all partials combined) has ZERO `using` statements from any `_-Systems/` folder
   - [ ] Every event signature uses `Action<IInterface>`, never `Action<ConcreteClass>` or `Action<SO_Xxx>`
   - [ ] Systems that fire events don't know who subscribes (no conditional logic based on subscriber count)
   - [ ] Systems that subscribe don't know who fires (no assumptions about fire order)

   **System independence verification:**
   - [ ] Each `_-Systems/` folder compiles independently — no direct class imports across system boundaries
   - [ ] Removing any single system (deleting its folder) causes ONLY: missing event subscriptions + missing interface implementations. Never compile errors in other systems.
   - [ ] Singleton reads are query-only (`Ins.GetValue()`), never commands (`Ins.DoAction()`) — exception: `UIManager.CloseAllSubManager()`

### Step 5: Fix Suggestions (when violations found)

   **When a violation is found, suggest the correct fix using this decision tree:**

   ```
   VIOLATION: Direct class import across _-Systems/ boundaries
   ├─ Does System A need a ONE-TIME ref from System B at startup?
   │  ├─ System B implements an interface System A defines?
   │  │  └─ FIX: Event-Push Bridge (B fires GameEvent with self as IXxx, A subscribes)
   │  ├─ System A needs runtime context (camera, transform) from B?
   │  │  └─ FIX: Event-Response Bridge (subscribe to equip event → push context via Set...Context())
   │  └─ Multiple instances of A already exist, B needs to push to all?
   │     └─ FIX: Push-to-All Bridge (FindObjectsByType in Start())
   │
   ├─ Does System A need to ANNOUNCE something happened (fire-and-forget)?
   │  └─ FIX: GameEvent — A fires Raise...(), B subscribes. Neither knows the other exists.
   │     └─ If event needs to pass data: define interface in the OWNING system, use Action<IXxx>
   │
   ├─ Does System A need to READ state from System B?
   │  ├─ B is a Singleton Manager (EconomyManager, UIManager)?
   │  │  └─ FIX: Singleton read — Ins.GetValue() (query only, never commands)
   │  ├─ B exposes data via interface?
   │  │  └─ FIX: Static-Accessor Bridge (expose IXxx via static property, consumers read directly)
   │  └─ B is a regular system?
   │     └─ FIX: Define interface in A (Spider pattern), B implements it, Bridge pushes ref to A
   │
   ├─ Does System A need to TRIGGER an action in System B?
   │  └─ FIX: NEVER use Singleton.Ins.DoAction(). Fire GameEvent, let B subscribe and act.
   │     └─ Exception: UIManager.CloseAllSubManager() is the ONLY allowed command-style call
   │
   └─ Does a Bridge need to announce ITSELF as an interface to multiple consumers?
      └─ FIX: Event-Chain Bridge (subscribe to GameEvent A → fire GameEvent B with `this` as IXxx)
   ```

   **"Keep as-is" is also a valid fix.** If in-depth analysis shows the current approach is genuinely better than elevation (complexity cost > portability gain), output:
   - `Suggested Fix: KEEP — [specific reason why current pattern is optimal]`

   Output: `| System A | → | System B | Communication Method | Valid? | Issue (if any) | Suggested Fix |`

## DataService & Testing Completeness

9. For every DataService in this phase:
   - [ ] Every `List<T>` / `Dictionary<K,V>` is in the DataService, not in a MonoBehaviour
   - [ ] Every collection has a PhaseXLOG method (`LIST_X__TO__JSON` / `DOC_X__TO__JSON`)
   - [ ] `GetSnapShotForTest()` calls ALL LOG methods
   - [ ] DEBUG_Check or equivalent test creates DataService via `new`, builds, mutates, logs snapshot
   - [ ] Nested types (e.g. CartItem) live inside the DataService

## Doc Consistency

10. Verify GUIDE.md:
    - Filenames match actual files in phase folder
    - Typing order is valid (no forward dependencies within compile groups)
    - All vertical slice tests have: prerequisites, NOT required, scene setup, controls, checklist
    - Modifications table matches actual cross-phase changes
    - Source vs Phase diff covers all major architectural differences

11. Verify FLOW.md:
    - Event registry matches actual GameEvents.cs (every event listed, correct fire/subscribe)
    - Data flows use correct script/method names
    - System map covers all systems in this phase

12. Verify each Dependency.md (must contain ALL 6 mandatory sections per GOAL.md):
    - **Header** — `# SystemName — L{n} ✅/❌ Portable/Game-Specific` format present
    - **Identity table** — Phase, Level, Scripts, Owns Interface, External _-Systems/ Deps
    - **FREE Requirements** — Table: GameEvents, UIManager, GlobalEnums, Utils — From + Why
    - **Internal File Dependency Graph** — 3-zone left-border ASCII diagram (Internal → Boundary → External)
    - **Future Phase Modifications** — Table: Phase, What Changes, Breaking?
    - **Verdict** — One line: COMPLETE / MOSTLY COMPLETE / PARTIAL / PERMANENTLY COMPLETE
    - **Checklist** — Pass/fail items for portability + architecture rules
    - Level (L0/L1+) matches actual imports
    - Shape matches actual behavior (Spider/Hunter/Adapter/Broadcaster)
    - All concrete deps are flagged and addressed

13. Verify Manual/*.md test guides:
    - Every system with visual/physics behavior has a Manual test guide
    - Each guide has: prerequisites, step-by-step scene setup, DO/EXPECT steps, pass/fail checklist
    - Complex systems have a **"How It Works"** prose section explaining the full data-flow lifecycle
    - Scene setup tables include every GO, component, and `| Field | Drag From |` wiring

## Pattern Discovery for GOAL.md

14. Review the phase for **new architectural patterns** not already in GOAL.md:
    - Did this phase introduce a new interaction flow (equip/drop/stack, conveyor chain, multi-step crafting)?
    - Did this phase create a new Bridge pattern variant?
    - Did this phase establish a new interface design worth reusing?
    - Did this phase introduce a new `#region` or code organization pattern?
    - For each discovery: describe the pattern, cite the specific scripts that use it, explain when future phases should reuse it.
    - Output: `| Pattern | Scripts | Should Add to GOAL.md? | Reason |`
    - If YES for any pattern, generate the exact `### [Pattern Name]` section to append to GOAL.md's "Game-Specific Patterns" section.

## SystemPortabilityMap.md Update

15. After verifying all Dependency.md files, update `LEARN/{PROJECT}/SystemPortabilityMap.md` with:
    - Corrected portability levels for any systems where the audit found misclassification
    - New aggregate counts: total L0, total L1, total L2+, total interfaces, total bridges
    - If `LEARN/{PROJECT}/SystemIsolationAnalysis.md` exists, verify its communication matrix is still accurate after this audit

## Report

16. Output comprehensive audit table:
    ```
    ## Source Fidelity (including nice-to-haves)
    | Original File | Methods Checked | ✅ | ❌ | ⚠️ | Nice-to-haves Present? | Notes |

    ## Architecture Violations
    | Violation Type | File | Line | Fix Applied |

    ## Common Mistakes (35 checks)
    | Mistake # | Status (Clean/Found) | File | Details |

    ## Pitfall Susceptibility (13 checks)
    | Pitfall # | Status (Safe/At Risk) | File | Details |

    ## System Shape Classification
    | System | Shape(s) | Owns Interfaces | Implements Interfaces | GameEvents (Fire/Subscribe) |

    ## Shape Elevation Analysis
    | System | Current Shape | Can Elevate? | To What? | Suggestion | Reasoning |

    ## MonoBehaviour Justification
    | Class | MB Justified? | Unity Features Used | Suggestion (if unjustified) |

    ## Inheritance Chain Audit
    | Chain Root | Depth | Levels | Unjustified Levels | Suggestion |

    ## Flattening Recommendations
    | Current Chain | Issue | Proposed Change | Lines Saved/Impact |

    ## Decoupling & Communication Validity
    | System A | → | System B | Method (Interface/Bridge/GameEvent) | Valid? | Issue | Suggested Fix |

    ## DataService Completeness
    | DataService | Collections | LOG Methods | Snapshot | Test |

    ## Doc Consistency
    | Check | Pass/Fail | Details |

    ## Dependency.md Structural Completeness
    | System | Header | Identity | FREE | Diagram | Future Mods | Verdict | Checklist |

    ## Manual Test Quality
    | System | Has Manual/*.md? | Has "How It Works"? | Scene Setup Complete? |

    ## Pattern Discovery
    | Pattern | Scripts | Add to GOAL.md? | Reason |

    ## Portability Update
    | System | Previous Level | Audited Level | Changed? |

    ## Unlisted Functionality Discovered
    | Source File | Method/Feature | Classification | Action |

    ## Summary
    Source fidelity: X/Y methods matched (including N nice-to-haves in #region Extra)
    Architecture violations: N found, N fixed
    Common mistakes (35): N found, N fixed
    Pitfalls (13): N at risk, N addressed
    MonoBehaviour audit: N classes checked, N unjustified (suggest conversion to plain C#)
    Inheritance chains: N chains mapped, N levels flagged for flattening
    Decoupling validity: N cross-system links verified, N issues found
    DataService: N complete, N incomplete
    Doc consistency: N pass, N fail
    Dependency.md structure: N complete (all 6 sections), N incomplete
    Manual tests: N complete, N missing "How It Works"
    New patterns for GOAL.md: N discovered
    Portability corrections: N systems updated
    Unlisted functionality: N critical, N important, N nice-to-have discovered
    ```
