# New Agent — Start Here (Universal Template)

> **Current target: [PHASE_X] — [phase description]**
> Update this line when moving to the next phase.

> This is a **project-agnostic** agent instruction template. Replace `[PROJECT_NAME]`, `[PHASE_X]`, and game-specific references with your actual project details.

---

## How to Use This Template

1. Copy this file + `GOAL-general.md` into your new project's `learn/` folder
2. Rename to `GOAL.md` and `NewAgent.md`
3. Replace all `[PROJECT_NAME]` / `[PHASE_X]` placeholders
4. Add project-specific examples (SO_ names, system names, phase breakdown)
5. Create `PhaseMap.md` and `StructureMap.md` for your specific game
6. The architecture rules, patterns, and conventions remain identical

---

## First Steps — Before Any Phase

### Step 0: Bootstrap the Learn Folder

Before generating any phase, the project needs these foundational docs:

```
learn/
├── GOAL.md              → copy from GOAL-general.md, customize for [PROJECT_NAME]
├── NewAgent.md          → copy from NewAgent-general.md, customize
├── ARCHITECTURE.md      → comprehensive analysis of the original source
├── PhaseMap.md          → all phases, files per phase, modifications, vertical slice tests
├── StructureMap.md      → DataService specs per phase (collections, methods, nested types)
├── SystemPortabilityMap.md → L0/L1+ classification per system
├── SystemIsolationAnalysis.md → cross-system audit (interfaces, bridges, events, concrete deps)
├── CoverageMap.md       → every source file → which phase covers it
├── Estimate.md          → timeline calibrated from actual typing speed
├── OptionalFeatures.md  → features outside 100% scope (polish, extras)
├── surfer.md            → reasoning log (append after each agent prompt)
├── handTyped(latest)/   → user's ground-truth hand-typed code
└── phase-All/           → shared scripts (Singleton, GameEvents, UIManager, etc.)
```

### Step 0a: Analyse the Original Source

Read every file in `Scripts/Assembly-CSharp/`. Produce `learn/ARCHITECTURE.md` with this Table of Contents:

```
# [PROJECT_NAME] — Detailed Architecture Documentation

1. Project Overview
   - Game description (1-2 paragraphs)
   - Project structure (folder tree)
   - Third-party dependencies (table: Library | Purpose)

2. High-Level Architecture Diagram
   - ASCII art: Singleton Managers → Player Systems → World Systems → UI
   - Data flow diagrams for major game loops (e.g. resource lifecycle, progression)

3. Core Architectural Pattern: Singleton Managers
   - Singleton base class code
   - Execution order table (priority | manager | reason)

4. System-by-System Breakdown
   - 4.1 [System Name] — files, responsibilities, key code, data flow
   - 4.2 [System Name] — ...
   - (one subsection per major system — typically 10-20 systems)

5. Key Design Patterns & Techniques
   - Object pooling, interfaces, coroutine patterns, event-driven, etc.

6. Critique & Thoughts
   - What the original source does well
   - What could be improved (these become your architecture improvements)

7. File Index
   - Every script with one-line purpose (table: File | Lines | Purpose)
```

This analysis is the foundation for PhaseMap and StructureMap. Be thorough — missing systems here means missing phases later.

### Step 0b: Create PhaseMap

Break the game into phases. For each phase:
- **Domain boundary** — what this phase covers
- **File list** — every .cs file with folder placement and one-line purpose
- **Modifications** — changes to earlier-phase files (table: File | How | Change | Why)
- **Vertical Slice Tests** — what to test, prerequisites, checklist
- **Gap Audit** — at the end, list missing files/features per phase with priority

**Gap Audit format (append at end of PhaseMap):**
```
| Phase | +Scripts | Key Additions | Priority |
|-------|---------|---------------|----------|
| B | +3 | MissingFeature, ExtraController, UtilMethod | Critical |
| C | +2 | EdgeCaseHandler, PoolOptimization | Important |
| E | +1 | VisualPolish shader swap | Polish |
```
- **Critical** — source has it, you must include it. Missing = broken fidelity.
- **Important** — source has it, adds meaningful behavior. Include in main delivery.
- **Polish** — nice-to-have. Put in `#region extra` blocks (typed last, skippable).

**Phase ordering (dependency order):**
1. Core + Economy + UI framework (shop, interaction)
2. Environment (level-specific setup)
3. Player (controller, inventory, tools, grabbing)
4. Primary game mechanic (game-specific: mining, combat, building, etc.)
5. Secondary mechanics (automation, processing, crafting)
6. Content systems (quests, research, progression)
7. Persistence (save/load)
8. Polish (audio, settings, menus)
9. Final (debug, demo, world events)

