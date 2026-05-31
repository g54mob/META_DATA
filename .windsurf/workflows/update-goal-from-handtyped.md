---
description: Sync GOAL.md with user's actual coding style after hand-typing a phase. Use after each phase typed to calibrate conventions.
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`

## Process

2. Read `LEARN/{PROJECT}/handTyped(latest)/` — the user's ground-truth hand-typed code
3. Read `LEARN/{PROJECT}/GOAL.md` — current architecture bible
4. Compare: identify style differences between GOAL.md conventions and actual typed code
5. Update GOAL.md to match reality:
   - Naming patterns the user actually uses
   - Region ordering preferences
   - Comment verbosity level
   - Extension method preferences
   - Blank line habits
   - Any conventions the user consistently ignores or adds
6. Report what was calibrated
