---
description: "Rebuild all top-level LEARN/ documentation from actual phase code — PhaseMap, StructureMap, SystemPortabilityMap, CoverageMap, SystemIsolationAnalysis, Estimate, OptionalFeatures, GameStateSoFar. Use when: after multiple phases are done, docs feel stale, after major refactors"
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`
2. Ask: "Which docs to refresh?" → options:
   - **"all"** (default) — rebuild every doc listed below
   - **"specific"** — user picks which ones (PhaseMap, StructureMap, etc.)

**In-depth detailed analysis is MANDATORY.** Read every phase folder. Trace every system, every interface, every event across all phases.

## Context Load

3. Read ALL templates in `.windsurf/templates/` that correspond to docs being rebuilt:
   - `PhaseMap-template.md`, `StructureMap-template.md`, `SystemPortabilityMap-template.md`
   - `SystemIsolationAnalysis-template.md`, `CoverageMap-template.md`
   - `Estimate-template.md`, `OptionalFeatures-template.md`
   - `GameStateSoFar-template.md`
4. Read `LEARN/{PROJECT}/GOAL.md` — architecture rules
5. Read `LEARN/{PROJECT}/phase-All/` — shared infra (GameEvents core, enums, Singleton, Utils)
6. Inventory ALL phase folders in `LEARN/{PROJECT}/` — list every `phase-{x}/` that exists
7. For each existing phase, read:
   - Every `.cs` file (scan for: classes, interfaces, enums, GameEvents, DataService collections, Singleton<T>, system shapes)
   - Every `_-Systems/*/Dependency.md` (if exists — use as reference for shapes/levels)
   - `GUIDE.md` and `FLOW.md` (if exists — for cross-reference)

## Rebuild PhaseMap.md

7. Follow the structure in `PhaseMap-template.md`. For each phase, rebuild its section:
   - **File list** — every `.cs` file with its role (SO_, Field_, W, DataService, Orchestrator, SubManager, Bridge, Interface, other)
   - **System assignments** — which `_-Systems/` folder each file belongs to
   - **Cross-phase modifications** — what this phase adds/modifies in earlier phases
   - **Vertical slice tests** — what to test when this phase compiles
   - **Gap audit** — any functionality from `MAIN-SOURCE/` not yet covered
   - **Dependency DAG** — verify all arrows point LEFT (no forward refs)
   - **80% rule** — verify each phase has ≥80% scripts inside `_-Systems/`
   - **Phase size** — flag any phase exceeding ~25 files

## Rebuild StructureMap.md

8. Follow the structure in `StructureMap-template.md`. For each phase, for each DataService:
   - **Class name** and which system it belongs to
   - **Collections** — every `List<T>`, `Dictionary<K,V>`, and their exact generic types
   - **Methods** — every public method with signature
   - **Nested types** — any inner classes/structs
   - **GetSnapShotForTest()** — exact format
   - **ASCII folder tree** — show the system's folder structure with file roles

## Rebuild SystemPortabilityMap.md

9. Follow the structure in `SystemPortabilityMap-template.md`. For each system across ALL phases:
   - **Level** (L0, L1, L2, ...) — count non-FREE imports from other `_-Systems/`
   - **Shape(s)** — Spider/Hunter/Adapter/Broadcaster/Listener with emoji
   - **Concrete deps** — list any ❌ concrete imports (must fix)
   - **Interface deps** — list interface imports (portable, counted)
   - **Portable?** — ✅ (interface-only or L0) or ❌ (concrete deps)
   - **Aggregate stats** — total systems, % L0, % L1+ portable, % game-specific

## Rebuild SystemIsolationAnalysis.md

10. Follow the structure in `SystemIsolationAnalysis-template.md`. Build cross-system analysis:
    - **Communication Matrix** — grid showing how every system talks to every other (Event/Read/Interface/Bridge/Direct)
    - **Bridge Pattern Inventory** — every Bridge class with: lives in, pattern variant (event-push/event-response/push-to-all/event-chain/static-accessor), pushes context to, phase
    - **Interface Ownership Map** — every interface: owner system, phase, implementors list
    - **Coupling Hotspots** — systems with 3+ incoming/outgoing connections
    - **Event Flow Diagram** — which events connect which systems (subscribers count)

## Rebuild CoverageMap.md

11. Follow the structure in `CoverageMap-template.md`. Cross-reference ALL source files in `MAIN-SOURCE/{PROJECT}/` against phases:
    - **Every source file** → which phase covers it (or "UNASSIGNED")
    - **Coverage percentage** — files covered / total files
    - **Unassigned files** — flag any source file not mapped to any phase
    - **Multi-assigned files** — flag any source file claimed by multiple phases

## Rebuild Estimate.md

12. Follow the structure in `Estimate-template.md`. Recalibrate from actual data:
    - Count files per phase (simple <8, medium 8-15, complex 16+)
    - If any phases have been hand-typed, use actual time as calibration
    - Project remaining phases based on calibrated speed
    - Flag phases that grew beyond original estimate

## Rebuild OptionalFeatures.md

13. Follow the structure in `OptionalFeatures-template.md`. Re-scan for features outside 100% scope:
    - Nice-to-have features discovered by `/source-fidelity-check` or `/audit-phase`
    - Visual polish (VFX, particles, screen effects)
    - Audio triggers and ambient systems
    - Animation flourishes
    - Edge-case handling (error recovery, fallback states)
    - For each: exact integration point (which system, which method, which `#region Extra`)

## Rebuild GameStateSoFar.md

13b. Follow the structure in `GameStateSoFar-template.md`. Regenerate ALL sections from actual phase code:
    - **"After /init" section** — game pitch (keep existing or rewrite from ARCHITECTURE.md)
    - **Per-phase sections** — for EACH delivered phase folder that exists in `LEARN/{PROJECT}/`:
      - Read the phase's GUIDE.md "What It Looks Like When Running" section
      - Read the phase's systems to understand what gameplay it enables
      - Write a cumulative 3-8 sentence player-experience description
      - Include "New this phase" bullets and "Still missing" bullets
    - **Player-experience language ONLY** — no class names, no system names, no architecture terms
    - If hand-typed code differs from generated code, note deviations as post-typing updates

## Verification

14. Cross-check all rebuilt docs:
    - PhaseMap file lists match actual file counts in phase folders
    - StructureMap DataService specs match actual DataService code
    - SystemPortabilityMap levels match Dependency.md files
    - CoverageMap shows 100% coverage (no unassigned files) — or flags gaps
    - No forward dependencies in PhaseMap DAG
    - 80% rule passes for every phase

## Output

15. Write all updated docs to `LEARN/{PROJECT}/`:
    - `PhaseMap.md`
    - `StructureMap.md`
    - `SystemPortabilityMap.md`
    - `SystemIsolationAnalysis.md`
    - `CoverageMap.md`
    - `Estimate.md`
    - `OptionalFeatures.md`
    - `GameStateSoFar.md`

**These are FULL rewrites** — not incremental patches. Each doc is regenerated from actual code as ground truth.