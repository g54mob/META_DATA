---
description: "Post-delivery self-audit — method-by-method source comparison + architecture rule check + pitfall scan + common mistakes check. Use when: after any delivery, verifying source fidelity, checking architecture violations, doc consistency"
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

## Source Fidelity (100% behavior match)

4. For every original source file in `MAIN-SOURCE/{PROJECT}/` mapped to this phase:
   - Read original line-by-line
   - Compare every public method, field, property, interface implementation against `LEARN/{PROJECT}/phase-{PHASE}/`
   - Compare every event subscription/raise, coroutine, Unity lifecycle hook
   - Compare every constant, threshold, timing value, default state
   - Log gaps: `| Original Method/Field | Status (✅/❌/⚠️) | Notes |`
   - ✅ = present and correct, ❌ = missing, ⚠️ = present but different behavior
5. Fix all ❌ gaps before proceeding. Document all ⚠️ with reason for difference.

## Unlisted Functionality Discovery

5b. **Go beyond the mapped files.** Read ALL source files in `MAIN-SOURCE/{PROJECT}/` that belong to this phase's DOMAIN (not just those listed in PhaseMap). Look for:
   - Source files in the same namespace/folder that PhaseMap didn't assign to any phase
   - Methods, coroutines, or event handlers inside mapped files that were overlooked (edge cases, fallback logic, secondary behaviors)
   - Nice-to-have features (visual effects, audio triggers, animation callbacks, UI polish) buried in source that OptionalFeatures.md missed
   - Conditional logic paths (e.g., `if (hasUpgrade)`, `if (isMultiplayer)`) that hint at features no phase covers

   For each discovery, classify:
   - **Critical** — source has it, without it the phase behavior is incomplete
   - **Important** — source has it, adds meaningful gameplay behavior
   - **Nice-to-have** — polish/visual/audio, goes in `#region Extra` or OptionalFeatures.md

   Output: `| Source File | Method/Feature | Classification | Currently Covered? | Action |`
   - Action = "Add to this phase" / "Add to later phase [which]" / "Add to OptionalFeatures.md" / "Already covered"

5c. **Update living docs** with discoveries:
   - Critical/Important items missing from this phase → flag for immediate fix
   - Items belonging to later phases → update PhaseMap.md + CoverageMap.md
   - Nice-to-haves → append to OptionalFeatures.md with integration points
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
   - Defensive null checks on inspector refs → remove (let it crash)
   - Missing `#region` blocks → add (Inspector Fields, private API, Unity Lifecycle, public API). Note: actual convention is lowercase `private API` / `public API` (combined), NOT "Private Fields" / "Public API" separately
   - Missing class summary (first-person "I") → add
   - Missing `// →` inline flow markers → add
   - GameEvents signatures using concrete classes → must use interfaces only (`Action<IInventoryItem>` not `Action<BaseHeldTool>`). GameEvents.cs must have zero imports from `_-Systems/`
   - Raw string Animator parameters (`SetTrigger("attack")`) → use `AnimParamType` enum in `GlobalEnumsX.cs`
   - Using `!` prefix for boolean checks — both `!` and `== false` are acceptable (keep code concise)
   - **80% rule violation** → if fewer than 80% of phase scripts are inside `_-Systems/`, audit every file outside it

## 17 Common Agent Mistakes Check

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

## 10 Common Pitfalls Check

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

## Domain-Specific Completeness Checks

8b. **Save/Load Completeness** (if phase has save/load):

<!-- SPLIT: This workflow exceeds Windsurf's 12K char limit. Continues in /audit-phase-2 -->

> **Continue:** Run `/audit-phase-2` to proceed with domain-specific checks, doc consistency, and report.