### Step 0c: Create StructureMap

For each phase, define DataService specs:
- Exact collections (field names, types)
- Methods (signatures, what they return/do)
- Nested types (with all fields)
- `GetSnapShotForTest()` format

### Step 0d: Create Estimate

Calibrate from actual typing data. Use these complexity tiers:

| Script Complexity | Examples | Avg Time |
|-------------------|---------|----------|
| **Simple** (enums, stubs, interfaces, SOs, entities) | GlobalEnumsX, SO_Def, SaveEntry | ~15 min |
| **Medium** (DataService, DataWrapper, Field_, Utils, tests) | ItemDataService, WItem, Field_Slot, PhaseXLOG | ~30 min |
| **Complex** (MonoBehaviours, Orchestrators, Managers, Player scripts) | PlayerMovement, Orchestrator, Manager with state | ~60 min |

**Formula:** `(simple_count × 15 + medium_count × 30 + complex_count × 60) + scene/testing buffer (~25%)`

Agent generation saves ~30% vs designing from scratch — code is ready to reference, GUIDE.md has typing order.

---

## First Prompt (copy-paste into new conversation)

```
Read these files in this order:
1. learn/GOAL.md — all architecture rules, folder structure, naming conventions, minimal API, decoupling, vertical slice tests
2. learn/PhaseMap.md — [PHASE_X] section (files, modifications, vertical slice tests)
3. learn/StructureMap.md — DataService specs per phase (exact collections, methods, nested types)
4. learn/handTyped(latest)/ — my ACTUAL hand-typed code (ground truth for coding style, isFirstEnable pattern, separate Open/Close events)
5. learn/handTyped(latest)/ and its subfolders — reference for architecture patterns (isFirstEnable, separate Open/Close events, SubManager, Orchestrator, DataService, Field_, #region style)
6. Scripts/Assembly-CSharp/ — original source for [PHASE_X] files (refer PhaseMap, StructureMap)
7. Completed phase folders in learn/ — reference for established _-Systems/ architecture, portable system pattern, bridge scripts, interface ownership

End goal: 100% main-source functionality with clean architecture — systems communicate via interfaces + GameEvents, making them portable to future Unity projects.

Now build [PHASE_X] with:
- 100% main source functionality + portable systems
- _-Systems/ architecture: each feature = self-contained folder with ALL code (SO_, Field_, DataService, DataWrapper, Orchestrator, SubManager, Interface/, Bridge/, Entities, Test.md, Dependency.md)
- Numbered folders (0-Core/, 2-Data/, 3-MonoBehaviours/) are ONLY for shared cross-system infra (RARE)
- All utility code in phase-All/4-Utils/Utils.cs — no per-phase UtilsPhaseX.cs
- System independence: communicate via interfaces + GameEvents only. No direct class imports across _-Systems/ folders.
- GameEvents use interfaces, NEVER concrete classes (Action<IMyInterface> not Action<ConcreteClass>)
- Portable systems own their interfaces — copy folder = complete
- Bridge scripts for cross-system runtime context (lives in consumer/game-specific side)
- [AddComponentMenu("[PROJECT_NAME]/Category/ClassName")] on every MonoBehaviour
- Least possible public API exposure
- Zero FindObjectOfType — use GameEvents + [SerializeField] + Owner chain
- partial GameEvents in phase-X/0-Core/GameEvents.cs (no modifying earlier phase files)
- Vertical slice tests per system with full GUIDE.md (prerequisites, scene setup, checklist)
- One-liner purpose per script — if it doesn't fit one sentence, split it
```

---

## Documentation Voice & Tone

**All documentation is beginner-friendly.** This means:

- **GUIDE.md** reads like a friend walking you through the codebase, not a reference manual
- **FLOW.md** reads like a story of what happens when the player does X — not a sequence diagram
- **Script summaries** use first person "I" — the script is *talking to you*
- **Test instructions** assume the reader has never opened Unity — every click, every field, every GO is explicit

**What "beginner-friendly" does NOT mean:**
- It does NOT mean dumbed-down. Technical details are kept. `SpringJoint`, `OverlapSphere`, `OnTriggerEnter` are used by name.
- It does NOT mean long. Be conversational but concise. One good sentence beats three mediocre ones.
- It does NOT mean skipping "why." Always explain why a pattern exists (e.g., "isFirstEnable exists because Awake order is unpredictable across GOs").

