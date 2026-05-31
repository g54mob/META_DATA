---
name: "unity-save-load"
description: "Save/Load system architecture — ISaveable interface, SaveData pure C# classes, SaveManager singleton, JSON serialization, auto-save, slot management, versioning, PlayerPrefs settings isolation, DataService↔SaveData mapping for Unity rebuild projects"
---

# Unity Save/Load — Persistence Architecture

> **Universal pattern — applies to ALL Unity projects with persistent game state.**
> This skill defines the save/load architecture: interface-driven persistence, pure C# SaveData classes,
> singleton SaveManager, JSON serialization, auto-save, and schema versioning.
> SaveSystem is L0 portable — zero `_-Systems/` dependencies.
> These patterns work for any Unity game with save/load needs (20/29 projects use this).
> Examples below reference MINEMGL and SCHEDULE-1 patterns — substitute with your project's equivalents.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        SaveManager                               │
│  Singleton<SaveManager>  [DefaultExecutionOrder(-900)]           │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────────────────────────────┐   │
│  │ Save Slot Mgmt  │  │ Registered ISaveables                │   │
│  │ Slot 1..N       │  │ List<ISaveable> — all registered     │   │
│  │ activeSaveName  │  │ Iterate on save/load                 │   │
│  └────────┬────────┘  └──────────────────────────────────────┘   │
│           ▼                                                      │
│  SaveGame() → iterate ISaveables → GetSaveData() → write JSON   │
│  LoadGame() → read JSON → iterate ISaveables → LoadFromSave()   │
│  File path: Application.persistentDataPath + "/Saves/"           │
└──────────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐     ┌──────────────────────────┐
│  AutoSaveManager│     │  SaveData Classes         │
│  Timer-based    │     │  Pure C# [Serializable]   │
│  Coroutine-     │     │  Mirror DataService colls │
│  driven         │     │  Zero MonoBehaviour       │
└─────────────────┘     └──────────────────────────┘
```

---

## Core Components

### ISaveable — Interface Contract

```csharp
/// <summary>
/// Contract for any object that participates in save/load.
/// SaveManager iterates all registered ISaveables — it never knows concrete types.
///
/// Who implements me: any MonoBehaviour with persistent state (machines, inventory, quests, economy).
/// Who uses me: SaveManager.SaveGame() / LoadGame().
/// </summary>
public interface ISaveable
{
    /// <summary> Unique identifier for this saveable — used as JSON key. </summary>
    string SaveID { get; }

    /// <summary> Returns JSON string of this object's SaveData snapshot.
    /// Called by SaveManager during save. </summary>
    string GetSaveData();

    /// <summary> Restores state from JSON string.
    /// Called by SaveManager during load. </summary>
    void LoadFromSave(string json);

    /// <summary> Returns false if this object has default/empty state (skip saving).
    /// Reduces file size by omitting unchanged objects. </summary>
    bool ShouldBeSaved();
}
```

**Variant — Multi-Phase Load (from THRONEFALL):**
```csharp
/// <summary> Extended contract with three-phase load pass.
/// Use when load order matters (references between objects). </summary>
public interface ISaveLoadPhased
{
    void OnBeforeMainLoadPass(string guid);  // → resolve references, prepare containers
    void OnLoad(string guid);                 // → restore own state
    void OnAfterMainLoadPass(string guid);    // → wire cross-references, validate
    void OnSave(string guid);
}
```

**Decision: ISaveable vs ISaveLoadPhased:**

| Complexity | Interface | When |
|-----------|-----------|------|
| Simple (most systems) | `ISaveable` | No cross-references between saved objects |
| Complex (interconnected) | `ISaveLoadPhased` | Objects reference other saved objects (e.g. NPC → building assignment) |

---

### SaveData — Pure C# Data Classes

```csharp
/// <summary> Snapshot of InventorySystem's persistent state.
/// Pure C# — no MonoBehaviour, no Unity refs. JSON-serializable.
/// Mirrors InventoryDataService collections. </summary>
[Serializable]
public class InventorySaveData
{
    public List<SlotSaveData> slots;
    public int selectedIndex;
}

