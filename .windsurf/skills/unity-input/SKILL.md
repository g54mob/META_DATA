---
name: "unity-input"
description: "Input system architecture — New Input System setup, InputAction asset configuration, action maps (Gameplay/UI/Vehicle), rebinding UI, Rewired/InControl wrapper patterns, input buffering, context-aware input routing, mobile touch variant for Unity rebuild projects"
---

# Unity Input — Input System Architecture

> **Universal pattern — applies to ALL Unity projects in this workspace.**
> This skill defines input architecture: how player actions map to physical inputs, how to support
> rebinding, how to handle context switching (gameplay vs UI vs vehicle), and third-party wrappers.
> 16/29 projects need this. Input is always in phase-All or early phases.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    InputActions Asset                    │
│  ┌────────────┐  ┌──────────┐  ┌───────────────┐      │
│  │  Gameplay  │  │    UI    │  │   Vehicle     │      │
│  │  Move      │  │  Navigate│  │   Steer       │      │
│  │  Look      │  │  Submit  │  │   Accelerate  │      │
│  │  Jump      │  │  Cancel  │  │   Brake       │      │
│  │  Interact  │  │  Point   │  │   Exit        │      │
│  │  Fire      │  │  Click   │  │               │      │
│  │  Inventory │  │          │  │               │      │
│  └────────────┘  └──────────┘  └───────────────┘      │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   INPUT (Static Class)                   │
│  Wraps InputActions. Provides:                          │
│  • Context switching (EnableGameplay/EnableUI)          │
│  • Polling helpers (K, M mouse, GP gamepad)             │
│  • Rebinding persistence                               │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
              GameEvents.RaiseInputAction(...)
              OR direct subscription per system
```

---

## New Input System Setup

### InputActions Asset

Create one `.inputactions` asset per project. Contains all action maps:

```
Assets/Input/[PROJECT]_InputActions.inputactions
├── Gameplay (default enabled)
│   ├── Move [Value, Vector2] — WASD / Left Stick
│   ├── Look [Value, Vector2] — Mouse Delta / Right Stick
│   ├── Jump [Button] — Space / South Button
│   ├── Interact [Button] — E / West Button
│   ├── Fire [Button] — LMB / Right Trigger
│   ├── AltFire [Button] — RMB / Left Trigger
│   ├── Inventory [Button] — Tab / Select
│   ├── Sprint [Button] — Left Shift / Left Stick Press
│   ├── Crouch [Button] — Left Ctrl / Right Stick Press
│   └── Scroll [Value, float] — Mouse Scroll / DPad Y
├── UI (enabled when menus open)
│   ├── Navigate [Value, Vector2]
│   ├── Submit [Button]
│   ├── Cancel [Button]
│   ├── Point [Value, Vector2]
│   └── Click [Button]
└── [Project-specific maps: Vehicle, Building, Dialogue, etc.]
```

### INPUT Static Wrapper Class

```csharp
/// <summary> I wrap the InputActions asset with context switching and polling helpers.
/// Systems read input through me — never directly from InputAction callbacks. </summary>
[AddComponentMenu("[PROJECT]/Core/InputManager")]
public class InputManager : Singleton<InputManager>
{
    private PlayerInputActions _actions;

    // Shorthand accessors
    public static class K  // Keyboard
    {
        public static bool interact => _instance._actions.Gameplay.Interact.WasPressedThisFrame();
        public static bool jump => _instance._actions.Gameplay.Jump.WasPressedThisFrame();
        public static bool sprint => _instance._actions.Gameplay.Sprint.IsPressed();
        public static bool inventory => _instance._actions.Gameplay.Inventory.WasPressedThisFrame();
        public static Vector2 move => _instance._actions.Gameplay.Move.ReadValue<Vector2>();
    }

    public static class M  // Mouse
    {
        public static Vector2 look => _instance._actions.Gameplay.Look.ReadValue<Vector2>();
        public static bool fire => _instance._actions.Gameplay.Fire.WasPressedThisFrame();
        public static bool altFire => _instance._actions.Gameplay.AltFire.WasPressedThisFrame();
        public static float scroll => _instance._actions.Gameplay.Scroll.ReadValue<float>();
    }

    #region Context Switching
    public void EnableGameplay()
    {
        _actions.Gameplay.Enable();
        _actions.UI.Disable();
    }

    public void EnableUI()
    {
        _actions.UI.Enable();
        _actions.Gameplay.Disable();
    }

