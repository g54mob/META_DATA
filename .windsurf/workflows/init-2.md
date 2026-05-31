---
description: "/init continuation (part 2/3) — generates PhaseMap, StructureMap, GOAL.md, NewAgent.md, and supporting docs. Run /init first."
---

<!-- SPLIT: Part 2 of /init — exceeds Windsurf's 12K char limit when combined -->

## Generate PhaseMap.md

10. Group all source scripts into logical phases by dependency order:
    - Phase = set of scripts that can be built and tested independently
    - Rule: each phase depends only on earlier phases, never forward
    - **SIZE CAP: Max ~25 scripts per phase.** If a phase exceeds 25 files, split it into sub-phases (e.g., phase-C → phase-C + phase-D). Reasons: hand-typing fatigue, vertical slice testing scope, manageable PR size. Count ALL files (SO_, Field_, DataService, Orchestrator, SubManager, interfaces, bridges, enums, tests).
    - For each phase: file list with folder placement, "What It Looks Like When Running" (conversational), difficulty rating, weight %
    - Phase ordering (dependency order):
      1. Core + Economy + UI framework (shop, interaction)
      2. Environment (level-specific setup)
      3. Player (controller, inventory, tools, grabbing)
      4. Primary game mechanic (game-specific: mining, combat, building, etc.)
      5. Secondary mechanics (automation, processing, crafting)
      6. Content systems (quests, research, progression)
      7. Persistence (save/load)
      8. Polish (audio, settings, menus)
      9. Final (debug, demo, world events)

11. For each phase include:
    - **Domain boundary** — what this phase covers (one sentence)
    - **File list** — every .cs file with exact folder placement and one-line purpose. **Primary placement = `_-Systems/XxxSystem/`** for all feature code (SO_, Field_, DataService, DataWrapper, Orchestrator, SubManager, Interface/, Bridge/). Only shared infra goes in numbered folders (0-Core/, 2-Data/Enums/, 4-Utils/). **80% rule: at least 80% of scripts MUST be inside `_-Systems/`.**
    - **_-Systems/ assignments** — which files group into systems (3+ tightly coupled files per system). Most scripts should be inside a system.
    - **Modifications to earlier phases** — table: `| File | How (partial/direct) | Change | Why |`
    - **Vertical Slice Tests** — what to test, prerequisites, checklist per system
    - **"What It Looks Like When Running"** — conversational description of the player experience

12. Append **Gap Audit** at the end of PhaseMap:
    ```
    | Phase | +Scripts | Key Additions | Priority |
    |-------|---------|---------------|----------|
    ```
    - **Critical** — source has it, missing = broken fidelity
    - **Important** — source has it, adds meaningful behavior
    - **Polish** — nice-to-have, goes in `#region extra` blocks

12b. **Dependency DAG Verification** — After all phases are defined, draw an ASCII dependency DAG:
    ```
    phase-All ← phase-A ← phase-B ← phase-C
                                  ↖ phase-D
    ```
    - Every arrow must point LEFT (to an earlier phase). If any arrow points RIGHT, reorder phases.
    - Verify: for EACH phase, list every class it imports from another phase. If any import comes from a LATER phase, either reorder or split.
    - Verify: each phase compiles with ONLY earlier phases present (no forward references).
    - Include this DAG in PhaseMap.md as a "Phase Dependency Order" section.

12c. **Phase Size Validation** — After splitting, verify:
    ```
    | Phase | File Count | Status |
    |-------|-----------|--------|
    ```
    - ✅ = ≤25 files
    - ⚠️ = 26-30 files (acceptable if tightly coupled, add justification)
    - ❌ = 31+ files (MUST split — no exceptions)

13. Create `LEARN/{PROJECT}/PhaseMap.md` — follow the structure in `.windsurf/templates/PhaseMap-template.md`

## Generate StructureMap.md

