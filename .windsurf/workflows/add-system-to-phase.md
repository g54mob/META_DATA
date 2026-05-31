---
description: Add a single new system to an existing completed phase. Use when a system was missed or needs to be added after initial build.
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`. Ask: "Which phase?" → `{PHASE}`. Ask: "What system?" → `{SYSTEM}`

## Process

2. Read `LEARN/{PROJECT}/GOAL.md` and `LEARN/{PROJECT}/NewAgent.md`
3. Read `LEARN/{PROJECT}/PhaseMap.md` — verify system isn't already listed, or find its entry
4. Read original source for this system from `MAIN-SOURCE/{PROJECT}/`
5. Read existing phase code to understand established patterns
6. Generate the new system folder: `_-Systems/{SYSTEM}/` with all required files
7. Update `0-Core/GameEvents.cs` if new events needed (partial extend)
8. Update `2-Data/Enums/GlobalEnums{X}.cs` if new enums needed
9. Update `4-Utils/Phase{X}LOG.cs` with new collection snapshot methods
10. Update GUIDE.md, FLOW.md with new system sections
11. Generate Dependency.md for the new system
12. Run `/decouple-check` on the new system
