---
description: "In-depth project overview — deeply analyze a MAIN-SOURCE/ project, explain what it is, how it plays, its architecture insights, system relationships, script/asset breakdown, and estimated build hours. Chat-only — no files created or modified."
mode: "ask"
---

# /project-overview — In-Depth Project Analysis

> **Purpose:** Deeply analyze a raw source project and deliver a rich, insightful breakdown of what the game is, how it works, and what it would take to rebuild.
> **Output:** Chat only — zero files created, zero files modified.

---

## Setup

1. Ask: "Which project?" → `{PROJECT}`
2. Verify `MAIN-SOURCE/{PROJECT}/` exists
3. Check if `MAIN-SOURCE/entire-{PROJECT}.stub` exists — if yes, read it fully (this is the complete file hierarchy including assets excluded due to size)

---

## Step 1 — Identify What This Game Is

Scan the source **thoroughly** — read class names, method bodies, enums, ScriptableObject fields, manager orchestration, and folder structures. Determine:

- **Game title / working name** — from namespace, assembly name, or main class names
- **Genre** — FPS, tycoon, horror, sim, puzzle, etc. (infer from class names, folder structure, gameplay patterns)
- **Core mechanic** — one sentence describing the main gameplay loop
- **Perspective** — FPS, TPS, 2D, isometric, top-down
- **Multiplayer?** — check for FishNet, Photon, Mirror, Netcode, RakNet, Lidgren namespaces/assemblies
- **Third-party libraries** — list every non-Unity assembly or plugin detected (DOTween, Cinemachine, A*Pathfinding, FMOD, Rewired, Odin, etc.)

Output as:

```
## What Is This?

**Game:** {title}
**Genre:** {genre} ({perspective})
**Core Loop:** {one-sentence mechanic description}
**Multiplayer:** {None / Online (library) / LAN (library)}
**Third-Party:** {comma-separated list}
```

---

## Step 2 — Deep Gameplay Insights

This is the **most important section**. Read key scripts (managers, player, core systems) deeply. Don't just list — **explain what the player actually does** and how the code implements it.

### 2A — Player Experience (What It Feels Like to Play)

Describe the game from the player's perspective in 3-5 sentences:
- What does the player see when they start?
- What actions can they take?
- What's the loop (moment-to-moment → session-level → long-term progression)?
- What's the challenge / tension / fun?

### 2B — Architecture Insights

Analyze HOW the game is built. Look for:

- **Communication pattern** — events? direct references? singletons? ScriptableObject channels?
- **Data ownership** — who owns game state? single GameManager? distributed? DataService?
- **Persistence approach** — PlayerPrefs? JSON? binary? SQLite? what gets saved?
- **Code quality signals** — clean separation or spaghetti? clear responsibilities or god classes? consistent naming or chaotic?
- **Notable anti-patterns** — massive Update() loops? string-based Find()? tight coupling?
- **Notable good patterns** — proper event decoupling? SO-driven config? pooling? clean FSM?

### 2C — System Relationship Map

Describe how the major systems **talk to each other**. Identify:
- The "spine" (central systems everything depends on)
- Leaf systems (isolated, easy to extract)
- Tightly coupled clusters (would need to rebuild together)

Output as:

```
## Gameplay Insights

### What It Feels Like to Play
{3-5 sentence player experience description}

### Architecture Quality
**Communication:** {pattern — e.g., "Event-driven via static GameEvents class" or "Direct singleton references everywhere"}
**Data Flow:** {who owns state, how it flows}
**Persistence:** {save approach}
**Code Quality:** {honest 1-sentence assessment}

### System Relationships
**Spine (everything depends on):** {list core systems}
**Leaf (isolated):** {list extractable systems}
**Coupled Clusters:** {list tightly-bound groups}

### Notable Observations
- {insight 1 — something surprising, clever, or problematic}
- {insight 2}
- {insight 3}
```

---

## Step 3 — Count Everything

Scan `MAIN-SOURCE/{PROJECT}/` and the `.stub` file to count assets by category. For files physically present, count directly. For files only in the `.stub`, count from the hierarchy listing.

### Categories to count:

