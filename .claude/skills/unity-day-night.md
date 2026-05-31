---
name: "unity-day-night"
description: "Day/Night cycle architecture — TimeOfDay controller, lighting transitions via Gradient/AnimationCurve, directional light rotation, skybox/fog/ambient updates, gameplay hooks via GameEvents, genre variants (outdoor sun-driven, gameplay-driving, cosmetic) for Unity rebuild projects"
---

# Unity Day/Night — Time Cycle Architecture

> **Universal pattern — applies to ALL Unity projects with time-of-day cycles.**
> This skill defines the day/night architecture: TimeOfDay controller, lighting transitions,
> gameplay hooks, and GameEvents integration.
> DayNightSystem is L0 portable — zero `_-Systems/` dependencies.
> These patterns work for any Unity game with time cycles (9/29 projects use this).
> Examples below reference TWFACTORY and THRONEFALL patterns — substitute with your project's equivalents.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    DayNightCycle                                  │
│  MonoBehaviour — drives time progression                         │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────────────────────────────┐   │
│  │ Time Controller  │  │ Lighting Controller                  │   │
│  │ timeOfDay (0→1) │  │ Gradient → light color               │   │
│  │ currentPhase    │  │ AnimationCurve → intensity            │   │
│  │ dayDuration     │  │ Directional light rotation            │   │
│  └────────┬────────┘  │ Skybox, fog, ambient updates          │   │
│           │           └──────────────────────────────────────┘   │
│           ▼                                                      │
│  GameEvents.RaiseTimeChanged(timeOfDay)                          │
│  GameEvents.RaiseDayStarted() / RaiseNightStarted()              │
└──────────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────────────┐  ┌──────────────────────────┐
│  Gameplay Subscribers   │  │  Visual Subscribers       │
│  SpawnManager           │  │  AudioDayNightFader       │
│  NPCScheduleManager    │  │  ParticleController       │
│  ShopOpenHours          │  │  PostProcessController    │
└─────────────────────────┘  └──────────────────────────┘
```

---

## Core Components

### DayNightCycle — Time Controller

```csharp
/// <summary> I drive the day/night cycle. I control timeOfDay (0→1), fire GameEvents
/// at phase transitions, and update lighting. Systems subscribe to my events —
/// they never poll my state directly. </summary>
[DefaultExecutionOrder(-50)]
[AddComponentMenu("[PROJECT]/Manager/DayNightCycle")]
public class DayNightCycle : MonoBehaviour
{
    #region Inspector Fields
    [Header("Cycle Settings")]
    [SerializeField] float _dayDurationMinutes = 10f;
    [SerializeField] float _nightDurationMinutes = 5f;

    [Header("Phase Thresholds (0-1)")]
    [SerializeField] float _sunriseStart = 0.2f;
    [SerializeField] float _dayStart = 0.3f;
    [SerializeField] float _sunsetStart = 0.7f;
    [SerializeField] float _nightStart = 0.8f;

    [Header("Directional Light")]
    [SerializeField] Light _directionalLight;
    [SerializeField] Gradient _lightColorGradient;
    [SerializeField] AnimationCurve _lightIntensityCurve;
    [SerializeField] float _sunPitch = 60f;

    [Header("Ambient")]
    [SerializeField] Gradient _ambientColorGradient;
    [SerializeField] AnimationCurve _fogDensityCurve;
    [SerializeField] Gradient _fogColorGradient;
    #endregion
    #region private API
    float _timeOfDay;          // 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
    TimePhase _currentPhase;
    int _dayCount;

    void UpdateLighting()
    {
        // → directional light color + intensity from gradients
        _directionalLight.color = _lightColorGradient.Evaluate(_timeOfDay);
        _directionalLight.intensity = _lightIntensityCurve.Evaluate(_timeOfDay);

        // → sun rotation (east → west arc)
        float sunAngle = _timeOfDay * 360f - 90f;
        _directionalLight.transform.rotation = Quaternion.Euler(sunAngle, _sunPitch, 0f);

        // → ambient + fog
        RenderSettings.ambientLight = _ambientColorGradient.Evaluate(_timeOfDay);
        RenderSettings.fogColor = _fogColorGradient.Evaluate(_timeOfDay);
        RenderSettings.fogDensity = _fogDensityCurve.Evaluate(_timeOfDay);
    }