14. For each phase, define the internal structure:
    - **DataService candidates** — every `List<T>` / `Dictionary<K,V>` extractable from MonoBehaviours into pure C# DataService classes
    - For each DataService: exact collections (field names, types), methods (signatures, what they return/do), nested types (with all fields), `GetSnapShotForTest()` format
    - **SO_ / Field_ / W prefix assignments** — which original scripts become which role
    - **Orchestrator triads** — which SubManager owns which DataService, which Orchestrator wires which Field_ types
    - **Interface candidates** — cross-system communication points, who owns, who implements
    - **_-Systems/ structure** — which scripts go in which system folder, with Interface/ and Bridge/ subfolders
    - **Decision trees** — for ambiguous scripts: "Is it a Manager or MonoBehaviour? Does it need DataService extraction?"
    - **Full folder tree per phase** — ASCII tree showing exact file placement:
      ```
      phase-X/
      ├── _-Systems/
      │   ├── FeatureASystem/
      │   │   ├── SO_FeatureADef.cs
      │   │   ├── Field_FeatureA.cs
      │   │   ├── WFeatureA.cs
      │   │   ├── FeatureADataService.cs
      │   │   ├── FeatureAOrchestrator.cs
      │   │   ├── FeatureAUI.cs
      │   │   ├── Interface/
      │   │   │   └── IFeatureAProvider.cs
      │   │   ├── Bridge/
      │   │   │   └── FeatureAContextBridge.cs
      │   │   ├── Test.md
      │   │   └── Dependency.md
      │   └── FeatureBSystem/
      │       └── ...
      ├── 0-Core/
      │   └── GameEvents.cs
      ├── 2-Data/Enums/
      │   └── GlobalEnumsX.cs
      └── 4-Utils/
          └── PhaseXLOG.cs
      ```
      This tree is the agent's build target — every file listed here MUST be produced by `/build-phase`.

15. Create `LEARN/{PROJECT}/StructureMap.md` — follow the structure in `.windsurf/templates/StructureMap-template.md`

## Generate GOAL.md (from template)

16. **Read `.windsurf/templates/GOAL-general.md`** — this is the universal architecture rules template containing ALL conventions: folder structure, naming, class responsibilities, decoupling, lifecycle, C# features, testing, pitfalls, gold-standard doc examples, mandatory patterns, common agent mistakes.

17. **Copy the ENTIRE content** of `GOAL-general.md` into a new `LEARN/{PROJECT}/GOAL.md`, then customize:
    - Replace all `[PROJECT_NAME]` with the actual project name
    - Replace `[PHASE_X]` placeholders with actual phase names from PhaseMap
    - Fill in the **"User's Coding Style — CUSTOMIZE THIS"** section by reading `LEARN/{PROJECT}/handTyped(latest)/` if it exists, or noting "TO BE FILLED after user types Phase A"
    - Fill in the **"Phase Overview — CUSTOMIZE THIS"** table with actual phases from PhaseMap
    - Add project-specific utility extensions found in source (if any)
    - Add project-specific enums, tags, layers found in source
    - **CRITICAL: GOAL.md must describe the REDESIGNED architecture (what to build), NOT the original source patterns (what exists).** The original source analysis belongs in ARCHITECTURE.md. GOAL.md defines the transformation target.

18. Create `LEARN/{PROJECT}/GOAL.md`

## Generate NewAgent.md (from template)

19. **Read `.windsurf/templates/NewAgent-general.md`** — this is the universal agent instruction template containing: first prompt, delivery checklist, common mistakes, mandatory patterns, reference files table.

20. **Copy the ENTIRE content** of `NewAgent-general.md` into a new `LEARN/{PROJECT}/NewAgent.md`, then customize:
    - Replace all `[PROJECT_NAME]` with the actual project name
    - Replace `[PHASE_X]` with Phase A (first phase to build)
    - Update the "First Prompt" template with project-specific phase names and system names
    - Fill in the reference files table with actual file paths
    - Add any project-specific patterns discovered during source analysis

21. Create `LEARN/{PROJECT}/NewAgent.md`

## Generate Supporting Docs

