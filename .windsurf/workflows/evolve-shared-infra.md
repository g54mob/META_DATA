---
description: Analyze and strategize phase-All/ growth as phases accumulate. Use every 2-3 phases.
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`

## Process

2. Read all files in `LEARN/{PROJECT}/phase-All/`
3. Read all phase folders to identify:
   - Utils methods used across 2+ phases → should be in Utils.cs
   - Events that belong in core GameEvents (used by 3+ systems)
   - Shared enums that outgrew their phase → move to GlobalEnumsAll
   - Manager candidates (patterns repeated across phases)
4. Recommend additions to phase-All/:
   - New extension methods for Utils.cs
   - Events to promote to core GameEvents
   - Enums to move to GlobalEnumsAll.cs
   - New shared infrastructure (if justified)
5. Generate diffs for approved changes