    void CheckPhaseTransitions()
    {
        TimePhase newPhase = GetPhaseForTime(_timeOfDay);
        if (newPhase == _currentPhase) return;

        TimePhase oldPhase = _currentPhase;
        _currentPhase = newPhase;

        // purpose: notify systems of phase transition
        GameEvents.RaiseTimePhaseChanged(oldPhase, newPhase);

        if (newPhase == TimePhase.day && oldPhase == TimePhase.sunrise)
        {
            _dayCount++;
            // purpose: notify systems day started (spawning, shops open, etc.)
            GameEvents.RaiseDayStarted(_dayCount);
        }
        else if (newPhase == TimePhase.night && oldPhase == TimePhase.sunset)
        {
            // purpose: notify systems night started (enemies spawn, shops close, etc.)
            GameEvents.RaiseNightStarted(_dayCount);
        }
    }

    TimePhase GetPhaseForTime(float t)
    {
        if (t < _sunriseStart) return TimePhase.night;
        if (t < _dayStart) return TimePhase.sunrise;
        if (t < _sunsetStart) return TimePhase.day;
        if (t < _nightStart) return TimePhase.sunset;
        return TimePhase.night;
    }
    #endregion
    #region public API
    /// <summary> Current time of day normalized 0-1.
    /// 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset. </summary>
    public float GetTimeOfDay() => _timeOfDay;
    public TimePhase GetCurrentPhase() => _currentPhase;
    public int GetDayCount() => _dayCount;

    /// <summary> Sets time instantly (for debug, load from save). </summary>
    public void SetTimeOfDay(float t)
    {
        _timeOfDay = Mathf.Repeat(t, 1f);
        UpdateLighting();
        CheckPhaseTransitions();
    }

    /// <summary> Skips to next dawn/dusk. </summary>
    public void SkipToNextPhase()
    {
        if (_currentPhase == TimePhase.day || _currentPhase == TimePhase.sunrise)
            SetTimeOfDay(_sunsetStart);
        else
            SetTimeOfDay(_dayStart);
    }
    #endregion
    #region Unity Life Cycle
    void Update()
    {
        // → advance time based on current phase duration
        float duration = (_currentPhase == TimePhase.night || _currentPhase == TimePhase.sunset)
            ? _nightDurationMinutes : _dayDurationMinutes;
        float speed = 1f / (duration * 60f);
        _timeOfDay = Mathf.Repeat(_timeOfDay + Time.deltaTime * speed, 1f);

        UpdateLighting();
        CheckPhaseTransitions();

        // purpose: continuous time update for smooth transitions
        GameEvents.RaiseTimeChanged(_timeOfDay);
    }
    #endregion
}
```

---

### TimePhase Enum

```csharp
// In GlobalEnumsX.cs
public enum TimePhase { night, sunrise, day, sunset }
```

---

### GameEvents Integration

```csharp
// phase-{x}/0-Core/GameEvents.cs
public static partial class GameEvents
{
    // when time of day changes (every frame) >>
    public static event Action<float> OnTimeChanged;
    public static void RaiseTimeChanged(float timeOfDay) { ... }
    // << when time of day changes

    // when time phase transitions >>
    public static event Action<TimePhase, TimePhase> OnTimePhaseChanged;
    public static void RaiseTimePhaseChanged(TimePhase from, TimePhase to) { ... }
    // << when time phase transitions

    // when a new day starts >>
    public static event Action<int> OnDayStarted;
    public static void RaiseDayStarted(int dayCount) { ... }
    // << when a new day starts

