---
name: "unity-dialogue"
description: "Dialogue system architecture — DialogueManager singleton, dialogue tree ScriptableObjects, third-party integration (YarnSpinner, Ink, PixelCrushers), speaker/listener model, choice/branching, GameEvents integration, save/load for dialogue state, genre variants for Unity rebuild projects"
---

# Unity Dialogue System — Architecture Patterns

> **Universal pattern — applies to ALL projects with NPC/narrative dialogue.**
> This skill covers dialogue tree management, third-party engine integration, and
> speaker/listener communication. Projects: btycoon (PixelCrushers), noimnot (YarnSpinner), loop-2025 (Ink).

---

## Core Architecture

### DialogueManager (Singleton)

Central dispatcher — owns no dialogue data, only manages active conversation state and routing:

```csharp
/// <summary> I coordinate dialogue flow — start, advance, end conversations. </summary>
[AddComponentMenu("Managers/DialogueManager")]
public class DialogueManager : Singleton<DialogueManager>
{
    #region Inspector Fields
    [SerializeField] DialogueUI _dialogueUI;
    #endregion

    #region private API
    bool _isInDialogue;
    SO_DialogueDef _currentDialogue;
    int _currentNodeIndex;
    #endregion

    #region public API
    /// <summary> Start a dialogue sequence with an NPC. </summary>
    public void StartDialogue(SO_DialogueDef dialogue, Transform speaker)
    {
        if (_isInDialogue) return;
        _isInDialogue = true;
        _currentDialogue = dialogue;
        _currentNodeIndex = 0;
        GameEvents.RaiseDialogueStarted(dialogue, speaker);
        ShowCurrentNode();
    }

    /// <summary> Advance to next node or end dialogue. </summary>
    public void AdvanceDialogue()
    {
        _currentNodeIndex++;
        if (_currentNodeIndex >= _currentDialogue.nodes.Count)
            EndDialogue();
        else
            ShowCurrentNode();
    }

    /// <summary> Select a choice and branch accordingly. </summary>
    public void SelectChoice(int choiceIndex)
    {
        var node = _currentDialogue.nodes[_currentNodeIndex];
        if (choiceIndex < node.choices.Count)
        {
            int targetNode = node.choices[choiceIndex].targetNodeIndex;
            _currentNodeIndex = targetNode;
            GameEvents.RaiseChoiceMade(_currentDialogue, choiceIndex);
            ShowCurrentNode();
        }
    }

    public void EndDialogue()
    {
        _isInDialogue = false;
        GameEvents.RaiseDialogueEnded(_currentDialogue);
        _currentDialogue = null;
        _dialogueUI.Hide();
    }

    public bool IsInDialogue => _isInDialogue;
    #endregion

    void ShowCurrentNode()
    {
        var node = _currentDialogue.nodes[_currentNodeIndex];
        if (node.choices.Count > 0)
            _dialogueUI.ShowChoices(node.speakerName, node.text, node.choices);
        else
            _dialogueUI.ShowLine(node.speakerName, node.text);
    }
}
```

---

## Dialogue ScriptableObjects

### SO_DialogueDef — Dialogue Definition

```csharp
/// <summary> I define a complete dialogue tree with nodes and branching choices. </summary>
[CreateAssetMenu(fileName = "New Dialogue", menuName = "Data/Dialogue")]
public class SO_DialogueDef : ScriptableObject
{
    public string dialogueID;
    public List<DialogueNode> nodes = new();
}

[System.Serializable]
public class DialogueNode
{
    public string speakerName;
    [TextArea(2, 5)] public string text;
    public List<DialogueChoice> choices = new(); // → empty = simple advance
    public string animationTrigger; // → optional NPC animation
}

[System.Serializable]
public class DialogueChoice
{
    public string choiceText;
    public int targetNodeIndex; // → which node to jump to
    public string requiredFlag; // → optional: only show if flag is set
}
```

---

## Speaker / Listener Model

NPCs that can be spoken to implement `IDialogueSpeaker`:

```csharp
public interface IDialogueSpeaker
{
    SO_DialogueDef GetCurrentDialogue(); // → may change based on quest state
    Transform SpeakerTransform { get; }
    string SpeakerName { get; }
}

/// <summary> I provide dialogue when the player interacts with me. </summary>
[AddComponentMenu("NPC/DialogueSpeaker")]
public class NPCDialogueSpeaker : MonoBehaviour, IDialogueSpeaker, IInteractable
{
    #region Inspector Fields
    [SerializeField] SO_DialogueDef _defaultDialogue;
    [SerializeField] SO_DialogueDef _questActiveDialogue;
    [SerializeField] string _speakerName;
    #endregion

    public SO_DialogueDef GetCurrentDialogue()
    {
        // → quest-specific dialogue takes priority
        if (_questActiveDialogue != null && QuestManager.Ins.HasActiveQuestFor(_speakerName))
            return _questActiveDialogue;
        return _defaultDialogue;
    }

    public Transform SpeakerTransform => transform;
    public string SpeakerName => _speakerName;

    // IInteractable
    public void OnInteract()
    {
        DialogueManager.Ins.StartDialogue(GetCurrentDialogue(), transform);
    }
}
```

---

## GameEvents Integration

```csharp
// In GameEvents.cs (partial — dialogue events)
public static partial class GameEvents
{
    // when dialogue starts >>
    public static event Action<SO_DialogueDef, Transform> OnDialogueStarted;
    public static void RaiseDialogueStarted(SO_DialogueDef d, Transform speaker)
    {
        LogSubscribersCount(OnDialogueStarted, nameof(OnDialogueStarted));
        OnDialogueStarted?.Invoke(d, speaker);
    }
    // << when dialogue starts

    // when player makes a choice >>
    public static event Action<SO_DialogueDef, int> OnChoiceMade;
    public static void RaiseChoiceMade(SO_DialogueDef d, int choiceIndex)
    {
        LogSubscribersCount(OnChoiceMade, nameof(OnChoiceMade));
        OnChoiceMade?.Invoke(d, choiceIndex);
    }
    // << when player makes a choice

    // when dialogue ends >>
    public static event Action<SO_DialogueDef> OnDialogueEnded;
    public static void RaiseDialogueEnded(SO_DialogueDef d)
    {
        LogSubscribersCount(OnDialogueEnded, nameof(OnDialogueEnded));
        OnDialogueEnded?.Invoke(d);
    }
    // << when dialogue ends
}
```

---

## Third-Party Integration Patterns

### YarnSpinner (noimnot)

Wrap YarnSpinner's `DialogueRunner` behind the DialogueManager interface:

```csharp
/// <summary> I bridge YarnSpinner's DialogueRunner into our GameEvents system. </summary>
[AddComponentMenu("Dialogue/YarnSpinnerBridge")]
public class YarnSpinnerBridge : MonoBehaviour
{
    [SerializeField] Yarn.Unity.DialogueRunner _runner;

    void OnEnable()
    {
        _runner.onDialogueStart.AddListener(HandleYarnStart);
        _runner.onDialogueComplete.AddListener(HandleYarnEnd);
        _runner.onCommand += HandleYarnCommand;
    }

    void OnDisable()
    {
        _runner.onDialogueStart.RemoveListener(HandleYarnStart);
        _runner.onDialogueComplete.RemoveListener(HandleYarnEnd);
        _runner.onCommand -= HandleYarnCommand;
    }

    void HandleYarnStart() => GameEvents.RaiseDialogueStarted(null, transform);
    void HandleYarnEnd() => GameEvents.RaiseDialogueEnded(null);
    void HandleYarnCommand(string command)
    {
        // → route Yarn <<commands>> to game systems via GameEvents
        if (command.StartsWith("give_item"))
            GameEvents.RaiseItemGiven(command.Split(' ')[1]);
    }
}
```

### Ink (loop-2025)

Ink uses a runtime Story object. Wrap it similarly:

```csharp
/// <summary> I bridge Ink's Story runtime into our dialogue flow. </summary>
[AddComponentMenu("Dialogue/InkBridge")]
public class InkBridge : MonoBehaviour
{
    [SerializeField] TextAsset _inkJSON;
    Ink.Runtime.Story _story;

    void Awake() => _story = new Ink.Runtime.Story(_inkJSON.text);

    public void StartConversation(string knotName)
    {
        _story.ChoosePathString(knotName);
        GameEvents.RaiseDialogueStarted(null, transform);
        ContinueStory();
    }

    void ContinueStory()
    {
        if (_story.canContinue)
        {
            string text = _story.Continue();
            if (_story.currentChoices.Count > 0)
                ShowChoices(text, _story.currentChoices);
            else
                ShowLine(text);
        }
        else
        {
            GameEvents.RaiseDialogueEnded(null);
        }
    }

    public void SelectChoice(int index)
    {
        _story.ChooseChoiceIndex(index);
        ContinueStory();
    }

    void ShowLine(string text) { /* display via UI */ }
    void ShowChoices(string text, List<Ink.Runtime.Choice> choices) { /* display via UI */ }
}
```

