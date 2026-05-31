---
description: "Sync all living docs after user hand-types a phase"
---

# /post-delivery-sync — Update Living Docs After Phase Completion

> Run this after the user finishes hand-typing a phase. Compares actual delivered code against planned docs and updates everything.

## Setup

1. Ask: "Which project?" → `{PROJECT}`. Ask: "Which phase?" → `{PHASE}`

## Context

The user just finished hand-typing `{PHASE}`. The actual code may differ from what was planned in PhaseMap.md, StructureMap.md, and other docs. This prompt brings all living docs into sync with reality.

## Steps

### 1. Inventory actual delivered files

Scan `LEARN/{PROJECT}/phase-{PHASE}/` recursively. List every `.cs` file with:
- File path
- Class name(s)
- Which `_-Systems/` folder it's in
- One-liner purpose

### 2. Compare against PhaseMap.md

Read `LEARN/{PROJECT}/PhaseMap.md` section for `{PHASE}`. For each planned file:
- ✅ Delivered as planned
- ⚠️ Delivered but renamed/moved/split
- ❌ Not delivered (missing)
- ➕ Extra file not in plan

Update PhaseMap.md with actual file list, actual folder placements, and corrected modifications table.

### 3. Compare against StructureMap.md

Read `LEARN/{PROJECT}/StructureMap.md` section for `{PHASE}`. For each DataService:
- Compare planned collections vs actual collections (names, types)
- Compare planned methods vs actual methods (signatures)
- Compare planned nested types vs actual
- Update with reality

### 4. Update CoverageMap.md

Scan all phase folders. For every `.cs` file in `MAIN-SOURCE/{PROJECT}/` referenced by this phase:
- Map source file → which phase covers it → which script(s)
- Update coverage percentage
- Flag any source files NOT yet covered

### 5. Update SystemPortabilityMap.md

For every `_-Systems/` folder in the delivered phase:
- Read its `Dependency.md`
- Verify portability level matches actual code
- Update the global portability table

### 6. Update Estimate.md

If the user tracked typing time:
- Compare estimated vs actual time per script
- Recalibrate complexity tiers
- Update future phase estimates

### 7. Update GUIDE.md statistics

In `LEARN/{PROJECT}/phase-{PHASE}/GUIDE.md`:
- Correct file counts
- Correct system counts
- Correct test counts
- Ensure folder structure matches actual

### 7b. Update FLOW.md event registry

In `LEARN/{PROJECT}/phase-{PHASE}/FLOW.md`:
- Verify Event Registry table matches actual GameEvents.cs (user may have added/removed/renamed events)
- Update data flows if user changed method names or interaction patterns
- Update system map if user added/removed systems or changed connections
- Update portability diagram if dependency structure changed

### 7c. Compare user's naming deviations

Compare the user's hand-typed code against GOAL.md conventions:
- Did the user rename any planned scripts? (e.g., `ShopUI` → `ShopSubManager`)
- Did the user use different field naming patterns? (e.g., dropped `DOC__` prefix)
- Did the user organize `#region` blocks differently than prescribed?
- Did the user introduce new extension methods not in Utils.cs?
- Output: `| Convention | GOAL.md Says | User Did | Action |`
  - Action = "Update GOAL.md" (user's way is better) or "Note deviation" (one-off exception) or "Flag for discussion"
- If any deviations should become the new standard, update GOAL.md "User's Coding Style" section.

### 7d. Update GOAL.md with discovered patterns

Review the delivered phase for **new architectural patterns** not already documented:
- New interaction flows (equip/drop/stack, multi-step crafting, conveyor chains)
- New Bridge pattern variants
- New interface designs worth reusing
- New code organization patterns
- If any are found, append them to GOAL.md's "Game-Specific Patterns" section with: pattern name, which system introduced it, code snippet, when to reuse.

### 7e. Update SystemIsolationAnalysis.md

If `LEARN/{PROJECT}/SystemIsolationAnalysis.md` exists:
- Add this phase's systems to the communication matrix
- Add new interfaces to the Interface Ownership Map
- Add new bridges to the Bridge Pattern Catalog
- Update GameEvents Flow table with new events
- Update Isolation Tiers Summary with new systems
- Update Coupling Hotspots if new high-connectivity systems emerged

### 7f. Update GameStateSoFar.md

If `LEARN/{PROJECT}/GameStateSoFar.md` exists:
- Compare the planned "After phase-{PHASE}" section against what was actually hand-typed
- If the hand-typed code changed the gameplay scope (added features, removed features, moved features to another phase):
  - Append a `> **Post-typing update (phase-{PHASE}):**` note describing what changed
- If the gameplay scope is unchanged from the plan, skip this step
- **Player-experience language ONLY** — no class names, no system names

### 8. Summary

Output a table:

| Doc | Changes Made |
|-----|-------------|
| PhaseMap.md | [what changed] |
| StructureMap.md | [what changed] |
| CoverageMap.md | [what changed] |
| SystemPortabilityMap.md | [what changed] |
| SystemIsolationAnalysis.md | [what changed] |
| Estimate.md | [what changed] |
| GUIDE.md | [what changed] |
| FLOW.md | [what changed] |
| GOAL.md | [patterns added / style deviations noted] |
| GameStateSoFar.md | [post-typing update note added / no change] |
| Naming Deviations | [list any convention changes] |