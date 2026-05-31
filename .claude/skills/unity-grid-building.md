---
name: "unity-grid-building"
description: "Grid/tile building placement system — grid snapping, ghost preview, placement validation, rotation, building SO definitions, BuildingManager singleton, connection points, overlap detection, placement modes (free/grid/snap-to-node) for Unity rebuild projects"
---

# Unity Grid Building — Placement System Architecture

> **Universal pattern — applies to ALL Unity projects in this workspace.**
> This skill defines building/placement system architecture: grid-based and free-form placement,
> ghost previews, validation, rotation, and connection points.
> 8/29 projects have significant building/placement systems (tycoon, factory, strategy, sandbox).
> Follows the SO_/Field_/DataService/Orchestrator pattern from this workspace's conventions.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│ _-Systems/BuildingSystem/                                      │
│                                                                │
│  SO_BuildingDef      → "I define what a building IS"           │
│  WBuilding           → "I track one placed building's state"   │
│  BuildingDataService → "I manage all placed buildings"         │
│  BuildingPlacer      → "I handle ghost preview + validation"   │
│  BuildingManager     → "I am the singleton registry"           │
│  Interface/IBuildable → "Contract for placeable objects"        │
│                                                                │
│  Placement Modes:                                              │
│  • Grid-snapped (modulus, twFactory) — discrete grid cells     │
│  • Free-form (smarket, basementToSky) — anywhere with overlap  │
│  • Node-snapped (minemgl) — specific attachment points         │
└────────────────────────────────────────────────────────────────┘
```

---

## Data Layer

### SO_BuildingDef — Building Blueprint

```csharp
[CreateAssetMenu(menuName = "SO/SO_BuildingDef", fileName = "SO_BuildingDef")]
public class SO_BuildingDef : ScriptableObject
{
    public string buildingName = "Building";
    [TextArea(2, 3)] public string description;
    public Sprite icon;
    public GameObject pfGhost;       // Transparent preview prefab
    public GameObject pfBuilding;    // Actual placed prefab
    public Vector2Int gridSize = Vector2Int.one;  // Footprint in grid cells
    public float cost;
    public BuildingCategory category;
    public bool canRotate = true;
    public int rotationSteps = 4;    // 4 = 90° increments
}
```

### WBuilding — Runtime Wrapper

```csharp
public class WBuilding
{
    public SO_BuildingDef buildingDef;
    public Vector3 position;
    public Quaternion rotation;
    public int rotationIndex;        // 0-3 for 90° steps
    public bool isOperational = true;
    public GameObject instance;      // Reference to placed GO

    public WBuilding(SO_BuildingDef def, Vector3 pos, int rotIndex)
    {
        buildingDef = def;
        position = pos;
        rotationIndex = rotIndex;
        rotation = Quaternion.Euler(0, rotIndex * (360f / def.rotationSteps), 0);
    }
}
```

---

## BuildingDataService — Pure C# Collection

```csharp
public class BuildingDataService
{
    #region private API
    List<WBuilding> BUILDINGS = new();
    Dictionary<Vector2Int, WBuilding> DOC__gridCell_building = new();  // Grid occupancy
    #endregion

    #region public API
    public void PlaceBuilding(WBuilding building)
    {
        BUILDINGS.Add(building);
        // Mark grid cells as occupied
        var cells = GetOccupiedCells(building);
        foreach (var cell in cells)
            DOC__gridCell_building[cell] = building;
    }

    public bool CanPlaceAt(SO_BuildingDef def, Vector2Int gridPos, int rotation)
    {
        var cells = GetFootprintCells(def, gridPos, rotation);
        foreach (var cell in cells)
        {
            if (DOC__gridCell_building.ContainsKey(cell))
                return false;  // Cell already occupied
        }
        return true;
    }

    public void RemoveBuilding(WBuilding building)
    {
        BUILDINGS.Remove(building);
        var cells = GetOccupiedCells(building);
        foreach (var cell in cells)
            DOC__gridCell_building.Remove(cell);
    }

    public List<WBuilding> GetAll() => BUILDINGS;
    public WBuilding GetBuildingAt(Vector2Int cell) =>
        DOC__gridCell_building.GetValueOrDefault(cell);
    #endregion

    #region private helpers
    private List<Vector2Int> GetFootprintCells(SO_BuildingDef def, Vector2Int origin, int rot)
    {
        var cells = new List<Vector2Int>();
        Vector2Int size = (rot % 2 == 0)
            ? def.gridSize
            : new Vector2Int(def.gridSize.y, def.gridSize.x);  // Rotated footprint

        for (int x = 0; x < size.x; x++)
            for (int y = 0; y < size.y; y++)
                cells.Add(origin + new Vector2Int(x, y));
        return cells;
    }

    private List<Vector2Int> GetOccupiedCells(WBuilding building) =>
        GetFootprintCells(building.buildingDef,
            WorldToGrid(building.position), building.rotationIndex);
    #endregion
}
```

---

## Ghost Preview System

### BuildingPlacer — Handles Placement Input

```csharp
[AddComponentMenu("[PROJECT]/Building/BuildingPlacer")]
public class BuildingPlacer : MonoBehaviour
{
    [SerializeField] LayerMask _groundLayer;
    [SerializeField] Material _ghostValid;    // Green transparent
    [SerializeField] Material _ghostInvalid;  // Red transparent

