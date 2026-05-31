---
name: "unity-physics"
description: "Physics system patterns — Rigidbody configuration, collision layers, trigger zones, ragdoll setup, joints (ConfigurableJoint/SpringJoint/HingeJoint), physics materials, raycasting patterns, object pooling with physics reset, OverlapSphere detection, force application, physics-based movement for Unity rebuild projects"
---

# Unity Physics — Physics System Patterns

> **Universal pattern — applies to ALL Unity projects in this workspace.**
> This skill defines physics architecture: how to configure Rigidbodies, collision layers,
> joints for ragdolls/connections, raycasting for interaction/damage, and physics-based gameplay.
> 15/29 projects have significant physics (ragdoll, joints, stress simulation, grab mechanics).
> Examples use `[PROJECT]` placeholders — substitute with your project's equivalents.

---

## Architecture Overview

```
┌────────────────── Physics Configuration ──────────────────┐
│                                                           │
│  Layer Matrix (Edit → Project Settings → Physics)         │
│  ┌──────────────────────────────────────────┐            │
│  │ Player × Player = OFF (no self-collide)  │            │
│  │ Projectile × Projectile = OFF            │            │
│  │ Trigger × Default = ON (detection)       │            │
│  │ Ghost × Everything = OFF (no collide)    │            │
│  └──────────────────────────────────────────┘            │
│                                                           │
│  Fixed Timestep: 0.02 (50Hz — default)                   │
│  Solver Iterations: 6 (default), 12+ for ragdolls       │
│  Gravity: (0, -9.81, 0) standard                        │
└───────────────────────────────────────────────────────────┘
```

---

## Rigidbody Configuration Patterns

### Standard Dynamic Object (Items, Props)

```csharp
// Default for pickups, physics props, throwables
Rigidbody:
  Mass: 1-10 (scale with visual size)
  Drag: 0.5 (prevents sliding forever)
  Angular Drag: 0.5
  Use Gravity: true
  Is Kinematic: false
  Interpolation: Interpolate (smooth rendering)
  Collision Detection: Discrete (or Continuous for fast objects)
```

### Kinematic Toggle Pattern (Equip/Drop)

```csharp
// Object picked up → disable physics
public void OnPickup()
{
    _rb.isKinematic = true;
    _rb.interpolation = RigidbodyInterpolation.None;
}

// Object dropped → re-enable physics
public void OnDrop(Vector3 throwForce)
{
    _rb.isKinematic = false;
    _rb.interpolation = RigidbodyInterpolation.Interpolate;
    _rb.linearVelocity = Vector3.zero;
    _rb.angularVelocity = Vector3.zero;
    _rb.AddForce(throwForce, ForceMode.VelocityChange);
}
```

### Pool Reset Pattern

```csharp
public void ResetPhysics()
{
    _rb.linearVelocity = Vector3.zero;
    _rb.angularVelocity = Vector3.zero;
    _rb.linearDamping = DEFAULT_DRAG;
    _rb.angularDamping = DEFAULT_ANGULAR_DRAG;
    _rb.isKinematic = false;
    transform.rotation = Quaternion.identity;
}
```

---

## Raycasting Patterns

### Interaction Raycast (Single Hit)

```csharp
[SerializeField] float _interactRange = 3f;
[SerializeField] LayerMask _interactLayers;

private void CheckInteraction()
{
    if (Physics.Raycast(_cam.position, _cam.forward, out RaycastHit hit,
        _interactRange, _interactLayers))
    {
        if (hit.collider.TryGetComponent<IInteractable>(out var interactable))
        {
            _currentTarget = interactable;
            interactable.OnHoverEnter();
        }
    }
    else if (_currentTarget != null)
    {
        _currentTarget.OnHoverExit();
        _currentTarget = null;
    }
}
```

### Area Detection (OverlapSphere)