**FLOW.md formatting rules:**
- **bold** = visible change the player sees ("the pickaxe **disappears from the ground**")
- *italic* = context or internal note ("the tool *doesn't know about inventory*")
- `code` = exact script/method/field reference ("`GameEvents.RaiseToolPickupRequested(this)`")
- Written as a narrative story, NOT as swim lanes, NOT as ASCII tables
- Each flow = one major user action (pickup, switch, drop, open menu, drag-drop, etc.)

See GOAL.md "Gold Standard" section for concrete examples of all of the above.

---

## What The Agent Must Deliver

For each phase, the agent must produce:

### 1. GUIDE.md — Beginner-Friendly Phase Guide

Same conversational voice as FLOW.md. Written so someone who has never seen this codebase can follow it. Must include ALL of:

- **What it looks like when running** (conversational, describe the player experience)
- **Folder structure** (`_-Systems/` as primary, with one-liner purpose per file. Numbered folders are RARE shared infra only)
- **Script Purpose** — one sentence per script
- **Hand-typing order** (compile groups with stop-and-test points)
- **Vertical Slice Tests** — beginner-friendly step-by-step for each `.cs` test:
  - Conversational intro: what this test proves (1-2 sentences)
  - "What you need to type first" / "What you DON'T need"
  - Step-by-step scene setup (numbered: create GO, add component, wire fields with `| Field | Drag From |` tables)
  - "How to test" table: `| Key | What it does | What you should see |`
  - "Full test flow" for complex tests (ordered steps: do X → expect Y → do Z)
  - Checklist: pass/fail items
- **Art & Scene Work (Non-Script)** — animations, audio, shaders, prefabs, layers/tags, SO assets
- **Scene Setup** (full — GOs, components, wiring checklist)
- **Modifications to Earlier Phases** (table: File | How | Change | Why)
- **Source vs Phase diff** (what original did vs what we changed)
- **Systems & Testability** (at end): Individual Systems table + Testability Matrix + final count

### 1b. FLOW.md — System Connections

- **System Map** — ASCII box diagram: all systems, what each owns, connections via GameEvents/SerializeField
- **Data Flows** — one per major user action. Written in **conversation-style plain English** with `code refs`, **bold** for key moments, *italics* for context. NOT swim lanes or ASCII tables — readable prose.
- **Event Registry** — table: every GameEvent in that phase, who fires it, who subscribes
- **Portability Diagram** — which systems are L0, which are L1+, dependency arrows with scorecard
- Every connection = GameEvent or [SerializeField]. Direct cross-system calls = tight coupling = refactor.

### 1c. Update `phase-All/7-3D/` — Centralized Asset Docs (grows per phase)

If this phase introduces new 3D models, animations, or world setup:
- **`MODEL.md`** — add a `## Phase X` section with every 3D mesh: name, shape, dimensions, component hierarchy tree, vertex count, variants
- **`ANIM.md`** — add a `## Phase X` section with every animation clip (name, duration, keyframes), AnimatorController state machines (ASCII graph), parameters as `AnimParamType` enum (never raw strings), transition rules, wiring
- **`WORLD.md`** — add a `## Phase X` section with world layout: ASCII top-down map, prefab placement, lighting, camera, "what the player sees"
- If no 3D/asset requirements for this phase, skip this step entirely.

### 1d. `Dependency.md` Per System — Mandatory

Inside each `_-Systems/XxxSystem/` folder, create a `Dependency.md`:
- **Rewrite from scratch** every time this system is built or modified. Never patch — always regenerate.
- **Requires in-depth analysis first:** read every `.cs` in the system, trace every `using`, `Singleton<X>.Ins`, `GetComponent<I>()`, `GameEvents.On/Raise`. Cross-reference GOAL.md portability rules.
- **Sections (all mandatory):**
  - Header: `# SystemName — L{n} ✅/❌ Portable/Game-Specific`
  - Identity table: Phase, Level, Scripts, Owns Interface, External _-Systems/ Deps
  - FREE Requirements table: GameEvents, UIManager, GlobalEnums, Utils, shared infra
  - Internal File Dependency Graph: 3-zone left-border ASCII diagram (INTERNAL / BOUNDARY / EXTERNAL)
  - Future Phase Modifications table
  - Verdict: COMPLETE / MOSTLY COMPLETE / PARTIAL / PERMANENTLY COMPLETE
  - Checklist: pass/fail items for portability + architecture rules
