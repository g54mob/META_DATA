# .github/ Framework — Audit-Required TODO

> Last assessed: 2025-05-24 | Projects scanned: 29 | Source: MAIN-SOURCE/ only
> Total .cs files scanned: ~55,000 (after excluding third-party libs)

---

## Project Inventory

| # | Project | Total .cs | Game Code .cs | Third-Party Libraries | Size Class |
|---|---------|-----------|---------------|-----------------------|------------|
| 1 | _1.0.1 | 61 | 61 | — (framework/template) | Small |
| 2 | basementToSky | 1856 | 1813 | Enviro3, PaintIn3D, Barmetler.RoadSystem | Large |
| 3 | bdp | 97 | 55 | RTLTMPro | Small |
| 4 | bsge | 6222 | 5189 | RakNet, ch.sycoforge.Decal | Massive |
| 5 | btycoon | 5517 | 5329 | Animancer, A*Pathfinding, Cinemachine, EasySave3, DOTween, PixelCrushers, spine | Massive |
| 6 | contentWarn | 2786 | 2069 | Photon PUN2+Voice, Odin, Zorro | Large |
| 7 | dCentre | 245 | 237 | EPO | Medium |
| 8 | frkt | 1867 | 1432 | Zenject, AdvancedDissolve, Odin | Large |
| 9 | fwr | 592 | 542 | FMOD | Medium |
| 10 | loop-2025 | 149 | 149 | — | Medium |
| 11 | megbonk | 2227 | 2227 | Rewired, Discord SDK | Large |
| 12 | minemgl | 399 | 357 | DOTween, SSCC | Medium |
| 13 | modulus | 4356 | 4085 | FMOD, PlayFab, Discord SDK, Shapes | Large |
| 14 | noimnot | 1529 | 1516 | YarnSpinner, ECM2, Zenject, UniTask, DOTween | Large |
| 15 | obradin | 1626 | 1623 | Rewired | Large |
| 16 | papersPls | 1334 | 1330 | — | Large |
| 17 | peoplePlayGrnd | 2761 | 1786 | Ceras, NAudio, WatsonTcp | Large |
| 18 | polybridge3 | 2730 | 2320 | Odin | Large |
| 19 | rimWrld | 9806 | 9763 | NAudio, NVorbis, ISharpZipLib | Massive |
| 20 | schedule-1 | 4018 | 3860 | FishNet, A*Pathfinding, Cinemachine | Large |
| 21 | shapeFactr | 2333 | 2297 | DOTween, spine, UniTask | Large |
| 22 | smarket | 3413 | 3314 | Cinemachine, DOTween, Photon PUN2, NodeCanvas, Dreamteck Splines, LeanPool | Large |
| 23 | stackLand | 1955 | 909 | DOTween, Odin, ImGui.NET | Large |
| 24 | stickfgt | 1402 | 1399 | Lidgren.Network | Large |
| 25 | tabs | 5858 | 4911 | A*Pathfinding, Cinemachine, PhotonBolt, InControl, Bolt, Odin, mod.io | Massive |
| 26 | throneFall | 3607 | 3279 | A*Pathfinding, Rewired, MoreMountains.Feedbacks, Shapes | Large |
| 27 | twFactory | 1250 | 788 | Cinemachine, AllIn1Vfx, Odin | Large |
| 28 | welcmHome | 607 | 565 | FMOD, PSX Render Pipeline, TextAnimator | Medium |
| 29 | wrngfloor | 79 | 49 | — | Small |

---

## Genre Classification Summary

| # | Project | Genre | Core Mechanic | Perspective | Multiplayer |
|---|---------|-------|---------------|-------------|-------------|
| 1 | _1.0.1 | Framework | Reusable system templates | FPS | None |
| 2 | basementToSky | Life Sim / Open World | Cooking, crafting, quests, vehicles | FPS | None |
| 3 | bdp | Horror Adventure | Puzzle exploration | FPS | None |
| 4 | bsge | Physics Sandbox Builder | Build & destroy siege machines | 3D Free | LAN (RakNet) |
| 5 | btycoon | Business Tycoon | Grid building, NPC management, economy | Isometric/TPS | None |
| 6 | contentWarn | Co-op Horror | Found footage, cooperative exploration | FPS | Online (Photon PUN2) |
| 7 | dCentre | Business Sim | Data center management | FPS/TPS | None |
| 8 | frkt | Physics Fighting | Ragdoll combat | TPS | None |
| 9 | fwr | Puzzle/Adventure | Item-based puzzles | FPS | None |
| 10 | loop-2025 | Visual Novel / Tool | Ink-based interactive fiction + text editor | 2D | None |
| 11 | megbonk | Action RPG | Enemy combat, exploration, spawning | TPS | None |
| 12 | minemgl | Mining FPS | Mine ore, build machines, automate | FPS | None |
| 13 | modulus | Factory Automation | Build factories, production chains | Isometric | None |
| 14 | noimnot | Narrative Adventure | Dialogue-driven, NPC scheduling, day/night | 2.5D | None |
| 15 | obradin | Narrative Sim | Story-driven investigation, schedules | 2D/Isometric | None |
| 16 | papersPls | Document Puzzle | Document inspection | 2D | None |
| 17 | peoplePlayGrnd | Physics Sandbox | Physics experimentation | 2D | None |
| 18 | polybridge3 | Physics Puzzle | Bridge building + stress simulation | 2D/3D | None |
| 19 | rimWrld | Colony Sim | Colonist management, AI | Top-down 2D | None |
| 20 | schedule-1 | Drug Empire Sim | Production, dealing, NPC AI, police | FPS | Online (FishNet) |
| 21 | shapeFactr | Action Roguelite | Turn-based/real-time combat, waves | 2D | None |
| 22 | smarket | Business Tycoon | Supermarket management, NPC customers | FPS | Online (Photon PUN2) |
| 23 | stackLand | Card/Deck Builder | Card combos, survival | Top-down 2D | None |
| 24 | stickfgt | Physics Fighting | Ragdoll combat | 2D | LAN (Lidgren) |
| 25 | tabs | Physics Battle Sim | Unit placement, physics battles | TPS | Online (PhotonBolt) |
| 26 | throneFall | Tower Defense / Strategy | Build + defend, day/night waves | TPS | None |
| 27 | twFactory | Factory / Tower Defense | Factory building + tower defense waves | Isometric | None |
| 28 | welcmHome | Horror Adventure | Exploration, AI stalking, quests | FPS | None |
| 29 | wrngfloor | Horror Puzzle | Short horror, AI patrol | FPS | None |