    // when night starts >>
    public static event Action<int> OnNightStarted;
    public static void RaiseNightStarted(int dayCount) { ... }
    // << when night starts
}
```

---

## IDaytimeSensitive Interface (Optional)

For objects that need direct notification without GameEvents overhead:

```csharp
/// <summary>
/// Contract for scene objects sensitive to time transitions.
/// DayNightCycle calls these directly on registered objects.
///
/// Who implements me: Lanterns (auto-light at dusk), flowers (close at night).
/// Who uses me: DayNightCycle iterates registered list.
/// </summary>
public interface IDaytimeSensitive
{
    void OnDawn();
    void OnDusk();
}
```

---

## Genre Variants

### Gameplay-Driving (THRONEFALL, TWFACTORY)

Day = build/prepare. Night = enemies attack. Time drives core gameplay loop.

```csharp
// → Day starts: enable building UI, disable enemies
GameEvents.OnDayStarted += (day) =>
{
    // purpose: enable building mode during day
    GameEvents.RaiseEnableBuildMode();
    _spawnManager.StopSpawning();
};

// → Night starts: disable building, start waves
GameEvents.OnNightStarted += (day) =>
{
    // purpose: start enemy waves at night
    GameEvents.RaiseDisableBuildMode();
    _spawnManager.StartWave(day);
};
```

### Economic Cycle (SMARKET, BTYCOON)

Time drives shop hours, NPC schedules, bills, deliveries.

```csharp
GameEvents.OnDayStarted += (day) =>
{
    _shopManager.OpenShop();
    _customerSpawner.StartSpawning();
    _deliveryManager.ScheduleDeliveries();
};

GameEvents.OnNightStarted += (day) =>
{
    _shopManager.CloseShop();
    _billsManager.ProcessDailyBills();
};
```

### NPC Schedule (NOIMNOT, OBRADIN)

Time drives NPC routines — each NPC has per-hour behavior.

### Cosmetic Only (POLYBRIDGE3, MINEMGL)

Visual atmosphere change only — no gameplay impact. Simplest variant.

### Underground/Indoor (No Directional Light)

- Replace directional light rotation with point light color shifts
- No skybox — ambient only
- Time still progresses (for gameplay hooks) but no sun arc

---

## Save/Load Integration

```csharp
// ISaveable implementation
[Serializable]
public class DayNightSaveData
{
    public float timeOfDay;
    public int dayCount;
}

// In DayNightCycle (implements ISaveable)
public string GetSaveData() => JsonUtility.ToJson(new DayNightSaveData
{
    timeOfDay = _timeOfDay,
    dayCount = _dayCount
});

public void LoadFromSave(string json)
{
    var data = JsonUtility.FromJson<DayNightSaveData>(json);
    _dayCount = data.dayCount;
    SetTimeOfDay(data.timeOfDay);
}
```

---

## Pitfalls

- ❌ **Polling GetTimeOfDay() in Update()** — every system calling the getter every frame instead of reacting to events
  → ✅ Subscribe to `OnTimePhaseChanged` GameEvent for phase transitions

- ❌ **Hard-coded time thresholds** — sunrise at 0.25, sunset at 0.75 baked into code
  → ✅ Use `[SerializeField]` for sunrise/sunset thresholds — tunable in inspector

- ❌ **Directional light jumps at midnight** — rotation snaps from 359° to 0° causing visible pop
  → ✅ Use `Mathf.Repeat()` for smooth 0→1 wraparound

- ❌ **No save/load for time state** — time resets to morning on every load
  → ✅ Save `timeOfDay` + `dayCount` in SaveData

- ❌ **Gameplay systems directly reading DayNightCycle** — concrete reference to manager, breaks portability
  → ✅ Use GameEvents — keep systems decoupled from time manager

- ❌ **Missing fog/ambient updates** — only updating directional light, scene still looks wrong
  → ✅ Update ALL lighting channels: directional, ambient, fog, skybox tint

- ❌ **Night too dark to see** — intensity curve hits zero, player can't navigate
  → ✅ Use minimum intensity in AnimationCurve (never zero — floor at 0.05-0.1)

- ❌ **Time speed not configurable** — gameplay balance impossible without adjustable day length
  → ✅ `[SerializeField] float _dayDurationSeconds` — expose to designers