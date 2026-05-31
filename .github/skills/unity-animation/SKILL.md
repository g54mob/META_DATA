---
name: 'unity-animation'
description: 'Animation system patterns — AnimatorControllers, code-driven rotation, shader-driven UV scrolling, coroutine motion, AnimParamType enum convention, animation-to-gameplay sync, character/enemy/UI/environmental categories, spine-unity variant, DOTween variant for Unity rebuild projects'
---

# Unity Animation — Motion System Patterns

> **Universal pattern — applies to ALL Unity projects in this workspace.**
> This skill defines the animation architecture: AnimatorControllers for character/item animation,
> code-driven rotation for machinery, shader-driven scrolling for surfaces, coroutine motion for mechanical parts.
> The `AnimParamType` enum is MANDATORY — never use raw strings for animator parameters.
> Documented in `phase-All/7-3D/ANIM.md` which grows per phase.
> Examples use `[PROJECT]` placeholders — substitute with your project's equivalents.

---

## Animation Strategy Overview

| Category | Motion Method | When to Use |
|----------|--------------|-------------|
| Character locomotion | AnimatorController + BlendTree | Walk/run/idle blending based on speed |
| Character actions | AnimatorController + clips | Attack, interact, emote — keyframed |
| Equipment/tools | AnimatorController + clips | Swing, use, reload — synced to gameplay |
| Machine rotators | Code-driven (`Transform.Rotate`) | Continuous, speed-variable, no clip needed |
| Scrolling surfaces | Shader-driven (UV scroll via `_Time`) | Zero CPU cost, purely visual |
| Mechanical arms/gates | Coroutine-driven (`SmoothStep`) | Timed ping-pong with pauses |
| UI elements | DOTween / coroutine | Scale punch, fade, slide transitions |
| Camera | Code-driven (Perlin + bob) | Procedural, speed-responsive |

---

## AnimParamType Enum (MANDATORY)

**NEVER use raw strings for animator parameters.** Always use the enum.

```csharp
/// <summary> Animator parameter names as enum — never use raw strings.
/// Usage: _animator.Play(AnimParamType.attack1.ToString())
/// Usage: _animator.SetBool(AnimParamType.isRunning.ToString(), true) </summary>
public enum AnimParamType
{
    // Character locomotion
    isWalking,
    isRunning,
    speed,

    // Character actions
    attack1,
    interact,
    die,

    // State flags
    isGrounded,
    isFalling,
}
```

**Location:** `phase-{X}/2-Data/Enums/GlobalEnums{X}.cs` (grows per phase)

**Usage:**
```csharp
// ✅ CORRECT — enum guarantees no typos
_animator.SetBool(AnimParamType.isRunning.ToString(), _isRunning);
_animator.Play(AnimParamType.attack1.ToString(), -1, 0f);

// ❌ WRONG — raw string, typo-prone, no compile-time check
_animator.SetBool("IsRunning", _isRunning);
_animator.Play("Attack1", -1, 0f);
```

---

## Character Animation (AnimatorController)

### Architecture

Each animated character/item has:
1. **AnimatorController** asset — state machine with states + transitions
2. **Animation clip(s)** — keyframed motion
3. **Animator component** — on the visual model GO (child of root)

### Locomotion BlendTree Pattern

```
  ┌────────────────────────────────────────────────┐
  │            Locomotion (BlendTree)               │
  │  Parameter: speed (float 0→1)                  │
  │                                                │
  │  0.0 ─── Idle                                  │
  │  0.5 ─── Walk                                  │
  │  1.0 ─── Run                                   │
  └────────────────────────────────────────────────┘
          │
          │ Trigger: attack1
          ▼
  ┌──────────────┐
  │   Attack1    │  HasExitTime=true, ExitTime=1.0
  │   0.3s clip  │  TransDuration=0.1
  └──────┬───────┘
         │ (auto-return)
         ▼
  [back to Locomotion]
```

### Action Clip Pattern

```
  ┌──────────────┐    .Play("attack1")     ┌──────────────┐
  │     Idle     │ ──────────────────────► │   Attack1    │
  │   (default)  │ ◄────────────────────── │   (action)   │
  │   no clip    │    HasExitTime=true     │  0.3s clip   │
  └──────────────┘    ExitTime=1.0         └──────────────┘
                      TransDuration=0.1
```