[Serializable]
public class SlotSaveData
{
    public string itemDefName;  // → maps back to SO_ via lookup dictionary
    public int qty;
    public float durability;
}
```

**SaveData Rules:**
- **One SaveData class per system with persistent state** — mirrors the DataService collections
- **Zero methods** — pure `[Serializable]` data fields only
- **No Unity types** — use `string` IDs to reference SO_ assets (resolved via lookup on load)
- **No MonoBehaviour** — SaveData is plain C#, lives alongside its DataService
- **Nested SaveData OK** — `SlotSaveData` inside `InventorySaveData`
- **Filename:** `XxxSaveData.cs` — lives in `_-Systems/XxxSystem/`

**SaveData ↔ DataService Mapping:**

| DataService Field | SaveData Field | Notes |
|-------------------|---------------|-------|
| `List<WItem> ITEMS` | `List<SlotSaveData> slots` | W → SaveData snapshot |
| `int activeIndex` | `int selectedIndex` | Direct copy |
| `SO_ItemDef` ref | `string itemDefName` | SO_ → string ID for serialization |

---

### SaveManager — Singleton Hub

```csharp
[DefaultExecutionOrder(-900)]
[AddComponentMenu("[PROJECT]/Manager/SaveManager")]
public class SaveManager : Singleton<SaveManager>
{
    #region Inspector Fields
    [SerializeField] List<GameObject> _allSavablePrefabs;
    #endregion
    #region private API
    public const int SAVE_VERSION = 1;
    const string SAVE_FOLDER = "Saves";

    List<ISaveable> _registeredSaveables = new List<ISaveable>();
    string _activeSaveFileName = "Save1";
    bool _isLoading;

    string GetSaveFolderPath()
        => Path.Combine(Application.persistentDataPath, SAVE_FOLDER);

    string GetSaveFilePath(string saveName)
        => Path.Combine(GetSaveFolderPath(), saveName + ".json");
    #endregion
    #region public API
    /// <summary> Registers an ISaveable for inclusion in save/load cycles.
    /// Called by each system's Awake/Start. </summary>
    public void RegisterSaveable(ISaveable saveable)
    {
        // → add to registry, validate no duplicate SaveIDs
        if (_registeredSaveables.Any(s => s.SaveID == saveable.SaveID))
        {
            Debug.LogError($"[SaveManager] Duplicate SaveID: {saveable.SaveID}");
            return;
        }
        _registeredSaveables.Add(saveable);
    }

    /// <summary> Saves all registered ISaveables to JSON file.
    /// Fires OnSaveStart/OnSaveComplete GameEvents. </summary>
    public void SaveGame()
    {
        // purpose: notify systems that save is starting
        GameEvents.RaiseSaveStart();

        var saveFile = new SaveFile { version = SAVE_VERSION };

        foreach (var saveable in _registeredSaveables)
        {
            if (!saveable.ShouldBeSaved()) continue;
            saveFile.entries.Add(new SaveEntry
            {
                saveID = saveable.SaveID,
                json = saveable.GetSaveData()
            });
        }

        // → write to disk
        string fullJson = JsonUtility.ToJson(saveFile, prettyPrint: true);
        string path = GetSaveFilePath(_activeSaveFileName);
        Directory.CreateDirectory(GetSaveFolderPath());
        File.WriteAllText(path, fullJson);

        // purpose: notify systems that save is complete
        GameEvents.RaiseSaveComplete();
    }

    /// <summary> Loads save file and distributes data to registered ISaveables.
    /// Fires OnLoadComplete after all ISaveables have restored state. </summary>
    public void LoadGame(string saveName)
    {
        string path = GetSaveFilePath(saveName);
        if (!File.Exists(path))
        {
            Debug.Log("[SaveManager] No save file found, starting new game");
            return;
        }

        _isLoading = true;
        string fullJson = File.ReadAllText(path);
        var saveFile = JsonUtility.FromJson<SaveFile>(fullJson);

        // → version migration
        if (saveFile.version < SAVE_VERSION)
            MigrateSaveFile(saveFile);

        // → distribute to each saveable
        foreach (var entry in saveFile.entries)
        {
            var saveable = _registeredSaveables.find(s => s.SaveID == entry.saveID);
            if (saveable != null)
                saveable.LoadFromSave(entry.json);
            else
                Debug.LogWarning($"[SaveManager] No ISaveable for ID: {entry.saveID}");
        }

        _isLoading = false;
        // purpose: notify systems that load is complete (rebuild UI, etc.)
        GameEvents.RaiseLoadComplete();
    }
    #endregion
    #region Extra
    /// <summary> Migrates save file from older version to current.
    /// Chain: V1→V2→V3→... each step handles one version bump. </summary>
    void MigrateSaveFile(SaveFile saveFile)
    {
        if (saveFile.version == 0) { MigrateV0ToV1(saveFile); saveFile.version = 1; }
        // → add future migrations here: if (saveFile.version == 1) { ... saveFile.version = 2; }
    }