---

## Domain Demand Matrix

Legend: ✅ = Central | ⚡ = Supporting | · = Minor/Absent

| Domain | _1 | bTS | bdp | bsge | btyc | cWrn | dC | frkt | fwr | loop | megb | mine | modu | noim | obra | ppls | pPG | pb3 | rimW | sch1 | shpF | smar | stLd | stFg | tabs | thrF | twFa | wlcH | wrng | **Count** |
|--------|-----|-----|-----|------|------|------|-----|------|-----|------|------|------|------|------|------|------|------|------|------|------|------|------|------|------|------|------|------|------|------|-------|
| **Save/Load** | · | ✅ | · | ⚡ | ✅ | ⚡ | ✅ | · | · | · | ✅ | ✅ | ✅ | ✅ | ✅ | ⚡ | · | ✅ | ⚡ | ✅ | ⚡ | ✅ | ✅ | · | ✅ | ✅ | ✅ | · | · | **20** |
| **FSM** | · | · | · | ⚡ | ✅ | ✅ | ✅ | ✅ | · | · | ✅ | · | · | ✅ | · | · | ⚡ | · | ⚡ | ✅ | ✅ | ✅ | · | · | ✅ | ✅ | · | · | · | **14** |
| **Audio** | ✅ | ✅ | · | ✅ | ✅ | ✅ | ✅ | ⚡ | ✅ | · | ✅ | ✅ | ✅ | ⚡ | ✅ | · | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | · | ✅ | **25** |
| **Input** | ⚡ | ✅ | · | ✅ | ✅ | · | ✅ | ⚡ | · | · | ✅ | ✅ | ✅ | ⚡ | ✅ | · | ⚡ | ✅ | · | · | ✅ | ✅ | · | · | · | ✅ | ⚡ | ⚡ | · | **16** |
| **Physics** | ⚡ | ✅ | · | ✅ | ⚡ | ✅ | · | ✅ | · | · | · | ✅ | ⚡ | · | · | · | ✅ | ✅ | · | ⚡ | · | ✅ | · | ✅ | ✅ | ⚡ | ⚡ | ⚡ | · | **15** |
| **Animation** | ⚡ | ⚡ | · | ⚡ | ✅ | ✅ | · | · | · | · | · | ⚡ | ⚡ | · | · | · | · | · | · | ⚡ | ⚡ | · | · | · | ⚡ | ✅ | · | ⚡ | · | **10** |
| **Day/Night** | · | ⚡ | · | · | · | ✅ | · | · | · | · | · | ✅ | ✅ | ✅ | · | · | · | ⚡ | · | ⚡ | · | ✅ | · | · | · | ✅ | ✅ | · | · | **9** |
| **NavMesh/AI** | · | · | · | · | ⚡ | ⚡ | · | · | · | · | · | · | · | ✅ | · | · | · | · | · | ⚡ | · | ✅ | · | · | · | · | ✅ | ⚡ | · | **7** |
| **Networking** | · | · | · | ⚡ | · | ✅ | · | · | · | · | · | · | · | · | · | · | · | · | · | ✅ | · | ✅ | · | ⚡ | ✅ | · | · | · | · | **5** |
| **Cinemachine** | · | · | · | · | ✅ | · | · | · | · | · | · | · | · | · | · | · | · | · | · | ✅ | · | ✅ | · | · | ✅ | · | ✅ | · | · | **5** |
| **ProcGen** | · | · | · | · | · | ⚡ | · | · | · | · | ⚡ | · | · | · | · | · | ✅ | · | ✅ | · | · | · | · | · | ✅ | ✅ | · | · | · | **5** |
| **Quests** | · | ✅ | · | · | · | · | · | · | · | · | · | ✅ | ✅ | · | · | · | · | · | ✅ | ⚡ | · | · | ✅ | · | · | · | · | · | · | **5** |
| **NPC Sched** | · | · | · | · | · | · | · | · | · | · | · | · | · | ✅ | ✅ | · | · | · | ✅ | ✅ | · | · | · | · | · | · | · | · | · | **4** |
| **Inventory** | · | · | · | · | ⚡ | · | · | · | · | · | · | ⚡ | · | · | · | · | · | · | ⚡ | · | · | · | · | · | · | · | ⚡ | · | · | **4** |
| **Dialogue** | · | ⚡ | · | · | ✅ | · | · | · | · | · | · | · | · | ✅ | · | · | · | · | · | · | · | · | · | · | · | · | · | · | · | **3** |
| **Wave/Spawn** | · | · | · | · | · | · | · | · | · | · | ⚡ | · | · | · | · | · | · | · | · | · | · | · | ⚡ | · | · | ✅ | · | · | · | **3** |

