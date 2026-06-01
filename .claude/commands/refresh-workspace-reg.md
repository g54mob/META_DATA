---
description: "Regenerate WORKSPACE-REG.md from actual MAIN-SOURCE/ contents — rescan all projects, recount .cs files, reclassify scale/genre/skills, update demand matrix. Use when: new projects added, after /init confirms genres, after skill list changes, registry feels stale"
---

# /refresh-workspace-reg — Agentic Workspace Registry Refresh

This command uses **parallel subagents** to scan all projects concurrently. Each project is independent — perfect for fan-out. The orchestration follows this DAG:

```
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Setup (sequential — main agent)                            │
│   Read current registry → list MAIN-SOURCE/ → count projects        │
│   Determine chunk count → assign projects to agents                 │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Parallel Project Scan (fan-out — multiple agents)          │
│   Each agent gets ~5-10 projects to scan                            │
│   Extracts: .cs count, word count, class breakdown, assets,         │
│             genre, skills, status — for each assigned project        │
│   Returns: structured report per project                            │
└─────────────────────────┬───────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Synthesis (sequential — main agent)                        │
│   Merge all agent reports → build tables → classify scale           │
│   Build genre clusters → rebuild demand matrix                      │
│   Write WORKSPACE-REG.md → validate                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## PHASE 1 — Setup (Main Agent, Sequential)

**In-depth detailed analysis is MANDATORY.** Scan every project folder in MAIN-SOURCE/. Count actual files. Classify from real folder/file names. Do NOT guess.

1. Read `WORKSPACE-REG.md` — current registry (preserve any manually-set Status values)
2. Read `CLAUDE.md` — current skill list (Skills table) for valid skill names
3. List `MAIN-SOURCE/` — get every project folder (ignore `.stub` files, `file-size.js`, `pathHierarchy.js`, `gitignore-gen.js`)
4. **Immediately count** the project folder list and record as `TOTAL_PROJECTS`. Verify with `| wc -l`. This number must match all table row counts later.
5. **Determine agent count:**
   ```
   agents_to_launch = min(8, ceil(TOTAL_PROJECTS / 5))
   ```
   - ≤5 projects: 1 agent (no fan-out, main reads directly)
   - 6-10 projects: 2 agents
   - 11-15 projects: 3 agents
   - 16-40 projects: 4-8 agents
   - Chunk projects into roughly equal groups, sorted alphabetically

---

## PHASE 2 — Parallel Project Scan (Fan-Out Agents)

**Goal:** Each subagent scans its assigned projects and returns structured data for all of them. Projects are independent — no cross-project dependencies during scan.

### If ≤5 projects: Skip fan-out

Main agent performs all scans directly (same extraction as the agent prompt below). Jump to Phase 3.

### If >5 projects: Fan-out

6. **Fan-out** — launch one Agent per chunk in parallel. Each agent gets this prompt:

```
You are a workspace scanner for a Unity game rebuild workspace.

Your job: For each assigned project in MAIN-SOURCE/, extract structured metadata.
Return your results as a structured report — one section per project.

## Your assigned projects (scan ALL of them):
{LIST_OF_PROJECT_FOLDER_NAMES}

## For EACH project, extract and report:

### {project_name}

**A. File counts:**
- Total .cs files: recursively count all `.cs` files in the project folder
- If project has only `Assemblies/` folder (DLLs, no raw .cs): note as "DLL-only" and estimate from DLL count × ~50

**B. Word count:**
- Count total words across all `.cs` files combined: `find "MAIN-SOURCE/{project}" -name "*.cs" -exec cat {} + | wc -w`
- Record exact number

**C. Script class breakdown (use grep -rl within the project):**
- MonoBehaviours: files matching `: MonoBehaviour` OR `: NetworkBehaviour` OR `: MonoBehaviourPun` OR `: MonoBehaviourPunCallbacks`
- NetworkBehaviours: files matching `: NetworkBehaviour` OR `: MonoBehaviourPun` OR `: MonoBehaviourPunCallbacks` (subset)
- ScriptableObjects: files matching `: ScriptableObject`
- Interfaces: files containing `interface ` declarations
- Other Classes: (.cs count) - (MonoBehaviours + ScriptableObjects + Interfaces)

**D. Asset counts:**
- Sprites/textures: `grep -ci "\.png\|\.jpg\|\.psd\|\.tga" "MAIN-SOURCE/entire-{project}.stub"` (if stub exists)
- 3D models: `find "MAIN-SOURCE/{project}" -name "*.fbx" -o -name "*.obj" -o -name "*.blend" | wc -l`
- Animation clips: `find "MAIN-SOURCE/{project}" -name "*.anim" | wc -l`
- Animator controllers: `find "MAIN-SOURCE/{project}" -name "*.controller" | wc -l`
- Prefer actual file counts over stub grep. Fall back to stub only for sprites.

**E. Genre classification (order of trust):**
1. If `LEARN/{project}/ARCHITECTURE.md` or `GOAL.md` exists → read genre from there (authoritative)
2. Explore `Scripts/Assembly-CSharp/` subfolders for domain folders (Combat/, Building/, etc.)
3. Search for genre-signal filenames: `find "$dir" -name "*.cs" | grep -i "keyword"` with: farm, tower, idle, horror, card, physics, build, craft, quest, vehicle, tycoon, colony, puzzle, etc.
4. Class name patterns from file listings (*Tycoon*, *Horror*, *Tower*, *Card*)

