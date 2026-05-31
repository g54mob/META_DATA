# .windsurf/ Framework — ROADMAP & Benchmark

> **What is this file?** A living document tracking the maturity, gaps, and future plans for the `.windsurf/` automation framework. It tells you what the framework handles well, what it can't do yet, and what's planned.
>
> **Who is this for?** Anyone evaluating whether this framework fits their project, or planning contributions to extend it.
>
> Last assessed: May 2026

---

## What This Framework Does

This framework automates rebuilding Unity3D games from decompiled source into clean, testable architectures. It provides:

- **22 slash commands** (`/init`, `/build-phase`, `/audit-phase`, etc.) that automate the entire lifecycle
- **15 template files** defining universal architecture rules, naming conventions, and doc formats
- **18 domain skills** providing deep Unity knowledge (audio, FSM, save-load, networking, etc.)
- **Always-on context** via `project-guidelines.md` so every Windsurf response knows your architecture
- **Self-evolving tools** (`/rebuild-templates`, `/rebuild-prompts`) that keep the framework current as conventions evolve

See [MANUAL.md](MANUAL.md) for detailed usage of every command.

---

## Current Benchmark

| Dimension | Score | What It Means |
|-----------|-------|---------------|
| Single-player MonoBehaviour games | 9/10 | Built for this. Near-complete coverage of every workflow step. |
| Architecture rule depth | 10/10 | 2633-line GOAL-general.md — naming, roles, decoupling, pitfalls, code examples |
| Agent automation pipeline | 9/10 | 22 prompts covering full lifecycle. Self-auditing. Self-evolving. |
| Documentation methodology | 10/10 | GUIDE + FLOW + Dependency per system. surfer.md reasoning log. Estimate calibration |
| Decoupling framework | 9/10 | 5 Bridge variants, 5 system shapes, portability levels, interface ownership maps |
| Multiplayer readiness | 4/10 | Networking skill with FishNet/Photon patterns. No GOAL integration or project profile yet. |
| VR/XR readiness | 2/10 | Input model and UI patterns are screen-only |
| Mobile readiness | 3/10 | No touch input, no battery/memory constraints |
| ECS/DOTS readiness | 1/10 | Architecturally incompatible — role taxonomy is MonoBehaviour-native |
| Project-agnostic reusability | 8/10 | 18 skills with genre variants. All existing skills expanded for multi-genre. |

> **May 2026 update:** 13 new domain skills added since inception. All original skills expanded 
> with genre variants. Coverage went from 5 domains to 18. 41 projects registered in workspace.

**Overall: 9/10 for single-player MonoBehaviour games. 7/10 as a universal Unity framework.**

---

## What Works Well Today (with examples)

### Full project lifecycle automation

```
/init           → reads 200+ decompiled .cs files, produces 12 docs + phase-All/ in one run
/build-phase    → generates 25 scripts + GUIDE + FLOW + tests for one phase
/audit-phase    → compares every method against original source: ✅/❌/⚠️
```

### Architecture enforcement

The framework catches violations automatically:

```
Example: Agent generates FindObjectOfType<PlayerMovement>() in ShopUI.cs
/audit-phase catches it:
  "❌ Mistake #1: FindObjectOfType in MonoBehaviour. Use [SerializeField] or GameEvents."
```

### Self-evolution

After completing phases, conventions evolve. The framework updates itself:

```
/rebuild-templates → "🔴 Critical: Template says bridge on consumer side — code puts it on non-portable side"
/rebuild-prompts   → "🔴 High: audit-phase checks wrong #region names — would flag correct code"
```

### Decoupling at scale

28 systems across 10 phases. 20+ are fully portable (copy the folder → compiles in any project):

```
ShopUISystem (L0)        → zero external deps, copy folder → works anywhere
InventorySystem (L0)     → zero external deps
OreSystem (L2)           → 2 interface-only deps (ICrushable, IMagnetGrabbable)
AutoMinerSystem (❌)     → concrete dep on OrePiecePoolManager — intentionally game-specific
```

---

## Compatibility Gaps

### Multiplayer (FPS / Co-op / MMO)

The framework has zero networking support. Here's what's missing and why it matters:

