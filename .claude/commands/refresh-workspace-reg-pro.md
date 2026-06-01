---
description: "Workflow-powered /refresh-workspace-reg — deterministic JS workflow for project scanning. Same output as /refresh-workspace-reg but guaranteed agent counts, structured output schemas, resumability. CLI-only (requires Claude Code Workflow tool)."
---

# /refresh-workspace-reg-pro — Deterministic Workflow Registry Refresh

Same output as `/refresh-workspace-reg` (WORKSPACE-REG.md with all tables) but Phase 2 uses a **deterministic Workflow JS script** instead of natural-language agent spawning. Claude handles setup and synthesis; the workflow handles mechanical scanning.

**When to use:** 10+ projects in MAIN-SOURCE/, or anytime deterministic scanning + resume matters. CLI-only — Windsurf/Copilot cannot run workflows.

The orchestration follows this DAG:

```
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Setup (Claude — interactive + reasoning)                    │
│   Read current registry → list MAIN-SOURCE/ → count projects        │
│   Build project list → determine scan strategy → invoke workflow     │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Project Scan (Workflow JS — deterministic)                   │
│   Script: .claude/workflows/refresh-workspace-reg-scan.js           │
│                                                                     │
│   ≤5 projects: Skip workflow — main scans directly                  │
│   >5 projects: ceil(N/5) agents, each scanning ~5 projects          │
│                structured JSON output per project                    │
│                                                                     │
│   Returns: { projects: [...structured data...], agentStats }        │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Synthesis + Write (Claude — reasoning)                      │
│   Classify scale → build genre clusters → demand matrix             │
│   Write WORKSPACE-REG.md → validate → post-refresh                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1 — Setup (Main Agent, Sequential)

**In-depth detailed analysis is MANDATORY.** Do NOT guess — all data comes from actual file system scans.

1. Read `WORKSPACE-REG.md` — current registry (preserve any manually-set Status values)
2. Read `CLAUDE.md` — current skill list (Skills table) for valid skill names
3. List `MAIN-SOURCE/` — get every project folder (ignore `.stub` files, `file-size.js`, `pathHierarchy.js`, `gitignore-gen.js`)
4. **Immediately count** the project folder list and record as `TOTAL_PROJECTS`. Verify with `| wc -l`. This number must match all table row counts later.
5. **Build the project list** — collect all project folder names as an array, sorted alphabetically. For each project folder, list its top-level contents to determine structure (Scripts/, Assemblies/, etc.)

6. **Determine scan strategy:**
   - ≤5 projects: Skip workflow. Main agent scans all projects directly using the same extraction logic as the workflow agents (file counts, word count, class breakdown, assets, genre, skills, status — all via actual shell commands). Jump to Phase 3 after completing all scans.
   - >5 projects: Invoke the workflow.

---

## PHASE 2 — Project Scan (Workflow, Deterministic)

7. **Invoke the workflow:**

   ```
   Workflow({
     scriptPath: ".claude/workflows/refresh-workspace-reg-scan.js",
     args: {
       projects: ["project-0", "project-1", "project-2", ...],
       totalProjects: TOTAL_PROJECTS,
       previousStatuses: { "project-0": "Init'd", "project-1": "Phase C in progress", ... }
     }
   })
   ```

   The `previousStatuses` map is extracted from the existing WORKSPACE-REG.md (read in step 1) — pass every project's current Status value so workflow agents can preserve manually-set statuses.

### What the workflow does internally:

- Computes `agents_to_launch = min(8, ceil(totalProjects / 5))`
- Chunks projects alphabetically into roughly equal groups
- Spawns all agents in `parallel()` — each scans its assigned projects
- Each agent uses `{schema: PROJECT_SCHEMA}` for validated structured output:
  - `.csCount` (number), `words` (number), `monoBehaviours` (number), etc.
  - Genre (string), skills (array of strings), status (string)
- Returns merged array of all project data objects

### What it returns:

```json
{
  "projects": [
    {
      "name": "project-0",
      "csCount": 245,
      "words": 152300,
      "monoBehaviours": 89,
      "networkBehaviours": 0,
      "scriptableObjects": 22,
      "interfaces": 14,
      "otherClasses": 120,
      "sprites": 340,
      "models3d": 45,
      "animClips": 67,
      "animControllers": 12,
      "genre": "Mining/Factory",
      "skills": ["unity-save-load", "unity-fsm", "unity-grid-building"],
      "status": "Init'd"
    },
    ...
  ],
  "agentStats": { "agentsLaunched": 4, "projectsPerAgent": 5 }
}
```

### Determinism guarantees (vs /refresh-workspace-reg):

| Feature | /refresh-workspace-reg (natural-language) | /refresh-workspace-reg-pro (workflow) |
|---------|------------------------------------------|--------------------------------------|
| Agent count | Claude interprets "spawn N" | **Exact** — JS computes `ceil(N/5)` |
| Output format | Free-text, Claude parses | **JSON schema** validated |
| Data types | Numbers may appear as strings | **Typed** — counts are guaranteed numbers |
| Resume on failure | Re-run from scratch | **`resumeFromRunId`** replays cached agents |
| Completeness | Agent may forget projects | **JS loop** — every project gets assigned |

### Error handling:

- If workflow returns fewer projects than `TOTAL_PROJECTS`, identify which are missing and scan them directly.
- If workflow fails entirely, fall back to `/refresh-workspace-reg` behavior (manual agent spawning).

**Wait for workflow to complete before proceeding.**

---

## PHASE 3 — Synthesis + Write (Main Agent, Sequential)

The main agent now has structured data for all projects from the workflow result.

### Status Preservation

7b. Compare workflow results against the previous registry (read in step 1). For any project where:
   - The LEARN folder state hasn't changed (same phases exist)
   - The previous registry had a manually-set or higher status
   → Preserve the previous status. Don't downgrade.

### Classify Scale

8. Apply scale tiers from actual .cs count and word count:
   | Scale | File Count | Words |
   |-------|-----------|-------|
   | Micro | <50 | <50k |
   | Small | 50–149 | 50k-150k |
   | Medium | 150–399 | 150k-400k |
   | Large | 400–799 | 400k-800k |
   | XLarge | 800–1999 | 800k-1.5M |
   | Massive | 2000-3999 | 1.5M-2.5M |
   | Colossal | 4000-6999 | 2.5M-4M |
   | Titan | 7000+ | 4M+ |

   After classifying, **verify:** sum of all tier counts MUST equal `TOTAL_PROJECTS`.

### Build Genre Clusters

9. Group projects by primary genre into clusters:
   a. For each distinct genre, list all projects that belong to it
   b. A project may appear in multiple clusters if it has strong dual-genre identity (e.g., Horror + Co-op)
   c. Sort clusters by count (highest first), then alphabetical for ties
   d. Use short genre labels: "Horror", "Tycoon / Management", "Idle / Incremental", "Factory / Automation", "Physics Sandbox / Combat", "Colony Sim / Strategy", "Card / Strategy", "City / Building Sim", "Action / RPG", "Tower Defense", "Engineering Puzzle", "Narrative / Mystery", "Co-op Multiplayer", etc.
   e. Merge genres with only 1 project into a broader category where sensible — avoid single-project clusters unless the genre is truly unique

### Rebuild Demand Matrix

10. After all projects classified, rebuild the Skill Demand table:
    a. For each non-universal skill, count how many projects list it
    b. List all project short-names that need it
    c. Sort by demand count (highest first), then alphabetical for ties
    d. **Cross-check:** the listed project names for each skill must exactly match the projects that have that skill. If there's a mismatch, fix the discrepancy before writing.

### Write WORKSPACE-REG.md

11. Write `WORKSPACE-REG.md` with this exact structure:

```markdown
# Project Registry

