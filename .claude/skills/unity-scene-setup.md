---
name: "unity-scene-setup"
description: "Scene building patterns — render pipeline configuration (URP/Built-in/HDRP), lighting profiles (outdoor/indoor/underground/2D), materials, Shader Graph conventions, prefab placement, per-phase world layout, layers, post-processing, genre-adaptive setup, and WORLD.md format for Unity rebuild projects"
---

# Unity Scene Setup — World Building Patterns

> **Universal pattern — applies to ALL Unity projects in this workspace.**
> This skill defines how scenes are built per phase — lighting, materials, layers, prefab placement,
> and the WORLD.md documentation format.
> Each phase extends the world progressively (flat test room → enclosed area → full environment).
> Choose the **render pipeline** and **lighting profile** that matches your project.

---

## Render Pipeline Configuration

### URP (Universal Render Pipeline) — DEFAULT for new projects

1. Edit → Project Settings → Graphics
2. Scriptable Render Pipeline Settings → `UniversalRenderPipelineAsset`
3. Renderer Data asset → enable:
   - ✅ Depth Texture
   - ✅ Opaque Texture
   - Rendering Path: **Forward+**

**Post-Processing (Bloom for Emissive):**
1. Create Empty GO → `PostProcessVolume`
2. Add `Volume` component → Create New Profile
3. Add Override → **Bloom** (Intensity=0.5, Threshold=1.0, Scatter=0.7)
4. On Camera: enable **Post Processing** checkbox
5. On Renderer Data: check **Post Processing Enabled**

### Built-in Render Pipeline (12+ projects: rimWrld, tabs, polybridge3, etc.)

No Scriptable Render Pipeline asset needed. Uses legacy shaders.

1. Edit → Project Settings → Graphics → Built-in
2. Post-Processing: Use **Post Processing Stack v2** package
3. Shaders: Standard/Legacy, no Shader Graph (use custom .shader files)
4. Lighting: Legacy lightmapping, reflection probes
5. Camera: Standard Camera component (no URP camera data)

**Key differences from URP:**
- No `UniversalAdditionalCameraData`
- Shader properties use `_MainTex` not `_BaseMap`
- No SRP Batcher — use GPU instancing instead
- Post-processing via separate `PostProcessLayer` + `PostProcessVolume` components

### HDRP (High Definition Render Pipeline) — wrngfloor, high-fidelity projects

1. Edit → Project Settings → Graphics → `HDRenderPipelineAsset`
2. Volume Framework: Global Volume + Local Volumes for areas
3. Lighting: Volumetric fog, area lights, screen-space GI
4. Materials: HDRP/Lit shader (more complex properties)

**Key differences from URP:**
- Volume system for ALL visual settings (exposure, fog, sky, post-processing)
- Area lights, volumetric lighting, ray tracing support
- Higher base performance cost — target 60fps, not 90fps
- Decal system via Decal Projectors
- Material properties different: `_BaseColorMap`, `_NormalMap`, `_MaskMap`

### PSX Render Pipeline (welcmHome — retro horror)

Custom render pipeline for PlayStation 1 aesthetic:
- Vertex snapping, affine texture mapping, limited color depth
- Use project's custom PSX RP asset — do not mix with URP/HDRP shaders

---

## Lighting Profiles

Choose the profile that matches your project's environment:

### Outdoor Daytime (20+ projects: basementToSky, btycoon, smarket, throneFall, etc.)

```
Environment Lighting:
  Source: Skybox
  Ambient Mode: Trilight (sky=bright, equator=mid, ground=dark)

Directional Light (Sun):
  Rotation: (50, -30, 0)
  Color: warm white (FFF8E7)
  Intensity: 1.5
  Shadow Type: Soft Shadows
  Shadow Resolution: 2048

Fog (optional — distance fade):
  Enabled: true
  Color: desaturated sky color
  Mode: Linear (Start=50, End=200)

Skybox:
  Material: URP Procedural Skybox or custom gradient
  Sun Source: Directional Light

Camera:
  Clear Flags: Skybox
  HDR: enabled
```

### Outdoor Night / Horror (contentWarn, welcmHome, wrngfloor)