| Gap | Why It Matters | Example |
|-----|---------------|---------|
| **Authority model** | No patterns for who owns which data | In a co-op mining game, who owns the ore count — host or client? Framework has no answer. |
| **State sync** | DataServices are pure local C# | `ShopDataService` manages cart items in memory. In multiplayer, cart state must sync across clients — no pattern for this. |
| **Network events** | GameEvents are local-only | `GameEvents.RaiseOreSold()` fires locally. In multiplayer, this needs to also fire on the server and replicate to other clients. |
| **Singleton hostility** | `Singleton<X>.Ins` assumes one instance per game | In a 4-player co-op, `Singleton<EconomyManager>` can't represent 4 separate wallets. Need per-player state. |
| **Player identity** | No concept of PlayerID or session ownership | `PlayerMovement.cs` controls one player. Framework has no pattern for "which player is this?" |
| **RPCs / Lobby / Matchmaking** | Zero infrastructure | No patterns for remote procedure calls, player sessions, or lobby management. |
| **Lag compensation** | No prediction/rollback patterns | Real-time multiplayer needs client-side prediction and server reconciliation. Framework is purely local. |

### VR / XR

| Gap | Why It Matters | Example |
|-----|---------------|---------|
| **XR interaction model** | Framework assumes mouse raycast from camera center | VR uses hand tracking, grab physics, controller-ray interactors — completely different input model. |
| **Locomotion** | No teleport, smooth locomotion, snap turn, comfort vignette | VR players move differently. Framework's PlayerSystem assumes FPS CharacterController. |
| **Spatial UI** | Framework assumes screen-space Canvas | VR uses world-space Canvas attached to hand or floating in 3D. SubManager/UIManager model doesn't fit. |
| **Player rig** | PlayerSystem = one camera + CharacterController | VR player = camera rig + 2 tracked controllers + tracked body. Completely different hierarchy. |
| **Performance budget** | No LOD/occlusion framework | VR requires 90fps minimum. No patterns for draw call budgets, LOD management, or dynamic resolution. |

### Mobile (2D / Casual / Idle)

| Gap | Why It Matters | Example |
|-----|---------------|---------|
| **Touch input** | INPUT.K/M assumes keyboard/mouse | No tap, swipe, pinch-to-zoom, long press, drag. Mobile games are entirely touch-driven. |
| **Battery / memory** | No resource constraint patterns | Mobile games must manage memory pools, texture compression, battery drain from GPS/gyro. |
| **Screen orientation** | No responsive UI patterns | Framework's Canvas setup is fixed. Mobile needs portrait/landscape switching, safe area handling. |
| **Architecture overkill** | `_-Systems/` requires 3+ tightly coupled files | A 15-script puzzle game doesn't need the full system folder structure. Most features would be 1-2 files. |
| **Phase overhead** | PhaseMap with 10 phases is unnecessary for tiny games | A simple idle game might be 1-2 phases total. The phase machinery adds overhead without benefit. |

### ECS / DOTS

| Gap | Why It Matters | Example |
|-----|---------------|---------|
| **Complete role rewrite needed** | SO_/Field_/W/DataService/Orchestrator/SubManager are MonoBehaviour-native | DOTS uses SystemBase, IComponentData, EntityQuery, Burst jobs. None of the current roles apply. |
| **No GameObject/MonoBehaviour** | No `[SerializeField]`, no `GetComponent<>`, no Singletons, no ScriptableObjects | Pure ECS has none of these concepts. The entire naming and wiring convention breaks down. |
| **Needs separate GOAL** | Would need entirely new architecture rules | A `GOAL-general-dots.md` with DOTS-specific naming, roles, patterns, and pitfalls. |

### Procedural Generation (Roguelike / Infinite World)

| Gap | Why It Matters | Example |
|-----|---------------|---------|
| **Chunk streaming** | No spatial partitioning or async loading patterns | An infinite world needs load/unload chunks as the player moves. Framework has no concept of spatial management. |
| **Seed / determinism** | No seed passing or deterministic RNG conventions | Roguelikes need reproducible worlds from a seed. No pattern for where seeds live or how RNG chains flow. |
| **Generation vs runtime** | Framework "phases" are dev phases, not runtime phases | Procgen has a build-time generation pipeline (place rooms, connect corridors, spawn enemies) that's architecturally distinct from gameplay. No pattern for this. |

---

## Planned Improvements

### Priority 1 — Ship Current Project First

- [ ] **Add README.md** to repo root
- [ ] **Add .gitignore**
- [ ] **Add LICENSE**
- [ ] **Run `/update-goal-from-handtyped`** — reconcile UtilsPhaseA/B vs centralized Utils.cs convention
- [ ] **Hand-type remaining phases**

### Priority 2 — Framework Improvements (After Shipping)

