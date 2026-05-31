---
description: Backport patterns discovered during phase builds back into templates. Use after 3+ phases when patterns have stabilized.
---

## Process

1. Read all completed phases across all projects
2. Read current templates in `.windsurf/templates/`
3. Identify patterns that emerged during builds but aren't in templates:
   - New DataService patterns
   - New Orchestrator patterns
   - New region structures
   - New documentation conventions
   - New test patterns
4. Update templates to include discovered patterns
5. Ensure templates remain universal (not project-specific)