    void MigrateV0ToV1(SaveFile saveFile) { /* → rename fields, add defaults for new fields */ }
    #endregion
}
```

**Key Design Decisions:**
- **`[DefaultExecutionOrder(-900)]`** — ready before any gameplay script registers.
- **Registration pattern** — each ISaveable calls `RegisterSaveable(this)` in its own Awake/Start.
- **SaveID uniqueness** — enforced at registration time (duplicate = error log).
- **Version migration chain** — each version bump has its own migration method.
- **GameEvents integration** — `OnSaveStart`/`OnSaveComplete`/`OnLoadComplete` for UI feedback, auto-save, etc.

### SaveFile — Container Structure

```csharp
[Serializable]
public class SaveFile
{
    public int version;
    public List<SaveEntry> entries = new List<SaveEntry>();
}

[Serializable]
public class SaveEntry
{
    public string saveID;
    public string json;  // → serialized SaveData for one ISaveable
}
```

---

### AutoSaveManager — Timer-Based

```csharp
[AddComponentMenu("[PROJECT]/Manager/AutoSaveManager")]
public class AutoSaveManager : Singleton<AutoSaveManager>
{
    #region Inspector Fields
    [SerializeField] float _autoSaveFrequencyMinutes = 5f;
    [SerializeField] bool _autoSaveEnabled = true;
    #endregion
    #region private API
    float _lastAutoSaveTime;

    /// <summary> Checks timer in Update. Triggers save via coroutine when interval elapsed.
    /// Skips excluded scenes (main menu, loading). </summary>
    void Update()
    {
        if (!_autoSaveEnabled) return;
        if (Time.time - _lastAutoSaveTime < _autoSaveFrequencyMinutes * 60f) return;

        _lastAutoSaveTime = Time.time;
        StartCoroutine(AutoSave());
    }

    IEnumerator AutoSave()
    {
        // → show auto-save indicator
        Singleton<UIManager>.Ins.ShowAutoSavingWarning();
        Singleton<SaveManager>.Ins.SaveGame();
        yield return new WaitForSeconds(1f);
        // → hide auto-save indicator
        Singleton<UIManager>.Ins.HideAutoSavingWarning();
    }
    #endregion
    #region public API
    /// <summary> Applies user settings from PlayerPrefs (frequency, enabled). </summary>
    public void ApplySettings()
    {
        _autoSaveFrequencyMinutes = PlayerPrefs.GetFloat("AutoSaveFrequency", 5f);
        _autoSaveEnabled = PlayerPrefs.GetInt("AutoSaveEnabled", 1) > 0;
    }
    #endregion
}
```

---

## ISaveable Implementation Pattern

How a system implements ISaveable — connecting DataService to SaveData:

```csharp
[AddComponentMenu("[PROJECT]/Systems/InventorySystem")]
public class InventoryManager : Singleton<InventoryManager>, ISaveable
{
    #region private API
    InventoryDataService _dataService;
    #endregion
    #region ISaveable
    public string SaveID => "inventory";

    public bool ShouldBeSaved() => _dataService.GetSlots().Any(s => s.item != null);

    public string GetSaveData()
    {
        // → snapshot DataService → SaveData → JSON
        var saveData = new InventorySaveData
        {
            selectedIndex = _dataService.GetActiveIndex(),
            slots = _dataService.GetSlots().map(s => new SlotSaveData
            {
                itemDefName = s.item?.itemDef.name ?? "",
                qty = s.qty,
                durability = s.durability
            }).ToList()
        };
        return JsonUtility.ToJson(saveData);
    }

    public void LoadFromSave(string json)
    {
        // → JSON → SaveData → restore DataService
        var saveData = JsonUtility.FromJson<InventorySaveData>(json);
        _dataService.RestoreFromSave(saveData);
    }
    #endregion
    #region Unity Life Cycle
    protected override void Awake()
    {
        base.Awake();
        _dataService = new InventoryDataService();
        Singleton<SaveManager>.Ins.RegisterSaveable(this);
    }
    #endregion
}
```

---

## Serialization Strategies

### Default — JsonUtility (built-in)

```csharp
// → Save
string json = JsonUtility.ToJson(saveData, prettyPrint: true);

