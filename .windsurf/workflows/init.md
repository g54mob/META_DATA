---
description: Analyse a raw source project and bootstrap all architecture docs from scratch. Use when starting a new project, initial source analysis, generating ARCHITECTURE.md GOAL.md NewAgent.md PhaseMap.md StructureMap.md Estimate.md SystemPortabilityMap.md CoverageMap.md OptionalFeatures.md GameStateSoFar.md surfer.md phase-All/
---

## Setup

1. Ask: "Which project?" → sets `{PROJECT}` (e.g., `project-0`)
2. Verify `MAIN-SOURCE/{PROJECT}/` exists and contains source scripts
3. Read `MAIN-SOURCE/entire-{PROJECT}.stub` — COMPLETE file hierarchy of the original project
4. Create `LEARN/{PROJECT}/` folder structure if it doesn't exist

## Read Templates

Read ALL templates in `.claude/templates/` — these define exact structure for every generated doc:
- `ARCHITECTURE-template.md`, `PhaseMap-template.md`, `StructureMap-template.md`
- `SystemPortabilityMap-template.md`, `CoverageMap-template.md`, `Estimate-template.md`
- `OptionalFeatures-template.md`, `GameStateSoFar-template.md`, `surfer-template.md`
- `GOAL-general.md` → copied into GOAL.md
- `NewAgent-general.md` → copied into NewAgent.md

## Source Analysis

5. Read **every single `.cs` file** in `MAIN-SOURCE/{PROJECT}/Scripts/Assembly-CSharp/`
   - Start with 10 largest files (god-objects that reveal dependency graph)
   - Then read every remaining `.cs` file
6. Extract: class name, base class, interfaces, singletons, [SerializeField], public methods, FindObjectOfType, event subscriptions, direct class references
7. Map full dependency graph. Count total files.

## Scale Classification

| Scale | File Count | Phases |
|-------|-----------|--------|
| Micro | <50 | 2-3 |
| Small | 50-149 | 3-5 |
| Medium | 150-399 | 5-8 |
| Large | 400-799 | 8-12 |
| XLarge | 800+ | 10-15+ |

## Generate Docs (in order)

1. **ARCHITECTURE.md** — full source analysis (from template)
2. **GOAL.md** — copy GOAL-general.md + customize with project specifics
3. **NewAgent.md** — copy NewAgent-general.md + customize
4. **PhaseMap.md** — phases, files, mods, tests, gap audit (from template)
5. **StructureMap.md** — DataService specs per phase (from template)
6. **Estimate.md** — typing timeline (from template)
7. **SystemPortabilityMap.md** — L0/L1+ classification (from template)
8. **CoverageMap.md** — source file → phase mapping (from template)
9. **OptionalFeatures.md** — features outside scope (from template)
10. **GameStateSoFar.md** — progressive state (from template)
11. **surfer.md** — reasoning log (from template)
12. **phase-All/** — Singleton.cs, GameEvents.cs, UIManager.cs, DataManager.cs, GlobalEnumsAll.cs, Utils.cs
