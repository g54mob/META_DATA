---
name: "unity-audio"
description: "Sound system architecture — pool-based SoundManager, SoundDefinition ScriptableObjects, SoundPlayer recycling, LoopingSoundPlayer proximity triggers, dynamic spatial mixing, volume fading, distance culling, Music system, 2D audio, FMOD variant, genre-adaptive pool sizing for Unity rebuild projects"
---

# Unity Audio — Sound System Architecture

> **Universal pattern — applies to ALL Unity projects in this workspace.**
> This skill defines the sound system architecture: pool-based playback, ScriptableObject definitions,
> proximity-based looping, music management, and dynamic spatial mixing.
> SoundSystem is L0 portable — zero `_-Systems/` dependencies.
> These patterns work for any Unity game with audio needs (25/29 projects use this).
> Examples use `[PROJECT]` placeholders — substitute with your project's equivalents.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        SoundManager                              │
│  Singleton<SoundManager>  [DefaultExecutionOrder(-10)]           │
│                                                                  │
│  ┌─────────────┐  ┌──────────────────────────────────────────┐   │
│  │ Sound Pool  │  │ Dynamic Spatial Mixer (optional)         │   │
│  │ Queue<SP>   │  │ OverlapSphereNonAlloc → closest N       │   │
│  │ _poolSize   │  │ Assign AudioSources to nearest emitters │   │
│  └──────┬──────┘  └──────────────────────────────────────────┘   │
│         ▼                                                        │
│  PlaySoundAtLocation()                                           │
│  ReturnToPool()                                                  │
│  Distance culling: sqrDist > (maxRange×1.25)²                    │
└──────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────────────┐
│  SoundPlayer    │     │  LoopingSoundPlayer      │
│  One-shot play  │     │  Proximity trigger-based │
│  Auto-return    │     │  Loop = true             │
│  Pool member    │     │  Placed directly in scene│
└─────────────────┘     └──────────────────────────┘
```

---

## Core Components

### SoundManager — Singleton Pool Hub

```csharp
[DefaultExecutionOrder(-10)]
[AddComponentMenu("[PROJECT]/Manager/SoundManager")]
public class SoundManager : Singleton<SoundManager>
{
    private Queue<SoundPlayer> soundPlayersPool;
    [SerializeField] int _poolSize = 20;  // Tune: 5-10 (small/2D), 20-30 (medium 3D), 40+ (large)

    /// <summary> Plays a one-shot sound at a world position. Culls if too far from listener. </summary>
    public void PlaySoundAtLocation(SoundDefinition def, Vector3 position,
        float volumeMultiplier = 1f, float pitchMultiplier = 1f,
        bool dontPlayIfTooFar = true, bool isUISound = false)
    {
        if (dontPlayIfTooFar)
        {
            float sqrDist = (ListenerPosition - position).sqrMagnitude;
            float cullDist = def.maxRange * 1.25f;
            if (sqrDist > cullDist * cullDist) return;
        }

        SoundPlayer player = soundPlayersPool.Dequeue();
        player.transform.position = position;
        player.gameObject.SetActive(true);
        player.PlaySound(def, volumeMultiplier, pitchMultiplier, isUISound);
    }

    public void ReturnToPool(SoundPlayer player)
    {
        player.gameObject.SetActive(false);
        soundPlayersPool.Enqueue(player);
    }
}
```

**Key design decisions:**
- **Pool size configurable** via `[SerializeField]` — tune per project genre
- **Distance culling** — `sqrMagnitude` (no sqrt). Threshold = 1.25× maxRange
- **UI sounds** — `isUISound = true` → spatialBlend = 0 (no positioning)
- **Execution order -10** — ready before any gameplay script plays sounds

### SoundPlayer — Individual Playback Unit

```csharp
[RequireComponent(typeof(AudioSource))]
[AddComponentMenu("[PROJECT]/Audio/SoundPlayer")]
public class SoundPlayer : MonoBehaviour
{
    private AudioSource _audioSource;
    public bool IsPoolMember = true;

    public void PlaySound(SoundDefinition def, float volumeMult = 1f,
        float pitchMult = 1f, bool isUISound = false)
    {
        AudioClipDescription sound = def.GetSound();
        _audioSource.spatialBlend = isUISound ? 0f : 1f;
        _audioSource.volume = sound.volume * volumeMult;
        _audioSource.pitch = sound.pitch * pitchMult;
        _audioSource.maxDistance = sound.maxRange;
        _audioSource.priority = sound.priority;
        _audioSource.PlayOneShot(sound.clip);

        if (IsPoolMember)
            StartCoroutine(ReturnAfterClip(sound.clip.length / sound.pitch));
    }