// → Load
var saveData = JsonUtility.FromJson<InventorySaveData>(json);
```

**Limitations:** No polymorphism, no Dictionary serialization, no null for value types.

### Variant — Newtonsoft.Json (complex data)

```csharp
// → Save (handles Dictionary, polymorphism, null)
string json = JsonConvert.SerializeObject(saveData, Formatting.Indented,
    new JsonSerializerSettings { TypeNameHandling = TypeNameHandling.Auto });

// → Load
var saveData = JsonConvert.DeserializeObject<InventorySaveData>(json);
```

**Use when:** Dictionary<K,V> in SaveData, polymorphic types, complex nested structures.

### Variant — EasySave3 (third-party)

```csharp
// → Save (auto-generates type converters)
ES3.Save<InventorySaveData>("inventory", saveData, filePath);

// → Load
var saveData = ES3.Load<InventorySaveData>("inventory", filePath);
```

**Use when:** Project already uses ES3 (btycoon). Don't add ES3 just for saves — JsonUtility is sufficient.

---

## PlayerPrefs — Settings Only (CRITICAL)

**PlayerPrefs is for user SETTINGS — never game state.**

| ✅ PlayerPrefs (settings) | ❌ NOT PlayerPrefs (game state) |
|--------------------------|-------------------------------|
| Volume levels | Inventory contents |
| Keybind remapping | Quest progress |
| Auto-save frequency | Money/resources |
| Window size / fullscreen | NPC relationships |
| Tutorial shown flag | Building placement |
| Language preference | Unlock progression |

```csharp
// ✅ Settings — PlayerPrefs
PlayerPrefs.SetFloat("MasterVolume", 0.8f);
PlayerPrefs.SetInt("AutoSaveEnabled", 1);

// ❌ Game state — use SaveManager + JSON file
// NEVER: PlayerPrefs.SetInt("PlayerMoney", 5000);
// NEVER: PlayerPrefs.SetString("InventoryJSON", json);
```

---

## GameEvents Integration

```csharp
// phase-{x}/0-Core/GameEvents.cs
public static partial class GameEvents
{
    // when save starts >>
    public static event Action OnSaveStart;
    public static void RaiseSaveStart()
    {
        LogSubscribersCount(nameof(OnSaveStart), OnSaveStart);
        GameEvents.OnSaveStart?.Invoke();
    }
    // << when save starts

    // when save completes >>
    public static event Action OnSaveComplete;
    public static void RaiseSaveComplete()
    {
        LogSubscribersCount(nameof(OnSaveComplete), OnSaveComplete);
        GameEvents.OnSaveComplete?.Invoke();
    }
    // << when save completes

    // when load completes >>
    public static event Action OnLoadComplete;
    public static void RaiseLoadComplete()
    {
        LogSubscribersCount(nameof(OnLoadComplete), OnLoadComplete);
        GameEvents.OnLoadComplete?.Invoke();
    }
    // << when load completes
}
```

**Subscribers:**
- `AutoSaveManager` → `OnSaveComplete` (reset timer)
- `UIManager` → `OnSaveStart`/`OnSaveComplete` (show/hide indicator)
- All SubManagers → `OnLoadComplete` (refresh UI from restored DataService)

---

## Version Migration Pattern

```csharp
// In SaveManager:
void MigrateSaveFile(SaveFile saveFile)
{
    // → chain migrations: V0→V1→V2→...
    while (saveFile.version < SAVE_VERSION)
    {
        switch (saveFile.version)
        {
            case 0: MigrateV0ToV1(saveFile); break;
            case 1: MigrateV1ToV2(saveFile); break;
            // → add new migrations here
        }
        saveFile.version++;
    }
}

