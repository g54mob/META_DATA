---
description: "Deep-analyse ALL projects in MAIN-SOURCE/ to classify domain demands, discover what skills are needed, and produce a comprehensive gap report. Scans actual .cs files — not just folder names. Identifies missing skills, existing skill genre-blindness, template gaps, prompt blind spots, and convention holes. Use when: adding new project genres, framework feels insufficient, or before running /implement-audit-todo."
---

# /audit-framework — Multi-Project Deep Source Analysis & Framework Gap Report

> Deep-analyses EVERY project in `MAIN-SOURCE/*/` by scanning actual `.cs` files. Classifies each project's
> genre and domain demands. Identifies what skills are needed, which existing skills have genre-blind
> assumptions, and what conventions/templates/prompts need updating.

> **This prompt reads `MAIN-SOURCE/` (raw source) exclusively for analysis.** It does NOT read or modify
> `LEARN/` content — those conventions are handled by `/rebuild-templates` and `/rebuild-prompts`.

> **Output:** A comprehensive gap report with prioritized TODO items. Save to `.claude/audit-required-todo.md`
> for `/implement-audit-todo` to action.

---

## Setup

### 1. Discover all projects in MAIN-SOURCE/

Scan the workspace for project source folders:

```
MAIN-SOURCE/
├── {project-1}/          ← raw decompiled/extracted source
├── {project-2}/
└── ...
```

Also check legacy layout: `Scripts/Assembly-CSharp/` (single-project mode, treat as one project).

For each discovered project folder:
1. Count total `.cs` files (recursive)
2. List top-level subfolders (these often reveal game structure)
3. Check for third-party assemblies/folders (e.g., `Photon/`, `FishNet/`, `DOTween/`, `AstarPathfinding/`)
4. Estimate project size: Small (<100 files), Medium (100-500), Large (500-2000), Massive (2000+)

Produce project inventory:

| # | Project | Total .cs Files | Top Folders | Third-Party Libraries | Size Class |
|---|---------|----------------|-------------|----------------------|------------|

### 2. Deep-scan each project for genre classification

For EACH project, perform the following source scans to determine genre and core mechanics:

**Step 2a — Assembly/namespace scan:**
```
Search for: Assembly-CSharp folders, namespace declarations, assembly definition files
Purpose: Identify game's module structure
```

**Step 2b — Core gameplay pattern detection:**
Grep for keywords that reveal genre:

| Pattern to Search | Indicates | Search Strategy |
|-------------------|-----------|-----------------|
| `NavMesh`, `NavMeshAgent`, `SetDestination` | AI/Navigation | grep in all .cs |
| `ServerRpc`, `ClientRpc`, `ObserversRpc`, `NetworkBehaviour`, `NetworkObject`, `SyncVar`, `Rpc` | Networking | grep in all .cs |
| `ISaveable`, `SaveManager`, `SaveData`, `Serialize`, `LoadGame`, `ES3`, `PlayerPrefs.Set` | Save/Load | grep + filename `*Save*`, `*Load*`, `*Persist*` |
| `DialogueManager`, `DialogueController`, `Yarn`, `Ink`, `Conversation`, `DialogNode` | Dialogue | grep + folder `Dialogue/`, `Dialog/` |
| `Inventory`, `ItemStack`, `AddItem`, `RemoveItem`, `SlotUI`, `CraftingRecipe` | Inventory/Crafting | grep + folder `Inventory/`, `Crafting/` |
| `WheelCollider`, `VehicleController`, `Throttle`, `Steering`, `EngineRPM` | Vehicles | grep + filename `*Vehicle*`, `*Car*`, `*Wheel*` |
| `DayNight`, `TimeOfDay`, `GameTime`, `DayCycle`, `sunLight`, `skybox` | Day/Night Cycle | grep |
| `FSM`, `StateMachine`, `IState`, `ChangeState`, `currentState`, `BehaviorTree`, `BTNode` | AI State Machines | grep |
| `Physics.Raycast`, `Rigidbody`, `OnCollision`, `Joint`, `Ragdoll`, `ActiveRagdoll` | Physics-Heavy | grep (count occurrences — 20+ = significant) |
| `ParticleSystem`, `VFXGraph`, `_EmissionColor`, `SetFloat("_Speed")` | VFX/Shaders | grep |
| `InputAction`, `InputSystem`, `Rebind`, `InputActionMap`, `PlayerInput` | Input System | grep + assembly `Unity.InputSystem` |
| `Cinemachine`, `CinemachineVirtualCamera`, `CameraController`, `FreeLook`, `OrbitCamera` | Camera System | grep |
| `Canvas`, `UIPanel`, `UIManager`, `ShowPanel`, `HidePanel`, `Button.onClick` | UI System | grep (count — 30+ occurrences = heavy UI) |
| `AudioSource`, `AudioClip`, `PlayOneShot`, `SoundManager`, `MusicManager` | Audio | grep |
| `Animator`, `AnimatorController`, `SetTrigger`, `SetBool`, `BlendTree`, `AnimationClip` | Animation | grep (count — determines complexity) |
| `WaveManager`, `SpawnWave`, `EnemySpawner`, `WaveConfig`, `TowerPlacement` | Tower Defense | grep |
| `ProceduralGeneration`, `ChunkManager`, `WorldGen`, `Perlin`, `Random.seed` | Procedural Gen | grep |
| `Quest`, `QuestManager`, `Objective`, `QuestStep`, `QuestReward` | Quests | grep |
| `Schedule`, `NPCSchedule`, `DailyRoutine`, `TimeSlot`, `ScheduleEntry` | NPC Scheduling | grep |

