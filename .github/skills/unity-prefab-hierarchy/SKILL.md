---
name: 'unity-prefab-hierarchy'
description: 'Prefab GameObject hierarchy patterns — universal prefab structures (Player, NPC, Interactable, Building, Projectile, UI), Tool ViewModel/WorldModel split, Machine collider zones + connection points, flat hierarchy principles, collider separation, visual state switching for Unity rebuild projects'
---

# Unity Prefab Hierarchy — GameObject Structure Patterns

> **Universal pattern — applies to ALL Unity projects in this workspace.**
> This skill defines how prefabs are structured: which components go on which GameObject,
> parent/child relationships, visual state switching, collider separation, and connection points.
> Prefabs are intentionally FLAT (1-2 levels deep). Complexity lives in scripts, not hierarchy depth.
> Examples use `[PROJECT]` placeholders — substitute with your project's equivalents.

---

## Core Design Principles

1. **Flat hierarchies** — Most prefabs are 1-2 levels deep. No deep nesting.
2. **Component-driven** — Logic lives in scripts, not in transform structure.
3. **Visual state = SetActive** — Show/hide child GOs rather than spawn/destroy.
4. **Collider separation** — Physics and trigger colliders on separate child GOs.
5. **Connection via transforms** — Buildings/machines expose `Transform` fields for input/output/spawn points.
6. **Parenting for context** — Objects change parents at runtime (equipped items: scene → hand → scene).

---

## Universal Prefab Patterns

### Pattern 1: Player Prefab

Every player controller has a camera, interaction points, and optional visual model.

```
Player (root — PlayerController + CharacterController/Rigidbody)
├── GroundCheck (Transform — raycast origin for grounding)
├── Camera (PlayerCamera component)
│   └── ViewModelContainer (Transform — held items parent here)
│       └── [equipped item GO at runtime]
├── HoldPosition (Transform — grab point for held objects)
├── CharacterModel (GO — visible body, toggle for FPS)
│   ├── MeshRenderer / SkinnedMeshRenderer
│   └── Animator
├── InteractionPoint (Transform — raycast/overlap origin)
└── [Project-specific children: flashlight, backpack slot, etc.]
```

**Key transform relationships:**

| Transform | Purpose | Who References It |
|-----------|---------|-------------------|
| `ViewModelContainer` | Equipped items parent here | Equip system |
| `HoldPosition` | Physics grab target | Grab/carry system |
| `GroundCheck` | Ground detection raycast | Movement system |
| `Camera` | Raycasts, FOV, look direction | Everything |
| `InteractionPoint` | OverlapSphere for nearby items | Interaction system |

**FPS variant:** CharacterModel.SetActive(false) — player never sees own body.
**TPS variant:** CharacterModel always visible, camera offset behind/above.

---

### Pattern 2: NPC Prefab

NPCs have visual model, navigation, interaction zone, and AI state.

```
NPC (root — NPCController + NavMeshAgent OR CharacterController)
├── Model (GO — visual representation)
│   ├── SkinnedMeshRenderer / SpriteRenderer
│   └── Animator
├── InteractionTrigger (GO — SphereCollider isTrigger, larger than model)
├── DialogueAnchor (Transform — UI speech bubble position)
├── PatrolPoints[] (Transform[] — waypoint references, optional)
├── FootstepAudioPosition (Transform — sound emit point)
└── [State indicators: exclamation mark GO, sleep particles GO, etc.]
```

**State machine integration:**
```csharp
// NPC visual state driven by FSM
public void SetVisualState(NPCVisualState state)
{
    _exclamationMark.SetActive(state == NPCVisualState.alert);
    _sleepParticles.SetActive(state == NPCVisualState.sleeping);
    _animator.SetBool(AnimParamType.isWalking.ToString(), state == NPCVisualState.walking);
}
```

---

### Pattern 3: Interactable / Pickup Prefab

Objects the player can interact with (pick up, use, examine).

```
Interactable (root — implements IInteractable)
├── Visual (GO — mesh/sprite)
│   ├── MeshRenderer / SpriteRenderer
│   └── [optional: Animator for idle bob/glow]
├── PhysicsCollider (GO — actual shape for raycasts)
│   └── Collider (Box/Mesh/Capsule — layer: Interactable)
├── HighlightEffect (GO — outline/glow child, default inactive)
└── InteractionPromptAnchor (Transform — "Press E" UI position)
```

**Pickup item variant (FPS equippable):**
```
PickupItem (root — implements IInteractable, IIconItem)
├── WorldModel (GO — visible when on ground)
│   ├── MeshRenderer
│   └── Collider (Interactable layer)
├── ViewModel (GO — visible when equipped, default inactive)
│   ├── MeshRenderer (first-person hand model)
│   └── Animator
└── HighlightEffect (GO — default inactive)
```

