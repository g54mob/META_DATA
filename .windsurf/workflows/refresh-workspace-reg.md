---
description: "Regenerate WORKSPACE-REG.md from actual MAIN-SOURCE/ contents — rescan all projects, recount .cs files, reclassify scale/genre/skills, update demand matrix. Use when: new projects added, after /init confirms genres, after skill list changes, registry feels stale"
---

## Setup

No user input required — this prompt scans the entire workspace.

**In-depth detailed analysis is MANDATORY.** Scan every project folder in MAIN-SOURCE/. Count actual files. Classify from real folder/file names. Do NOT guess.

## Context Load

1. Read `.windsurf/WORKSPACE-REG.md` — current registry (preserve any manually-set Status values)
2. Read `.windsurf/copilot-instructions.md` — current skill list (Skills table) for valid skill names
3. List `MAIN-SOURCE/` — get every project folder (ignore `.stub` files, `file-size.js`, `pathHierarchy.js`, `gitignore-gen.js`)
4. **Immediately count** the project folder list and record as `TOTAL_PROJECTS`. Verify with `| wc -l`. This number must match all table row counts later.
5. For each project folder, list its top-level contents to determine structure (Scripts/, Assemblies/, etc.)

## Phase 1 — Count .cs Files Per Project

6. For EACH project folder in `MAIN-SOURCE/`:
   a. Recursively count all `.cs` files (use `find "$dir" -name "*.cs" | wc -l`)
   b. Record the exact count — do NOT approximate
   c. If a project has only an `Assemblies/` folder (DLLs, no raw .cs): note as "DLL-only" and estimate from DLL count × ~50

**Batching:** Process in batches of ~10 projects per shell command to avoid timeouts. Use a for-loop that prints `"$dir: $count"` per project. Run batches in parallel where possible.

## Phase 2 — Measure Content Volume

7. For EACH project folder in `MAIN-SOURCE/`:

   **A. Word count (code volume):**
   - Count total words across all `.cs` files combined: `find "$dir" -name "*.cs" -exec cat {} + | wc -w`
   - Record as raw number (e.g., 52561, 1124520)
   - This is the TRUE complexity metric — more important than file count
   - **Batch** in groups of ~10 projects per command. Use 300s timeout for word-count commands.

   **B. Script class breakdown:**
   - Use `grep -rl` (files containing pattern) within each project to count:
     - **MonoBehaviours:** files matching `: MonoBehaviour` OR `: NetworkBehaviour` OR `: MonoBehaviourPun` OR `: MonoBehaviourPunCallbacks`
     - **NetworkBehaviours:** files matching `: NetworkBehaviour` OR `: MonoBehaviourPun` OR `: MonoBehaviourPunCallbacks` (subset of MB count)
     - **ScriptableObjects:** files matching `: ScriptableObject`
     - **Interfaces:** files containing `interface ` declarations (grep for `"^\s*\(public \|internal \|private \|\)interface "`)
     - **Other Classes:** calculated as `(.cs file count) - (MonoBehaviours + ScriptableObjects + Interfaces)`. This is an approximation since some files contain multiple types or only enums/structs, but sufficient for registry purposes.
   - **Batch** in groups of ~10 projects per command.

   **C. Asset counts (from .stub files or project folders):**
   - For sprites/textures: `grep -ci "\.png\|\.jpg\|\.psd\|\.tga" "entire-{project}.stub"`
     - NOTE: This counts lines containing these extensions — includes `.meta` references. Accept as approximate.
   - For 3D models: count actual files in project folder with `find "$dir" -name "*.fbx" -o -name "*.obj" -o -name "*.blend" | wc -l`
   - For animation clips: count actual files with `find "$dir" -name "*.anim" | wc -l`
   - For animator controllers: count actual files with `find "$dir" -name "*.controller" | wc -l`
   - If neither project folder nor stub has data, mark as "N/A"
   - **Prefer actual file counts** from project folders over stub grep when both exist. Fall back to stub only for sprites (which are typically stripped from source folders but listed in stubs).

## Phase 3 — Classify Scale

8. Apply scale tiers from actual .cs count:
   | Scale | Range |
   |-------|-------|
   | Micro | < 50 |
   | Small | 50–149 |
   | Medium | 150–399 |
   | Large | 400–799 |
   | XLarge | 800–1999 |
   | Massive | 2000+ |

   After classifying, **verify:** sum of all tier counts MUST equal `TOTAL_PROJECTS`.

## Phase 4 — Classify Genre

