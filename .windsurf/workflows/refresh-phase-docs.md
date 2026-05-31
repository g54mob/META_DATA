---
description: Regenerate phase documentation (GUIDE.md, FLOW.md, Dependency.md) from current code state. Use after manual edits to phase scripts.
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`. Ask: "Which phase?" → `{PHASE}`

## Process

2. Read all scripts in `LEARN/{PROJECT}/phase-{PHASE}/`
3. Read templates: GUIDE-template.md, FLOW-template.md, Dependency-template.md
4. Regenerate:
   - **GUIDE.md** — beginner-friendly walkthrough reflecting current code
   - **FLOW.md** — story-style data flows reflecting current code
   - **Dependency.md** for each system — reflecting current imports/implements/owns
5. Cross-check against PhaseMap.md for accuracy