These extend the framework for broader use:

- [ ] **`test-runner` prompt** — auto-generate NUnit tests for DataServices

  ```
  Example: /test-runner generates:
  [Test] public void ShopDataService_AddToCart_IncreasesCount()
  {
      var ds = new ShopDataService();
      ds.Build(testItems);
      ds.AddToCart(testItems[0]);
      Assert.AreEqual(1, ds.GetCartCount());
  }
  ```

  DataServices are pure C# with zero Unity deps — perfect for automated unit tests.

- [ ] **Project Profile in `/init`** — choose architecture variant at project start:

  ```
  /init
  Agent: "Choose project profile:"
    1. singleplayer-mono  (current — full _-Systems/, bridges, portability)
    2. multiplayer-mono   (adds: authority model, network events, per-player state)
    3. vr-xr              (adds: XR interaction, spatial UI, hand tracking)
    4. mobile-2d          (simplified: lighter folder structure, touch input)
    5. ecs-dots           (separate: DOTS-specific roles, naming, patterns)
  ```

  Each profile loads different architecture rules, role taxonomies, and pitfall lists into GOAL.md.

- [x] ~~**Networking section in GOAL-general.md**~~ — **Partially done:** `unity-networking` skill exists with FishNet/Photon patterns. Still needed: GOAL-general.md authority model rules, NetworkGameEvents, project profile system.

  ```
  Example remaining additions:
  - NetworkGameEvents (events that replicate across clients)
  - AuthoritativeBridge (host-owned data pushed to clients)
  - Per-player DataService (state isolation per PlayerID)
  - NetworkSingleton<T> (server-owned singleton pattern)
  ```

- [ ] **VR interaction section** — XR Interaction Toolkit patterns:

  ```
  Example additions:
  - XRInteractable (replaces IInteractable for hand/controller grab)
  - WorldSpaceSubManager (replaces screen-space SubManager)
  - LocomotionSystem (teleport, smooth, snap turn as _-System/)
  - XRPlayerRig (replaces PlayerSystem's CharacterController)
  ```

- [ ] **Mobile section** — touch input + responsive UI:

  ```
  Example additions:
  - TouchInputManager (replaces INPUT.K keyboard model)
  - ResponsiveUIManager (portrait/landscape switching)
  - Lighter _-Systems/ threshold (1-2 files = standalone, no folder needed)
  - MemoryBudgetManager (pool tracking, texture compression hints)
  ```

- [ ] **Configurable `_-Systems/` threshold** — per project profile:

  ```
  singleplayer-mono: 3+ files → create _-Systems/ folder (current)
  mobile-2d:         5+ files → create _-Systems/ folder (lighter)
  ecs-dots:          N/A — uses SystemGroup folders instead
  ```

### Priority 3 — Long-Term Vision

These are speculative — may or may not happen:

- [ ] **GOAL-general-dots.md** — completely separate architecture rules for ECS/DOTS projects
- [ ] **Multiplayer bridge variants** — `NetworkBridge`, `AuthoritativeBridge`, `ReplicatedBridge`
- [ ] **Procgen phase concept** — generation pipeline vs gameplay pipeline as separate phase types
- [ ] **Cross-project template sharing** — extract `.windsurf/` into a shareable package
- [ ] **`/migrate-profile`** — convert a singleplayer project to multiplayer

---

## How to Contribute

### Adding a new prompt

1. Create `.windsurf/workflows/your-command.md` with YAML frontmatter (`description: "..."`)
2. Follow the 2-phase gate pattern if the prompt modifies files (Phase 1 = analyze + report, Phase 2 = apply after approval)
3. Update `MANUAL.md` — add to trigger list, quick reference table, detailed section, typical workflow, folder structure
4. Update `project-guidelines.md` — add to prompts listing in workspace structure
5. Run `/rebuild-prompts` to verify the new prompt doesn't conflict with existing ones

### Extending architecture rules

1. Add the rule to `.windsurf/templates/GOAL-general.md` using generic placeholders (`[SystemName]`, `[PHASE_X]`)
2. Add any new common mistakes to `.windsurf/templates/NewAgent-general.md`
3. Update `.windsurf/project-guidelines.md` conventions summary if the rule is fundamental
4. Run `/rebuild-templates` to verify consistency

### Testing changes

After modifying any framework file:
```
/audit-phase on a completed phase    → verify zero false positives on correct code
/build-phase on next phase           → verify it produces correct deliverables
/rebuild-prompts                     → verify all prompts are consistent
```