**Step 2c — Classify each project:**

For each project, produce:

```
### Project: {name}

**Genre:** {Primary genre} / {Secondary genre}
**Core Mechanic:** {1-sentence description}
**Player Perspective:** FPS / TPS / Top-down / 2D / Isometric
**Multiplayer:** None / Local co-op / Online (library: {name})
**File Count:** {N}

**Domain Usage (from grep counts):**
| Domain | Files Found | Key Classes | Significance (Central/Supporting/Minor) |
|--------|-------------|-------------|----------------------------------------|
| Save/Load | 12 files | SaveManager, ISaveable, LoadManager | Central |
| AI/NavMesh | 8 files | NPCMovement, CustomerAI, EnemyFSM | Central |
| Networking | 35 files | NetworkManager, PlayerSync, RoomController | Central |
| ... | ... | ... | ... |

**Third-Party Dependencies:**
| Library | What It Does | Integration Depth (light/deep) |
|---------|-------------|-------------------------------|
| FishNet | Networking | Deep (NetworkBehaviour everywhere) |
| DOTween | Animation | Light (convenience only) |
```

### 3. Read the current .claude/ framework

Read ALL existing framework files (skills, conventions, templates, commands):
- `.claude/skills/*.md` — read FULL bodies, note what they cover and what they assume
- `.claude/instructions/csharp-conventions.md` — note all rules
- `.claude/templates/*.md` — note all fields/sections
- `.claude/commands/*.md` — note all steps and skill references

---

## Phase 1 — Comprehensive Gap Analysis

### 4. Domain-to-Skill coverage matrix

Build the master matrix. Mark ✅ if domain is SIGNIFICANT in that project (Central or Supporting, not Minor):

| Domain Area | Proj-1 | Proj-2 | Proj-3 | ... | Covered by Skill? | Projects Needing It |
|-------------|--------|--------|--------|-----|-------------------|-------------------|

**Significance threshold:** A domain is significant if:
- 5+ source files dedicated to it, OR
- It's central to gameplay (game breaks without it), OR
- It involves architectural patterns agents consistently get wrong

### 5. Missing skills analysis (DETAILED)

For EACH domain area marked ✅ in 2+ projects but NOT covered by an existing skill:

```
### Missing Skill: unity-{domain-name}

**Projects that need it:** {list with file counts per project}
**Priority:** 🔴/🟡/🟢
**Justification:** {why agents need guidance — what they get wrong without it}

**Source evidence — key files per project:**
| Project | Key Files | Core Pattern Observed |
|---------|-----------|---------------------|
| project-1 | SaveManager.cs, ISaveable.cs, LoadManager.cs | ISaveable interface + JSON serialization |
| project-2 | SaveSystem.cs, ISavable.cs, SaveProfile.cs | Similar ISaveable + binary |

**Cross-project consensus:**
| Pattern | Project Count | Consensus? | Should Be Core/Variant |
|---------|--------------|-----------|----------------------|
| ISaveable interface contract | 5/8 | ✅ Yes | Core |
| ES3 (Easy Save 3) | 2/8 | ❌ No | Genre Variant |
| PlayerPrefs for settings | 3/8 | ✅ Yes | Core (settings only) |

**What the skill MUST cover (section outline):**
1. Architecture Overview — {what components exist, how they connect}
2. Core pattern — {the 3+ project consensus pattern}
3. Component A — {class, responsibilities, lifecycle}
4. Component B — {class, responsibilities}
5. Genre Variants — {1-2 project patterns that differ}
6. Integration with framework — {how it fits _-Systems/, GameEvents, DataService}
7. Pitfalls — {what agents get wrong without guidance}

**Key code files to extract patterns from (for /implement-audit-todo):**
- `MAIN-SOURCE/project-1/path/to/SaveManager.cs` — core manager pattern
- `MAIN-SOURCE/project-2/path/to/ISaveable.cs` — interface contract
- `MAIN-SOURCE/project-1/path/to/SaveData.cs` — data class pattern
```

Repeat this block for EVERY missing skill identified.

### 6. Existing skills — genre-blindness analysis

For EACH existing skill, check if it makes assumptions that break for other project genres:

```
### Existing Skill: unity-{name}

**Current assumptions:**
- {Assumption 1 — e.g., "pool size = 30 hardcoded"}
- {Assumption 2 — e.g., "only spatial 3D audio, no 2D"}
- {Assumption 3 — e.g., "only FPS ViewModel/WorldModel"}

**Projects where these assumptions break:**
| Assumption | Breaks For | What They Do Instead | Source Evidence |
|-----------|-----------|---------------------|----------------|
| Pool=30 | noimnot (2D) | No pool needed, 5 sounds max | AudioManager.cs line ~20 |
| Spatial 3D only | noimnot, loop-2025 | spatialBlend=0 for all | SFXPlayer.cs |

**Genre Variants needed:**
### {Genre} ({project names})
- {What to add — concrete values, not vague descriptions}
- {Code-level difference}

### {Genre} ({project names})
- {What to add}
```