```csharp
[SerializeField] float _detectionRadius = 5f;
[SerializeField] LayerMask _targetLayers;
private Collider[] _hitBuffer = new Collider[32];

private void DetectNearby()
{
    int count = Physics.OverlapSphereNonAlloc(
        transform.position, _detectionRadius, _hitBuffer, _targetLayers);

    for (int i = 0; i < count; i++)
    {
        if (_hitBuffer[i].TryGetComponent<ITarget>(out var target))
            ProcessTarget(target);
    }
}
```

**Performance rules:**
- Use `NonAlloc` variants — zero GC allocation
- Pre-allocate hit buffers (`new Collider[32]`)
- Use `sqrMagnitude` instead of `Vector3.Distance` for comparisons
- LayerMask always — never raycast against all layers

### SphereCast (Fat Raycast)

```csharp
// More forgiving than thin raycast — good for grab/aim assist
if (Physics.SphereCast(_origin, 0.2f, _direction, out hit, _range, _layers))
{
    // Hit something within 0.2m radius of ray
}
```

---

## Joint Patterns

### SpringJoint — Grab/Carry System

```csharp
/// <summary> Attaches grabbed object via SpringJoint for physics-based carry. </summary>
public void GrabObject(Rigidbody targetRb)
{
    _springJoint = gameObject.AddComponent<SpringJoint>();
    _springJoint.connectedBody = targetRb;
    _springJoint.spring = 500f;
    _springJoint.damper = 50f;
    _springJoint.maxDistance = 0.1f;
    _springJoint.autoConfigureConnectedAnchor = false;
    _springJoint.connectedAnchor = Vector3.zero;

    targetRb.linearDamping = 10f;  // Reduce wobble
    targetRb.angularDamping = 10f;
}

public void ReleaseObject()
{
    if (_springJoint != null)
    {
        _springJoint.connectedBody.linearDamping = DEFAULT_DRAG;
        _springJoint.connectedBody.angularDamping = DEFAULT_ANGULAR_DRAG;
        Destroy(_springJoint);
    }
}
```

### ConfigurableJoint — Ragdoll Limbs

```csharp
// Ragdoll limb setup (automated or manual)
ConfigurableJoint joint = limb.AddComponent<ConfigurableJoint>();
joint.connectedBody = parentLimb;
joint.xMotion = ConfigurableJointMotion.Locked;
joint.yMotion = ConfigurableJointMotion.Locked;
joint.zMotion = ConfigurableJointMotion.Locked;
joint.angularXMotion = ConfigurableJointMotion.Limited;
joint.angularYMotion = ConfigurableJointMotion.Limited;
joint.angularZMotion = ConfigurableJointMotion.Limited;

// Rotation limits
SoftJointLimit limit = new SoftJointLimit { limit = 45f };
joint.lowAngularXLimit = new SoftJointLimit { limit = -45f };
joint.highAngularXLimit = limit;
joint.angularYLimit = limit;
joint.angularZLimit = limit;
```

### HingeJoint — Doors/Gates

```csharp
HingeJoint hinge = door.AddComponent<HingeJoint>();
hinge.axis = Vector3.up;  // Rotate around Y axis
hinge.useLimits = true;
hinge.limits = new JointLimits { min = 0f, max = 90f };
hinge.useSpring = true;
hinge.spring = new JointSpring { spring = 50f, damper = 5f, targetPosition = 0f };
```

---

## Ragdoll Pattern (tabs, frkt, stickfgt)

### Setup

```
Hip (root Rigidbody — heaviest mass)
├── Torso (ConfigurableJoint → Hip)
│   ├── Head (ConfigurableJoint → Torso, limited rotation)
│   ├── UpperArmL → LowerArmL → HandL
│   └── UpperArmR → LowerArmR → HandR
├── UpperLegL → LowerLegL → FootL
└── UpperLegR → LowerLegR → FootR
```

### Active Ragdoll (Standing)