- **Diagram format** — see GOAL.md `_-Systems/` section for the 3-zone left-border-only format.

### 2. All Scripts Following GOAL.md Rules

- `#region` blocks in MANDATORY order: Inspector Fields → private API → Public API → Extra → Unity Life Cycle (lifecycle is LAST, not third)
- **`private API` combines fields + helpers** — don't split into separate "Private Fields" and "Private API" regions. Single `#region private API`.
- Subdivide `#region public API — IInterfaceName` when a class implements multiple interfaces
- **Region suffix annotations** explain context: `#region public API — Owner chain (read by tools)`, `#region private API — drag-drop`, `#region Protected State — subclasses use ownerCam for raycast`
- `#region Extra` for `// nice-to-have:` features (typed last, skippable)
- No blank lines between `#endregion` and next `#region`
- **Pure data classes** (InventorySlot, CartItem) with only public fields — **omit regions entirely** (too small)
- **`/// <summary>` on EVERY class and EVERY method — mandatory, no exceptions:**
  - **Class (short form)**: one-sentence summary for simple scripts (SubManagers, Field_, simple Managers)
  - **Class (narrative form)**: multi-paragraph first-person "I'm the..." for complex classes (Orchestrators, base classes, PlayerMovement). Include: (1) what I do, (2) how I work, (3) who uses me, (4) events I fire/subscribe
  - **Public method**: 2-line English explaining the full effect (what happens inside, not just the method name)
  - **Private method**: same — describe what actually happens, not just the method name being called
  - **Unity lifecycle**: 2-line explaining what THIS script does in this hook — don't just say "called by Unity"
  - **Interface**: design intent + decoupling rationale + who implements + who calls + which phase
  - **Enum**: what each value means in context (which system uses it, what changes per value)
  - **Exception**: one-liner Get.../Set...() that just return/set a field — name is self-documenting
  - **Exception**: Field_ setter methods (SetData, SetState) — name + params tell the story
- **`// →` inline flow markers** inside every method body
- **`// >> text` / `// << text` block delimiters** for multi-step logical blocks in Orchestrators
- `// purpose:` on every `.Raise...()` and `+=` subscription
- **`// Phase X:` comments** in enums that grow across phases
- **Boolean checks** — both `!` and `== false` are acceptable (use whichever is clearer)
- Zero `FindObjectOfType`
- Minimal public API — private by default
- `partial class GameEvents` in own `0-Core/GameEvents.cs`
- **GameEvents use interfaces, NEVER concrete classes.** `Action<IMyInterface>` not `Action<ConcreteClass>`.
- **Actively create DataServices** for any pure C# logic. **EVERY `List<T>` and `Dictionary<K,V>` that can be tested via `new` MUST live in a DataService**, not in a MonoBehaviour. DataService has: `Build + Get + Add + Remove + boolean questions + GetSnapShotForTest()`. Use `ALL_CAPS` for list fields, `DOC__x_y` for dictionary fields. Nested types (e.g. `CartItem`) live inside the DataService. Ask: "Can I test this via `new`?" If yes → DataService.
- **PhaseXLOG for EVERY collection.** Every collection in a DataService gets its own LOG method: `LIST_X__TO__JSON` for lists, `DOC_X__TO__JSON` for dictionaries. All use `.map()` to anonymous type + `.ToNSJson(pretify: true)`. DataService's `GetSnapShotForTest()` calls ALL LOG methods.
- **Actively extract reusable logic into phase-All/4-Utils/Utils.cs.** Extension methods (e.g. `formatMoney(this float)`) + static helpers. If logic appears in 2+ scripts, it goes in Utils.cs (phase-All). No per-phase UtilsPhaseX.cs — per-phase 4-Utils/ only has PhaseXLOG.cs.
- **Orchestrator patterns:** `DOC__X__Field` dictionary mapping data → Field_ instance. `.destroyLeaves()` before repopulating. `.gc<T>()` after Instantiate. `AddListener` ONLY in Orchestrator. `RefreshAllRequired()` after every data mutation (event-driven, never Update).
- **Reduce verbosity** — `?.`, `??`, `=>`, LINQ, custom extensions (`.map()`, `.find()`, `.all()`, `.sum()`, `.getRandom()`, `.gc<T>()`, `.destroyLeaves()`, `.toggle()`, `.colorTag()`)
- **Protected helpers** for repeated patterns shared across subclasses. Put in base class, not duplicated in each concrete class.
- See GOAL.md "Pure Purpose with Live Code" for exact code patterns of every role.

