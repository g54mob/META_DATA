---
name: "unity-procedural-gen"
description: "Procedural generation architecture — seeded randomization, Perlin noise terrain, chunk-based world generation, biome systems, room/dungeon generation, seed-based reproducibility for Unity rebuild projects"
---

# Unity Procedural Generation — World Building Architecture

> **Universal pattern — applies to ALL Unity projects with procedurally generated content.**
> This skill defines procedural generation architecture: seeded randomization, noise-based terrain,
> chunk-based world gen, and biome systems.
> ProcGenSystem is L0 portable — zero `_-Systems/` dependencies.
> These patterns work for any Unity game with procedural content (5/29 projects use this).

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    WorldGenerator                                │
│  Singleton — drives generation pipeline                          │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────────────────────────────┐   │
│  │ Seed Manager     │  │ Generation Pipeline                  │   │
│  │ int worldSeed    │  │ 1. Heightmap (Perlin noise)          │   │
│  │ System.Random    │  │ 2. Biome assignment                  │   │
│  │ Reproducible     │  │ 3. Feature placement                 │   │
│  └─────────────────┘  │ 4. Entity spawning                   │   │
│                       └──────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### Seeded Randomization (CRITICAL)

```csharp
/// <summary> I provide reproducible randomization from a world seed.
/// Same seed = same world every time. </summary>
public class SeededRandom
{
    private System.Random _rng;

    public SeededRandom(int seed) => _rng = new System.Random(seed);

    public int Range(int min, int max) => _rng.Next(min, max);
    public float Range(float min, float max) => (float)(_rng.NextDouble() * (max - min) + min);
    public float Value => (float)_rng.NextDouble();

    /// <summary> Shuffles list in-place using Fisher-Yates. </summary>
    public void Shuffle<T>(List<T> list)
    {
        for (int i = list.Count - 1; i > 0; i--)
        {
            int j = _rng.Next(i + 1);
            (list[i], list[j]) = (list[j], list[i]);
        }
    }
}
```

**CRITICAL:** Never use `UnityEngine.Random` for procedural generation — it's not seedable across sessions. Use `System.Random` with explicit seed.

### Perlin Noise Terrain

```csharp
public static float GetHeight(float x, float z, int seed, float scale, int octaves)
{
    float height = 0f;
    float frequency = 1f;
    float amplitude = 1f;
    float maxValue = 0f;

    for (int i = 0; i < octaves; i++)
    {
        height += Mathf.PerlinNoise(
            (x + seed) * frequency / scale,
            (z + seed) * frequency / scale) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5f;    // → each octave contributes less
        frequency *= 2f;      // → each octave is higher frequency
    }
    return height / maxValue;  // → normalize to 0-1
}
```

### Chunk-Based Generation

```csharp
/// <summary> I generate world chunks around the player.
/// Only chunks within view distance are active. </summary>
public class ChunkManager : MonoBehaviour
{
    [SerializeField] int _chunkSize = 16;
    [SerializeField] int _viewDistance = 3;

    Dictionary<Vector2Int, Chunk> _loadedChunks = new Dictionary<Vector2Int, Chunk>();

    void UpdateChunks(Vector3 playerPos)
    {
        Vector2Int playerChunk = WorldToChunk(playerPos);

        // → generate missing chunks in range
        for (int x = -_viewDistance; x <= _viewDistance; x++)
        for (int z = -_viewDistance; z <= _viewDistance; z++)
        {
            Vector2Int coord = playerChunk + new Vector2Int(x, z);
            if (!_loadedChunks.ContainsKey(coord))
                _loadedChunks[coord] = GenerateChunk(coord);
        }

        // → unload distant chunks
        var toRemove = _loadedChunks.Keys
            .Where(k => Vector2Int.Distance(k, playerChunk) > _viewDistance + 1).ToList();
        foreach (var key in toRemove)
        {
            _loadedChunks[key].Unload();
            _loadedChunks.Remove(key);
        }
    }
}
```

---

## Room / Dungeon Generation

For interior/underground procedural layouts (rimWrld caves, contentWarn maps). Uses a generate-then-connect pattern:

```csharp
/// <summary> I generate connected rooms using BSP (Binary Space Partition). </summary>
public class DungeonGenerator
{
    System.Random _rng;
    List<RectInt> _rooms = new();
    List<(Vector2Int, Vector2Int)> _corridors = new();

    public DungeonGenerator(int seed) => _rng = new System.Random(seed);

    public void Generate(int width, int height, int minRoomSize, int maxRooms)
    {
        // → split space into partitions
        var partitions = BSPSplit(new RectInt(0, 0, width, height), minRoomSize, maxRooms);

        // → place room inside each partition (with random padding)
        foreach (var partition in partitions)
        {
            int roomW = _rng.Next(minRoomSize, partition.width - 2);
            int roomH = _rng.Next(minRoomSize, partition.height - 2);
            int x = partition.x + _rng.Next(1, partition.width - roomW);
            int y = partition.y + _rng.Next(1, partition.height - roomH);
            _rooms.Add(new RectInt(x, y, roomW, roomH));
        }

        // → connect adjacent rooms with corridors
        for (int i = 0; i < _rooms.Count - 1; i++)
        {
            var a = Center(_rooms[i]);
            var b = Center(_rooms[i + 1]);
            _corridors.Add((a, b));
        }
    }

    Vector2Int Center(RectInt r) => new(r.x + r.width / 2, r.y + r.height / 2);
}
```

**Key patterns from source:**
- rimWrld (`MapGenerator.cs`): Uses `GenStep` pipeline — each step adds a layer (terrain → caves → resources → structures)
- Room placement validates no overlap using spatial hashing
- Corridors use L-shaped paths (horizontal then vertical) for natural feel

---

## Object Placement / Decoration Pass

After terrain/room generation, place objects using density maps:

```csharp
/// <summary> I place objects on generated terrain based on density rules. </summary>
public class ObjectPlacer
{
    public void PlaceObjects(int[,] heightMap, int seed, List<PlacementRule> rules)
    {
        var rng = new System.Random(seed + 1); // → offset seed from terrain

        foreach (var rule in rules)
        {
            int placed = 0;
            int attempts = rule.maxCount * 3; // → avoid infinite loop

            while (placed < rule.maxCount && attempts-- > 0)
            {
                int x = rng.Next(0, heightMap.GetLength(0));
                int z = rng.Next(0, heightMap.GetLength(1));
                int height = heightMap[x, z];

                if (height >= rule.minHeight && height <= rule.maxHeight)
                {
                    // → check minimum spacing from other placed objects
                    if (IsSpacingValid(x, z, rule.minSpacing))
                    {
                        PlaceAt(x, height, z, rule.prefabID);
                        placed++;
                    }
                }
            }
        }
    }

    bool IsSpacingValid(int x, int z, float minSpacing) { /* spatial check */ return true; }
    void PlaceAt(int x, int y, int z, string prefabID) { /* instantiate or record */ }
}

[System.Serializable]
public class PlacementRule
{
    public string prefabID;
    public int maxCount;
    public int minHeight;
    public int maxHeight;
    public float minSpacing;
}
```

---

## Genre Variants

### Colony Sim (rimWrld) — Biome-based flat map

Biome assignment via noise thresholds (temperature × rainfall). Multi-pass generation pipeline.

- `GenStep` pipeline: Base terrain → elevation → caves → rivers → resources → structures → pawns
- Biome selection from world-level noise (temperature + rainfall → biome table lookup)
- Feature placement: ores, ruins, geysers based on biome fertility/resource density
- Map size configurable (50×50 to 400×400 cells)

```csharp
// Simplified rimWrld-style biome selection
BiomeType GetBiome(float temperature, float rainfall)
{
    if (temperature < 0.2f) return BiomeType.Tundra;
    if (rainfall < 0.2f) return BiomeType.Desert;
    if (rainfall > 0.7f && temperature > 0.6f) return BiomeType.TropicalForest;
    return BiomeType.Temperate;
}
```

### Physics Battle (tabs) — Arena generation

Flat terrain with obstacle placement. Symmetric spawning zones for fair combat.

- Terrain is mostly flat with decorative height variation
- Obstacle placement uses mirror symmetry across center axis
- Spawn zones defined by distance from center (team A left, team B right)

### Tower Defense (throneFall) — Path-based levels

Predefined paths with procedural obstacle/decoration placement around fixed waypoints.

- Path nodes are hand-placed; decoration is procedural
- Enemy spawn points and castle positions are fixed anchors
- Procedural elements: tree density, rock clusters, puddles along path edges

---

## Pitfalls

- ❌ **Using UnityEngine.Random for world gen** — not seedable, different results every run, can't reproduce bugs
  → ✅ Use `System.Random(seed)` for reproducibility. Share seed in SaveData.

- ❌ **Generating everything in one frame** — massive stall on world load (1-10+ seconds frozen)
  → ✅ Spread across frames with coroutines or async chunks with loading screen

- ❌ **No seed persistence** — world looks different after reload
  → ✅ Save world seed in SaveData for identical regeneration on load

- ❌ **Noise scale too uniform** — terrain looks artificial and repetitive
  → ✅ Use multiple octaves (fractal noise) with decreasing amplitude per octave

- ❌ **No chunk boundary handling** — visible seams between chunks, terrain discontinuities
  → ✅ Overlap noise samples at chunk edges for seamless transitions