> **Shallow quick-reference only.** Use for at-a-glance lookups (scale, genre, skill tags, status).
> For detailed research, analysis, or /init work — always read `MAIN-SOURCE/{project}/` directly.
>
> Updated by `/refresh-workspace-reg`, `/audit-framework`, and `/implement-audit-todo`.
>
> **Universal skills** (`unity-input`, `unity-scene-setup`, `unity-testing`, `unity-prefab-hierarchy`) apply to ALL projects and are omitted from the table below.

---

## Projects

| Project | .cs Count | Words | Scale | Genre(s) | Status | Applicable Skills |
|---------|-----------|-------|-------|-----------|--------|-------------------|
| `{name}` | {exact_count} | {word_count} | {scale} | {genre} | {status} | {skills csv} |
...

---

## Content Volume

| Project | Words | MonoBehaviours | NetworkBehaviours | ScriptableObjects | Interfaces | Other Classes |
|---------|-------|----------------|-------------------|-------------------|------------|---------------|
| `{name}` | {word_count} | {mb_count} | {nb_count} | {so_count} | {iface_count} | {other_count} |
...

---

## Asset Counts

| Project | Sprites/Textures | 3D Models (.fbx/.obj/.blend) | Anim Clips (.anim) | Animator Controllers (.controller) |
|---------|------------------|------------------------------|---------------------|-------------------------------------|
| `{name}` | {sprite_count} | {model_count} | {anim_count} | {controller_count} |
...

