---
description: Merge two adjacent underpopulated phases into one — combines files, documentation, and recalculates all cross-references. Use when two phases are too small to justify separation.
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`. Ask: "Merge which phases?" → `{PHASE_A}` + `{PHASE_B}`

## Process

2. Verify phases are adjacent (dependency order preserved)
3. Verify combined file count stays under 25 (phase size cap)
4. Merge all `_-Systems/` folders into target phase
5. Merge `0-Core/GameEvents.cs` partial classes
6. Merge `2-Data/Enums/GlobalEnums{X}.cs` files
7. Merge `4-Utils/Phase{X}LOG.cs` files
8. Regenerate combined GUIDE.md, FLOW.md
9. Update all living docs:
   - PhaseMap.md (combine entries, renumber)
   - StructureMap.md (combine DataService specs)
   - CoverageMap.md (update phase assignments)
   - Estimate.md (recalculate)
10. Delete the absorbed phase folder
