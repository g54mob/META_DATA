---
name: "unity-camera"
description: "Camera system architecture — Cinemachine virtual cameras, FreeLook/3rdPersonAim, camera state transitions, input-driven orbital camera, follow/look-at targets, screen shake, FOV transitions, perspective switching for Unity rebuild projects"
---

# Unity Camera — Camera System Architecture

> **Universal pattern — applies to ALL Unity projects with dynamic cameras.**
> This skill defines the camera architecture: Cinemachine virtual cameras, camera state transitions,
> input-driven control, and common camera patterns.
> CameraSystem is L0 portable — zero `_-Systems/` dependencies.
> These patterns work for any Unity game with camera management (5/29 projects use Cinemachine).

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                      CameraManager                               │
│  Singleton — manages active camera state                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Cinemachine Brain (on Main Camera)                          │  │
│  │ Blends between Virtual Cameras based on Priority            │  │
│  └─────────────────────────────────────────────────────────────┘  │
│           │                                                      │
│  ┌────────┼─────────────────────────────────────────────┐        │
│  │  VCam  │  VCam       VCam          VCam              │        │
│  │  Follow│  FreeLook   Aim           Cutscene          │        │
│  │  P:10  │  P:10       P:15          P:20              │        │
│  └────────┴─────────────────────────────────────────────┘        │
│  Active = highest Priority. Enable/disable to switch.            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Core Patterns

### Cinemachine Setup (5 Projects)

```csharp
/// <summary> I manage camera states by enabling/disabling Cinemachine virtual cameras.
/// Higher priority = active camera. Blending handled automatically by CinemachineBrain. </summary>
[AddComponentMenu("[PROJECT]/Manager/CameraManager")]
public class CameraManager : Singleton<CameraManager>
{
    #region Inspector Fields
    [SerializeField] CinemachineVirtualCamera _followCam;
    [SerializeField] CinemachineFreeLook _freeLookCam;
    [SerializeField] CinemachineVirtualCamera _aimCam;
    #endregion
    #region public API
    public void SetFollowCamera()
    {
        _followCam.Priority = 15;
        _freeLookCam.Priority = 10;
        _aimCam.Priority = 10;
    }

    public void SetAimCamera()
    {
        _followCam.Priority = 10;
        _freeLookCam.Priority = 10;
        _aimCam.Priority = 15;
    }

    public void SetFreeLookCamera()
    {
        _followCam.Priority = 10;
        _freeLookCam.Priority = 15;
        _aimCam.Priority = 10;
    }
    #endregion
}
```

### Non-Cinemachine Camera (Manual Control)

```csharp
/// <summary> I handle FPS camera look via mouse input. </summary>
[AddComponentMenu("[PROJECT]/Player/PlayerCamera")]
public class PlayerCamera : MonoBehaviour
{
    #region Inspector Fields
    [SerializeField] float _sensitivity = 2f;
    [SerializeField] float _maxPitch = 80f;
    #endregion
    #region private API
    float _yaw, _pitch;
    #endregion
    #region Unity Life Cycle
    void Update()
    {
        if (Singleton<UIManager>.Ins.isAnyMenuOpen) return;

        _yaw += Input.GetAxis("Mouse X") * _sensitivity;
        _pitch -= Input.GetAxis("Mouse Y") * _sensitivity;
        _pitch = Mathf.Clamp(_pitch, -_maxPitch, _maxPitch);

        transform.localRotation = Quaternion.Euler(_pitch, _yaw, 0f);
    }
    #endregion
}
```

### Camera Shake

```csharp
/// <summary> Screen shake via Cinemachine Impulse or manual coroutine. </summary>
public void Shake(float intensity = 1f, float duration = 0.3f)
{
    // Cinemachine:
    _impulseSource.GenerateImpulse(intensity);

    // Manual:
    StartCoroutine(ShakeCoroutine(intensity, duration));
}

IEnumerator ShakeCoroutine(float intensity, float duration)
{
    float elapsed = 0f;
    Vector3 originalPos = transform.localPosition;
    while (elapsed < duration)
    {
        float x = Random.Range(-1f, 1f) * intensity;
        float y = Random.Range(-1f, 1f) * intensity;
        transform.localPosition = originalPos + new Vector3(x, y, 0f);
        elapsed += Time.deltaTime;
        intensity = Mathf.Lerp(intensity, 0f, elapsed / duration);
        yield return null;
    }
    transform.localPosition = originalPos;
}
```

### FOV Transitions

