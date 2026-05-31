---
description: "Regenerate WORKSPACE-REG.md from actual MAIN-SOURCE/ contents — rescan all projects, recount .cs files, reclassify scale/genre/skills, update demand matrix. Use when: new projects added, after /init confirms genres, after skill list changes, registry feels stale"
agent: "agent"
---

## Setup

No user input required — this prompt scans the entire workspace.

**In-depth detailed analysis is MANDATORY.** Scan every project folder in MAIN-SOURCE/. Count actual files. Classify from real folder/file names. Do NOT guess.

## Context Load

1. Read `.github/WORKSPACE-REG.md` — current registry (preserve any manually-set Status values)
2. Read `.github/copilot-instructions.md` — current skill list (Skills table) for valid skill names
3. List `MAIN-SOURCE/` — get every project folder (ignore `.stub` files, `file-size.js`, `pathHierarchy.js`, `gitignore-gen.js`)
4. For each project folder, list its contents to determine structure (Scripts/, Assemblies/, etc.)

## Phase 1 — Count .cs Files Per Project

5. For EACH project folder in `MAIN-SOURCE/`:
   a. Recursively count all `.cs` files (search `**/*.cs` within that folder)
   b. Record the exact count — do NOT approximate
   c. If a project has only an `Assemblies/` folder (DLLs, no raw .cs): note as "DLL-only" and estimate from DLL count × ~50

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

## Phase 6 — Rebuild Demand Matrix

10. After all projects classified, rebuild the Skill Demand table:
    a. For each skill, count how many projects list it
    b. List all project short-names that need it
    c. Sort by demand count (highest first), then alphabetical for ties

## Phase 7 — Write WORKSPACE-REG.md

11. Write `.github/WORKSPACE-REG.md` with this exact structure:

```markdown
# Project Registry

> **Shallow quick-reference only.** Use for at-a-glance lookups (scale, genre, skill tags, status).
> For detailed research, analysis, or /init work — always read `MAIN-SOURCE/{project}/` directly.
>
> Updated by `/refresh-workspace-reg`, `/audit-framework`, and `/implement-audit-todo`.

---

## Projects

| Project | .cs Count | Scale | Genre(s) | Status | Applicable Skills |
|---------|-----------|-------|-----------|--------|-------------------|
| `{name}` | {exact_count} | {scale} | {genre} | {status} | {skills csv} |
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

## Skill Demand (projects needing each skill)

| Skill | Demand | Projects |
|-------|--------|----------|
| `unity-{x}` | {count} | {project list} |
...

---

## Notes

- `.cs counts` are exact file counts from MAIN-SOURCE/ scan on {DATE}
- Genre: confirmed (from LEARN/ docs) or estimated (from folder patterns)
- Skill applicability: confirmed (from /init) or estimated (from file signals)
- Status tracks rebuild progress: `Not started` → `Init'd` → `Phase X in progress` → `Complete`
```

## Validation

12. Verify:
    - Every project folder in MAIN-SOURCE/ appears in the table (no orphans)
    - No table entry references a project folder that doesn't exist
    - Scale tier matches actual .cs count for every row
    - Skill Demand counts match the sum of projects listing that skill
    - Scale Distribution counts sum to total project count
    - Universal skills (input, scene-setup, testing, prefab-hierarchy) show demand = total project count

## Post-Refresh

13. Update `.github/copilot-instructions.md` if project count changed (currently references "29 projects" in workspace description — update if different)
14. Append to `LEARN/{any-active-project}/surfer.md` if one is in progress: `### /refresh-workspace-reg — {DATE}\n- Registry refreshed: {N} projects, {changes summary}`