### PixelCrushers Dialogue System (btycoon)

PixelCrushers provides its own UI and sequencer. Integration = event bridging only:

```csharp
/// <summary> I bridge PixelCrushers events into GameEvents. </summary>
[AddComponentMenu("Dialogue/PixelCrushersBridge")]
public class PixelCrushersBridge : MonoBehaviour
{
    void OnConversationStart(Transform actor)
    {
        // → PixelCrushers calls this automatically via SendMessage
        GameEvents.RaiseDialogueStarted(null, actor);
    }

    void OnConversationEnd(Transform actor)
    {
        GameEvents.RaiseDialogueEnded(null);
    }
}
```

---

## Save/Load for Dialogue State

Track which dialogues have been seen and choices made:

```csharp
[System.Serializable]
public class DialogueSaveData
{
    public List<string> completedDialogueIDs = new();
    public Dictionary<string, int> lastChoiceMade = new(); // dialogueID → choiceIndex
}
```

---

## Genre Variants

### Visual Novel (noimnot)

Full-screen dialogue with character portraits, background changes, and extensive branching. Dialogue IS the gameplay.

- Dialogue drives all progression — no free-roam between conversations
- Character portrait system (left/right speakers, emotion variants)
- Background scene changes triggered by Yarn/Ink commands
- History/log system for reviewing past dialogue
- Skip/auto-advance speed controls

### RPG Side-Dialogue (btycoon, obradin)

Brief NPC conversations providing quest info, lore, or shop access. Dialogue supports gameplay but isn't the core loop.

- Short exchanges (3-5 nodes typical)
- Dialogue often triggers other systems on end (open shop, give quest, unlock area)
- NPC has 2-3 dialogue variants based on relationship/quest state
- Player rarely makes meaningful choices — mostly "OK" / "Goodbye"

### Barks / Ambient Dialogue (contentWarn, schedule-1)

Non-interactive speech bubbles triggered by proximity or events. No player input, no branching.

- Fire-and-forget: NPC says line, no blocking input
- Triggered by proximity trigger, time-of-day, or random timer
- Pool of bark lines on NPC — picks randomly (no repeat until all played)
- World-space TextMeshPro with fade-out timer
- No save state needed — barks are ephemeral

```csharp
/// <summary> I display ambient barks above NPC head on proximity. </summary>
[AddComponentMenu("NPC/BarkSpeaker")]
public class BarkSpeaker : MonoBehaviour
{
    [SerializeField] string[] _barks;
    [SerializeField] TextMeshPro _barkText;
    [SerializeField] float _displayDuration = 3f;
    int _lastIndex = -1;

    public void TriggerBark()
    {
        int index;
        do { index = UnityEngine.Random.Range(0, _barks.Length); }
        while (index == _lastIndex && _barks.Length > 1);

        _lastIndex = index;
        _barkText.text = _barks[index];
        _barkText.gameObject.SetActive(true);
        StartCoroutine(HideAfter(_displayDuration));
    }

    IEnumerator HideAfter(float seconds)
    {
        yield return new WaitForSeconds(seconds);
        _barkText.gameObject.SetActive(false);
    }
}
```

---

## Pitfalls

- ❌ **Dialogue logic in UI scripts** — UI panels contain conversation state, branching, choice effects
  → ✅ DialogueManager/DataService owns state. UI only receives display commands.

- ❌ **Hardcoded NPC dialogue strings** — dialogue text baked into C# code, can't localize
  → ✅ All text in ScriptableObjects or third-party assets (Yarn files, Ink JSON, DB)

- ❌ **No pause of game systems during dialogue** — player can move, enemies attack during conversation
  → ✅ `OnDialogueStarted` fires GameEvent → PlayerMovement disables, AI pauses

- ❌ **Direct reference to third-party API in game scripts** — YarnSpinner/Ink calls in NPC controllers
  → ✅ Wrap behind Bridge class. Game code only talks to DialogueManager or GameEvents.

- ❌ **Choice effects applied immediately in UI** — clicking choice gives reward before server validates
  → ✅ Choice fires GameEvent → receiving system validates and applies effect

- ❌ **No dialogue history/state tracking** — repeated conversations, no memory of past choices
  → ✅ DialogueSaveData tracks completedIDs + choices. NPC checks before offering dialogue.