```
Environment Lighting:
  Source: Color (dark blue/purple — 0.05, 0.05, 0.1)
  Ambient Intensity: 0.1-0.3

Directional Light:
  Moon simulation — intensity 0.1-0.3, blue-white color
  OR: no directional light, point/spot only (flashlight-driven)

Key Lights:
  Spot lights for flashlights, lanterns
  Point lights for candles, fire, monitors
  Low intensity (0.5-1.0), warm/cool contrast

Post-Processing:
  Color Grading: desaturated, cool tones, crushed blacks
  Vignette: enabled (0.3-0.5 intensity)
  Bloom: subtle (for flashlight/fire glow)
  Film Grain: optional (found-footage feel)

Camera:
  Clear Flags: Solid Color (near-black)
```

### Indoor / Underground (Mining, labs, dungeons)

```
Environment Lighting:
  Source: Color (dark gray — 0.1, 0.1, 0.12)
  Ambient Intensity: 0.05-0.15

No Directional Light — point/spot lights only
Camera Clear: Solid Color (near-black)
No Skybox

Point Lights:
  Range: 8-15 (room dependent)
  Warm white (1, 0.95, 0.85) for work areas
  Cool blue (0.7, 0.85, 1) for corridors
  Max 4 shadow-casting lights for performance

Emissive Materials:
  Status indicators, glowing elements
  Requires Bloom post-processing to glow visibly
```

### 2D Games (stackLand, papersPls, shapeFactr, noimnot)

```
Environment Lighting:
  Source: Color
  Ambient Intensity: 1.0 (fully lit — sprites self-illuminate)

No Directional Light (or very subtle for normal-mapped sprites)
Camera: Orthographic
Sorting Layers: Background, Default, Foreground, UI
No fog, no volumetric effects
No post-processing shadows (optional: Bloom for UI effects)

Sprite Lighting (if 2D lights used):
  Point Light 2D, Freeform Light 2D
  Global Light 2D for base illumination
```

### Isometric / Top-Down (modulus, btycoon, twFactory)

```
Environment Lighting:
  Source: Skybox or Gradient
  Directional Light at steep angle (70, -45, 0)

Camera:
  Orthographic or narrow FOV perspective
  Rotation: (45-60, 45, 0) — standard isometric
  Post-Processing: Subtle (SSAO, light bloom)

Shadows:
  Directional Light shadows important for depth perception
  Shadow distance: 50-100 (matches visible area)
```

---

## Materials & Shader Graph Conventions

### Naming Convention

| Type | Format | Example |
|------|--------|---------|
| Material | `M_DescriptiveName` | `M_Ghost_Valid`, `M_Floor_Wood`, `M_GreenLight` |
| Shader Graph | `PascalCase_Description` | `Ghost_Transparent`, `ScrollingTexture`, `Emissive_Indicator` |
| Texture | `T_DescriptiveName` | `T_FloorTile`, `T_WallBrick` |

### Common Shader Graphs

**`Ghost_Transparent`** — Placement preview
- Properties: `_Color` (Color), `_Alpha` (float 0-1)
- Surface Type: Transparent, Render Face: Both
- Variants: Valid (green), Invalid (red), Requirement (yellow)

**`Emissive_Indicator`** — Status lights
- Properties: `_BaseColor`, `_EmissionColor` (HDR), `_EmissionIntensity` (float)
- Bloom post-processing makes these glow visibly

**`ScrollingTexture`** — Conveyor/water/lava surfaces
- Properties: `_MainTex`, `_ScrollSpeed` (float), `_Tint` (Color)
- UV offset driven by `_Time` node — zero CPU cost

---

## Layer Setup (Genre-Configurable)

### Base Layers (All Projects)

| Layer | Purpose |
|-------|---------|
| Default | General objects |
| Ground | Floor/terrain for movement |
| Interactable | Raycast targets for interaction |
| Player | Player collider (ignore self-raycast) |
| UI | UI elements (if needed in world-space) |

### Extended Layers (Add as Needed)

| Layer | Purpose | Typical Genres |
|-------|---------|----------------|
| Grabbable | Physics objects for grab system | FPS, sandbox |
| Tool/Weapon | Equipment on ground | FPS, RPG |
| Building | Placed structures | Tycoon, strategy, factory |
| BuildingGhost | Placement preview (no collision) | Tycoon, strategy |
| Projectile | Bullets/arrows (ignore other projectiles) | Shooter, TD |
| NPC | NPC colliders | All with NPCs |
| Enemy | Enemy colliders (separate from NPC) | Action, RPG, TD |
| Trigger | Invisible trigger zones | All |

