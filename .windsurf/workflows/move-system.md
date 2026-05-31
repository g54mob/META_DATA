---
description: Move a system from one phase to another — relocates files, updates all cross-references, dependency docs, and living docs. Use when a system was placed in the wrong phase or phase rebalancing.
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`. Ask: "Which system?" → `{SYSTEM}`. Ask: "From phase?" → `{FROM}`. Ask: "To phase?" → `{TO}`

## Process

2. Verify dependency order allows the move (no forward deps in target phase)
3. Move all files from `phase-{FROM}/_-Systems/{SYSTEM}/` to `phase-{TO}/_-Systems/{SYSTEM}/`
4. Update cross-references:
   - GameEvents partial (move events to correct phase file)
   - GlobalEnums (move enum values to correct phase file)
   - PhaseXLOG (move snapshot methods)
5. Update documentation:
   - PhaseMap.md (move system listing)
   - CoverageMap.md (update phase assignment)
   - Both phase GUIDE.md and FLOW.md
   - SystemPortabilityMap.md if portability changed
6. Verify no forward dependencies introduced