    private IEnumerator ReturnAfterClip(float delay)
    {
        yield return new WaitForSecondsRealtime(delay);
        Singleton<SoundManager>.Ins.ReturnToPool(this);
    }
}
```

### SoundDefinition — ScriptableObject Configuration

```csharp
[CreateAssetMenu(fileName = "SoundDefinition", menuName = "Audio/SoundDefinition")]
public class SoundDefinition : ScriptableObject
{
    public AudioClipDescription[] sounds;  // 2-5 variants for natural variation
    [Range(0.5f, 2f)] public float minPitch = 0.9f;
    [Range(0.5f, 2f)] public float maxPitch = 1.1f;
    [Range(0f, 100f)] public float maxRange = 20f;
    [Range(0f, 256f)] public int Priority = 180;

    public AudioClipDescription GetSound()
    {
        AudioClipDescription result = sounds[Random.Range(0, sounds.Length)];
        result.pitch = Random.Range(minPitch, maxPitch);
        result.maxRange = maxRange;
        result.priority = Priority;
        return result;
    }
}

public struct AudioClipDescription
{
    public AudioClip clip;
    public float volume;
    public float pitch;
    public float maxRange;
    public int priority;
}
```

---

## Looping Sounds — Proximity-Based

### LoopingSoundPlayer — Ambient/Machine Sounds

```csharp
[RequireComponent(typeof(AudioSource))]
[DefaultExecutionOrder(-1)]
[AddComponentMenu("[PROJECT]/Audio/LoopingSoundPlayer")]
public class LoopingSoundPlayer : MonoBehaviour
{
    public AudioSource AudioSource;
    public bool ShouldPlay = true;
    private bool _isInRange;

    private void Awake()
    {
        AudioSource = GetComponent<AudioSource>();
        AudioSource.loop = true;
        AudioSource.playOnAwake = false;
        // Auto-add proximity trigger
        SphereCollider sphere = gameObject.AddComponent<SphereCollider>();
        sphere.isTrigger = true;
        sphere.radius = AudioSource.maxDistance;
    }

    private void OnTriggerEnter(Collider other)
    {
        _isInRange = true;
        if (ShouldPlay && !AudioSource.isPlaying) AudioSource.Play();
    }

    private void OnTriggerExit(Collider other)
    {
        _isInRange = false;
        if (AudioSource.isPlaying) AudioSource.Stop();
    }

    public void Play() { ShouldPlay = true; if (_isInRange) AudioSource.Play(); }
    public void Stop() { ShouldPlay = false; AudioSource.Stop(); }
}
```

**Use cases:** Machines, ambient emitters, fire crackling, water flow, engine idle, any continuous sound.

### LoopingSoundFader — Smooth Volume Transitions

```csharp
[RequireComponent(typeof(LoopingSoundPlayer))]
[AddComponentMenu("[PROJECT]/Audio/LoopingSoundFader")]
public class LoopingSoundFader : MonoBehaviour
{
    private LoopingSoundPlayer _loopPlayer;
    private float _targetVolume, _fadeSpeed;

    public void FadeTo(float targetVolume, float duration = -1f)
    {
        _targetVolume = Mathf.Clamp01(targetVolume);
        if (duration <= 0f)
        {
            _loopPlayer.AudioSource.volume = _targetVolume;
            if (_targetVolume <= 0f) _loopPlayer.Stop();
            else if (!_loopPlayer.AudioSource.isPlaying) _loopPlayer.Play();
            return;
        }
        if (!_loopPlayer.AudioSource.isPlaying) _loopPlayer.Play();
        _fadeSpeed = Mathf.Abs(_targetVolume - _loopPlayer.AudioSource.volume) / duration;
        enabled = true;
    }

    private void Update()
    {
        float vol = Mathf.MoveTowards(_loopPlayer.AudioSource.volume,
            _targetVolume, _fadeSpeed * Time.deltaTime);
        _loopPlayer.AudioSource.volume = vol;
        if (Mathf.Approximately(vol, _targetVolume))
        {
            enabled = false;
            if (_targetVolume <= 0f) _loopPlayer.Stop();
        }
    }
}
```

---

## Music System

```csharp
[AddComponentMenu("[PROJECT]/Manager/MusicManager")]
public class MusicManager : Singleton<MusicManager>
{
    [SerializeField] AudioSource _musicSourceA, _musicSourceB;
    [SerializeField] float _crossfadeDuration = 2f;
    private bool _isSourceA = true;

    public void PlayTrack(AudioClip clip, float volume = 1f)
    {
        AudioSource next = _isSourceA ? _musicSourceA : _musicSourceB;
        AudioSource prev = _isSourceA ? _musicSourceB : _musicSourceA;
        next.clip = clip;
        next.volume = 0f;
        next.Play();
        StartCoroutine(Crossfade(prev, next, volume));
        _isSourceA = !_isSourceA;
    }