| Category | File Extensions | Where to Look |
|----------|----------------|---------------|
| **Scripts** | `.cs` | `MAIN-SOURCE/{PROJECT}/` (physical files) |
| **3D Models** | `.fbx`, `.obj`, `.blend`, `.dae`, `.3ds` | `.stub` file — `Mesh/`, `PrefabHierarchyObject/`, model folders |
| **Animations** | `.anim`, `.controller`, `.overrideController` | `.stub` file — `AnimationClip/`, `AnimatorController/`, `AnimatorOverrideController/` |
| **Textures** | `.png`, `.jpg`, `.tga`, `.psd`, `.exr`, `.tif` | `.stub` file — `Texture2D/`, `Sprite/`, texture folders |
| **Audio** | `.wav`, `.mp3`, `.ogg`, `.aif`, `.flac` | `.stub` file — `AudioClip/`, audio folders |
| **Scenes** | `.unity` | `.stub` file — `Scenes/` |
| **Materials** | `.mat` | `.stub` file — `Material/` |
| **Shaders** | `.shader`, `.shadergraph`, `.hlsl` | `.stub` file — `Shader/`, `ShaderGraph/` |
| **Prefabs** | `.prefab` | `.stub` file — `PrefabHierarchyObject/`, prefab folders |
| **ScriptableObjects** | `.asset` (in SO_ folders) | `.stub` file — `Resources/`, SO-related folders |
| **Fonts** | `.ttf`, `.otf`, `.fontsettings` | `.stub` file — `Font/` |
| **Lighting** | `LightingSettings/`, `LightmapSnapshot/`, `LightingData` | `.stub` file |
| **Terrain** | `TerrainData/`, `TerrainLayer/` | `.stub` file |
| **Physics** | `PhysicsMaterial/`, `PhysicsMaterial2D/` | `.stub` file |

**Script sub-classification** (from reading actual `.cs` files):

Classify each script into ONE bucket:

| Script Type | How to Identify |
|-------------|-----------------|
| **Game Logic** | MonoBehaviour with gameplay methods (Update, triggers, coroutines, player/enemy/item behavior) |
| **Data / SO** | ScriptableObject definitions, pure data classes, enums, serializable structs |
| **UI** | Canvas/panel/button scripts, HUD, menus, text formatters |
| **Manager / Singleton** | Manager classes, singletons, orchestrators, system coordinators |
| **Utility / Extension** | Static helpers, extension methods, math utils, string formatters |
| **Editor** | `#if UNITY_EDITOR`, `CustomEditor`, `EditorWindow`, `PropertyDrawer` |
| **Third-Party** | Files from plugin/library assemblies (DOTween, Odin, etc.) — count but separate |
| **Networking** | NetworkBehaviour, RPCs, sync vars, lobby/session code |
| **Save/Load** | ISaveable, SaveManager, serialization, persistence |
| **Audio** | AudioSource wrappers, sound managers, music controllers |
| **Animation** | Animator controllers in code, IK, procedural animation |

Output as:

```
## Asset Breakdown

| Category | Count | Notes |
|----------|-------|-------|
| Scripts (total) | {N} | {game-code} game / {third-party} third-party |
| 3D Models | {N} | {note if none = 2D game} |
| Animations | {N} clips, {N} controllers | |
| Textures | {N} | |
| Audio | {N} | |
| Scenes | {N} | |
| Materials | {N} | |
| Shaders | {N} | {custom vs standard} |
| Prefabs | {N} | |
| Fonts | {N} | |
| Terrain | {N} layers, {N} data | |

### Script Breakdown

| Type | Count | % |
|------|-------|---|
| Game Logic | {N} | {%} |
| Data / SO | {N} | {%} |
| UI | {N} | {%} |
| Manager / Singleton | {N} | {%} |
| Utility / Extension | {N} | {%} |
| Editor | {N} | {%} |
| Third-Party | {N} | {%} |
| Networking | {N} | {%} |
| Save/Load | {N} | {%} |
| Audio | {N} | {%} |
| Animation | {N} | {%} |
```

---

## Step 4 — Estimate Build Hours by Category

Estimate how long it would take a **solo developer** to rebuild this project from scratch, broken down by category. Use these baselines:

### Estimation Rules

**Scripts:**
- Simple script (< 50 lines, one responsibility): **15 min**
- Medium script (50-200 lines, multiple methods, some logic): **45 min**
- Complex script (200+ lines, state machines, coroutines, math): **90 min**
- Read each script (or sample 30% if 500+ scripts) to classify complexity

