---
name: "unity-fsm"
description: "Finite State Machine architecture — IState interface with Enter/Update/Exit, StateMachine class, one-class-per-state pattern, constructor injection, enum state IDs, AI/UI/gameplay FSM integration, transition rules for Unity rebuild projects"
---

# Unity FSM — Finite State Machine Architecture

> **Universal pattern — applies to ALL Unity projects with stateful AI, game phases, or complex UI flows.**
> This skill defines the FSM architecture: IState interface, StateMachine class, one-class-per-state,
> constructor injection, and clean transition rules.
> FSM is L0 portable — zero `_-Systems/` dependencies.
> These patterns work for any Unity game with state management needs (14/29 projects use this).
> Examples below reference SMARKET and THRONEFALL patterns — substitute with your project's equivalents.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     NPCController                                │
│  MonoBehaviour — owns StateMachine + shared context              │
│                                                                  │
│  ┌──────────────────┐  ┌────────────────────────────────────┐    │
│  │  StateMachine     │  │ Shared Context                     │    │
│  │  currentState     │  │ NavMeshAgent, Animator, Transform  │    │
│  │  ChangeState()    │  │ targetTransform, detectionRadius   │    │
│  │  Update()         │  │ (read by all states via controller)│    │
│  └────────┬─────────┘  └────────────────────────────────────┘    │
│           │                                                      │
│           ▼                                                      │
│  ┌────────┬──────────┬────────────┬───────────┐                  │
│  │ Idle   │ Patrol   │ Chase      │ Attack    │                  │
│  │ State  │ State    │ State      │ State     │                  │
│  │Enter() │Enter()   │Enter()     │Enter()    │                  │
│  │Update()│Update()  │Update()    │Update()   │                  │
│  │Exit()  │Exit()    │Exit()      │Exit()     │                  │
│  └────────┴──────────┴────────────┴───────────┘                  │
│  Each state receives controller ref via constructor               │
└──────────────────────────────────────────────────────────────────┘
```

---

## When to Use FSM vs Alternatives

| Complexity | Pattern | Example | Decision |
|-----------|---------|---------|----------|
| ≤3 trivial states | Enum + switch | Door (open/closed/locked) | Switch is fine |
| 4-10 states with transitions | **IState + StateMachine** | NPC AI, game phases, UI panels | **Use this skill** |
| 10+ states with complex trees | BehaviorTree | Colony sim AI, complex enemy AI | Consider external library |
| Two alternating states | Bool flag | Toggle (on/off) | No FSM needed |

---

## Core Components

### IState — Interface Contract

```csharp
/// <summary>
/// Contract for FSM states. One class per state.
/// Every Enter() allocation/subscription MUST have matching cleanup in Exit().
///
/// Who implements me: IdleState, PatrolState, ChaseState, AttackState, etc.
/// Who uses me: StateMachine.ChangeState() — delegates all behavior to current IState.
/// </summary>
public interface IState
{
    /// <summary> Called once when entering this state.
    /// Set up animations, subscriptions, timers. </summary>
    void Enter();

    /// <summary> Called every frame while this state is active.
    /// Check transition conditions, execute state behavior. </summary>
    void Update();

    /// <summary> Called once when leaving this state.
    /// Clean up everything allocated in Enter(). </summary>
    void Exit();
}
```

---

### StateMachine — State Holder

```csharp
/// <summary>
/// Holds the current IState. ChangeState() calls Exit() on old, Enter() on new.
/// Zero game logic — only delegates to IState methods.
/// </summary>
public class StateMachine
{
    private IState _currentState;

    /// <summary> Transitions to a new state. Calls Exit() on current, Enter() on new.
    /// Null-safe — works even if no state was set yet. </summary>
    public void ChangeState(IState newState)
    {
        _currentState?.Exit();
        _currentState = newState;
        _currentState?.Enter();
    }

    /// <summary> Delegates to current state's Update(). Call from controller's Update(). </summary>
    public void Update()
    {
        _currentState?.Update();
    }
}
```

**Key Design Decisions:**
- **Pure C# class** — not a MonoBehaviour. Owned by the controller MonoBehaviour.
- **Null-safe** — `?.` on Exit/Enter/Update handles initial null state.
- **Zero game logic** — StateMachine doesn't know what states do. It only calls Enter/Update/Exit.

---

### State Implementation — One Class Per State

```csharp
/// <summary> I make the NPC stand still and look for targets.
/// When a target enters detection range, I transition to ChaseState. </summary>
public class IdleState : IState
{
    private readonly NPCController _controller;