### 3. Test Scripts

- Summary comment: prerequisites, NOT required, "How to test" steps, controls
- `// purpose:` on every Raise/Subscribe
- Console logging via GameEvents subscription
- Minimal bootstrap — systems handle their own Update()
- Fire GameEvents to trigger actions (never call methods directly)

### 4. Manual Test Guides (`5-Tests/Manual/*.md`)

**Decision question for every phase:** "Does this system have UI panels, animations, physics visuals, or dense inspector setup?" If yes → create a `Manual/*.md` for each system that needs it. Analyse the main source.

For systems needing visual/hands-on verification:
- **Prerequisites** — singletons, prefabs, test scripts needed
- **Setup Guide** — beginner-level step-by-step:
  - Every GO: name, parent, components, wiring (`| Field | Drag From |` table)
  - Prefab hierarchies: every child with RectTransform, Image, tag, layer, defaults
  - Final hierarchy tree
- **How It Works (System Flow)** — the heart of the manual test. Before DO/EXPECT steps, explain the system's **end-to-end data flow** in conversation-style plain English:
  - Break into labelled paragraphs per action (e.g. "Scene loads:", "Tool pickup:", "Drag-drop:")
  - Each paragraph traces: which script method → which GameEvent → which subscriber → which GO `SetActive` → which field changes → what player sees
  - Teaches WHY things happen, not just WHAT the reader sees
  - The reader should understand the full architecture by reading the manual test
- **Manual Test Flow** — numbered DO/EXPECT steps:
  - One action per step, EXPECT: **bold** for visual, `code` for console
  - Also explain behind the scenes: which method runs, which event fires, which GOs activate/deactivate
  - Cover: initial state → primary actions → edge cases → error conditions