    private SO_BuildingDef _currentDef;
    private GameObject _ghostInstance;
    private int _rotationIndex;
    private bool _isPlacing;

    public void StartPlacement(SO_BuildingDef def)
    {
        _currentDef = def;
        _ghostInstance = Instantiate(def.pfGhost);
        _isPlacing = true;
        _rotationIndex = 0;
        // Disable ghost colliders so it doesn't block raycasts
        SetGhostCollidersActive(false);
    }

    private void Update()
    {
        if (!_isPlacing) return;

        // Raycast to find ground position
        if (Physics.Raycast(_cam.position, _cam.forward, out var hit, 50f, _groundLayer))
        {
            Vector3 snappedPos = SnapToGrid(hit.point);
            _ghostInstance.transform.position = snappedPos;
            _ghostInstance.transform.rotation = GetRotation();

            // Validate placement
            bool canPlace = CanPlaceHere(snappedPos);
            SetGhostMaterial(canPlace ? _ghostValid : _ghostInvalid);

            // Confirm placement
            if (InputManager.K.fire && canPlace)
                ConfirmPlacement(snappedPos);

            // Rotate
            if (InputManager.K.rotate)
                _rotationIndex = (_rotationIndex + 1) % _currentDef.rotationSteps;

            // Cancel
            if (InputManager.K.cancel)
                CancelPlacement();
        }
    }

    private Vector3 SnapToGrid(Vector3 worldPos)
    {
        float gridSize = 1f;  // Configure per project
        return new Vector3(
            Mathf.Round(worldPos.x / gridSize) * gridSize,
            worldPos.y,
            Mathf.Round(worldPos.z / gridSize) * gridSize);
    }

    private void ConfirmPlacement(Vector3 position)
    {
        // Create actual building
        var go = Instantiate(_currentDef.pfBuilding, position, GetRotation());
        var wBuilding = new WBuilding(_currentDef, position, _rotationIndex);
        wBuilding.instance = go;

        // Register in DataService
        _dataService.PlaceBuilding(wBuilding);

        // Raise event
        GameEvents.RaiseBuildingPlaced(wBuilding);

        // Cleanup ghost
        Destroy(_ghostInstance);
        _isPlacing = false;
    }
}
```

---

## Placement Modes

### Grid-Snapped (Factory, Strategy)

```csharp
// Snap to discrete grid cells
Vector3 SnapToGrid(Vector3 pos, float cellSize = 1f)
{
    return new Vector3(
        Mathf.Round(pos.x / cellSize) * cellSize,
        pos.y,
        Mathf.Round(pos.z / cellSize) * cellSize);
}
```

### Free-Form with Overlap Check (Tycoon)

```csharp
// Place anywhere but check overlap via Physics.OverlapBox
bool CanPlaceFreeform(Vector3 pos, Vector3 halfExtents, LayerMask blockingLayers)
{
    Collider[] hits = Physics.OverlapBox(pos, halfExtents, Quaternion.identity, blockingLayers);
    return hits.Length == 0;
}
```

### Node-Snapped (Connection Points)

```csharp
// Snap to pre-defined attachment nodes on other buildings
Transform FindNearestNode(Vector3 position, float snapRadius)
{
    foreach (var building in _dataService.GetAll())
    {
        foreach (var node in building.instance.GetComponent<IBuildable>().GetConnectionNodes())
        {
            if (Vector3.Distance(position, node.position) < snapRadius)
                return node;
        }
    }
    return null;
}
```

---

## Ghost Material Setup

```
Ghost_Transparent Shader:
  Surface Type: Transparent
  Render Face: Both
  Properties:
    _Color (Color with alpha 0.3)
    _Alpha (float 0-1)

Materials:
  M_Ghost_Valid    — Green (0.2, 1, 0.2, 0.3)
  M_Ghost_Invalid  — Red (1, 0.2, 0.2, 0.3)
```

---

## Save Integration

```csharp
[System.Serializable]
public class BuildingSaveData
{
    public BuildingEntry[] buildings;

    [System.Serializable]
    public class BuildingEntry
    {
        public string defName;      // SO_ name for lookup
        public float[] position;    // [x, y, z]
        public int rotationIndex;
        public bool isOperational;
    }
}
```

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Ghost colliders blocking placement raycast | Disable all colliders on ghost prefab |
| Rotation not updating footprint | Swap gridSize.x/y when rotation is 90°/270° |
| Buildings overlap | Check ALL cells of footprint, not just origin |
| Placing through walls | Raycast must hit ground layer specifically |
| No undo/demolish | Track WBuilding → Destroy instance + remove from DataService |
| Grid origin mismatch | Ensure grid origin matches world origin (or offset consistently) |
| Ghost material on wrong renderer | Get ALL renderers in ghost prefab (including children) |
| Save position as grid index | Save world position — grid size might change |