    public IdleState(NPCController controller) => _controller = controller;

    public void Enter()
    {
        // → stop movement, play idle animation
        _controller.Agent.isStopped = true;
        _controller.Animator.SetBool(AnimParamType.isMoving.ToString(), false);
    }

    public void Update()
    {
        // → check for targets in range
        if (_controller.HasTargetInRange())
            _controller.StateMachine.ChangeState(new ChaseState(_controller));
    }

    public void Exit()
    {
        // → resume movement capability
        _controller.Agent.isStopped = false;
    }
}
```

```csharp
/// <summary> I make the NPC chase its current target.
/// When close enough, I transition to AttackState.
/// When target is lost, I return to IdleState. </summary>
public class ChaseState : IState
{
    private readonly NPCController _controller;

    public ChaseState(NPCController controller) => _controller = controller;

    public void Enter()
    {
        // → start running animation
        _controller.Animator.SetBool(AnimParamType.isMoving.ToString(), true);
    }

    public void Update()
    {
        // → move toward target
        if (_controller.CurrentTarget == null)
        {
            _controller.StateMachine.ChangeState(new IdleState(_controller));
            return;
        }

        _controller.Agent.SetDestination(_controller.CurrentTarget.position);

        // → close enough to attack?
        float dist = Vector3.Distance(_controller.transform.position,
            _controller.CurrentTarget.position);
        if (dist <= _controller.AttackRange)
            _controller.StateMachine.ChangeState(new AttackState(_controller));
    }

    public void Exit()
    {
        // → stop navigation
        _controller.Agent.ResetPath();
    }
}
```

---

### NPCController — Owner MonoBehaviour

```csharp
/// <summary> I own the StateMachine and shared context for one NPC.
/// States read my properties (Agent, Animator, Target) — they never import each other. </summary>
[AddComponentMenu("[PROJECT]/NPC/NPCController")]
public class NPCController : MonoBehaviour
{
    #region Inspector Fields
    [SerializeField] float _detectionRadius = 10f;
    [SerializeField] float _attackRange = 2f;
    #endregion
    #region private API
    NavMeshAgent _agent;
    Animator _animator;
    StateMachine _stateMachine;
    Transform _currentTarget;
    #endregion
    #region public API — Owner chain (read by states)
    public NavMeshAgent Agent => _agent;
    public Animator Animator => _animator;
    public StateMachine StateMachine => _stateMachine;
    public Transform CurrentTarget => _currentTarget;
    public float AttackRange => _attackRange;

    public bool HasTargetInRange()
    {
        // → OverlapSphere to find closest enemy
        var colliders = Physics.OverlapSphere(transform.position, _detectionRadius);
        foreach (var col in colliders)
        {
            if (col.HasTag(TagType.player))
            {
                _currentTarget = col.transform;
                return true;
            }
        }
        _currentTarget = null;
        return false;
    }
    #endregion
    #region Unity Life Cycle
    void Awake()
    {
        _agent = GetComponent<NavMeshAgent>();
        _animator = GetComponent<Animator>();
        _stateMachine = new StateMachine();
    }

    void Start()
    {
        // → begin in idle state
        _stateMachine.ChangeState(new IdleState(this));
    }

    void Update()
    {
        // → delegate to current state
        _stateMachine.Update();
    }
    #endregion
}
```

---

## Nested IState Pattern (Alternative)

When states are simple and tightly coupled to ONE controller, nest IState inside the controller:

```csharp
/// <summary> I control the baker NPC's behavior via nested states. </summary>
public class Baker : MonoBehaviour
{
    public interface IState
    {
        void Enter();
        void Update();
        void Exit();
    }

    private IState _currentState;

    public void ChangeState(IState newState)
    {
        _currentState?.Exit();
        _currentState = newState;
        _currentState?.Enter();
    }

    // → Nested state classes access Baker's private members
    public class IdleState : IState { /* ... */ }
    public class WorkState : IState { /* ... */ }
    public class BreakState : IState { /* ... */ }
}
```

**When to nest:**
- States are simple (<20 lines each)
- Only ONE controller uses these states
- States need access to controller's private members

**When to use separate files:**
- States are complex (20+ lines)
- States might be reused by different controllers
- System has 5+ states (keeps files manageable)

---

## Enum State IDs (Optional — For External Observation)

When other systems need to know WHICH state an FSM is in (e.g., UI showing enemy state):

```csharp
// In GlobalEnumsX.cs
public enum NPCStateID { idle, patrol, chase, attack, flee }