/// <summary> V0→V1: Added durability field to SlotSaveData (default 1.0). </summary>
void MigrateV0ToV1(SaveFile saveFile)
{
    // → parse each entry, add missing fields with defaults
    foreach (var entry in saveFile.entries)
    {
        if (entry.saveID == "inventory")
        {
            // → add "durability": 1.0 to each slot that's missing it
            var data = JsonUtility.FromJson<InventorySaveData>(entry.json);
            foreach (var slot in data.slots)
                if (slot.durability <= 0f) slot.durability = 1f;
            entry.json = JsonUtility.ToJson(data);
        }
    }
}
```

---

## Save Slot Management

```csharp
// SaveManager slot API
public List<SaveSlotInfo> GetSaveSlots()
{
    var slots = new List<SaveSlotInfo>();
    string folder = GetSaveFolderPath();
    if (!Directory.Exists(folder)) return slots;

    foreach (string file in Directory.GetFiles(folder, "*.json"))
    {
        var info = new FileInfo(file);
        slots.Add(new SaveSlotInfo
        {
            saveName = Path.GetFileNameWithoutExtension(file),
            lastModified = info.LastWriteTime,
            fileSizeBytes = info.Length
        });
    }
    return slots.OrderByDescending(s => s.lastModified).ToList();
}

public void DeleteSave(string saveName)
{
    string path = GetSaveFilePath(saveName);
    if (File.Exists(path)) File.Delete(path);
}
```

---

## Genre Variants

### Mining/Factory (MINEMGL, MODULUS)

- Save each placed machine's position + rotation + custom data
- `SavableObjectID` enum maps to prefab lookup dictionary
- `ISaveLoadableObject` includes `GetPosition()`, `GetRotation()`, `GetCustomSaveData()`

### Tycoon (BTYCOON, SMARKET)

- EasySave3 with auto-generated type converters (40+ `ES3UserType_*.cs`)
- NPC state, economy, building placement all saved
- Multiple save categories (player, world, NPC, economy)

### Strategy (THRONEFALL, TABS)

- Three-phase load: Before → Main → After (for cross-references)
- Level progress + perk unlocks (separate from in-game state)
- Simple text-based line serialization (key-value pairs)

### Colony Sim (RIMWRLD)

- Deep save across hundreds of objects
- Custom XML/binary serialization (performance)
- Scribe system for versioned serialization

---

## SaveData Creation Checklist

When adding save/load to a system:

1. **Create SaveData class:** `XxxSaveData.cs` alongside DataService — `[Serializable]`, fields only
2. **Map DataService → SaveData:** each persistent collection gets a SaveData mirror field
3. **SO_ refs → string IDs:** `itemDef.name` not `SO_ItemDef` reference (SO_ can't be serialized)
4. **Implement ISaveable** on the system's Manager/MonoBehaviour
5. **Register:** `Singleton<SaveManager>.Ins.RegisterSaveable(this)` in Awake
6. **GetSaveData():** snapshot DataService → SaveData → `JsonUtility.ToJson()`
7. **LoadFromSave():** JSON → SaveData → restore DataService collections
8. **ShouldBeSaved():** return false if all state is default (reduce file size)
9. **Test round-trip:** save → load → verify DataService state matches

---

## Pitfalls

- ❌ **SaveData inside MonoBehaviour** — putting serializable fields directly in the MonoBehaviour class couples persistence to Unity lifecycle
  → ✅ Extract to separate `[Serializable]` SaveData pure C# class

- ❌ **PlayerPrefs for game state** — storing money, inventory, progress in PlayerPrefs. Not portable, limited size, no versioning
  → ✅ Use SaveManager + JSON file. PlayerPrefs = settings only (volume, sensitivity)

- ❌ **Unity Object refs in SaveData** — storing SO_, GameObject, or Component references. These break on reload/scene change
  → ✅ Use string IDs → resolve via lookup dictionary on load

- ❌ **No save versioning** — schema changes corrupt old saves with no recovery path
  → ✅ Add `SAVE_VERSION` int, increment on schema change, implement migration chain

- ❌ **Loading before ISaveables register** — SaveManager.Load() fires before systems have called Register()
  → ✅ `[DefaultExecutionOrder(-900)]` on SaveManager, systems register in Awake

- ❌ **Missing null checks on load** — deleted items/changed IDs cause NullRef on load
  → ✅ Validate SaveData entries — skip missing IDs with warning log

- ❌ **Saving every frame / in Update()** — wasteful I/O, causes frame hitches, file corruption risk
  → ✅ Save on events only (manual save, auto-save timer, scene exit)

- ❌ **No corruption protection** — crash mid-write destroys save file
  → ✅ Write to temp file first, rename on success (atomic write pattern)

- ❌ **FindObjectOfType<SaveManager>()** — slow, fragile, breaks decoupling
  → ✅ Use `Singleton<SaveManager>.Ins`

- ❌ **Hardcoded save file path** — breaks on different platforms (mobile, console, web)
  → ✅ Use `Application.persistentDataPath` — platform-independent