- **Summary Checklist** — pass/fail items
- **Self-contained** — no "see GUIDE.md" shortcuts. Assumes zero prior knowledge.
- **Pitfall Checks** — every Manual/*.md must warn about applicable items from the 10 Common Pitfalls list in GOAL.md (SetActive cascading, scene vs prefab, raycastTarget, missing layers, etc.)

### Manual Test Pitfall Checklist

Every Manual/*.md MUST include a "Pitfall Checks" section at the end. Review each item — if it applies to THIS system, add a warning with the specific GO/component affected:

| # | Pitfall | Check |
|---|---------|-------|
| 1 | **SetActive cascading** — parent.SetActive(false) disables ALL children. Independent panels = siblings, not children. | Does this system have nested panels that toggle independently? |
| 2 | **Scene instance vs prefab** — drag from Hierarchy (scene), not Project panel (asset). | Does the test require wiring scene references? |
| 3 | **raycastTarget** — ghost Image = false, slot background = true, icon on top = false. | Does this system have UI with overlapping Images? |
| 4 | **Missing layers** — `LayerMask.NameToLayer` returns -1 silently if layer doesn't exist. | Does this system use custom layers? |
| 5 | **LayerMask at Nothing** — defaults to 0, all raycasts return empty. Must set in inspector. | Does this system use LayerMask fields? |
| 6 | **Dual collider setup** — trigger + physical on SEPARATE child GOs, never both on same GO. | Does this system use both trigger and physical colliders? |
| 7 | **Static lists surviving domain reload** — second Play press has stale null refs. Clear in OnEnable or use `[RuntimeInitializeOnLoadMethod]`. | Does this system have static collections? |
| 8 | **Execution order** — `[DefaultExecutionOrder]` on managers. Don't remove or reorder. | Does this test depend on manager init order? |
| 9 | **isFirstEnable** — SubManager must self-disable on first OnEnable, not Start/Awake. | Does this system have SubManagers? |
| 10 | **Cross-phase mods not applied** — if this phase modifies earlier files, compile error or silent failure. | Does this phase modify earlier phase scripts? |

---

## Reference Files

| File | What it is | Read when |
|------|-----------|-----------|
| `learn/GOAL.md` | Architecture bible — all rules | Always first |
| `learn/NewAgent.md` | Agent instructions + delivery checklist + common mistakes | Always — before building any phase |
| `learn/PhaseMap.md` | Roadmap — all phases, files, modifications | Before building any phase |
| `learn/StructureMap.md` | DataService specs — exact collections, methods, nested types per phase | Before writing any DataService |
| `learn/handTyped(latest)/` | User's ACTUAL hand-typed code — ground truth for style (isFirstEnable, Open/Close events) | Always — match this, not generic C# |
| `learn/Estimate.md` | Timeline + hours | For planning |
| `learn/ARCHITECTURE.md` | Original source analysis | When source fidelity questions arise |
| `learn/surfer.md` | Reasoning history | Optional — decisions captured in GOAL.md |
| `Scripts/Assembly-CSharp/` | Original source (all files) | To match 100% behavior |
| `learn/SystemPortabilityMap.md` | L0/L1+ classification per system | When assessing portability |
| `learn/SystemIsolationAnalysis.md` | Cross-system audit — interfaces, bridges, events, concrete deps | When writing Dependency.md |
| `learn/CoverageMap.md` | Every source file → which phase covers it | Gap checking |
| `learn/OptionalFeatures.md` | Features outside 100% scope (polish, external packages) | When deciding what to include |
| Completed phase folders | Reference for established _-Systems/ patterns, bridges, interface ownership | Before building later phases |

---

## Key Rules (Quick Reference)

- **Check Gap Audit before building any phase.** PhaseMap.md and StructureMap.md have "Gap Audit" sections listing missing files per phase. Include all **Critical** and **Important** items. **Polish** items go in `#region extra` blocks.
- **PhaseMap/StructureMap are NOT exhaustive.** Always cross-reference every original source file for the phase. If the source has functionality not listed, **include it anyway**. The main source is the ultimate source of truth.
- **MANDATORY: Post-delivery self-audit.** Method-by-method comparison against original source. Non-negotiable.
- **Vertical slice = standalone scene.** If a test needs another system, fix the architecture.

All C# coding conventions (naming, capitalization, class roles, folder structure, decoupling, mandatory patterns, script structure, method naming, pitfalls) are defined in [C# Conventions](../instructions/csharp-conventions.instructions.md). That file is the single source of truth — do not duplicate rules here.

---

## Common Mistakes The Agent WILL Make

> These are violations of [C# Conventions](../instructions/csharp-conventions.instructions.md). That file has the full rules and examples — this list is a quick-scan checklist.

Catch these before delivering:

1. **Any `FindObjectOfType` in MonoBehaviours** → use `[SerializeField]`, Owner chain, or GameEvents.
2. **Public methods nobody calls externally** → audit every public method. "Who calls this?"
3. **Missing `// purpose:` on Raise/Subscribe calls** → mandatory on every single one.
4. **Tight coupling** (Script A directly calls Script B across systems) → decouple via GameEvents.
5. **Defensive null checks on inspector refs** → let it crash.
6. **RefreshAll() in Update()** (polling) → make it event-driven.
7. **DataService that needs Unity physics/lifecycle** → question if it should be a DataService at all.
8. **Missing `isFirstEnable` pattern on SubManagers** → every SubManager MUST use it. No exceptions.
9. **Toggle instead of separate Open/Close events** → every UI panel needs SEPARATE events.
10. **Using `Input.GetKeyDown` directly in SubManagers** → SubManagers don't handle input. They subscribe to events.
11. **Methods on SO_ classes** → SO_ = pure data, zero methods. Move to consumer.
12. **Singleton in `3-MonoBehaviours/` instead of `1-Managers/`** → Singleton<T> = always 1-Managers/.
13. **Collections left in MonoBehaviour instead of DataService** → any `List<T>` / `Dictionary<K,V>` testable via `new` MUST be in a DataService. No exceptions.
14. **Missing PhaseXLOG methods** → every collection in every DataService gets its own LOG method. `GetSnapShotForTest()` calls them all.
15. **Missing `RefreshAllRequired()` in Orchestrator** → after every data mutation, refresh the UI. Never poll in Update().
16. **Missing `DOC__X__Field` in Orchestrator** → Orchestrators that create Field_ instances MUST track them in a `DOC__` dictionary for refresh/destroy.
17. **Not using user's custom extensions** → use `.map()`, `.gc<T>()`, `.destroyLeaves()`, `.toggle()`, `.colorTag()`, `C.method(this)`, `LOG.AddLog()` etc. Don't reinvent with standard API.
18. **Bridge script placed on the portable side** → Bridges live on the non-portable / game-specific side, regardless of consumer/provider role. A portable system should have zero game-specific imports.
19. **`Interface/` subfolder not used when system has 2+ interfaces** → single interface = root of system folder. Two or more interfaces = `Interface/` subfolder. Check after writing every system.
20. **Using `FindObjectOfType` instead of `FindObjectsByType`** → `FindObjectOfType` is obsolete in Unity 6000.3. Use `FindObjectsByType<T>(FindObjectsSortMode.None)` — ONLY inside Bridge scripts for push-to-all pattern, never in normal MonoBehaviours.
21. **Wrong bridge pattern chosen** → 5 variants exist (event-push, event-response, push-to-all, event-chain, static-accessor). Match the data-flow direction and frequency. See GOAL.md Bridge Pattern Catalog.
22. **`#region Private Fields` instead of `#region private API`** → the correct region name is `private API` (lowercase). `Private Fields` is NOT a valid region name in this architecture.
23. **Field_ uses `[SerializeField]` instead of public fields** → Field_ scripts use **public** references (set by Orchestrator at runtime via `.gc<T>()`), not `[SerializeField]`. Only MonoBehaviours wired in the inspector use `[SerializeField]`.

---

## MANDATORY Patterns — Do NOT Skip

### `// purpose:` on EVERY Raise and Subscribe

**After writing each script, ctrl+F for `GameEvents.Raise` and `GameEvents.On`. Every single one MUST have a `// purpose:` comment.** No exceptions.

```csharp
// purpose: cursor lock/unlock for player controller
GameEvents.RaiseMenuStateChanged(isAnyMenuOpen: true);

// purpose: HUD updates display
GameEvents.RaiseResourceChanged(amount);

// purpose: log when item is processed
GameEvents.OnItemProcessed += (value) => Debug.Log($"processed for {value}");
```

### `isFirstEnable` on ALL SubManagers

Every SubManager MUST use this pattern:

```csharp
bool isFirstEnable = true;
private void OnEnable()
{
    if (isFirstEnable)
    {
        // subscribe + build + self-disable
        GameEvents.OnOpenThisView += () => this.gameObject.SetActive(true);
        GameEvents.OnCloseThisView += () => this.gameObject.SetActive(false);
        this.gameObject.SetActive(false);
        isFirstEnable = false;
        return;
    }
    GameEvents.RaiseMenuStateChanged(isAnyMenuOpen: true);
}
```

Do NOT use Start() for subscriptions. Do NOT use Awake(). See GOAL.md "Why isFirstEnable".

### Separate Open/Close Events Per UI Panel

Every UI panel gets TWO events, not a toggle:

```
OnOpenShopView / OnCloseShopView
OnOpenInventoryView / OnCloseInventoryView
OnOpenSettingsView / OnCloseSettingsView
```

SubManagers subscribe to both. `UIManager.CloseAllSubManager()` fires all Close events.

### DataService + PhaseXLOG + GetSnapShotForTest — For EVERY Collection

**After writing any system with collections, verify:**

1. **Every `List<T>` / `Dictionary<K,V>`** that can be tested via `new` lives in a DataService
2. **Every collection has a PhaseXLOG method:** `LIST_X__TO__JSON` or `DOC_X__TO__JSON`
3. **DataService has `GetSnapShotForTest()`** that calls ALL LOG methods with `=` header
4. **DEBUG_Check tests it** via `new DataService()` → Build → mutate → `LOG.AddLog(snapshot, "json")`

```csharp
// DataService
#region snapShot
public string GetSnapShotForTest(string header = "when something happened")
{
    return $@"
{'='.repeat(4) + header + '='.repeat(4)}
// ITEMS
{PhaseXLOG.LIST_ITEMS__TO__JSON(ITEMS)}
// DOC__category_items
{PhaseXLOG.DOC_CATEGORY_ITEMS__TO__JSON(DOC__category_items)}";
}
#endregion
```

### Orchestrator DOC__ + RefreshAllRequired

**Every Orchestrator that creates Field_ instances MUST:**

1. Track them in `DOC__X__Field` dictionary (data → Field_ mapping)
2. Call `RefreshAllRequired()` after every data mutation
3. Use `.destroyLeaves()` before repopulating
4. Use `.gc<T>()` after Instantiate
5. Wire `AddListener` ONLY inside Orchestrator — Field_ never wires its own clicks

---

## After First Delivery

The user will audit your scripts. Expect:
- "Is the public API minimal?"
- "Any tight coupling?"
- "Does every Raise have a // purpose: comment?"
- "Can this be tested independently in a standalone scene?"

Fix what the user flags. You'll calibrate to their strictness level after 1-2 corrections.

---

## Don't Forget

- **Check if the user has custom utility extensions** (like `.map()`, `.find()`, `.all()`, `.sum()`, `.getRandom()`, `.gc<T>()`, `.destroyLeaves()`, `.toggle()`, `.colorTag()`, `.repeat()`, `.ToNSJson()`, `C.method(this)`, `INPUT.K.InstantDown()`, `LOG.AddLog()`, `.flatMap()`, `.forEach()`, `.formatMoneyShort()`, `.parseInt()`). Use them, don't reinvent.
- **Using import block order:** System → UnityEngine → TMPro → SPACE_UTIL. Blank line between groups. Omit unused namespaces.
- **Naming conventions (verify in every script):**
  - Class suffixes: `XxxDataService`, `XxxOrchestrator`, `XxxUI` (SubManager), `XxxManager`, `XxxBridge`, `BaseXxx` (base class)
  - Method prefixes: `Get.../Set...` (explicit, no properties), `Try...` (returns bool), `Can.../Is.../Should.../Has...` (predicates), `Handle...` (event callbacks), `Raise...` (GameEvents), `Build...` (init), `Refresh...` (UI update), `Orchestrate...`/`Subscribe...`/`Wire...` (event setup)
  - Compound method names are fine: `InitBuildOrchestrateAndSubscribe()`, `BuildAndOrchestrateCategoryView()`
  - Enum values: **camelCase** (CRITICAL — `TagType.grabbable` not `Grabbable`). Exception: ID enums with explicit int values may use PascalCase.
  - `[SerializeField]` fields: `_camelCase` always private. Prefab refs: `_pfXxx`
  - Lists: `ALL_CAPS`. Dicts: `DOC__key_value`. Constants: `CONSTANT_CASE`.
  - Boolean fields: `is` prefix (`isFirstEnable`, `isDead`)
- **Multiline SerializeField grouping:** When 4+ fields share a type, group under one `[SerializeField]` attribute with type on separate line:
  ```csharp
  [SerializeField]
  Color
      _canAffordColor = Color.limeGreen,
      _cannotAffordColor = Color.red * 0.8f;
  ```
- **Context injection pattern:** Use `Set...Context()` methods called by Bridges to push data between systems. The consumer stores only what it needs (transforms, not the owner class).
- **Boolean checks** — both `!` and `== false` are acceptable (use whichever is clearer).
- **Attributes (verify in every MonoBehaviour):**
  - `[AddComponentMenu("[PROJECT_NAME]/Category/ClassName")]` — MANDATORY on every MB. Categories: `Tools/`, `Managers/`, `Bridge/`, `Mining/`, `Inventory/`, `UI/`, `Test/`, etc.
  - `[CreateAssetMenu(menuName = "SO/SO_XxxDef", fileName = "SO_XxxDef")]` on every SO_
  - `[DefaultExecutionOrder]` on 2-3 critical managers per phase (not overdone)
  - `[Header]`, `[Range]`, `[TextArea]`, `[Tooltip]` — use for inspector clarity
- **File naming: filename MUST match classname** for inspector-added MonoBehaviours (Unity 6000.3)
- **Append surfer.md** after completing the phase with critical decisions made.
- **Read `learn/handTyped(latest)/`** to see the user's ACTUAL coding style — match it.

---

## New Project Quickstart Checklist

When starting a **brand new** Unity3D game rebuild:

```
□ 1. Extract/decompile original source into Scripts/Assembly-CSharp/
□ 2. Read every file. Understand all systems and their connections.
□ 3. Create learn/ARCHITECTURE.md (full source analysis)
□ 4. Create learn/GOAL.md (copy from GOAL-general.md, add project-specific examples)
□ 5. Create learn/NewAgent.md (copy from NewAgent-general.md, customize first prompt)
□ 6. Break game into phases → learn/PhaseMap.md
□ 7. Define DataService specs → learn/StructureMap.md
□ 8. Estimate timeline → learn/Estimate.md
□ 9. Build phase-All/ (Singleton, GameEvents, UIManager, EconomyManager/CurrencyManager)
□ 10. Build Phase 1 → hand-type → test → iterate
□ 11. Build Phase 2+ → repeat
□ 12. Each phase: GUIDE.md + FLOW.md + scripts + tests + manual tests
□ 13. Post-delivery self-audit per phase (mandatory)
□ 14. Append surfer.md with reasoning per prompt
```

**The architecture is the same every time.** Only the game content changes — different SO_ types, different MonoBehaviours, different GameEvents. The folder structure, naming conventions, decoupling rules, test strategy, and documentation format are universal.