```csharp
/// <summary> Smooth FOV change for sprint, aim, etc. </summary>
public void SetTargetFOV(float targetFOV, float duration = 0.3f)
{
    StartCoroutine(LerpFOV(targetFOV, duration));
}

IEnumerator LerpFOV(float target, float duration)
{
    float start = _camera.fieldOfView;
    float elapsed = 0f;
    while (elapsed < duration)
    {
        elapsed += Time.deltaTime;
        _camera.fieldOfView = Mathf.Lerp(start, target, elapsed / duration);
        yield return null;
    }
    _camera.fieldOfView = target;
}
```

---

## GameEvents Integration

```csharp
public static partial class GameEvents
{
    // when camera mode changes >>
    public static event Action<CameraMode> OnCameraModeChanged;
    public static void RaiseCameraModeChanged(CameraMode mode) { ... }
    // << when camera mode changes
}
```

---

## Camera State Machine

For games with multiple camera modes (FPS ↔ ADS ↔ Vehicle ↔ Cinematic), use a dedicated camera FSM:

```csharp
public enum CameraMode { FPS, ADS, Vehicle, Cinematic, FreeLook }

/// <summary> I manage camera state transitions and drive the active VCam. </summary>
public class CameraStateMachine : MonoBehaviour
{
    [SerializeField] CinemachineVirtualCamera _fpsVCam;
    [SerializeField] CinemachineVirtualCamera _adsVCam;
    [SerializeField] CinemachineVirtualCamera _vehicleVCam;
    [SerializeField] CinemachineVirtualCamera _cinematicVCam;

    CameraMode _current = CameraMode.FPS;

    void OnEnable() => GameEvents.OnCameraModeChanged += HandleModeChange;
    void OnDisable() => GameEvents.OnCameraModeChanged -= HandleModeChange;

    void HandleModeChange(CameraMode newMode)
    {
        SetAllPriority(0);
        GetVCam(newMode).Priority = 10; // → Cinemachine auto-blends
        _current = newMode;
    }

    CinemachineVirtualCamera GetVCam(CameraMode mode) => mode switch
    {
        CameraMode.FPS => _fpsVCam,
        CameraMode.ADS => _adsVCam,
        CameraMode.Vehicle => _vehicleVCam,
        CameraMode.Cinematic => _cinematicVCam,
        _ => _fpsVCam
    };

    void SetAllPriority(int p)
    {
        _fpsVCam.Priority = p;
        _adsVCam.Priority = p;
        _vehicleVCam.Priority = p;
        _cinematicVCam.Priority = p;
    }
}
```

---

## Cinemachine FreeLook Orbital Setup

For third-person orbital cameras (btycoon, schedule-1):

```csharp
/// <summary> I configure a Cinemachine FreeLook for orbital 3rd-person view. </summary>
[AddComponentMenu("Camera/FreeLook Setup")]
public class FreeLookSetup : MonoBehaviour
{
    [SerializeField] CinemachineFreeLook _freeLook;
    [SerializeField] Transform _followTarget;
    [SerializeField] Transform _lookAtTarget;

    #region Inspector Fields
    [SerializeField] float _topRigHeight = 4f;
    [SerializeField] float _topRigRadius = 3f;
    [SerializeField] float _midRigHeight = 2f;
    [SerializeField] float _midRigRadius = 5f;
    [SerializeField] float _botRigHeight = 0.5f;
    [SerializeField] float _botRigRadius = 4f;
    #endregion

    void Awake()
    {
        _freeLook.Follow = _followTarget;
        _freeLook.LookAt = _lookAtTarget;

        // → configure 3 orbits
        _freeLook.m_Orbits[0] = new CinemachineFreeLook.Orbit(_topRigHeight, _topRigRadius);
        _freeLook.m_Orbits[1] = new CinemachineFreeLook.Orbit(_midRigHeight, _midRigRadius);
        _freeLook.m_Orbits[2] = new CinemachineFreeLook.Orbit(_botRigHeight, _botRigRadius);
    }
}
```

---

## Camera Collision Handling

Prevent camera from clipping through walls using SphereCast:

```csharp
/// <summary> I pull the camera forward when it would clip through geometry. </summary>
void LateUpdate()
{
    Vector3 desiredPos = _followTarget.position + _offset;
    Vector3 dir = desiredPos - _followTarget.position;
    float dist = dir.magnitude;

    if (Physics.SphereCast(_followTarget.position, _collisionRadius, dir.normalized, out RaycastHit hit, dist, _collisionMask))
    {
        // → camera pulled to hit point minus small buffer
        transform.position = hit.point - dir.normalized * _collisionRadius;
    }
    else
    {
        transform.position = desiredPos;
    }
}
```