**Setup Steps:**
1. Create → Animator Controller → name `{Character}_Controller`
2. Create BlendTree or states as needed
3. Transitions back to idle: HasExitTime=true, ExitTime=1.0, TransDuration=0.1
4. Action triggers via `.Play()` or `.SetTrigger()` from code

---

## Animation-to-Gameplay Sync Pattern

**Critical:** Animation plays **immediately**, gameplay action is **delayed** to sync with visual.

```csharp
public void PerformAttack()
{
    // 1. Play animation IMMEDIATELY (visual feedback first)
    _animator.Play(AnimParamType.attack1.ToString(), -1, 0f);

    // 2. Play sound IMMEDIATELY (audio feedback)
    Singleton<SoundManager>.Ins.PlaySoundAtLocation(_attackSound, transform.position);

    // 3. DELAY the actual gameplay effect to sync with animation peak
    StartCoroutine(DelayedAttack(0.2f));
}

private IEnumerator DelayedAttack(float delaySeconds)
{
    yield return new WaitForSeconds(delaySeconds);
    // → NOW do the actual hit detection (synced with visual peak)
    if (Physics.Raycast(_cam.position, _cam.forward, out var hit, _range, _hitLayers))
    {
        hit.collider.GetComponent<IDamageable>()?.TakeDamage(_damage, hit.point);
    }
}
```

**Timing rule:** Delay = time to animation peak (usually 50-70% of clip duration).

---

## Code-Driven Rotation (Machines/Props)

```csharp
// Continuous rotation — any axis, speed-variable
[SerializeField] Transform _rotator;
[SerializeField] float _rotationSpeed = 180f;

private void Update()
{
    if (!_isActive) return;
    _rotator.Rotate(Vector3.right * _rotationSpeed * Time.deltaTime);
}
```

**When to use:** Speed changes dynamically, no benefit from keyframes, continuous motion.

**Common applications:** Drill bits, fans, windmills, gears, radar dishes, loading spinners.

---

## Shader-Driven Motion (Scrolling Surfaces)

### UV Scroll Shader Graph

```
[Time node] → Multiply (_ScrollSpeed) → Vector2 (0, result)
                                              ↓
[UV node] ──────────────────────────► Add (UV + offset)
                                          ↓
[_MainTex] ──────────────────────► Sample Texture 2D
                                          ↓
                                  Multiply (_Tint)
                                          ↓
                              Fragment → Base Color
```

**Properties:** `_MainTex` (Texture2D), `_ScrollSpeed` (float), `_Tint` (Color).

**Use cases:** Conveyor belts, water surfaces, lava flows, scrolling backgrounds, treadmills.

**Runtime speed control:**
```csharp
_renderer.material.SetFloat("_ScrollSpeed", _currentSpeed);
```

---

## Coroutine-Driven Motion (Mechanical Parts)

### Ping-Pong Pattern

```csharp
/// <summary> Swings a transform between two angles with easing and pause. </summary>
private IEnumerator SwingLoop()
{
    while (true)
    {
        yield return SwingTo(_maxAngle);
        yield return new WaitForSeconds(_pauseTime);
        yield return SwingTo(_minAngle);
        yield return new WaitForSeconds(_pauseTime);
    }
}

private IEnumerator SwingTo(float targetAngle)
{
    float startAngle = transform.localEulerAngles.y;
    float elapsed = 0f;
    while (elapsed < _swingDuration)
    {
        elapsed += Time.deltaTime;
        float t = elapsed / _swingDuration;
        float angle = Mathf.SmoothStep(startAngle, targetAngle, t);
        transform.localEulerAngles = new Vector3(0f, angle, 0f);
        yield return null;
    }
}
```

**Use cases:** Splitter arms, gates, doors, pendulums, sorting mechanisms.

---

## Camera Animation (Procedural)

### Screen Shake — Perlin Noise + Trauma

```csharp
[AddComponentMenu("[PROJECT]/Camera/CameraShaker")]
public class CameraShaker : MonoBehaviour
{
    [SerializeField] float _shakeAmplitude = 0.5f;
    [SerializeField] float _shakeFrequency = 1f;
    private float _traumaAmount;

    public void AddTrauma(float amount) => _traumaAmount = Mathf.Clamp01(_traumaAmount + amount);

    private void Update()
    {
        float traumaShake = _traumaAmount * _traumaAmount;
        float punchX = (Mathf.PerlinNoise(Time.time * 20f, 0f) - 0.5f) * traumaShake * 5f;
        float punchY = (Mathf.PerlinNoise(0f, Time.time * 20f) - 0.5f) * traumaShake * 5f;
        transform.localRotation = Quaternion.Euler(punchX, punchY, 0f);
        _traumaAmount = Mathf.Max(0f, _traumaAmount - Time.deltaTime * 2f);
    }
}
```

