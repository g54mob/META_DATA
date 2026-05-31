---
description: Analyse a raw source project and bootstrap all architecture docs from scratch. Use when starting a new project, initial source analysis, generating ARCHITECTURE.md GOAL.md NewAgent.md PhaseMap.md StructureMap.md Estimate.md SystemPortabilityMap.md CoverageMap.md OptionalFeatures.md GameStateSoFar.md surfer.md phase-All/
---

## Setup

1. Ask: "Which project?" → sets `{PROJECT}` (e.g., `project-0`)
2. Verify `MAIN-SOURCE/{PROJECT}/` exists and contains source scripts
3. Read `MAIN-SOURCE/entire-{PROJECT}.stub` — COMPLETE file hierarchy of the original project including assets excluded due to size. Use it to understand full scope (3D models, audio, prefabs, scenes).
4. Create `LEARN/{PROJECT}/` folder structure if it doesn't exist

## Read Templates

4b. Read ALL templates in `.windsurf/templates/` — these define exact structure for every generated doc:
- `ARCHITECTURE-template.md` → format for ARCHITECTURE.md
- `PhaseMap-template.md` → format for PhaseMap.md
- `StructureMap-template.md` → format for StructureMap.md
- `SystemPortabilityMap-template.md` → format for SystemPortabilityMap.md
- `SystemIsolationAnalysis-template.md` → format for SystemIsolationAnalysis.md
- `CoverageMap-template.md` → format for CoverageMap.md
- `Estimate-template.md` → format for Estimate.md
- `OptionalFeatures-template.md` → format for OptionalFeatures.md
- `GameStateSoFar-template.md` → format for GameStateSoFar.md
- `surfer-template.md` → format for surfer.md
- `GOAL-general.md` → copied into GOAL.md (ENTIRE content)
- `NewAgent-general.md` → copied into NewAgent.md (ENTIRE content)

## Source Analysis

5. Cross-reference `.stub` against `MAIN-SOURCE/{PROJECT}/` — identify asset-only vs code folders
6. Read **every single `.cs` file** in `MAIN-SOURCE/{PROJECT}/Scripts/Assembly-CSharp/`:
   - Start with 10 largest files (god-objects that reveal dependency graph)
   - Then read every remaining `.cs` file — no skipping
7. For each file extract: class name, base class, interfaces, singletons, [SerializeField] fields, public methods, FindObjectOfType calls, event subscriptions/raises, direct class references
8. Map full dependency graph: who imports who, who calls who, who subscribes to whose events. Count total files.

## Scale Classification

| Scale | Files | Phases | Approach |
|-------|-------|--------|----------|
| Micro | <50 | 2-3 | Combine systems, skip SystemIsolationAnalysis |
| Small | 50-149 | 3-5 | Standard _-Systems/ |
| Medium | 150-399 | 5-8 | Full architecture, all docs mandatory |
| Large | 400-799 | 8-12 | Phase Dependency DAG, aggressive splitting |
| XLarge | 800-1999 | 10-15 | Sub-phase strategy, domain boundary splits |
| Massive | 2000+ | 12-20+ | Sub-phase numbering, arc grouping |

## Genre + Third-Party + Skill Detection

- Classify genre (Mining/Tycoon/Combat/Horror/Colony/Puzzle/Sim)
- Detect third-party: FishNet/Mirror/Photon→networking, A*→ai-nav, DOTween→animation, Spine→animation, FMOD→audio
- Note applicable skills from `.windsurf/skills/` for later phases

## Generate Docs (in order)

9. **ARCHITECTURE.md** — full source analysis. Mandatory TOC: Project Overview, High-Level Diagram, Singleton Managers, System-by-System Breakdown (one per major system), Design Patterns, Coupling Analysis (FindObjectOfType table, cross-system refs, static access), God Objects, Critique, File Index.
10. **PhaseMap.md** — group scripts by dependency order. SIZE CAP: max 25 scripts/phase. Include: domain boundary, file list with exact folder placement (80%+ in `_-Systems/`), _-Systems/ assignments, modifications to earlier phases, vertical slice tests, "What It Looks Like Running", Gap Audit, Dependency DAG, Size Validation.
11. **StructureMap.md** — DataService specs per phase: collections (exact field names/types), methods (signatures), nested types, GetSnapShotForTest format, full ASCII folder tree per phase.
12. **GOAL.md** — COPY ENTIRE `GOAL-general.md`, customize: replace [PROJECT_NAME], fill Phase Overview table, add project-specific extensions/enums/tags.
13. **NewAgent.md** — COPY ENTIRE `NewAgent-general.md`, customize: replace placeholders, fill reference table.
14. **Estimate.md** — Simple=15min, Medium=30min, Complex=60min per script, +25% buffer.
15. **SystemPortabilityMap.md** — L0/L1+ per system, shapes (Spider/Hunter/Adapter/Broadcaster), FREE items don't count.
16. **CoverageMap.md** — every source file → phase mapping + Interface Inventory + Bridge Inventory + GameEvents Registry.
17. **OptionalFeatures.md** — with specific integration points and code patterns (not just categories).
18. **GameStateSoFar.md** — header + "After /init" section with game pitch (player language only).
19. **SystemIsolationAnalysis.md** — communication matrix, interface ownership, bridge catalog, events flow, isolation tiers.
20. **surfer.md** — Prompt 1 entry with discoveries/decisions/changes.
21. **phase-All/** — Singleton.cs, GameEvents.cs, UIManager.cs, DataManager.cs, GlobalEnumsAll.cs, Utils.cs, 7-3D/ docs (MODEL.md, ANIM.md, WORLD.md).

## Verify

22. Completeness check:
- [ ] ARCHITECTURE.md has ALL source files (verify file count)
- [ ] PhaseMap covers every source file (no orphans)
- [ ] PhaseMap DAG has no forward references
- [ ] ALL phases ≤25 files
- [ ] StructureMap has DataService specs + folder trees for every phase
- [ ] GOAL.md has no remaining placeholders
- [ ] NewAgent.md has no remaining placeholders
- [ ] CoverageMap has Interface/Bridge/Events inventories
- [ ] phase-All/ has all foundation scripts (EconomyManager is phase-specific, NOT here)
- [ ] surfer.md has Prompt 1 entry