### Skill Coverage Summary

| Domain Area | Significant Projects | Covered by Skill? | Gap Priority |
|-------------|---------------------|-------------------|--------------|
| **Save/Load** | 20 | ❌ None | 🔴 Critical |
| **FSM/StateMachine** | 14 | ❌ None | 🔴 Critical |
| **Audio** | 25 | ✅ unity-audio (genre-blind) | 🟡 Update |
| **Input System** | 16 | ❌ None | 🟡 Important |
| **Physics-Heavy** | 15 | ❌ None | 🟡 Important |
| **Animation** | 10 | ✅ unity-animation (genre-blind) | 🟡 Update |
| **Day/Night Cycle** | 9 | ❌ None | 🟡 Important |
| **NavMesh/AI** | 7 | ❌ None | 🟡 Important |
| **Networking** | 5 | ❌ None | 🟡 Important |
| **Cinemachine/Camera** | 5 | ❌ None | 🟢 Nice-to-have |
| **Quests** | 5 | ❌ None | 🟢 Nice-to-have |
| **Procedural Gen** | 5 | ❌ None | 🟢 Nice-to-have |
| **NPC Schedule** | 4 | ❌ None | 🟢 Nice-to-have |
| **Inventory** | 4 | ❌ None | 🟢 Nice-to-have |
| **Dialogue** | 3 | ❌ None | 🟢 Nice-to-have |
| **Prefab Hierarchy** | All | ✅ unity-prefab-hierarchy (genre-blind) | 🟡 Update |
| **Scene Setup** | All | ✅ unity-scene-setup (genre-blind) | 🟡 Update |
| **Testing** | All | ✅ unity-testing (mostly OK) | 🟢 Minor update |

---

## 🔴 Critical Items

### TODO-1: Create `unity-save-load` skill

**Type:** `create-skill`
**File:** `.github/skills/unity-save-load/SKILL.md`
**Priority:** 🔴 Critical
**Projects affected:** 20/29 — basementToSky, bsge, btycoon, contentWarn, dCentre, megbonk, minemgl, modulus, noimnot, obradin, papersPls, polybridge3, rimWrld, schedule-1, shapeFactr, smarket, stackLand, tabs, throneFall, twFactory
**Justification:** Save/Load is present in 20+ projects — the single most common gameplay system after audio. Without guidance, agents produce SaveData mixed into MonoBehaviour, no ISaveable interface, hardcoded serialization, missing versioning, PlayerPrefs for complex data.

**Source evidence — key files per project:**

| Project | Key Files | Core Pattern |
|---------|-----------|-------------|
| minemgl | `ISaveLoadableObject.cs`, `SavingLoadingManager.cs`, `AutoSaveManager.cs` | ISaveLoadableObject interface + JSON per-object |
| btycoon | `Scripts/EasySave3/ES3.cs`, `ES3UserType_*.cs` (40+ converters) | EasySave3 + auto-generated type converters |
| schedule-1 | `ScheduleOne/Persistence/ISaveable.cs`, `SaveManager.cs` | ISaveable + folder-based JSON + versioning (SAVES_PER_FRAME=15) |
| throneFall | `ISaveLoad.cs`, `SaveLoadManager.cs` | ISaveLoad callback interface (Before/Main/After phases) |
| modulus | `SaveSystem.cs` | Newtonsoft.Json + custom converters + TypeNameHandling.Auto |
| obradin | `Awards.cs`, `Book.cs`, `BookAction.cs` (408 matches) | Deep save across all gameplay objects |
| dCentre | `CableEndpointSaveData.cs`, `CableSaveData.cs` | Typed SaveData classes per entity |

**Cross-project consensus:**