22. Create `LEARN/{PROJECT}/Estimate.md` — follow `.windsurf/templates/Estimate-template.md`. Hours per phase using these complexity tiers:
    | Script Complexity | Examples | Avg Time |
    |-------------------|---------|----------|
    | **Simple** (enums, stubs, interfaces, SOs, entities) | GlobalEnumsX, SO_Def, SaveEntry | ~15 min |
    | **Medium** (DataService, DataWrapper, Field_, Utils, tests) | ItemDataService, WItem, Field_Slot | ~30 min |
    | **Complex** (MonoBehaviours, Orchestrators, Managers, Player scripts) | PlayerMovement, Orchestrator | ~60 min |
    Formula: `(simple × 15 + medium × 30 + complex × 60) + scene/testing buffer (~25%)`

23. Create `LEARN/{PROJECT}/SystemPortabilityMap.md` — follow `.windsurf/templates/SystemPortabilityMap-template.md`. For every system in every phase:
    - Portability level (L0 = zero deps, L1+ = each import = +1)
    - System shape (Spider/Hunter/Adapter/Broadcaster/Infrastructure)
    - What it owns (interfaces), what it implements, concrete deps
    - FREE items that don't count: GameEvents, Singleton<T>, UIManager, DataManager, Utils.*, GlobalEnumsX, phase-All/ infra

24. Create `LEARN/{PROJECT}/CoverageMap.md` — follow `.windsurf/templates/CoverageMap-template.md`. Cross-reference table:
    - Every source file in `LEARN/{PROJECT}/Scripts/Assembly-CSharp/**/` → which phase covers it
    - Format: `| Source File | Lines | Phase | New Name(s) | Notes |`
    - Flag any source file NOT covered by any phase as "UNCOVERED — needs assignment"
    - This ensures 100% source coverage — no file falls through the cracks

    **Additionally, include these inventory sections:**

    **Interface Inventory:**
    ```
    | Interface | Owner System | Phase | Implementors (System → Phase) |
    |-----------|-------------|-------|-------------------------------|
    | IInteractable | InteractionSystem | B | OreSystem→C, ToolSystem→B |
    ```
    - Every interface defined across all phases, who owns it, who implements it
    - Helps identify cross-phase coupling at a glance

    **Bridge Inventory:**
    ```
    | Bridge | Lives In (System) | Pushes Context To | Phase |
    |--------|-------------------|-------------------|-------|
    | CamContextBridge | CameraSystem | PlayerGrab, FresnelHighlighter | B |
    ```
    - Every Bridge class, where it lives, what systems consume it

    **GameEvents Registry:**
    ```
    | Event | Defined In Phase | Raised By | Subscribed By |
    |-------|-----------------|-----------|---------------|
    | OnMoneyChanged | All | EconomyManager | ShopOrchestrator(A), ToolOrchestrator(B) |
    ```
    - Complete event communication map across all phases

25. Create `LEARN/{PROJECT}/OptionalFeatures.md` — follow `.windsurf/templates/OptionalFeatures-template.md`. Features outside mandatory 100% scope:
    - Visual polish (particles, screen shake, post-processing)
    - Audio (ambient, SFX, music system)
    - Advanced UI (tooltips, notifications, tutorials)
    - Performance (object pooling, LOD, culling optimizations)

    **For each feature, provide:**
    ```
    ### [Feature Name] — [Nice/Cool/Stretch]
    **Phase:** where it naturally fits
    **Effort:** [Simple/Medium/Complex] (~Xmin)
    **Integration point:** exact script + method where this plugs in
    **SerializeField refs needed:** what inspector refs the feature needs
    **Call pattern:**
    ```csharp
    // In [ScriptName].cs, [method]:
    [SerializeField] ParticleSystem _hitParticles;  // ← ADD
    _hitParticles.Play();  // ← ADD after damage applied
    ```
    **Why optional:** [doesn't affect core behavior / pure visual / requires asset work]
    ```

    This specificity ensures any optional feature can be added in ~5 minutes by knowing exactly WHERE the code goes and WHAT it looks like — not just a vague category.


> **Continue:** Run `/init-3` to proceed with GameStateSoFar, phase-All scaffolding, and verification.
