---
description: "Regenerate WORKSPACE-REG.md from actual MAIN-SOURCE/ contents — rescan all projects, recount .cs files, reclassify scale/genre/skills, update demand matrix. Use when: new projects added, after /init confirms genres, after skill list changes, registry feels stale"
---

## Setup

No user input required — this prompt scans the entire workspace.

**In-depth detailed analysis is MANDATORY.** Scan every project folder in MAIN-SOURCE/. Count actual files. Classify from real folder/file names. Do NOT guess.

## Context Load

1. Read `.claude/WORKSPACE-REG.md` — current registry (preserve any manually-set Status values)
2. Read `CLAUDE.md` — current skill list (Skills table) for valid skill names
3. List `MAIN-SOURCE/` — get every project folder (ignore `.stub` files, `file-size.js`, `pathHierarchy.js`, `gitignore-gen.js`)
4. For each project folder, list its contents to determine structure (Scripts/, Assemblies/, etc.)

## Phase 1 — Count .cs Files Per Project

5. For EACH project folder in `MAIN-SOURCE/`:
   a. Recursively count all `.cs` files (search `**/*.cs` within that folder)
   b. Record the exact count — do NOT approximate
   c. If a project has only an `Assemblies/` folder (DLLs, no raw .cs): note as "DLL-only" and estimate from DLL count × ~50

## Phase 1.5 — Measure Content Volume