### 7. Convention gap analysis

For EACH pattern found in 3+ projects that `csharp-conventions.instructions.md` doesn't document:

| Convention Gap | Projects Using It | Source Evidence | Impact if Missing |
|---------------|------------------|----------------|-------------------|
| async/await for networking | schedule-1, smarket, bsge | `async Task ConnectAsync()` in NetworkManager.cs | 🔴 Convention actively blocks correct code |
| FSM IState pattern | schedule-1, smarket, twFactory, bsge | `IState.cs`, `StateManager.cs` in AI folders | 🟡 Agents produce ad-hoc switch statements |
| Generic object pool | minemgl, schedule-1, bsge, twFactory | `Pool<T>.cs`, `ObjectPool.cs` | 🟡 Agents instantiate/destroy repeatedly |

### 8. Template gap analysis

For each template, check if ANY project's source reveals patterns the template doesn't handle:

| Template | Gap | Which Projects Expose It | What to Add |
|----------|-----|-------------------------|-------------|
| PhaseMap-template.md | No network tier column | schedule-1, smarket | "Network Tier" column for client/server/shared |
| GOAL-general.md | No save/load architecture | 8 projects | ISaveable section with rules |
| FLOW-template.md | No networked event flow | schedule-1, smarket | Client→Server→AllClients diagram |

### 9. Prompt gap analysis

For each prompt, check if its steps produce wrong output for specific genres:

| Prompt | Step/Area | Issue | Genre That Breaks It | Fix |
|--------|-----------|-------|---------------------|-----|
| init.prompt.md | Phase ordering | Assumes "economy first" | NPC-centric games | Add genre-aware ordering |
| build-phase.prompt.md | Skills reference | Missing 4+ domains | All | Add new skill refs |
| audit-phase.prompt.md | Fidelity checks | No persistence completeness | Tycoon/sim | Add save state audit |
| decouple-check.prompt.md | Coupling rules | Flags NetworkBehaviour refs | Multiplayer | Add intentional coupling allowlist |

---

## Phase 1 Output — Structured TODO

Save the full report as `.claude/audit-required-todo.md` with this structure:

```markdown
# .claude/ Framework — Audit-Required TODO

> Last assessed: {date} | Projects scanned: {N} | Source: MAIN-SOURCE/ only

## Project Inventory
{Table from Step 1}

## Domain Demand Matrix  
{Table from Step 4}

## 🔴 Critical Items
### TODO-{N}: {title}
**Type:** `create-skill` | `update-skill` | `edit-convention` | `edit-template` | `edit-prompt`
**File:** {target file to create or modify}
**Priority:** 🔴
**Projects affected:** {list}
**Source evidence:** {key files/classes found}
**What to change:** {exact description — detailed enough for /implement-audit-todo to act without re-scanning}
**Acceptance criteria:** {checklist}

## 🟡 Important Items
{Same format — every item MUST have the Type field}

## 🟢 Nice-to-Have Items
{Same format}

## Existing Skill Genre-Blindness Fixes
{Summary table}

## Verification Checklist
{Post-implementation checks}

## Implementation Order
{Batch sequence}
```

Each TODO item MUST include:
1. **Type** — one of: `create-skill`, `update-skill`, `edit-convention`, `edit-template`, `edit-prompt`
2. **Target file** — exact path of file to create or modify
3. **Priority** — with justification
4. **Projects affected** — which projects exposed the gap
5. **Source evidence** — specific files/classes/patterns found (saves `/implement-audit-todo` from re-scanning)
6. **What to change** — detailed enough for `/implement-audit-todo` to execute without re-scanning
7. **Acceptance criteria** — checkboxes for verification

---

## STOP — Present Report

Present the Phase 1 report to the user. Ask:
- "Save this as `.claude/audit-required-todo.md`?"
- "Run `/implement-audit-todo` to start implementing?"

Do NOT implement anything in this prompt — implementation is `/implement-audit-todo`'s job.
This prompt's ONLY job is thorough analysis and reporting.

---

## Key Principles

- **Scan MAIN-SOURCE/ exclusively** — don't analyse LEARN/ (that's `/rebuild-templates`' job)
- **Deep file reading, not surface scanning** — open files, read classes, count patterns. Don't just look at folder names
- **Cross-project consensus drives decisions** — a pattern in 3+ projects becomes "core", 1-2 becomes "variant"
- **Every gap maps to a specific file change** — vague "we should improve X" is useless. Say "add section Y to file Z"
- **Skills are the primary extension mechanism** — when agents need domain knowledge, create a SKILL
- **The TODO file is the deliverable** — it must be detailed enough that `/implement-audit-todo` can execute without re-scanning source
- **Universal framework** — changes must work for ALL Unity3D genres, not just the ones currently in MAIN-SOURCE/