---
description: "Analyze and strategize phase-All/ growth as phases accumulate"
---

# /evolve-shared-infra — Strategize phase-All/ Growth

> Run periodically (every 2-3 phases) to analyze whether shared infrastructure needs refactoring. Checks for bloat, duplication, and splitting opportunities.

## Context

As phases accumulate, `phase-All/` grows: Utils.cs gets longer, GlobalEnumsAll.cs gains more enums, GameEvents.cs expands, UIManager gains more Close events. This prompt analyzes the current state and recommends actions.

## Setup

1. Ask: "Which project?" → `{PROJECT}`

## Steps

### 1. Inventory phase-All/

Read every file in `LEARN/{PROJECT}/phase-All/`. For each file:
- Line count
- Number of methods/fields/enums
- Which phases use it (grep for references in all phase folders)

### 2. Analyze Utils.cs growth

- Current line count and `#region` count
- Are there regions only used by ONE phase? (should stay in phase-All but mark with comment)
- Are there regions used by ALL phases? (true shared infra)
- Is the file approaching 500+ lines? Consider splitting into `Utils.cs` (core) + `UtilsPhysics.cs` etc.
- Any duplicate logic across phases that should be extracted here?

### 3. Analyze GlobalEnumsAll.cs growth

- How many enums?
- How many values total?
- Is it approaching 200+ lines?
- The architecture says "one file per phase" (`GlobalEnumsB.cs`, `GlobalEnumsC.cs`) — is this being followed?
- TagType enum: how many tags? Still manageable?

### 4. Analyze GameEvents.cs (phase-All)

- How many events in the shared file?
- Are any events only used within ONE phase? (should move to that phase's 0-Core/GameEvents.cs)
- Are partial class extensions in each phase's 0-Core/ well-organized?

### 5. Analyze UIManager growth

- How many Close events does `CloseAllSubManager()` fire?
- How many key checks in `Update()`?
- Is it approaching the point where key routing should be extracted to a KeyRouter or InputManager?

### 6. Analyze DataManager growth

- How many shared visual data fields?
- Any fields only used by one system? (move to that system)

### 6b. Detect emergent base classes

Scan ALL phase folders (not just phase-All/) for inheritance patterns:
- Are there abstract/base classes duplicated or scattered across phases? (e.g., `BasePhysicsObject` in phase-C, `BaseSellableItem` in phase-D)
- Are there 2+ classes across different systems that share significant code via copy-paste? (extraction candidate)
- For each candidate: where is it now, which phases/systems use it, should it move to `phase-All/3-MonoBehaviours/`?
- Output: `| Base Class | Current Location | Used By (Systems) | Recommend Move to phase-All? |`

### 6c. Analyze 7-3D/ documentation growth

Read `LEARN/{PROJECT}/phase-All/7-3D/` (MODEL.md, ANIM.md, WORLD.md):
- Do they have `## Phase X` sections for each completed phase?
- Are there missing phases (phase was built but didn't update 7-3D/ docs)?
- Are there 3D conventions being followed inconsistently across phases?
- Output: `| Doc | Phases Covered | Phases Missing | Status |`

### 6d. Evaluate need for new Managers

Look for patterns across phases that suggest a new shared Manager:
- Is there data being queried via `Singleton<X>.Ins.GetY()` from 3+ different systems? (candidate for dedicated Manager)
- Are there shared visual assets (materials, sprites, colors) being referenced via `[SerializeField]` in 3+ systems? (DataManager candidate)
- Is there input routing logic scattered across multiple SubManagers? (InputManager / KeyRouter candidate)
- Is there save/load logic emerging across systems? (SaveLoadManager candidate)
- For each candidate: what it would own, which systems would use it, estimated impact.
- Output: `| Candidate Manager | What It Would Own | Current Workaround | Systems That Would Use It |`

### 7. Recommend actions

For each file, recommend:
- **Keep as-is** — file is healthy, no action needed
- **Split** — file is too large, recommend splitting strategy
- **Extract** — logic should move to a specific phase or system
- **Consolidate** — scattered logic should move here from phases
- **New shared infra needed** — a new Manager or utility class should be created

### 8. Output

Summary table:
| File | Lines | Status | Recommendation |
|------|-------|--------|---------------|
| Utils.cs | [N] | [healthy/growing/bloated] | [keep/split/extract] |
| GlobalEnumsAll.cs | [N] | [...] | [...] |
| GameEvents.cs | [N] | [...] | [...] |
| UIManager.cs | [N] | [...] | [...] |
| DataManager.cs | [N] | [...] | [...] |

Emergent base classes:
| Base Class | Current Location | Used By | Recommendation |
|-----------|-----------------|---------|---------------|

7-3D/ documentation:
| Doc | Phases Covered | Missing | Status |
|-----|---------------|---------|--------|

New Manager candidates:
| Candidate | What It Would Own | Impact |
|-----------|-------------------|--------|

Detailed recommendations with code examples for any splitting/extraction/creation.