6. For EACH project folder in `MAIN-SOURCE/`:

   **A. Word count (code volume):**
   - Count total words across all `.cs` files combined (`cat *.cs | wc -w` equivalent)
   - Record as raw number (e.g., 52561, 1.12M)
   - This is the TRUE complexity metric — more important than file count

   **B. Script class breakdown:**
   - Count classes inheriting `MonoBehaviour` (grep for `: MonoBehaviour` or `: NetworkBehaviour` or `: MonoBehaviourPun` etc.)
   - Count classes inheriting `NetworkBehaviour` / `MonoBehaviourPun` / `MonoBehaviourPunCallbacks` (subset of above — multiplayer scripts)
   - Count classes inheriting `ScriptableObject` (grep for `: ScriptableObject`)
   - Count `interface` declarations (grep for `interface I` or `public interface` or `internal interface`)
   - Count remaining classes as "Other" (plain C# classes, structs, enums — anything not MB/SO/interface)

   **C. Asset counts (from project folder or .stub file):**
   - Count `.png` + `.jpg` + `.psd` + `.tga` files = **Sprites/Textures**
   - Count `.fbx` + `.obj` + `.blend` files = **3D Models**
   - Count `.anim` files = **Animation Clips**
   - Count `.controller` files = **Animator Controllers**
   - If raw asset folders don't exist, check `entire-{project}.stub` for file hierarchy listings and count from there
   - If neither source has asset info, mark as "N/A (no asset data)"

## Phase 2 — Classify Scale

6. Apply scale tiers from actual .cs count:
   | Scale | Range |
   |-------|-------|
   | Micro | < 50 |
   | Small | 50–149 |
   | Medium | 150–399 |
   | Large | 400–799 |
   | XLarge | 800–1999 |
   | Massive | 2000+ |

## Phase 3 — Classify Genre

7. For each project, determine genre(s) from:
   - Folder names in Scripts/ (e.g., `Combat/`, `Building/`, `Dialogue/`, `AI/`, `Inventory/`)
   - Class name patterns (e.g., `*Tycoon*`, `*Horror*`, `*Tower*`, `*Card*`)
   - If project has `LEARN/{project}/ARCHITECTURE.md` or `GOAL.md`, read genre from there (authoritative)
   - If `/init` has already run (LEARN/{project}/ exists with docs), use that classification as ground truth
   - Otherwise classify from folder/file patterns (mark as "estimated" in Notes)

## Phase 4 — Determine Applicable Skills

8. For each project, determine which skills apply by scanning for evidence:
   | Signal | Skill |
   |--------|-------|
   | NavMesh*, AI*, Patrol*, NPC* folders/classes | `unity-ai-navigation` |
   | Anim*, Animator*, Spine*, DOTween refs | `unity-animation` |
   | Audio*, Sound*, Music*, FMOD* | `unity-audio` |
   | Camera*, Cinemachine*, FreeLook* | `unity-camera` |
   | DayNight*, TimeOfDay*, Sun*, LightCycle* | `unity-day-night` |
   | Dialogue*, Yarn*, Ink*, Conversation* | `unity-dialogue` |
   | State*, FSM*, IState* | `unity-fsm` |
   | Grid*, Build*, Place*, Tile*, Snap* | `unity-grid-building` |
   | Input*, Rebind*, ActionMap* | `unity-input` |
   | Inventory*, Item*, Slot*, Hotbar*, Equipment* | `unity-inventory` |
   | Network*, RPC*, Sync*, Photon*, Mirror*, FishNet* | `unity-networking` |
   | Rigidbody*, Joint*, Ragdoll*, Physics*, Force* | `unity-physics` |
   | Prefab hierarchy evidence (universal) | `unity-prefab-hierarchy` |
   | Procedural*, Perlin*, Chunk*, WorldGen*, Seed* | `unity-procedural-gen` |
   | Quest*, Objective*, Journal* | `unity-quest` |
   | Save*, Load*, ISaveable*, Persist*, Slot* (save context) | `unity-save-load` |
   | Scene setup (universal) | `unity-scene-setup` |
   | Testing (universal) | `unity-testing` |

   - `unity-input`, `unity-scene-setup`, `unity-testing`, `unity-prefab-hierarchy` apply to ALL projects
   - For non-universal skills, require at least 2 signal matches OR 1 strong match (dedicated folder)

## Phase 5 — Determine Status

9. For each project, check `LEARN/{project}/` existence:
   - No LEARN folder → `Not started`
   - Has ARCHITECTURE.md/GOAL.md but no phase folders → `Init'd`
   - Has phase-{x} folders → count them → `Phase {highest} in progress`
   - All phases from PhaseMap.md complete → `Complete`
   - Preserve existing status if LEARN folder matches (don't downgrade)

## Phase 6 — Build Genre Clusters

10. Group projects by primary genre into clusters:
    a. For each distinct genre, list all projects that belong to it
    b. A project may appear in multiple clusters if it has strong dual-genre identity (e.g., Horror + Co-op)
    c. Sort clusters by count (highest first), then alphabetical for ties
    d. Use short genre labels: "Horror", "Tycoon / Management", "Idle / Incremental", "Factory / Automation", "Physics Sandbox / Sim", "Colony Sim / Strategy", "Card / Strategy", "City / Building Sim", "Action / Combat", "Tower Defense", "Engineering Puzzle", "Mystery / Puzzle", "Narrative / Adventure", "Casual / Puzzle", etc.
    e. Merge genres with only 1 project into a broader category where sensible — avoid single-project clusters unless the genre is truly unique

## Phase 7 — Rebuild Demand Matrix

11. After all projects classified, rebuild the Skill Demand table:
    a. For each skill, count how many projects list it
    b. List all project short-names that need it
    c. Sort by demand count (highest first), then alphabetical for ties

## Phase 8 — Write WORKSPACE-REG.md

12. Write `.claude/WORKSPACE-REG.md` with this exact structure:

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
- `Other Classes` = plain classes, structs, enums not in above categories
- Asset counts sourced from project folders or `.stub` file hierarchy; "N/A" if no asset data available
- Genre: confirmed (from LEARN/ docs) or estimated (from folder patterns) — marked where estimated
- Skill applicability: confirmed (from /init) or estimated (from file signals)
- Status tracks rebuild progress: `Not started` → `Init'd` → `Phase X in progress` → `Complete`
- Universal skills (input, scene-setup, testing, prefab-hierarchy) omitted from per-project column for readability
- Project names reflect actual folder names in MAIN-SOURCE/ (case-sensitive)
```

## Validation

13. Verify:
    - Every project folder in MAIN-SOURCE/ appears in the table (no orphans)
    - No table entry references a project folder that doesn't exist
    - Scale tier matches actual .cs count for every row
    - Genre Clusters table includes every project at least once
    - Skill Demand counts match the sum of projects listing that skill
    - Scale Distribution counts sum to total project count
    - Universal skills (input, scene-setup, testing, prefab-hierarchy) show demand = total project count
    - Content Volume table has an entry for every project (word count must be non-zero for any project with .cs files)
    - MonoBehaviours + ScriptableObjects + Interfaces + Other ≈ total class/type declarations (sanity check)
    - Asset Counts table has an entry for every project (use "N/A" where data unavailable, never leave blank)

## Post-Refresh

14. Update `CLAUDE.md` if project count changed (currently references project count in workspace description — update if different)
15. Append to `LEARN/{any-active-project}/surfer.md` if one is in progress: `### /refresh-workspace-reg — {DATE}\n- Registry refreshed: {N} projects, {changes summary}`