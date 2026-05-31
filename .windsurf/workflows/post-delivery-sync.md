---
description: Sync all living docs after user hand-types a phase. Use after each phase typed.
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`. Ask: "Which phase was just typed?" → `{PHASE}`

## Process

2. Read the user's hand-typed code in `LEARN/{PROJECT}/handTyped(latest)/` or the phase folder
3. Compare against generated phase scripts — note differences in style, naming, structure
4. Update living docs to reflect actual typed state:
   - **GameStateSoFar.md** — add what's now playable after this phase
   - **Estimate.md** — record actual time taken vs estimate
   - **surfer.md** — append reasoning entry for this phase
   - **CoverageMap.md** — mark covered source files
   - **PhaseMap.md** — mark phase as TYPED, note any deviations
5. If style differences found, suggest running `/update-goal-from-handtyped`