    public void StopMusic(float fadeDuration = 1f)
    {
        StartCoroutine(FadeOut(_isSourceA ? _musicSourceA : _musicSourceB, fadeDuration));
    }

    private IEnumerator Crossfade(AudioSource from, AudioSource to, float targetVol)
    {
        float elapsed = 0f;
        float startVol = from.volume;
        while (elapsed < _crossfadeDuration)
        {
            elapsed += Time.deltaTime;
            float t = elapsed / _crossfadeDuration;
            from.volume = Mathf.Lerp(startVol, 0f, t);
            to.volume = Mathf.Lerp(0f, targetVol, t);
            yield return null;
        }
        from.Stop();
        from.volume = 0f;
        to.volume = targetVol;
    }

    private IEnumerator FadeOut(AudioSource source, float duration)
    {
        float startVol = source.volume;
        float elapsed = 0f;
        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            source.volume = Mathf.Lerp(startVol, 0f, elapsed / duration);
            yield return null;
        }
        source.Stop();
    }
}
```

**Rules:** Music = dedicated AudioSources (NOT SFX pool). Always crossfade. spatialBlend = 0. Separate volume slider from SFX.

---

## 2D Audio (4+ Projects)

For 2D games (stackLand, papersPls, shapeFactr, noimnot):

```csharp
// All sounds use spatialBlend = 0 (non-spatial)
// No distance culling needed
// Pool size: 5-15 (fewer simultaneous sounds)
public void PlaySound2D(SoundDefinition def, float volumeMult = 1f)
{
    SoundPlayer player = soundPlayersPool.Dequeue();
    player.PlaySound(def, volumeMult, isUISound: true);  // spatialBlend 0
}
```

---

## Dynamic Spatial Mixing (Genre-Specific)

For projects with many simultaneous emitters (factories, crowds, traffic):

```csharp
// Limited AudioSources (5-8) dynamically assigned to nearest emitters
// FixedUpdate: OverlapSphereNonAlloc → find closest N → assign positions
private void UpdateSpatialMix()
{
    int hits = Physics.OverlapSphereNonAlloc(
        _listenerPos, _checkRadius, _hitBuffer, _emitterLayer);
    // Sort by distance, assign closest N to shared AudioSources
    // Deactivate unused AudioSources
}
```

**Use cases:** Factory machines, crowd NPCs, vehicle traffic, ambient wildlife.

---

## FMOD Variant (fwr, modulus, welcmHome)

```csharp
using FMODUnity;
using FMOD.Studio;

public class FMODSoundManager : MonoBehaviour
{
    public void PlayOneShot(EventReference soundEvent, Vector3 position)
    {
        RuntimeManager.PlayOneShot(soundEvent, position);
    }

    public EventInstance CreateLoop(EventReference soundEvent, Transform follow)
    {
        EventInstance instance = RuntimeManager.CreateInstance(soundEvent);
        RuntimeManager.AttachInstanceToGameObject(instance, follow);
        instance.start();
        return instance;
    }
}
```

**FMOD differences:** No SoundDefinition SO (FMOD Studio defines properties). No pool needed. `EventReference` replaces `AudioClip`. Volume/effects in FMOD Studio, not code.

---

## Genre Audio Profiles

| Genre | Pool Size | spatialBlend | Music? | Special |
|-------|-----------|-------------|--------|---------|
| FPS (horror, survival) | 20-30 | 1.0 (3D) | Optional | Distance culling, proximity loops |
| Tycoon (btycoon, smarket) | 15-25 | 1.0 (3D) | ✅ | Ambient crowds, register sounds |
| 2D (stackLand, papersPls) | 5-15 | 0.0 (2D) | ✅ | No spatial, simpler pool |
| Horror (contentWarn, welcmHome) | 10-20 | 1.0 (3D) | ✅ | Dynamic ambient, tension layers |
| Strategy (throneFall, rimWrld) | 20-30 | 1.0 (3D) | ✅ | Battle sounds, group audio |
| Factory (modulus, twFactory) | 30-50 | 1.0 (3D) | Optional | Machine loops, spatial mixing |

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Playing sound every frame | Gate with cooldown or play-once flag |
| Not returning to pool | Always auto-return via coroutine after clip.length |
| Pool exhaustion (queue empty) | Increase pool size OR steal oldest playing sound |
| Music through SFX pool | Dedicated AudioSources for music — never pool |
| Missing WaitForSecondsRealtime | Sound won't finish during pause — use Realtime |
| AudioSource.Play() for one-shots | Use PlayOneShot() — doesn't interrupt previous |
| 3D sound for UI clicks | Set isUISound=true (spatialBlend=0) for UI |
| No pitch variation | Use minPitch/maxPitch in SoundDefinition (0.9-1.1) |