**State toggle:**
```csharp
// DROPPED: WorldModel active, ViewModel inactive, physics enabled
// EQUIPPED: WorldModel inactive, ViewModel active, parent to hand container
public void Equip(Transform handContainer)
{
    _worldModel.SetActive(false);
    _viewModel.SetActive(true);
    transform.SetParent(handContainer);
    transform.localPosition = Vector3.zero;
    transform.localRotation = Quaternion.identity;
}

public void Drop(Vector3 dropForce)
{
    transform.SetParent(null);
    _worldModel.SetActive(true);
    _viewModel.SetActive(false);
    _rb.isKinematic = false;
    _rb.AddForce(dropForce, ForceMode.VelocityChange);
}
```

---

### Pattern 4: Building / Machine Prefab

Placeable structures with collision zones, connection points, and visual state indicators.

```
Building (root — BuildingController component)
├── PhysicalCollider (GO — actual physics shape)
│   └── BoxCollider / MeshCollider
├── PlacementBlocker (GO — larger collider preventing overlap)
│   └── BoxCollider (bigger than physical — blocks other placements)
├── Visual (GO — main mesh, optional LOD Group)
│   └── MeshRenderer
├── StatusIndicator (GO — optional emissive light/material)
├── InputPoints[] (Transform[] — where resources/connections enter)
├── OutputPoints[] (Transform[] — where resources/connections exit)
├── SpawnPoint (Transform — where products appear)
└── [Machine-specific children: rotator, processor, arms, etc.]
```

**Collider strategy (CRITICAL):**

| GO | Active During | Purpose |
|----|---------------|---------|
| `PhysicalCollider` | Normal gameplay | Physics — blocks player, raycasts hit |
| `PlacementBlocker` | Normal gameplay | Prevents overlapping builds |
| Both DISABLED | Ghost preview | Preview doesn't collide with self |

```csharp
// Placement preview mode
public void SetGhostMode(bool isGhost)
{
    PhysicalCollider.SetActive(!isGhost);
    PlacementBlocker.SetActive(!isGhost);
    // Swap material to transparent ghost shader
    _visual.material = isGhost ? _ghostMaterial : _normalMaterial;
}
```

**Status indicator pattern:**
```csharp
// Material swap for machine state (works with Bloom post-processing)
_statusRenderer.material = _isRunning ? _matGreenLight : _matRedLight;
```

---

### Pattern 5: Projectile Prefab

Bullets, arrows, thrown objects — pooled and recycled.

```
Projectile (root — ProjectileController + Rigidbody)
├── Visual (GO — mesh/trail)
│   ├── MeshRenderer
│   └── TrailRenderer (optional — visual path)
├── HitCollider (GO — trigger collider for impact detection)
│   └── SphereCollider / CapsuleCollider (isTrigger = true)
└── ImpactVFX (GO — particle system, default inactive, enabled on hit)
```

**Pool reset pattern:**
```csharp
// When returned to pool:
public void ResetForPool()
{
    gameObject.SetActive(false);
    _rb.linearVelocity = Vector3.zero;
    _rb.angularVelocity = Vector3.zero;
    _trailRenderer.Clear();
    _impactVFX.SetActive(false);
}
```

---

### Pattern 6: UI Element Prefab (Field_)

Instantiated UI items in lists/grids — display only.

```
Field_Item (root — RectTransform + Field_Item component)
├── Icon (Image)
├── NameText (TMP_Text)
├── DescriptionText (TMP_Text — optional)
├── PriceText (TMP_Text — optional)
├── Button (Button component — onClick wired by Orchestrator)
│   └── ButtonBg (Image — color changes for state)
└── [optional: Badge GO, Lock overlay GO, QuantityText]
```

**Field_ rules:**
- `SetData(...)` receives all display values — never fetches from singletons
- `SetState(...)` toggles visual states (locked, selected, disabled)
- ZERO logic — no onClick handlers, no singleton access
- Orchestrator wires button listeners externally

---

### Pattern 7: Vehicle / Mount Prefab

```
Vehicle (root — VehicleController + Rigidbody)
├── Body (GO — main visual mesh)
│   └── MeshRenderer / SkinnedMeshRenderer
├── Wheels[] (Transform[] — rotation targets)
├── SeatPoint (Transform — player parents here when mounted)
├── ExitPoint (Transform — player teleports here on dismount)
├── EngineAudioSource (AudioSource — loop, proximity-based)
├── DamageCollider (GO — trigger for taking damage)
└── Headlights (GO — toggle on/off)
```

---

## Inheritance Chains (When Needed)

Use inheritance sparingly — prefer composition. When shared behavior genuinely belongs in a base class:

```
MonoBehaviour
└── BasePhysicsObject           ← "I cache Rigidbody, handle physics reset"
    │   Fields: Rb, mass caching
    │
    ├── BasePickupItem          ← "I can be picked up and dropped"
    │   │   Interfaces: IInteractable
    │   │   Children: WorldModel, ViewModel
    │   │
    │   ├── ToolPickaxe         ← project-specific tools
    │   ├── WeaponSword
    │   └── ThrowableGrenade
    │
    └── BaseProjectile          ← "I fly through space and hit things"
        │   Interfaces: IPoolable
        │
        ├── Bullet
        ├── Arrow
        └── Rocket
```