### Camera Bobbing (Movement-Linked)

```csharp
if (_isMoving)
{
    _bobTimer += Time.deltaTime * bobSpeed;
    float bobOffset = Mathf.Sin(_bobTimer) * bobAmount;
    _cameraTransform.localPosition = _defaultPos + Vector3.up * bobOffset;
}
else
{
    _bobTimer = 0f;
    _cameraTransform.localPosition = Vector3.Lerp(
        _cameraTransform.localPosition, _defaultPos, Time.deltaTime * 5f);
}
```

---

## Animation Events (Clip Callbacks)

| Approach | Use When |
|----------|----------|
| **Coroutine delay** (primary) | Timing predictable, clip short, single effect point |
| **Animation Event** | Multiple effect points, or timing must stay synced with variable speed |

```csharp
/// <summary> Receives animation clip events and routes to gameplay. </summary>
[AddComponentMenu("[PROJECT]/Animation/AnimEventReceiver")]
public class AnimEventReceiver : MonoBehaviour
{
    public event System.Action OnHitFrame;
    public event System.Action OnFootstep;

    // Called by animation clip keyframe event
    public void AnimEvent_HitFrame() => OnHitFrame?.Invoke();
    public void AnimEvent_Footstep() => OnFootstep?.Invoke();
}
```

---

## DOTween Variant (8+ Projects)

For projects using DOTween (minemgl, btycoon, smarket, noimnot, shapeFactr, stackLand, etc.):

```csharp
using DG.Tweening;

// UI punch scale
transform.DOPunchScale(Vector3.one * 0.1f, 0.2f, 5, 0.5f);

// Smooth rotation (replacing coroutine)
transform.DOLocalRotate(targetAngles, 0.3f).SetEase(Ease.OutQuad);

// Sequence for complex multi-step
DOTween.Sequence()
    .Append(transform.DOScale(1.2f, 0.1f))
    .Append(transform.DOScale(1f, 0.15f))
    .AppendCallback(() => OnAnimComplete());
```

**When to prefer DOTween over coroutines:** Easing curves needed, sequencing complex multi-step animations, UI tweening, value animations (color, float).

---

## Spine-Unity Variant (btycoon, shapeFactr)

For projects using spine-unity 2D skeletal animation:

```csharp
using Spine.Unity;

[SerializeField] SkeletonAnimation _skeletonAnimation;

// Set animation
_skeletonAnimation.AnimationState.SetAnimation(0, "walk", true);  // loop
_skeletonAnimation.AnimationState.SetAnimation(0, "attack", false);  // once

// Queue animation after current finishes
_skeletonAnimation.AnimationState.AddAnimation(0, "idle", true, 0f);

// Flip direction
_skeletonAnimation.skeleton.ScaleX = _facingRight ? 1f : -1f;
```

---

## ANIM.md Format (in `phase-All/7-3D/`)

```markdown
# ANIM — All Animations & AnimatorControllers

## AnimParamType Enum (Current State)
[List all enum values across all phases]

## Phase X — [Name]

### [Character]_Controller
[State machine diagram]
[Clip properties: duration, target, keyframes]

### [Machine/Prop] — Code-Driven
[Rotation axis, speed formula, when active]

### [Object] — Coroutine/DOTween
[Motion description, timing, easing]
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Raw strings for animator params | Use `AnimParamType` enum — compile-time safety |
| Gameplay effect without animation delay | Play anim first, delay effect to sync with visual peak |
| Animator on root GO | Put Animator on visual child — root handles logic/physics |
| Speed via animation clip editing | Use `Animator.speed` or `TimeScale` param — don't edit clips |
| Coroutine for continuous rotation | Use Update() with `Transform.Rotate` — coroutines are for timed |
| DOTween without kill on disable | Always `transform.DOKill()` in OnDisable() to prevent leaks |
| Animation controller per enemy variant | Share controller, vary parameters (speed, scale) |
| Missing HasExitTime on return transitions | Action clips won't return to idle without HasExitTime=true |
| Instantiating particles per hit | Pool particles, or use animation event → ParticleSystem.Play() |
| Updating animator every frame when idle | Use `Animator.enabled = false` when character fully idle |