// In NPCController
public NPCStateID CurrentStateID { get; private set; }

public void ChangeState(IState newState, NPCStateID stateID)
{
    _stateMachine.ChangeState(newState);
    CurrentStateID = stateID;
    // purpose: notify UI/debug systems of state change
    GameEvents.RaiseNPCStateChanged(this, stateID);
}
```

---

## FSM Integration Patterns

### AI FSM (NPC/Enemy) — Most Common

```
_-Systems/NPCSystem/
├── NPCController.cs        ← owns StateMachine + shared context
├── StateMachine.cs          ← generic, reusable
├── Interface/
│   └── IState.cs            ← contract
├── StateSub/                ← one file per state
│   ├── IdleState.cs
│   ├── PatrolState.cs
│   ├── ChaseState.cs
│   └── AttackState.cs
├── Test.md
└── Dependency.md
```

### Gameplay Phase FSM (Game Loop)

```csharp
// Game phases: Lobby → Countdown → Playing → GameOver → Results
public class GamePhaseManager : Singleton<GamePhaseManager>
{
    StateMachine _stateMachine = new StateMachine();

    void Start()
    {
        _stateMachine.ChangeState(new LobbyPhase(this));
    }

    void Update() => _stateMachine.Update();
}

// Each phase is its own IState class
public class LobbyPhase : IState
{
    private readonly GamePhaseManager _manager;
    public LobbyPhase(GamePhaseManager manager) => _manager = manager;

    public void Enter()
    {
        // purpose: show lobby UI
        GameEvents.RaiseOpenLobbyView();
    }
    public void Update()
    {
        if (_manager.AllPlayersReady)
            _manager.StateMachine.ChangeState(new CountdownPhase(_manager));
    }
    public void Exit()
    {
        // purpose: close lobby UI
        GameEvents.RaiseCloseLobbyView();
    }
}
```

### UI Panel FSM (Complex Multi-Step Menus)

```csharp
// UI states: Browse → Cart → Checkout → Confirmation
public class ShopUIStateMachine : MonoBehaviour
{
    StateMachine _stateMachine = new StateMachine();

    public void ShowBrowse() => _stateMachine.ChangeState(new BrowseState(this));
    public void ShowCart() => _stateMachine.ChangeState(new CartState(this));
}
```

---

## Transition Diagram Convention

Document FSM transitions in FLOW.md or Test.md:

```
┌────────┐  target found  ┌────────┐  in range  ┌────────┐
│  Idle  │ ──────────────→ │ Chase  │ ─────────→ │ Attack │
└────────┘                 └────────┘            └────────┘
     ↑                          │                     │
     │    target lost           │     target dead     │
     └──────────────────────────┘     ┌───────────────┘
                                      ▼
                               ┌────────────┐
                               │  Return    │
                               │  To Post   │
                               └────────────┘
```

---

## Pitfalls

- ❌ **Giant switch for 4+ states** — all state logic in one file, grows exponentially, impossible to test
  → ✅ Use IState pattern — one class per state

- ❌ **States referencing each other directly** — `new ChaseState()` inside IdleState creates tight coupling
  → ✅ States → `StateMachine.ChangeState()` only, never instantiate other states inside logic

- ❌ **Missing Exit() cleanup** — subscriptions, timers, coroutines from Enter() leak into next state
  → ✅ Every Enter() allocation/subscription MUST have matching Exit() cleanup

- ❌ **State logic in controller's Update()** — defeats the purpose of FSM, controller becomes god-object
  → ✅ Controller's Update() only calls `_stateMachine.Update()` — logic lives in state classes

- ❌ **FindObjectOfType in state constructor** — slow, fragile, breaks on scene transitions
  → ✅ Constructor receives controller ref — states access world via controller properties

- ❌ **No null-safety on currentState** — null initial state causes NullRef on first Update()
  → ✅ StateMachine uses `?.` — handles null initial state gracefully

- ❌ **Enum-only FSM for complex behavior** — enum + switch scales poorly, can't override per-state
  → ✅ Enum + switch OK for ≤3 states. 4+ states → IState classes

- ❌ **States storing persistent data** — data lost on state transition, duplicated across states
  → ✅ States are transient — persistent data lives in controller or DataService

- ❌ **Direct state-to-state transitions** — bypasses StateMachine, Exit() never called
  → ✅ `_controller.StateMachine.ChangeState(new X(_controller))` — always go through StateMachine

- ❌ **Missing GameEvents for state changes** — external systems poll `currentState` field, tight coupling
  → ✅ External systems listen via GameEvents, never poll `currentState`