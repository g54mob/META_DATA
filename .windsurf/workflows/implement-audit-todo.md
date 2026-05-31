---
description: Implement framework improvements by deep-reading MAIN-SOURCE/ projects and applying changes. Works from gap reports or user-specified changes. Use after /audit-framework produces a gap report.
---

## Setup

1. Check if `.windsurf/audit-required-todo.md` exists — if yes, read it for prioritized gaps
2. If no todo file, ask user what framework changes are needed

## Process

3. For each gap/improvement:
   - Read relevant MAIN-SOURCE/ files to understand the real pattern
   - Create new skill if pattern is missing (`.windsurf/skills/<name>/SKILL.md`)
   - Update existing skill if it's genre-blind
   - Update rules if conventions need additions
   - Update workflows if process is missing steps
4. Verify changes don't conflict with existing rules
5. Mark completed items in audit-required-todo.md