**Tag → TagType enum mapping:**
```csharp
collider.HasTag(TagType.grabbable)      // replaces CompareTag("Grabbable")
gameObject.SetTag(TagType.interactable)  // replaces tag = "string"
```

---

## Per-Phase World Progression

### Phase A — Flat Test Room (ALL projects start here)

```
┌────────────────────────────────────────┐
│                                        │
│    [Spawn] ★                          │
│                                        │
│    [Interactable Objects]              │  ← Core interaction targets
│                                        │
│    [UI Trigger / Terminal]             │  ← Shop/menu access point
│                                        │
│    [Test Objects] ■ ■ ■                │  ← Removed before final
│                                        │
└────────────────────────────────────────┘
Floor: Plane (5,1,5), Layer: Ground
Lighting: Single Directional Light (test only)
Singletons: UIManager, core managers
```

### Subsequent Phases — Grow Environment

Each phase adds to the world. The layout depends on your game:
- **FPS/Horror:** Room → corridors → floors → building
- **Tycoon:** Empty lot → shop floor → multiple departments → town
- **Factory:** Flat area → machine room → production lines → warehouse
- **Colony:** Empty map → base camp → expanded territory
- **TD:** Path → path + build zones → multi-lane

---

## Prefab Placement Rules

1. **Position precision:** Whole numbers or 0.5 increments. Never arbitrary floats.
2. **Y offset for ground items:** 0.1-0.2 above floor to prevent z-fighting.
3. **Spacing:** Items 1-2m apart, machines 3-5m apart.
4. **Rotation:** Default (0,0,0) unless wall-mounted (face outward).
5. **Scale:** Always (1,1,1) — scale the mesh asset, not transform.
6. **Singleton GOs:** Empty GO at (0,0,0), name matches class.
7. **Test objects:** Named `TEST_ObjectName` — removed before final build.

---

## Scene Hierarchy Organization

```
Scene Root/
├── --- MANAGERS ---           ← Empty separator GO
│   ├── UIManager
│   ├── EconomyManager
│   ├── SoundManager
│   └── [other singletons]
├── --- ENVIRONMENT ---
│   ├── Floor / Terrain
│   ├── Walls / Boundaries
│   ├── Lights/
│   │   ├── DirectionalLight_Sun
│   │   └── PointLight_Area1
│   └── PostProcessVolume
├── --- INTERACTABLES ---
│   ├── [machines, terminals, items]
│   └── SpawnPoints/
├── --- PLAYER ---
│   └── Player
├── --- NPCs ---               ← If applicable
│   └── [NPC prefabs]
├── --- TEST OBJECTS ---       ← Removed before final
│   └── TEST_*
└── --- UI ---
    └── Canvas
        ├── HUDPanel
        └── [other panels]
```

**Naming:**
- Separator GOs: `--- CATEGORY ---` (triple dash, all caps)
- Singletons: exact class name
- Test objects: `TEST_` prefix
- Lights: `LightType_Purpose` (e.g., `PointLight_Workshop`)

---

## WORLD.md Format (in `phase-All/7-3D/`)

```markdown
# WORLD — Layout Per Phase

## Phase X — [Name]

### Top-Down ASCII Map
[ASCII art showing positions]

### Prefab Table
| Prefab | Position | Rotation | Layer | Notes |

### Singletons Required
- [List all Singleton MonoBehaviours needed]

### Lighting
- Profile: [Outdoor Daytime / Night Horror / Indoor / 2D]
- Key lights: [positions, colors, intensities]

### New Layers/Tags Added
- Layer: Name — purpose
- TagType enum: name — purpose
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Missing PostProcessVolume | Emissive won't glow — add Volume + Bloom override |
| Wrong camera clear for indoor | Use Solid Color (dark), not Skybox for enclosed spaces |
| Too many realtime shadow lights | Max 4 realtime shadows — bake static lights |
| Raw string tags on objects | Use TagType enum + extension — never Inspector tag field |
| Forgetting layer on colliders | Physics queries need correct layerMask — set on collider GO |
| Scale != (1,1,1) on parent | Causes child physics issues — scale the mesh asset |
| Singleton GO not at origin | Singletons at (0,0,0) — no world position needed |
| Mixing render pipelines | Never use URP materials in Built-in project or vice versa |
| 2D game with 3D lighting | Use 2D lights (Light2D) or no lights (fully ambient) for 2D |
| Missing sorting layers in 2D | Define Background/Default/Foreground/UI before placing sprites |