**Rules for base classes:**
- Max 2-3 levels of inheritance (deeper = refactor to composition)
- Base class goes in `phase-All/3-MonoBehaviours/` if shared across phases
- Base class goes inside `_-Systems/` if owned by one system
- Virtual methods for override points; avoid abstract unless ALL children must implement

---

## Collider Separation Rules

| Scenario | Solution |
|----------|----------|
| Object needs both physics AND trigger | Two child GOs: one with Collider, one with Collider.isTrigger |
| Raycast target differs from physics shape | Physics collider = accurate mesh; Raycast collider = simplified box |
| Placement preview must not self-collide | Disable all colliders during preview mode |
| Multiple hit zones (head vs body damage) | Separate child GOs with tagged colliders |

```csharp
// Multi-zone damage example
// DamageZone (child GO with Collider + DamageZone component)
// ├── Head_DamageZone (2x multiplier)
// ├── Body_DamageZone (1x multiplier)
// └── Limb_DamageZone (0.5x multiplier)
```

---

## Visual State Switching Rules

**Always `SetActive()` — never Destroy/Instantiate for state changes:**

```csharp
// ✅ CORRECT — pre-existing children toggled
_worldModel.SetActive(isDropped);
_viewModel.SetActive(isEquipped);
_highlightEffect.SetActive(isHighlighted);
_damageOverlay.SetActive(healthPercent < 0.25f);

// ❌ WRONG — runtime instantiation for visual state
Instantiate(_damagePrefab, transform);  // Don't do this for state changes
Destroy(_normalVisual);                  // Don't destroy state visuals
```

---

## SerializeField Wiring Conventions

```csharp
[Header("Hierarchy Refs")]
[SerializeField] GameObject _worldModel;
[SerializeField] GameObject _viewModel;
[SerializeField] Transform _spawnPoint;
[SerializeField] Renderer _statusIndicator;

[Header("Config")]
[SerializeField] float _speed = 5f;
[SerializeField] SO_ItemDef _itemDef;
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Deep nesting (4+ levels) | Flatten — most info is data on root, not hierarchy depth |
| Collider on same GO as trigger | Separate GOs — one for physics, one for trigger |
| Destroying children for state changes | SetActive toggle — pre-create all states as children |
| Scale != (1,1,1) on parent | Scale mesh asset, not transform (causes child physics issues) |
| Missing [RequireComponent] on root | Add for Rigidbody, AudioSource, NavMeshAgent where needed |
| Singleton refs inside prefab scripts | Use GameEvents or interface — prefab must be portable |
| Animator on root instead of child | Put Animator on the visual child GO (root handles logic) |
| Public fields for hierarchy refs | Always [SerializeField] private — Orchestrator wires externally |
| Hardcoded child indices | Use [SerializeField] Transform refs, never transform.GetChild(0) |
| Missing layer on collider child | Physics queries need correct layer — set on the collider GO |

---

## Genre Variants

### FPS / Survival (Mining, Horror, Shooter)

Heavy use of **Pickup Item** pattern with ViewModel/WorldModel. Tools parent to ViewModelContainer under Camera. Machines use collider zones + connection points for resource flow.

### Tycoon / Management (btycoon, smarket, dCentre)

Buildings pattern dominates. NPCs have customer-specific children (cart, held items, satisfaction indicator). Grid-snapped placement with ghost preview.

### Colony Sim (rimWrld)

Entities are data-driven with component attachment at runtime. Prefabs are minimal shells — visual layers managed by renderer system, not GO children.

### Physics Fighting (tabs, frkt, stickfgt)

Ragdoll hierarchy with ConfigurableJoint on every limb:
```
Unit (root — UnitController)
├── Hip (Rigidbody + Joint → root)
│   ├── Torso (Rigidbody + Joint → Hip)
│   │   ├── Head (Rigidbody + Joint)
│   │   ├── ArmLeft/ArmRight (Rigidbody + Joint)
│   │   │   └── Hand (weapon mount point)
│   │   └── ...
│   └── LegLeft/LegRight (Rigidbody + Joint)
│       └── Foot (Rigidbody)
└── BalanceForce (GO — force applicator for standing)
```

### 2D Games (stackLand, papersPls, shapeFactr)

Flat hierarchies, SpriteRenderer, no complex collider separation:
```
Card (root — CardController + BoxCollider2D)
├── CardArt (SpriteRenderer — main visual)
├── CardFrame (SpriteRenderer — border/rarity overlay)
├── StackIndicator (GO — default inactive)
└── HighlightGlow (SpriteRenderer — selection)
```

### Tower Defense (throneFall, twFactory)

Combines Building pattern (base + range indicator) with turret rotation:
```
Tower (root — TowerController)
├── Base (mesh — static)
├── Turret (Transform — rotates toward target)
│   └── FirePoint (Transform — projectile spawn)
├── RangeIndicator (GO — decal, toggled during placement)
└── UpgradeVisuals[] (GO[] — progressive tier visuals)
```