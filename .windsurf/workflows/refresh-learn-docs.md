---
description: Rebuild all LEARN/ docs from current code state — ARCHITECTURE.md through GameStateSoFar.md. Use after major changes.
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`

## Process

2. Re-read all source in `MAIN-SOURCE/{PROJECT}/`
3. Re-read all generated code in `LEARN/{PROJECT}/`
4. Regenerate all living docs from current state:
   - PhaseMap.md — verify accuracy, update status
   - StructureMap.md — verify DataService specs match code
   - CoverageMap.md — verify source coverage
   - SystemPortabilityMap.md — recalculate portability levels
   - Estimate.md — update with actuals
   - GameStateSoFar.md — reflect current playable state
   - OptionalFeatures.md — update based on what's been implemented
5. Do NOT regenerate ARCHITECTURE.md (source hasn't changed) or GOAL.md (user calibrated)