---

## Scale Distribution

| Scale | Count | Projects |
|-------|-------|----------|
| Micro (<50) | ... | ... |
| Small (50-149) | ... | ... |
| Medium (150-399) | ... | ... |
| Large (400-799) | ... | ... |
| XLarge (800-1999) | ... | ... |
| Massive (2000-3999) | ... | ... |
| Colossal (4000-6999) | ... | ... |
| Titan (7000+) | ... | ... |

---

## Genre Clusters

| Genre | Count | Projects |
|-------|-------|----------|
| {genre_label} | {count} | {project list} |
...

> **Note:** Some projects appear in multiple clusters (e.g., Horror + Co-op). Clusters reflect primary genre identity for at-a-glance lookup.

---

## Skill Demand (projects needing each skill)

| Skill | Demand | Projects |
|-------|--------|----------|
| `unity-{x}` | {count} | {project list} |
...

---

## Notes

- `.cs counts` are exact file counts from MAIN-SOURCE/ scan on {DATE}
- `Words` = total word count across all .cs files (true complexity measure — more reliable than file count)
- `MonoBehaviours` includes all MB-derived classes (MonoBehaviour, NetworkBehaviour subtypes counted separately)
- `NetworkBehaviours` = subset of MonoBehaviours that inherit NetworkBehaviour/MonoBehaviourPun/MonoBehaviourPunCallbacks
- `ScriptableObjects` = classes inheriting ScriptableObject (data containers)
- `Interfaces` = all interface declarations
- `Other Classes` = approximate: total .cs files minus (MB + SO + Interface file counts)
- Asset counts: Sprites from `.stub` file grep (approximate — includes .meta refs); Models/Anims/Controllers from actual file counts
- Genre: confirmed (from LEARN/ docs) or estimated (from folder patterns) — marked where estimated
- Skill applicability: confirmed (from /init) or estimated (from file signals)
- Status tracks rebuild progress: `Not started` → `Init'd` → `Phase X in progress` → `Complete`
- Universal skills (input, scene-setup, testing, prefab-hierarchy) omitted from per-project column for readability
- Project names reflect actual folder names in MAIN-SOURCE/ (case-sensitive)
- Total workspace: {TOTAL_PROJECTS} projects, ~{total .cs files} .cs files, ~{total words}M words of source code
```

### Validation

12. Verify ALL of the following before considering the task complete:
    - `TOTAL_PROJECTS` matches the actual count from step 4
    - Every project folder in MAIN-SOURCE/ appears in the Projects table (no orphans)
    - No table entry references a project folder that doesn't exist
    - Scale tier label matches actual .cs count for every row (re-check each)
    - Scale Distribution project counts sum to `TOTAL_PROJECTS`
    - Genre Clusters table includes every project at least once
    - Skill Demand counts match the actual count of projects listing that skill
    - Universal skills show demand = `TOTAL_PROJECTS`
    - Content Volume table has an entry for every project
    - Asset Counts table has an entry for every project (use "0" for none, "N/A" only when data truly unavailable)
    - No duplicate project entries in any table

### Post-Refresh

13. Update `CLAUDE.md` if project count changed
14. Append to `LEARN/{any-active-project}/surfer.md` if one is in progress: `### /refresh-workspace-reg-pro — {DATE}\n- Registry refreshed: {N} projects, {changes summary}`

---

## Output Summary

15. Report to user:
    - Total projects scanned
    - Workflow stats: {N} scan agents launched, schema validations passed
    - Projects added/removed/changed since last refresh
    - Scale distribution (one-liner)
    - Any discrepancies found during validation

---

## Fallback Behavior

- **If ≤5 projects:** Skip workflow. Main agent scans all directly.
- **If workflow returns fewer projects than expected:** Scan missing ones directly.
- **If workflow fails entirely:** Fall back to `/refresh-workspace-reg` (natural-language agents).
- **If a project has no .cs files:** Report `.cs count: 0`, mark as "DLL-only" or "Asset-only". Still include in all tables.
- **If word count command times out:** Use estimation: `.cs count × avg_lines × 8`. Mark as estimated.