```csharp
// Apply standing force to Hip — keeps ragdoll upright
private void ApplyBalanceForce()
{
    Vector3 upForce = Vector3.up * _balanceStrength;
    _hipRb.AddForce(upForce - _hipRb.linearVelocity * _damping, ForceMode.Acceleration);

    // Torque to keep torso upright
    Quaternion targetRot = Quaternion.FromToRotation(_torso.up, Vector3.up);
    targetRot.ToAngleAxis(out float angle, out Vector3 axis);
    _torsoRb.AddTorque(axis * angle * _torqueStrength, ForceMode.Acceleration);
}
```

### Ragdoll Toggle (Animated ↔ Physics)

```csharp
public void EnableRagdoll(bool enable)
{
    _animator.enabled = !enable;
    foreach (var rb in _limbRigidbodies)
    {
        rb.isKinematic = !enable;
        rb.detectCollisions = enable;
    }
}
```

---

## Trigger Zone Patterns

### Proximity Detection

```csharp
[RequireComponent(typeof(Collider))]
public class ProximityTrigger : MonoBehaviour
{
    [SerializeField] LayerMask _detectLayers;
    private HashSet<GameObject> _inRange = new();

    private void OnTriggerEnter(Collider other)
    {
        if (((1 << other.gameObject.layer) & _detectLayers) != 0)
            _inRange.Add(other.gameObject);
    }

    private void OnTriggerExit(Collider other)
    {
        _inRange.Remove(other.gameObject);
    }

    public bool IsAnyInRange() => _inRange.Count > 0;
    public IReadOnlyCollection<GameObject> GetInRange() => _inRange;
}
```

### Damage Zone

```csharp
private void OnTriggerEnter(Collider other)
{
    if (other.TryGetComponent<IDamageable>(out var damageable))
    {
        damageable.TakeDamage(_damage, transform.position);
    }
}
```

---

## Physics Materials

| Material | Dynamic Friction | Static Friction | Bounciness | Use Case |
|----------|-----------------|-----------------|------------|----------|
| `PM_Default` | 0.4 | 0.4 | 0.0 | Standard objects |
| `PM_Bouncy` | 0.3 | 0.3 | 0.8 | Balls, rubber |
| `PM_Ice` | 0.02 | 0.02 | 0.0 | Slippery surfaces |
| `PM_Sticky` | 1.0 | 1.0 | 0.0 | Velcro, glue traps |
| `PM_Metal` | 0.3 | 0.3 | 0.1 | Metal-on-metal |

---

## Force Application Patterns

```csharp
// Instant velocity change (throw, launch)
_rb.AddForce(direction * power, ForceMode.VelocityChange);

// Continuous force (engines, wind)
_rb.AddForce(direction * power, ForceMode.Force);  // Mass-dependent

// Explosion (radial)
_rb.AddExplosionForce(power, explosionCenter, radius, upwardsModifier);

// Torque (spin)
_rb.AddTorque(axis * torqueAmount, ForceMode.VelocityChange);
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Moving Rigidbody via transform.position | Use `rb.MovePosition()` or `AddForce()` — transform breaks physics |
| Raycast without LayerMask | Always specify layers — avoids hitting unintended objects |
| Physics in Update() | Use FixedUpdate() for forces/movement, Update() for input reading |
| Allocating arrays per-frame | Use `NonAlloc` + pre-allocated buffers |
| Missing Interpolation on player | Set Interpolate on player/camera Rigidbody for smooth visuals |
| Collider on same GO as trigger | Separate GOs — physics collider child + trigger collider child |
| Ragdoll with Animator enabled | Disable Animator when ragdoll active — they fight each other |
| Joint without connected body | Joints need a connectedBody OR connect to world (anchor position) |
| Scale != 1 on rigidbody parent | Physics behaves unpredictably with scaled parents |
| Not resetting velocity on pool return | Zero out linear + angular velocity before deactivating |