**Art / Textures:**
- Per unique texture asset: **30 min** (creating/sourcing + import settings)
- UI sprites/icons: **15 min each**
- This assumes sourcing from asset stores or creating simple assets — NOT AAA art production

**3D Models:**
- Simple prop (cube, sphere, basic shape): **15 min**
- Medium model (furniture, tool, weapon): **2 hours**
- Complex model (character, vehicle, building): **6 hours**
- If model count is from `.stub` only, estimate from prefab/mesh names

**Animations:**
- Simple animation (door open, button press): **20 min**
- Character animation (walk, run, attack): **2 hours**
- Complex animation (cutscene, procedural): **4 hours**

**Audio:**
- Per sound effect (sourcing + import + wiring): **15 min**
- Per music track (sourcing + looping + integration): **1 hour**
- Audio system setup (manager, pooling, mixing): **4 hours**

**Scene Setup / Lighting:**
- Per scene (layout, lighting, post-processing, baking): **3 hours**
- Terrain setup (per terrain): **4 hours**
- Lighting profiles (if day/night): **6 hours**

**Materials / Shaders:**
- Standard material setup: **10 min each**
- Custom shader / Shader Graph: **3 hours each**

Output as:

```
## Estimated Build Hours

| Category | Items | Hours | Notes |
|----------|-------|-------|-------|
| Scripts (game code) | {N} scripts | {H}h | {simple/medium/complex breakdown} |
| Scripts (UI) | {N} scripts | {H}h | |
| Scripts (managers) | {N} scripts | {H}h | |
| Scripts (networking) | {N} scripts | {H}h | {skip if none} |
| Scripts (save/load) | {N} scripts | {H}h | {skip if none} |
| 3D Models | {N} models | {H}h | {skip if 2D} |
| Animations | {N} clips | {H}h | |
| Textures / Art | {N} textures | {H}h | |
| Audio | {N} sounds | {H}h | |
| Scenes / Lighting | {N} scenes | {H}h | |
| Materials / Shaders | {N} mats, {N} shaders | {H}h | |
| **TOTAL** | | **{TOTAL}h** | **~{weeks} weeks full-time** |

### Hours by Department (Pie Chart Data)

| Department | Hours | % |
|------------|-------|---|
| Programming | {H}h | {%} |
| Art / Textures | {H}h | {%} |
| 3D Modeling | {H}h | {%} |
| Animation | {H}h | {%} |
| Audio | {H}h | {%} |
| Level Design / Lighting | {H}h | {%} |
| Shaders / VFX | {H}h | {%} |
```

---

## Step 5 — Key Systems Detected

List the major gameplay systems found in the source. For each, note:
- System name (inferred from class names / folders)
- Approximate script count
- Complexity (simple / medium / complex)
- Notable patterns (FSM, pooling, SO-driven, event-driven)

Output as:

```
## Key Systems

| System | Scripts | Complexity | Notable Patterns |
|--------|---------|------------|------------------|
| {PlayerSystem} | {N} | {complex} | {CharacterController, FSM, input handling} |
| {InventorySystem} | {N} | {medium} | {SO-driven items, drag-drop UI} |
| ... | | | |
```

---

## Step 6 — Quick Verdict

End with a brief assessment:

```
## Verdict

**Size class:** {Tiny (< 20 scripts) / Small (20-50) / Medium (50-150) / Large (150-300) / Very Large (300-500) / Massive (500-1000) / Colossal (1000+)}
**Rebuild difficulty:** {Straightforward / Moderate / Complex / Very Complex}
**Biggest challenge:** {one sentence — e.g., "Networked state sync across 4 players with FishNet"}
**Phase estimate:** {N} phases at ~25 scripts each
**Recommended skills:** {list which .github/skills/ would be needed — e.g., unity-save-load, unity-fsm, unity-networking}
```

---

## Reminders

- **CHAT ONLY** — do not create or modify any files
- **No LEARN/ output** — this is purely informational
- **Be honest about unknowns** — if `.stub` is missing, say "asset counts unavailable — only scripts analyzed"
- **Round hours** — don't give false precision (say "~45h" not "44.7h")
- **Beginner-friendly language** — explain jargon when first used