    public void EnableAll()
    {
        _actions.Gameplay.Enable();
        _actions.UI.Enable();
    }

    public void DisableAll()
    {
        _actions.Gameplay.Disable();
        _actions.UI.Disable();
    }
    #endregion
}
```

### Context Switching via GameEvents

```csharp
// In UIManager or MenuManager — switch maps when menus open/close
private void HandleMenuStateChanged(bool isAnyMenuOpen)
{
    if (isAnyMenuOpen)
        InputManager.Ins.EnableUI();
    else
        InputManager.Ins.EnableGameplay();
}
```

---

## Input Buffering

For responsive feel, buffer recent inputs:

```csharp
private float _jumpBufferTime = 0.15f;
private float _lastJumpPress;

private void Update()
{
    if (K.jump) _lastJumpPress = Time.time;

    if (Time.time - _lastJumpPress < _jumpBufferTime && _isGrounded)
    {
        PerformJump();
        _lastJumpPress = -1f;  // Consume buffer
    }
}
```

---

## Rebinding UI

```csharp
/// <summary> Performs runtime rebinding of an action and saves to PlayerPrefs. </summary>
public void StartRebind(InputAction action, int bindingIndex, TMP_Text displayText)
{
    action.Disable();
    var rebind = action.PerformInteractiveRebinding(bindingIndex)
        .OnComplete(operation =>
        {
            displayText.text = action.GetBindingDisplayString(bindingIndex);
            action.Enable();
            SaveBindings();
            operation.Dispose();
        })
        .OnCancel(operation =>
        {
            action.Enable();
            operation.Dispose();
        })
        .Start();
}

private void SaveBindings()
{
    string json = _actions.asset.SaveBindingOverridesAsJson();
    PlayerPrefs.SetString("InputBindings", json);
}

private void LoadBindings()
{
    string json = PlayerPrefs.GetString("InputBindings", string.Empty);
    if (!string.IsNullOrEmpty(json))
        _actions.asset.LoadBindingOverridesFromJson(json);
}
```

---

## Rewired Variant (megbonk, obradin, throneFall — 4 projects)

```csharp
using Rewired;

public class RewiredInputWrapper : MonoBehaviour
{
    private Player _player;

    private void Awake()
    {
        _player = ReInput.players.GetPlayer(0);
    }

    // Wrap Rewired behind same interface as New Input System
    public bool GetInteract() => _player.GetButtonDown("Interact");
    public bool GetJump() => _player.GetButtonDown("Jump");
    public Vector2 GetMove() => new Vector2(
        _player.GetAxis("MoveHorizontal"),
        _player.GetAxis("MoveVertical"));
    public Vector2 GetLook() => new Vector2(
        _player.GetAxis("LookHorizontal"),
        _player.GetAxis("LookVertical"));
}
```

**Rewired differences:**
- Player-based (supports local multiplayer natively)
- String-based action names (define constants to avoid typos)
- Built-in rebinding UI via Rewired Input Manager
- No InputActions asset — configured in Rewired Editor window

---

## Integration with Architecture

**Where INPUT lives:** `phase-All/0-Core/` or `phase-All/1-Managers/`

**Decoupling rule:** Systems read input via INPUT wrapper or subscribe to GameEvents. Never `Input.GetKey()` directly in gameplay scripts.

```csharp
// ✅ CORRECT — through wrapper
if (InputManager.K.interact) { /* interact */ }

// ✅ CORRECT — via GameEvents (for decoupled systems)
GameEvents.OnInteractPressed += HandleInteract;

// ❌ WRONG — raw Unity input in gameplay script
if (Input.GetKeyDown(KeyCode.E)) { /* interact */ }
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `Input.GetKey()` scattered everywhere | Centralize in INPUT wrapper — one place to change bindings |
| Gameplay input active during menus | Switch action maps: EnableUI() when menu opens |
| No input buffering | Buffer jump/attack for 0.1-0.2s for responsive feel |
| Rebinding not persisted | Save to PlayerPrefs on rebind, load on startup |
| Mouse look in UI mode | Disable Gameplay map look action when cursor visible |
| Hardcoded KeyCode in scripts | Use InputAction references — supports rebinding |
| Forgetting to dispose rebind operation | Always call `.Dispose()` in OnComplete/OnCancel |
| Multiple PlayerInput components | One per player. Singleton InputManager for single-player |