---
name: "unity-quest"
description: "Quest system architecture — QuestManager singleton, QuestSO ScriptableObjects, QuestObjective tracking, objective-based progression, completion callbacks, GameEvents integration, save/load persistence for Unity rebuild projects"
---

# Unity Quest — Quest System Architecture

> **Universal pattern — applies to ALL Unity projects with quest/mission systems.**
> This skill defines the quest architecture: QuestManager singleton, SO-driven quest definitions,
> objective tracking, step progression, and GameEvents integration.
> QuestSystem is L0 portable — zero `_-Systems/` dependencies.
> These patterns work for any Unity game with quests (5/29 projects use this).

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                      QuestManager                                │
│  Singleton<QuestManager>                                         │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────────────────────────────┐   │
│  │ Active Quests    │  │ Quest Database                       │   │
│  │ List<WQuest>     │  │ SO_QuestDef[] — all quest definitions│   │
│  │ Track progress   │  │ Referenced by QuestManager           │   │
│  └────────┬────────┘  └──────────────────────────────────────┘   │
│           ▼                                                      │
│  StartQuest() → track objectives → CompleteQuest()               │
│  GameEvents.RaiseQuestStarted/Completed/ObjectiveUpdated         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### SO_QuestDef — Quest Definition

```csharp
[CreateAssetMenu(menuName = "SO/SO_QuestDef", fileName = "SO_QuestDef")]
public class SO_QuestDef : ScriptableObject
{
    public string questName;
    [TextArea(2, 4)] public string description;
    public QuestObjective[] objectives;
    public SO_QuestDef nextQuest;           // → chain quests
    public bool isMainQuest;
}

[Serializable]
public class QuestObjective
{
    public string objectiveName;
    [TextArea(1, 2)] public string description;
    public ObjectiveType type;               // → collect, deliver, visit, kill, interact
    public string targetID;                  // → maps to TagType or SO_ name
    public int requiredCount;
}
```

### WQuest — Session Wrapper

```csharp
/// <summary> I track runtime progress for one active quest. </summary>
public class WQuest
{
    public SO_QuestDef questDef;
    public int[] objectiveProgress;          // → current count per objective
    public bool isCompleted;

    public WQuest(SO_QuestDef def)
    {
        questDef = def;
        objectiveProgress = new int[def.objectives.Length];
    }

    public bool IsObjectiveComplete(int index)
        => objectiveProgress[index] >= questDef.objectives[index].requiredCount;

    public bool AreAllObjectivesComplete()
        => objectiveProgress.Select((p, i) => IsObjectiveComplete(i)).All(c => c);
}
```

### QuestDataService — Collection Manager

```csharp
public class QuestDataService
{
    List<WQuest> ACTIVE_QUEST = new List<WQuest>();
    List<SO_QuestDef> COMPLETED_QUEST = new List<SO_QuestDef>();

    public void StartQuest(SO_QuestDef def)
    {
        if (ACTIVE_QUEST.Any(q => q.questDef == def)) return;
        ACTIVE_QUEST.Add(new WQuest(def));
    }

    public void UpdateObjective(string targetID, ObjectiveType type, int amount = 1)
    {
        foreach (var wQuest in ACTIVE_QUEST)
        {
            for (int i = 0; i < wQuest.questDef.objectives.Length; i++)
            {
                var obj = wQuest.questDef.objectives[i];
                if (obj.targetID == targetID && obj.type == type)
                    wQuest.objectiveProgress[i] = Mathf.Min(
                        wQuest.objectiveProgress[i] + amount, obj.requiredCount);
            }
        }
    }

    public void CompleteQuest(WQuest wQuest)
    {
        wQuest.isCompleted = true;
        ACTIVE_QUEST.Remove(wQuest);
        COMPLETED_QUEST.Add(wQuest.questDef);
    }

    public List<WQuest> GetActiveQuests() => ACTIVE_QUEST;
    public bool IsQuestCompleted(SO_QuestDef def) => COMPLETED_QUEST.Contains(def);
}
```