9. For each project, determine genre(s) from:
   - **Primary source:** If `LEARN/{project}/ARCHITECTURE.md` or `GOAL.md` exists, read genre from there (authoritative)
   - **Secondary source:** Explore `Scripts/Assembly-CSharp/` subfolders — these contain the actual game code organized by domain (e.g., `Combat/`, `Building/`, `Cartel/`, `FactoryFloor/`, `Battle/`)
   - **Tertiary source:** Search for genre-signal filenames: `find "$dir" -name "*.cs" | grep -i "keyword"` with keywords like farm, tower, idle, horror, card, physics, build, craft, quest, vehicle, etc.
   - **Last resort:** Class name patterns from file listings (e.g., `*Tycoon*`, `*Horror*`, `*Tower*`, `*Card*`)

   Genre classification order of trust: LEARN/ docs > subfolder structure > filename patterns > class name guesses

## Phase 5 — Determine Applicable Skills

10. For each project, determine which skills apply by scanning for evidence:
    | Signal | Skill |
    |--------|-------|
    | NavMesh*, AI*, Patrol*, NPC* folders/classes; AstarPathfindingProject assembly | `unity-ai-navigation` |
    | Anim*, Animator*, Spine*, DOTween assembly; animation-heavy folders | `unity-animation` |
    | Audio*, Sound*, Music*, FMOD* assembly; AudioManager class | `unity-audio` |
    | Camera*, Cinemachine assembly*, FreeLook* | `unity-camera` |
    | DayNight*, TimeOfDay*, Sun*, LightCycle*, DayNightFader | `unity-day-night` |
    | Dialogue*, Yarn*, Ink*, Conversation*; YarnSpinner/PixelCrushers assembly | `unity-dialogue` |
    | State*, FSM*, IState*; Animancer.FSM assembly | `unity-fsm` |
    | Grid*, Build*, Place*, Tile*, Snap*; building/placement folders | `unity-grid-building` |
    | Inventory*, Item*, Slot*, Hotbar*, Equipment* (in inventory context) | `unity-inventory` |
    | Photon*, Mirror*, FishNet*, Netcode*; NetworkBehaviour count > 0 | `unity-networking` |
    | Rigidbody*, Joint*, Ragdoll*, Physics*, Force*; ActiveRagdoll folder | `unity-physics` |
    | Procedural*, Perlin*, Chunk*, WorldGen*, Seed*; DunGen assembly | `unity-procedural-gen` |
    | Quest*, Objective*, Journal* | `unity-quest` |
    | Save*, Load*, ISaveable*, Persist*; EasySave assembly; SaveManager class | `unity-save-load` |

    - `unity-input`, `unity-scene-setup`, `unity-testing`, `unity-prefab-hierarchy` apply to ALL projects (universal — omit from per-project column)
    - For non-universal skills, require at least 2 signal matches OR 1 strong match (dedicated folder OR dedicated assembly)

## Phase 6 — Determine Status

11. For each project, check `LEARN/{project}/` existence:
    - No LEARN folder → `Not started`
    - Has ARCHITECTURE.md/GOAL.md but no `phase-{letter/number}` folders → `Init'd`
    - Has `phase-{x}` folders → count them → `Phase {highest} in progress`
    - All phases from PhaseMap.md complete → `Complete`
    - Preserve existing manually-set status if LEARN folder state hasn't changed (don't downgrade)

## Phase 7 — Build Genre Clusters

12. Group projects by primary genre into clusters:
    a. For each distinct genre, list all projects that belong to it
    b. A project may appear in multiple clusters if it has strong dual-genre identity (e.g., Horror + Co-op)
    c. Sort clusters by count (highest first), then alphabetical for ties
    d. Use short genre labels: "Horror", "Tycoon / Management", "Idle / Incremental", "Factory / Automation", "Physics Sandbox / Combat", "Colony Sim / Strategy", "Card / Strategy", "City / Building Sim", "Action / RPG", "Tower Defense", "Engineering Puzzle", "Narrative / Mystery", "Co-op Multiplayer", etc.
    e. Merge genres with only 1 project into a broader category where sensible — avoid single-project clusters unless the genre is truly unique

## Phase 8 — Rebuild Demand Matrix

13. After all projects classified, rebuild the Skill Demand table:
    a. For each non-universal skill, count how many projects list it **by re-reading the completed Projects table rows**
    b. List all project short-names that need it
    c. Sort by demand count (highest first), then alphabetical for ties
    d. **Cross-check:** the listed project names for each skill must exactly match the projects that have that skill in their Applicable Skills column. If there's a mismatch, fix the discrepancy before writing.

## Phase 9 — Write WORKSPACE-REG.md

14. Write `.windsurf/WORKSPACE-REG.md` with this exact structure:

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
| Massive (2000+) | ... | ... |

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

## Validation

15. Verify ALL of the following before considering the task complete:
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

## Post-Refresh

16. Update `.windsurf/copilot-instructions.md` if project count changed (update workspace description if different)
17. Append to `LEARN/{any-active-project}/surfer.md` if one is in progress: `### /refresh-workspace-reg — {DATE}\n- Registry refreshed: {N} projects, {changes summary}`