**F. Skill detection (require 2+ signals OR 1 strong match):**
| Signal | Skill |
|--------|-------|
| NavMesh*, AI*, Patrol*, NPC*; AstarPathfindingProject assembly | `unity-ai-navigation` |
| Anim*, Animator*, Spine*, DOTween assembly | `unity-animation` |
| Audio*, Sound*, Music*, FMOD* assembly | `unity-audio` |
| Camera*, Cinemachine assembly*, FreeLook* | `unity-camera` |
| DayNight*, TimeOfDay*, Sun*, LightCycle* | `unity-day-night` |
| Dialogue*, Yarn*, Ink*, Conversation* | `unity-dialogue` |
| State*, FSM*, IState*; Animancer.FSM assembly | `unity-fsm` |
| Grid*, Build*, Place*, Tile*, Snap* (building context) | `unity-grid-building` |
| Inventory*, Item*, Slot*, Hotbar*, Equipment* | `unity-inventory` |
| Photon*, Mirror*, FishNet*, Netcode*; NetworkBehaviour count > 0 | `unity-networking` |
| Rigidbody*, Joint*, Ragdoll*, Physics*, Force* | `unity-physics` |
| Procedural*, Perlin*, Chunk*, WorldGen*, Seed* | `unity-procedural-gen` |
| Quest*, Objective*, Journal* | `unity-quest` |
| Save*, Load*, ISaveable*, Persist*; EasySave assembly | `unity-save-load` |

Universal skills (unity-input, unity-scene-setup, unity-testing, unity-prefab-hierarchy) apply to ALL — don't list them per project.

**G. Status (check LEARN/{project}/ existence):**
- No LEARN folder → `Not started`
- Has ARCHITECTURE.md/GOAL.md but no `phase-{x}` folders → `Init'd`
- Has `phase-{x}` folders → count them → `Phase {highest} in progress`
- All phases from PhaseMap.md complete → `Complete`

## Output format per project:

```
### {project_name}
- .cs count: {N}
- Words: {N}
- MonoBehaviours: {N}
- NetworkBehaviours: {N}
- ScriptableObjects: {N}
- Interfaces: {N}
- Other: {N}
- Sprites/Textures: {N}
- 3D Models: {N}
- Anim Clips: {N}
- Animator Controllers: {N}
- Genre: {genre_label}
- Skills: {comma-separated list}
- Status: {status}
```

Be thorough. Use ACTUAL file counts from shell commands — do NOT guess or estimate.
Use 300s timeout for word-count commands on large projects.
```

7. **Barrier** — wait for ALL scan subagents to complete. Collect all results.

---

## PHASE 3 — Synthesis (Main Agent, Sequential)

The main agent now has all scan results from Phase 2.

### Classify Scale

8. Apply scale tiers from actual .cs count:
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
    d. **Cross-check:** the listed project names for each skill must exactly match the projects that have that skill in their scan results. If there's a mismatch, fix the discrepancy before writing.

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
    - `TOTAL_PROJECTS` matches the actual `ls | wc -l` count from step 4
    - Every project folder in MAIN-SOURCE/ appears in the Projects table (no orphans)
    - No table entry references a project folder that doesn't exist
    - Scale tier label matches actual .cs count for every row (re-check each)
    - Scale Distribution project counts sum to `TOTAL_PROJECTS`
    - Genre Clusters table includes every project at least once
    - Skill Demand counts match the actual count of projects listing that skill in their Applicable Skills column
    - Universal skills show demand = `TOTAL_PROJECTS`
    - Content Volume table has an entry for every project
    - Asset Counts table has an entry for every project (use "0" for none, "N/A" only when data truly unavailable)
    - No duplicate project entries in any table

### Post-Refresh

13. Update `CLAUDE.md` if project count changed (currently references project count in workspace description — update if different)
14. Append to `LEARN/{any-active-project}/surfer.md` if one is in progress: `### /refresh-workspace-reg — {DATE}\n- Registry refreshed: {N} projects, {changes summary}`

---

## Scale-Adaptive Behavior

| Project Count | Agents | Projects/Agent | Speedup |
|---------------|--------|----------------|---------|
| 1-5 | 0 (main reads) | — | 1x |
| 6-10 | 2 | ~5 | ~2x |
| 11-15 | 3 | ~5 | ~3x |
| 16-20 | 4 | ~5 | ~3-4x |
| 21-30 | 5-6 | ~5 | ~4-5x |
| 31-40 | 7-8 | ~5 | ~5-6x |

---

## Fallback Behavior

- **If an agent fails or returns incomplete data:** Main agent re-scans the missing projects directly. Parallel is additive — falling back to sequential never loses functionality.
- **If ≤5 projects:** Skip Phase 2 entirely. Main agent scans all projects directly.
- **If a project has no .cs files at all:** Report `.cs count: 0`, mark as "DLL-only" or "Asset-only" depending on folder contents. Still include in all tables.
- **If word count command times out (very large project):** Use estimation: `.cs count × avg_lines × 8 words/line`. Mark as estimated in output.

---

## Output Summary

15. Report to user:
    - Total projects scanned
    - Agent stats: {N} scan agents launched
    - Projects added/removed/changed since last refresh
    - Scale distribution (one-liner)
    - Any discrepancies found during validation