---

## Genre Variants

### FPS (minemgl, schedule-1)

Raw Transform rotation driven by mouse input. No Cinemachine needed — manual control is simpler and more responsive for first-person. Camera is parented to player, handles pitch independently from yaw.

- Yaw rotates player Transform (horizontal). Pitch rotates camera Transform only (vertical)
- Pitch clamped to [-90, 90] to prevent over-rotation
- ViewModelContainer follows camera pitch for tool/weapon alignment
- No interpolation — instant response to input

```csharp
/// <summary> I handle FPS mouse-look with separate yaw (body) and pitch (camera). </summary>
public class FPSCamera : MonoBehaviour
{
    [SerializeField] Transform _cameraTransform;
    [SerializeField] float _sensitivity = 2f;
    float _pitch;

    void Update()
    {
        float mouseX = Input.GetAxis("Mouse X") * _sensitivity;
        float mouseY = Input.GetAxis("Mouse Y") * _sensitivity;

        transform.Rotate(Vector3.up, mouseX); // → yaw on body
        _pitch = Mathf.Clamp(_pitch - mouseY, -90f, 90f);
        _cameraTransform.localEulerAngles = new Vector3(_pitch, 0f, 0f); // → pitch on camera
    }
}
```

### TPS / Orbital (btycoon, tabs)

Cinemachine FreeLook with 3-rig orbital setup. Camera orbits around player with collision avoidance. Input drives orbit angle and height — player character visible at all times.

- Cinemachine FreeLook with Top/Middle/Bottom rigs
- CinemachineCollider extension prevents clipping
- Aim reticle at screen center, character offset to side
- Transition to ADS (Aim Down Sights) by switching to a dedicated VCam

### 2D (papersPls, stackLand, shapeFactr)

Orthographic camera with no depth. Zoom via orthographic size adjustment. No rotation needed — position-only tracking. Simpler than 3D cameras.

- Camera is orthographic, `transform.rotation` = identity (never rotates)
- Zoom = adjusting `Camera.orthographicSize` (clamped min/max)
- Follow target via `Vector3.Lerp` on position (z stays fixed)
- Bounds clamping prevents camera from showing outside world edges

```csharp
void LateUpdate()
{
    float targetSize = Mathf.Clamp(_baseSize - _scrollInput * _zoomSpeed, _minSize, _maxSize);
    _cam.orthographicSize = Mathf.Lerp(_cam.orthographicSize, targetSize, Time.deltaTime * _zoomSmooth);

    Vector3 targetPos = _followTarget.position;
    targetPos.z = transform.position.z; // → keep camera z fixed
    transform.position = Vector3.Lerp(transform.position, targetPos, Time.deltaTime * _followSpeed);
}
```

### Horror (wrngfloor, contentWarn)

FOV manipulation for tension, head-bob for immersion, found-footage shake for dread. Camera is a storytelling tool — not just a viewport.

- FOV pulses (narrow on scare, wide on chase) via `DOTween.To`
- Head-bob via sine wave on camera local position (amplitude increases when sprinting)
- Persistent low-frequency shake (handheld feel) layered with burst shake on events
- Night-vision / flashlight post-processing toggle for horror visibility control

---

## Pitfalls

- ❌ **Camera rotation in FixedUpdate** — causes visible jitter because camera updates at lower rate than rendering
  → ✅ Use Update() or LateUpdate() for camera — matches render frame rate

- ❌ **Cinemachine VCams all same priority** — conflicts cause camera flickering/fighting
  → ✅ Use different priorities, enable/disable to switch active camera

- ❌ **Camera code inside PlayerMovement** — movement + look in same class, can't swap camera systems
  → ✅ Separate `PlayerCamera.cs` from `PlayerMovement.cs` — independent systems

- ❌ **Hard-coded sensitivity** — one value suits no one, accessibility issue
  → ✅ `[SerializeField]` + save to PlayerPrefs for settings menu control

- ❌ **No cursor lock during gameplay** — cursor visible and drifts off window in FPS
  → ✅ Lock in gameplay, unlock in menus via `GameEvents.OnMenuStateChanged`

- ❌ **Shake without decay** — screen shake never stops, nauseating
  → ✅ Lerp shake intensity to 0 over duration (exponential decay feels best)

- ❌ **Camera clipping through walls** — camera shows inside/behind geometry
  → ✅ Use Cinemachine Collider extension or SphereCast to pull camera forward