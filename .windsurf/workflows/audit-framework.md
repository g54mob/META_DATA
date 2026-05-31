---
description: Deep-analyse ALL projects in MAIN-SOURCE/ to classify domain demands, discover missing skills, and produce a gap report. Use when adding new project genres or framework feels insufficient.
---

## Process

1. Scan ALL projects in `MAIN-SOURCE/` — read .cs files from each
2. Classify each project: genre, scale, skills needed, unique patterns
3. Cross-reference against available skills in `.windsurf/skills/`
4. Identify gaps:
   - Missing skills (patterns in source not covered by any skill)
   - Existing skills that are genre-blind (e.g., audio skill missing RTS patterns)
   - Template gaps (conventions not covered)
   - Workflow blind spots (common operations without a workflow)
5. Output gap report with prioritized recommendations
6. Save report to `.windsurf/audit-required-todo.md` for `/implement-audit-todo`