### GameEvents Integration

```csharp
public static partial class GameEvents
{
    // when quest starts >>
    public static event Action<SO_QuestDef> OnQuestStarted;
    public static void RaiseQuestStarted(SO_QuestDef def) { ... }
    // << when quest starts

    // when objective progress updates >>
    public static event Action<SO_QuestDef, int, int> OnObjectiveUpdated;
    public static void RaiseObjectiveUpdated(SO_QuestDef def, int objectiveIndex, int progress) { ... }
    // << when objective progress updates

    // when quest completes >>
    public static event Action<SO_QuestDef> OnQuestCompleted;
    public static void RaiseQuestCompleted(SO_QuestDef def) { ... }
    // << when quest completes
}
```

---

## Genre Variants

### Linear Story (noimnot, obradin)

Sequential quest chain — one active quest at a time, next unlocks on completion. No branching, no parallel quests. Driven by narrative progression.

- `SO_QuestDef.nextQuest` chains quests in fixed order
- Only one `WQuest` active at a time in QuestDataService
- Completion triggers `OnQuestCompleted` → auto-starts next
- No quest journal browsing needed — just current objective display

```csharp
/// <summary> Linear quest chain — auto-advances to next quest on completion. </summary>
void HandleQuestCompleted(SO_QuestDef completed)
{
    if (completed.nextQuest != null)
        _questDataService.StartQuest(completed.nextQuest);
    else
        GameEvents.OnAllQuestsComplete?.Invoke(); // → story finished
}
```

### Open World (basementToSky, rimWrld)

Multiple active quests simultaneously. Discovery-based unlocking — entering areas or talking to NPCs reveals new quests. Player chooses which to pursue.

- `List<WQuest> _activeQuests` — multiple tracked simultaneously
- Quests discovered via trigger zones or NPC interaction (not auto-given)
- Priority system: main quests vs side quests vs daily tasks
- Quest log UI with categories, filtering, tracking toggle

### Tycoon Milestones (minemgl, btycoon, smarket)

Threshold-based objectives — "earn $1000", "build 5 machines", "serve 100 customers". Not narrative quests but progression milestones that unlock features.

- Objectives track numeric thresholds (`currentCount >= requiredCount`)
- Counting driven by GameEvents (OnMoneEarned, OnBuildingPlaced) — passive tracking
- Completion unlocks game features (new items, areas, mechanics) not story beats
- No explicit "accept quest" — milestones always active, shown as achievements

```csharp
/// <summary> I passively track milestone progress via GameEvents. </summary>
void OnEnable()
{
    GameEvents.OnMoneyEarned += HandleMoneyEarned;
}

void HandleMoneyEarned(float amount)
{
    foreach (var quest in _questDataService.GetActiveByType(ObjectiveType.EarnMoney))
    {
        quest.IncrementObjective("money", amount);
        if (quest.IsComplete) GameEvents.OnMilestoneReached?.Invoke(quest.Definition);
    }
}
```

---

## Pitfalls

- ❌ **Quest logic in UI scripts** — UI panels contain quest progression logic, impossible to test without scene
  → ✅ QuestDataService = pure C#. UI only displays via Field_ pattern

- ❌ **Hardcoded quest checks** — `if (ironOreCount >= 5)` scattered through codebase
  → ✅ Use `ObjectiveType` enum + `targetID` string — fully data-driven

- ❌ **No save/load for quest progress** — quest state lost on reload
  → ✅ QuestSaveData with objective progress arrays, persisted via SaveManager

- ❌ **Direct quest-to-quest references** — Quest A has concrete ref to Quest B, can't reorder
  → ✅ Use `nextQuest` field on SO_QuestDef for chaining (null = terminal)

- ❌ **Polling quest state in Update()** — checking completion every frame wastes CPU
  → ✅ Subscribe to `OnObjectiveUpdated` GameEvent, check completion on event only