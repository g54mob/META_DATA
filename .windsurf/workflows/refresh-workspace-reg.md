---
description: Regenerate WORKSPACE-REG.md from actual MAIN-SOURCE/ contents — rescan all projects, recount .cs files, reclassify scale/genre/skills. Use when new projects added or registry feels stale.
---

## Process

1. Scan ALL folders in `MAIN-SOURCE/`
2. For each project:
   - Count .cs files
   - Classify: genre, scale (Micro/Small/Medium/Large/XLarge/Massive)
   - Identify skill tags (which `.windsurf/skills/` are relevant)
   - Check status (has LEARN/ folder? which phases done?)
3. Regenerate `.windsurf/WORKSPACE-REG.md` (also sync `.claude/WORKSPACE-REG.md` and `.github/WORKSPACE-REG.md` if they exist)
4. Format: table with columns: Project | Scale | Genre | Skills | Status | .cs Count