| Pattern | Count | Consensus? | Core/Variant |
|---------|-------|-----------|-------------|
| ISaveable/ISaveLoadable interface | 5/20 | ✅ Yes | **Core** |
| Singleton SaveManager | 5/20 | ✅ Yes | **Core** |
| Separate SaveData classes (pure C#) | 6/20 | ✅ Yes | **Core** |
| JSON serialization | 4/20 | ✅ Yes | **Core** |
| PlayerPrefs for settings only | 8/20 | ✅ Yes | **Core** |
| EasySave3 (ES3) | 1/20 | ❌ | Variant |
| Binary serialization | 2/20 | ❌ | Variant |
| Save versioning/migration | 2/20 | ⚠️ Emerging | Core (best practice) |
| Multi-phase load (Before/Main/After) | 2/20 | ⚠️ Emerging | Variant |

**What the skill MUST cover:**
1. Architecture Overview — SaveManager singleton, ISaveable interface, SaveData classes
2. Core Pattern — ISaveable contract (what methods, when called, lifecycle)
3. SaveData Pattern — pure C# classes, separate from MonoBehaviour, JSON-serializable
4. SaveManager — file I/O, slot management, auto-save, corruption protection
5. Serialization — JSON (default), binary (variant), ES3 (third-party variant)
6. Integration — how SaveData maps to DataService, how GameEvents trigger save/load
7. Versioning — schema migration pattern (version number + upgrade chain)
8. Pitfalls — SaveData in MonoBehaviour, PlayerPrefs for complex data, missing null checks on load, save order deps

**Key code files to extract patterns from (for /implement-audit-todo):**
- `MAIN-SOURCE/minemgl/Scripts/Assembly-CSharp/ISaveLoadableObject.cs` — interface contract
- `MAIN-SOURCE/minemgl/Scripts/Assembly-CSharp/SavingLoadingManager.cs` — manager pattern
- `MAIN-SOURCE/schedule-1/Scripts/Assembly-CSharp/ScheduleOne/Persistence/ISaveable.cs` — versioned interface
- `MAIN-SOURCE/schedule-1/Scripts/Assembly-CSharp/ScheduleOne/Persistence/SaveManager.cs` — queued save manager
- `MAIN-SOURCE/throneFall/Scripts/Assembly-CSharp/ISaveLoad.cs` — callback lifecycle
- `MAIN-SOURCE/dCentre/Scripts/Assembly-CSharp/CableEndpointSaveData.cs` — typed SaveData class

**Acceptance criteria:**
- [ ] ISaveable interface defined with lifecycle methods
- [ ] SaveData pure C# class pattern documented
- [ ] SaveManager singleton pattern with file I/O
- [ ] JSON serialization as default, variants documented
- [ ] Integration with DataService/GameEvents documented
- [ ] 5+ pitfalls listed with solutions
- [ ] Works for ALL genres (mining, tycoon, horror, strategy, sandbox, 2D)

---

### TODO-2: Create `unity-fsm` skill

**Type:** `create-skill`
**File:** `.github/skills/unity-fsm/SKILL.md`
**Priority:** 🔴 Critical
**Projects affected:** 14/29 — bsge, btycoon, contentWarn, dCentre, frkt, megbonk, noimnot, peoplePlayGrnd, schedule-1, shapeFactr, smarket, tabs, throneFall, twFactory
**Justification:** FSM is the #1 AI/gameplay pattern. Without guidance, agents produce giant switch statements, miss Enter/Exit lifecycle, create direct state-to-state references, and reimplements from scratch each time.

**Source evidence — key files per project:**

| Project | Key Files | Core Pattern |
|---------|-----------|-------------|
| smarket | `Baker.cs` (nested IState), `BakerIdleState.cs`, `SecurityGuardState.cs` | Nested IState + StateMachine class |
| btycoon | `Animancer.FSM/` folder, `IKeyedStateMachine.cs`, `DelegateState.cs` | Animancer.FSM library (generic keyed SM) |
| noimnot | 2877 matches — pervasive | Pervasive state management across all systems |
| throneFall | `AIBrain.cs`, `IOffMeshLinkStateMachine.cs` | AI brain + pathfinding FSM |
| shapeFactr | `ActionState.cs`, `BaseEnemy.cs`, `BaseBullet.cs` (816 matches) | Action/combat state pattern |
| contentWarn | `ConnectionState.cs`, `ConnectionStateHandler.cs` | Network connection FSM |
| dCentre | `ActionKeyHint.cs`, `AudioManager.cs` (73 matches) | UI/interaction FSM |
| tabs | `ChangeStateEvent.cs`, `UIComponentBase.cs` (270 matches) | Bolt + custom FSM |

**Cross-project consensus:**

| Pattern | Count | Consensus? | Core/Variant |
|---------|-------|-----------|-------------|
| IState with Enter/Update/Exit | 6/14 | ✅ Yes | **Core** |
| StateMachine class with currentState | 5/14 | ✅ Yes | **Core** |
| State as separate class (not switch) | 8/14 | ✅ Yes | **Core** |
| Nested IState inside controller | 3/14 | ⚠️ | Core (recommended) |
| Enum parallel to state classes | 3/14 | ⚠️ | Core (ID tracking) |
| State inheritance chains | 3/14 | ⚠️ | Variant |
| BehaviorTree (vs FSM) | 2/14 | ❌ | Variant |

**What the skill MUST cover:**
1. Architecture Overview — when to use FSM vs BehaviorTree vs simple enum
2. IState Interface — Enter(), Update(), Exit() contract
3. StateMachine Class — ChangeState(), currentState tracking, null-state handling
4. State Implementation — one class per state, constructor injection of controller
5. Nested vs Top-Level — when to nest IState inside controller class
6. Enum State IDs — TagType-style enum alongside state classes
7. Integration — FSM in AI (NPC/enemy), FSM in UI (panels/menus), FSM in gameplay (game phases)
8. Pitfalls — missing Exit() cleanup, state leaks, direct state-to-state refs, Update in wrong state

**Key code files to extract patterns from:**
- `MAIN-SOURCE/smarket/Scripts/Assembly-CSharp/Baker.cs` — nested IState + StateMachine
- `MAIN-SOURCE/smarket/Scripts/Assembly-CSharp/BakerIdleState.cs` — state implementation
- `MAIN-SOURCE/throneFall/Scripts/Assembly-CSharp/AIBrain.cs` — AI brain FSM
- `MAIN-SOURCE/shapeFactr/Scripts/Assembly-CSharp/ActionState.cs` — combat state

**Acceptance criteria:**
- [ ] IState interface defined
- [ ] StateMachine class pattern documented
- [ ] State implementation pattern with Enter/Update/Exit
- [ ] Integration with GameEvents for state change notifications
- [ ] Nested IState pattern documented
- [ ] 5+ pitfalls listed
- [ ] Works for AI, UI, and gameplay FSMs

---

### TODO-3: Update conventions — add FSM and Save/Load class roles

**Type:** `edit-convention`
**File:** `.github/instructions/csharp-conventions.instructions.md`
**Priority:** 🔴 Critical
**Projects affected:** All 29
**Source evidence:** FSM in 14 projects, Save/Load in 20 projects

**What to change:**
1. **Add to Class Responsibilities section:**
   - `StateMachine` — holds currentState, ChangeState(), no game logic
   - `IState` — Enter/Update/Exit, one class per state
   - `SaveData` — pure C# class, no MonoBehaviour, JSON-serializable
   - `ISaveable` — interface for objects participating in save/load
2. **Add to Naming section:**
   - `StateMachine` suffix for state machine classes
   - `State` suffix for state classes (e.g., `IdleState`, `ChaseState`)
   - `SaveData` suffix for save data classes (e.g., `PlayerSaveData`)
3. **Add to Common Mistakes section:**
   - ❌ Giant switch statements for state management → use IState pattern
   - ❌ SaveData fields inside MonoBehaviour → use separate pure C# SaveData class
   - ❌ PlayerPrefs for complex game data → use file-based JSON saves
4. **Add to Decoupling section:**
   - States communicate via StateMachine.ChangeState(), not direct refs
   - SaveManager fires GameEvents (OnSaveStart, OnSaveComplete), not direct calls

**Acceptance criteria:**
- [ ] StateMachine/IState/SaveData class roles documented
- [ ] Naming conventions added
- [ ] 3+ new common mistakes added
- [ ] Decoupling rules for FSM and Save/Load added

---

## 🟡 Important Items

### TODO-4: Create `unity-day-night` skill

**Type:** `create-skill`
**File:** `.github/skills/unity-day-night/SKILL.md`
**Priority:** 🟡 Important
**Projects affected:** 9/29 — basementToSky, contentWarn, minemgl, modulus, noimnot, polybridge3, smarket, throneFall, twFactory

**Source evidence:**

| Project | Matches | Key Files | Pattern |
|---------|---------|-----------|---------|
| throneFall | 211 | `AutoDayNight.cs`, `DayNightCycle.cs`, `AudioDayNightFader.cs` | Gameplay-driven (day=build, night=defend) |
| contentWarn | 107 | `Bed.cs`, `Connection.cs`, `DivingBell.cs` | Time-pressure mechanic |
| twFactory | 93 | `DayNightCycle.cs`, `AmbienceManager.cs`, `LevelData.cs` | Cycle affects spawning + ambience |
| noimnot | 66 | `CharactersManager.cs`, `ICharactersManager.cs` | NPC schedule driver |
| modulus | 61 | `DayNightCycleMomentSO.cs`, `EnableDayNightCycleValidator.cs` | SO-driven moment definitions |
| smarket | 38 | `AutoPaymentManager.cs`, `BankManager.cs`, `BillsTab.cs` | Economic cycle |
| minemgl | 29 | `JDayNightCycle.cs`, `JDayNightCycleProfile.cs` | Jupiter-branded profile |

**What the skill MUST cover:** TimeOfDay controller, lighting transitions, gameplay hooks, GameEvents (OnDayStart/OnNightStart/OnTimeChanged), genre variants (outdoor sun-driven, underground artificial, gameplay-driving vs cosmetic)

**Acceptance criteria:**
- [ ] TimeOfDay controller pattern documented
- [ ] Lighting integration documented
- [ ] GameEvents for time triggers
- [ ] Genre variants

---

### TODO-5: Create `unity-ai-navigation` skill

**Type:** `create-skill`
**File:** `.github/skills/unity-ai-navigation/SKILL.md`
**Priority:** 🟡 Important
**Projects affected:** 7/29 — btycoon, contentWarn, noimnot, schedule-1, smarket, twFactory, welcmHome

**Source evidence:**

| Project | Matches | Key Files |
|---------|---------|-----------|
| smarket | 57 | `Baker.cs`, `BakerIdleState.cs` — NPC AI |
| twFactory | 37 | `MovementComponent.cs` — enemy pathfinding |
| noimnot | 31 | `NavMeshCharacter.cs` — NPC navigation |
| schedule-1 | 16 | `Employee.cs`, `NavMeshUtility.cs` — NPC AI |
| btycoon | 15 | `AgentPathing.cs`, `AgentMovement.cs` — customer movement |
| contentWarn | 12 | `Bot_Nav_Navmesh.cs` — monster AI |
| welcmHome | 9 | `AIFollower.cs`, `AIPatrol.cs` — stalker AI |

**What to cover:** NavMeshAgent setup, FSM integration, A*Pathfinding vs Unity NavMesh (5 projects use A*), dynamic rebaking, group movement. Note: A*Pathfinding used by btycoon, schedule-1, smarket, tabs, throneFall.

**Acceptance criteria:**
- [ ] NavMeshAgent setup pattern
- [ ] FSM integration
- [ ] A*Pathfinding variant noted
- [ ] 3+ pitfalls

---

### TODO-6: Create `unity-networking` skill

**Type:** `create-skill`
**File:** `.github/skills/unity-networking/SKILL.md`
**Priority:** 🟡 Important
**Projects affected:** 5/29 — schedule-1 (FishNet), contentWarn (Photon PUN2), smarket (Photon PUN2), tabs (PhotonBolt), bsge (RakNet)

**Source evidence:**

| Project | Library | Matches | Key Pattern |
|---------|---------|---------|-------------|
| schedule-1 | FishNet | 1017 | `[ServerRpc]`, `[ObserversRpc]`, `NetworkBehaviour`, `SyncVar` |
| contentWarn | Photon PUN2 | — | `Photon*/`, `PhotonVoice*/`, `Zorro.PhotonUtility/` |
| smarket | Photon PUN2 | — | `PhotonUnityNetworking*/` |
| tabs | PhotonBolt | — | `PhotonBolt/`, `bolt/` |
| bsge | RakNet | — | `RakNetSwig/`, `NATTraversalForUNET/` |

**FishNet pattern found (schedule-1):**
```csharp
public class NetworkedInteractableToggleable : NetworkBehaviour
{
    [ServerRpc(RequireOwnership = false, RunLocally = true)]
    public void SendToggle() { }
    [ObserversRpc(RunLocally = true)]
    public void SetState(NetworkConnection conn, bool activated) { }
}
```

**What to cover:** Client/Server split, RPC attributes, ownership model, state sync (SyncVar/SyncList), DataService integration, Photon vs FishNet variants, intentional coupling allowlist

**Acceptance criteria:**
- [ ] Client/Server architecture documented
- [ ] RPC patterns documented
- [ ] Ownership/authority model
- [ ] DataService integration
- [ ] decouple-check allowlist specified

---

### TODO-7: Update `unity-audio` — remove genre-blind assumptions

**Type:** `update-skill`
**File:** `.github/skills/unity-audio/SKILL.md`
**Priority:** 🟡 Important
**Projects affected:** 25/29

**Current assumptions that break:**

| Assumption | Breaks For | What They Do Instead |
|-----------|-----------|---------------------|
| "Underground mine" environment | 24/29 outdoor projects | Outdoor spatial audio, skybox ambience |
| Pool size = 30 hardcoded | Small games (bdp, wrngfloor) | 5-10 sounds max |
| All audio is 3D spatial | 2D games (noimnot, shapeFactr, stackLand, papersPls) | spatialBlend=0 |
| No music/soundtrack system | 15+ projects with music | MusicManager, crossfading |
| No FMOD/Wwise | 3 projects (fwr, modulus, welcmHome) | FMOD Studio integration |
| Conveyor belt dynamic mixing | Only minemgl | No conveyor audio |
| SoundDefinition SO | Only minemgl | Direct AudioClip, AudioSet, AudioData |

**What to change:**
1. Add "Genre Context" section — 3D spatial (default), 2D non-spatial, mixed
2. Make pool size configurable (not hardcoded 30)
3. Add Music system section (MusicManager, crossfading, layers)
4. Add FMOD variant section
5. Generalize SoundDefinition to "Audio Data Pattern"
6. Move conveyor content to "Mining Genre Variant" subsection
7. Add 2D audio section

**Acceptance criteria:**
- [ ] Mine-specific references removed from core
- [ ] Pool size parameterized
- [ ] Music system section added
- [ ] FMOD variant noted
- [ ] 2D audio variant added

---

### TODO-8: Update `unity-animation` — remove genre-blind assumptions

**Type:** `update-skill`
**File:** `.github/skills/unity-animation/SKILL.md`
**Priority:** 🟡 Important
**Projects affected:** 10/29

**Assumptions that break:**

| Assumption | Breaks For | Alternative |
|-----------|-----------|------------|
| Tool ViewModel/WorldModel split | 22/29 non-tool games | Character/enemy/UI animation |
| AnimParamType enum | Animancer projects | State-based, no strings |
| Code-driven rotation for machines | 26/29 non-machine games | Animator, DOTween, spine |
| Conveyor UV scrolling | 28/29 projects | No conveyors |

**What to change:**
1. Restructure around animation CATEGORIES (character, enemy, UI, environmental)
2. Add spine-unity variant (btycoon, shapeFactr)
3. Add DOTween motion section (8+ projects)
4. Move mining content to genre variant

**Acceptance criteria:**
- [ ] Categories restructured
- [ ] Mining content → genre variant
- [ ] Spine-unity + DOTween noted

---

### TODO-9: Update `unity-prefab-hierarchy` — remove genre-blind assumptions

**Type:** `update-skill`
**File:** `.github/skills/unity-prefab-hierarchy/SKILL.md`
**Priority:** 🟡 Important
**Projects affected:** All 29

**Assumptions that break:** ViewModel/WorldModel (22/29), machine collider zones (26/29), OrePiece (28/29), ConveyorBelt (28/29), ModularSupports (28/29) — all mining-specific.

**What to change:**
1. Restructure around UNIVERSAL prefab patterns: Player, NPC, Interactable, Building, Projectile, UI
2. Keep mining patterns as genre variant
3. Preserve "flat hierarchy" as universal principle

**Acceptance criteria:**
- [ ] Universal prefab patterns documented
- [ ] Mining → genre variant
- [ ] Flat hierarchy preserved

---

### TODO-10: Update `unity-scene-setup` — remove genre-blind assumptions

**Type:** `update-skill`
**File:** `.github/skills/unity-scene-setup/SKILL.md`
**Priority:** 🟡 Important
**Projects affected:** All 29

**Assumptions that break:** Underground/no sun/no skybox (20+ outdoor), dark ambient (bright games), point lights only (directional sun games), mine layers, ghost preview (building games only).

**What to change:**
1. Add "Lighting Profiles" section (outdoor daytime, outdoor night, indoor/underground, 2D)
2. Make layer list genre-configurable
3. Generalize ghost preview to "Placement Preview"
4. Move mine content to genre variant

**Acceptance criteria:**
- [ ] Multiple lighting profiles
- [ ] Layers generalized
- [ ] Mine content → genre variant

---

### TODO-11: Update `GOAL-general.md` — add Save/Load, FSM, Input sections

**Type:** `edit-template`
**File:** `.github/templates/GOAL-general.md`
**Priority:** 🟡 Important
**Projects affected:** All future projects

**What to change:**
1. Add **Save/Load Architecture** section (ISaveable, SaveData, SaveManager, GameEvents)
2. Add **FSM Architecture** section (IState, StateMachine, when to use)
3. Add **Input Architecture** section (InputAction patterns, rebinding)
4. Add **Third-Party Integration** guidance (when to wrap, interface isolation)

**Acceptance criteria:**
- [ ] Save/Load section added
- [ ] FSM section added
- [ ] Input section added
- [ ] Third-party guidance added

---

### TODO-12: Update `PhaseMap-template.md` — add Network Tier and Third-Party columns

**Type:** `edit-template`
**File:** `.github/templates/PhaseMap-template.md`
**Priority:** 🟡 Important
**Projects affected:** Networked projects (5)

**What to change:** Add Network Tier column (Client/Server/Shared/None), Third-Party column, Save Integration column to per-phase tables.

**Acceptance criteria:**
- [ ] Network Tier column added
- [ ] Third-Party column added
- [ ] Save Integration column added

---

### TODO-13: Update `build-phase.prompt.md` — add missing skill references

**Type:** `edit-prompt`
**File:** `.github/prompts/build-phase.prompt.md`
**Priority:** 🟡 Important
**Projects affected:** All future phases

**What to change:** Add conditional skill references: unity-save-load, unity-fsm, unity-day-night, unity-ai-navigation, unity-networking (when phase includes those domains).

**Acceptance criteria:**
- [ ] All new skill references added
- [ ] Conditional loading logic documented

---

### TODO-14: Update `init.prompt.md` — add third-party detection and genre classification

**Type:** `edit-prompt`
**File:** `.github/prompts/init.prompt.md`
**Priority:** 🟡 Important
**Projects affected:** All new project bootstraps

**What to change:**
1. Add **Third-Party Library Detection** step (scan Scripts/ folder names)
2. Add **Genre Classification** step (domain pattern detection)
3. Add **Skill Selection** step (recommend skills based on genre)

**Acceptance criteria:**
- [ ] Third-party detection step
- [ ] Genre classification step
- [ ] Skill selection recommendation

---

### TODO-15: Update `audit-phase.prompt.md` — add save/FSM/network checks

**Type:** `edit-prompt`
**File:** `.github/prompts/audit-phase.prompt.md`
**Priority:** 🟡 Important
**Projects affected:** All phase audits

**What to change:**
1. Save State Completeness check (ISaveable ↔ SaveData mapping, round-trip)
2. Network Authority check (conditional — server-authoritative validation)
3. FSM Completeness check (Enter/Exit pairs, no leaks)

**Acceptance criteria:**
- [ ] Save state check added
- [ ] Network authority check added
- [ ] FSM completeness check added

---

### TODO-16: Update `decouple-check.prompt.md` — add coupling allowlists

**Type:** `edit-prompt`
**File:** `.github/prompts/decouple-check.prompt.md`
**Priority:** 🟡 Important
**Projects affected:** 5 networked + 14 FSM projects

**What to change:**
1. Networking allowlist (NetworkBehaviour refs, RPC attributes, NetworkConnection, SyncVar)
2. FSM exception (states → parent controller/StateMachine OK, states → other states ❌)

**Acceptance criteria:**
- [ ] Network coupling allowlist
- [ ] FSM coupling exception

---

## 🟢 Nice-to-Have Items

### TODO-17: Create `unity-quest` skill

**Type:** `create-skill`
**File:** `.github/skills/unity-quest/SKILL.md`
**Priority:** 🟢
**Projects affected:** 5/29 — basementToSky (104 matches), minemgl (49), modulus (42, `QuestManager.cs`), rimWrld (85), stackLand (113, `AllQuests.cs`)
**What to change:** QuestManager singleton, Quest data classes, Objective tracking, QuestStep progression, completion callbacks, GameEvents integration

---

### TODO-18: Create `unity-procedural-gen` skill

**Type:** `create-skill`
**File:** `.github/skills/unity-procedural-gen/SKILL.md`
**Priority:** 🟢
**Projects affected:** 5/29 — rimWrld (222 matches, `BiomeWorker_*.cs`), tabs (73), peoplePlayGrnd (41), throneFall (39), twFactory (17)
**What to change:** Perlin noise, chunk-based world gen, biome systems, seeded randomization

---

### TODO-19: Create `unity-camera` skill

**Type:** `create-skill`
**File:** `.github/skills/unity-camera/SKILL.md`
**Priority:** 🟢
**Projects affected:** 5/29 — btycoon (201), twFactory (198), tabs (174), smarket (93), schedule-1 (88)
**What to change:** Cinemachine setup, virtual camera management, FreeLook/3rdPersonAim, input-driven camera, camera state transitions

---

### TODO-20: Update `ARCHITECTURE-template.md` — add Third-Party Dependencies section

**Type:** `edit-template`
**File:** `.github/templates/ARCHITECTURE-template.md`
**Priority:** 🟢
**Projects affected:** 25/29
**What to change:** Add Third-Party Dependencies table (Library | Version | Depth | Wrapper?), Genre Classification field, Multiplayer Architecture section (conditional)

---

### TODO-21: Update `StructureMap-template.md` — add SaveData specs

**Type:** `edit-template`
**File:** `.github/templates/StructureMap-template.md`
**Priority:** 🟢
**Projects affected:** 20 with save/load
**What to change:** Add SaveData class specs per DataService (fields, serialization format, version)

---

### TODO-22: Update `FLOW-template.md` — add networked event flow

**Type:** `edit-template`
**File:** `.github/templates/FLOW-template.md`
**Priority:** 🟢
**Projects affected:** 5 networked projects
**What to change:** Add Client→Server→AllClients event flow diagram variant

---

### TODO-23: Update `unity-testing` skill — add save/network/FSM test patterns

**Type:** `update-skill`
**File:** `.github/skills/unity-testing/SKILL.md`
**Priority:** 🟢
**Projects affected:** 20 save, 5 network, 14 FSM
**What to change:** Save/load round-trip test, network RPC mock test, FSM state transition test

---

### TODO-24: Update `Dependency-template.md` — add network tier

**Type:** `edit-template`
**File:** `.github/templates/Dependency-template.md`
**Priority:** 🟢
**Projects affected:** 5 networked
**What to change:** Add Network Tier (Client/Server/Shared) to Identity Table

---

### TODO-25: Update `CoverageMap-template.md` — add third-party coverage

**Type:** `edit-template`
**File:** `.github/templates/CoverageMap-template.md`
**Priority:** 🟢
**Projects affected:** 25
**What to change:** Add "Third-Party Integration Coverage" section

---

## Existing Skill Genre-Blindness Fixes (Summary)

| Skill | Assumption | Breaks For | Fix TODO |
|-------|-----------|-----------|----------|
| unity-audio | Underground mine, pool=30, all 3D, no music, no FMOD | 24/29 outdoor, 4/29 2D, 15/29 music, 3/29 FMOD | TODO-7 |
| unity-animation | Tool ViewModel/WorldModel, mining machines, conveyor UV | 22/29 non-tool, 2/29 spine, 8+ DOTween | TODO-8 |
| unity-prefab-hierarchy | Mining tools, machines, ore, conveyors | 28/29 non-mining | TODO-9 |
| unity-scene-setup | Underground, dark ambient, no skybox, mine layers | 20/29 outdoor, 4/29 2D | TODO-10 |
| unity-testing | Mostly genre-neutral | Save/network/FSM testing missing | TODO-23 |

---

## Verification Checklist

- [ ] All 5 existing skills updated with genre variants (mining patterns preserved as variant, not deleted)
- [ ] 2+ new skills created (Save/Load + FSM at minimum)
- [ ] csharp-conventions has Save/Load + FSM class roles
- [ ] GOAL-general.md has Save/Load + FSM + Input sections
- [ ] PhaseMap-template has new columns
- [ ] build-phase.prompt references all new skills
- [ ] init.prompt detects third-party libs + classifies genre
- [ ] audit-phase.prompt checks save state + FSM completeness
- [ ] decouple-check.prompt has networking allowlist
- [ ] No mining-specific content in "core" sections of skills (moved to variant)
- [ ] All changes work for: mining FPS, tycoon, horror, 2D, colony sim, physics sandbox, card game, fighting, tower defense

---

## Implementation Order

> ✅ ALL 25 TODOs IMPLEMENTED — 2025-05-24

**Batch 1 — Foundation:** ✅
1. TODO-1: Create `unity-save-load` skill ✅
2. TODO-2: Create `unity-fsm` skill ✅
3. TODO-3: Update conventions with Save/Load + FSM ✅

**Batch 2 — De-genre-blind existing skills:** ✅
4. TODO-7: Update `unity-audio` ✅
5. TODO-8: Update `unity-animation` ✅
6. TODO-9: Update `unity-prefab-hierarchy` ✅
7. TODO-10: Update `unity-scene-setup` ✅

**Batch 3 — Template + Prompt updates:** ✅
8. TODO-11: Update `GOAL-general.md` ✅
9. TODO-12: Update `PhaseMap-template.md` ✅
10. TODO-13: Update `build-phase.prompt.md` ✅
11. TODO-14: Update `init.prompt.md` ✅
12. TODO-15: Update `audit-phase.prompt.md` ✅
13. TODO-16: Update `decouple-check.prompt.md` ✅

**Batch 4 — New optional skills:** ✅
14. TODO-4: Create `unity-day-night` ✅
15. TODO-5: Create `unity-ai-navigation` ✅
16. TODO-6: Create `unity-networking` ✅

**Batch 5 — Nice-to-have:** ✅
17. TODO-17: Create `unity-quest` ✅
18. TODO-18: Create `unity-procedural-gen` ✅
19. TODO-19: Create `unity-camera` ✅
20. TODO-20: Update `ARCHITECTURE-template.md` ✅
21. TODO-21: Update `StructureMap-template.md` ✅
22. TODO-22: Update `FLOW-template.md` ✅
23. TODO-23: Update `unity-testing` ✅
24. TODO-24: Update `Dependency-template.md` ✅
25. TODO-25: Update `CoverageMap-template.md` ✅

**Registration:** ✅
- `copilot-instructions.md` — tree + skills table updated
- `Manual.md` — tree + skills table updated