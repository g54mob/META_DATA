---
name: "unity-ai-navigation"
description: "AI Navigation architecture — NavMeshAgent setup, FSM integration, patrol/chase/flee patterns, A*Pathfinding variant, dynamic obstacle avoidance, group movement, NPC scheduling, waypoint systems for Unity rebuild projects"
---

# Unity AI Navigation — Pathfinding Architecture

> **Universal pattern — applies to ALL Unity projects with NPC/enemy pathfinding.**
> This skill defines the AI navigation architecture: NavMeshAgent setup, FSM integration,
> patrol waypoints, and pathfinding library variants.
> NavigationSystem is L0 portable — zero `_-Systems/` dependencies.
> These patterns work for any Unity game with AI movement (7/29 projects use this).
> Examples below reference SMARKET and SCHEDULE-1 patterns — substitute with your project's equivalents.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     NPCController                                │
│  MonoBehaviour — owns StateMachine + NavMeshAgent                │
│                                                                  │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐   │
│  │ StateMachine  │  │ NavMeshAgent   │  │ Shared Context       │   │
│  │ (IState FSM)  │  │ (pathfinding)  │  │ Animator, waypoints  │   │
│  └──────┬───────┘  └───────────────┘  └──────────────────────┘   │
│         │                                                        │
│  ┌──────┴──────────────────────────────────────────────┐         │
│  │ IdleState → PatrolState → ChaseState → AttackState  │         │
│  │ Each state controls NavMeshAgent via controller ref │         │
│  └─────────────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────────────┘
```

---

## Core Pattern — NavMeshAgent + FSM

### NavMeshAgent Setup

```csharp
/// <summary> I configure NavMeshAgent with per-NPC settings.
/// States control movement via Agent property. </summary>
[AddComponentMenu("[PROJECT]/NPC/NPCController")]
[RequireComponent(typeof(NavMeshAgent))]
public class NPCController : MonoBehaviour
{
    #region Inspector Fields
    [Header("Navigation")]
    [SerializeField] float _walkSpeed = 3.5f;
    [SerializeField] float _runSpeed = 6f;
    [SerializeField] float _stoppingDistance = 0.5f;
    [SerializeField] float _detectionRadius = 10f;

    [Header("Patrol")]
    [SerializeField] Transform[] _patrolWaypoints;
    #endregion
    #region private API
    NavMeshAgent _agent;
    StateMachine _stateMachine;
    int _currentWaypointIndex;
    #endregion
    #region public API
    public NavMeshAgent Agent => _agent;
    public StateMachine StateMachine => _stateMachine;
    public Transform[] PatrolWaypoints => _patrolWaypoints;
    public int CurrentWaypointIndex { get => _currentWaypointIndex; set => _currentWaypointIndex = value; }
    public float DetectionRadius => _detectionRadius;

    public void SetSpeed(float speed) => _agent.speed = speed;
    public void SetWalkSpeed() => _agent.speed = _walkSpeed;
    public void SetRunSpeed() => _agent.speed = _runSpeed;

    public bool HasReachedDestination()
        => !_agent.pathPending && _agent.remainingDistance <= _agent.stoppingDistance;
    #endregion
    #region Unity Life Cycle
    void Awake()
    {
        _agent = GetComponent<NavMeshAgent>();
        _agent.speed = _walkSpeed;
        _agent.stoppingDistance = _stoppingDistance;
        _stateMachine = new StateMachine();
    }

    void Start() => _stateMachine.ChangeState(new IdleState(this));
    void Update() => _stateMachine.Update();
    #endregion
}
```

### Patrol State

```csharp
/// <summary> I make the NPC walk between waypoints in order.
/// When reaching a waypoint, I move to the next one. </summary>
public class PatrolState : IState
{
    private readonly NPCController _controller;

    public PatrolState(NPCController controller) => _controller = controller;

    public void Enter()
    {
        _controller.SetWalkSpeed();
        GoToNextWaypoint();
    }

    public void Update()
    {
        // → check for threats
        if (_controller.HasTargetInRange())
        {
            _controller.StateMachine.ChangeState(new ChaseState(_controller));
            return;
        }

        // → reached waypoint? go to next
        if (_controller.HasReachedDestination())
            GoToNextWaypoint();
    }

    public void Exit() { }

    void GoToNextWaypoint()
    {
        if (_controller.PatrolWaypoints.Length == 0) return;
        _controller.Agent.SetDestination(
            _controller.PatrolWaypoints[_controller.CurrentWaypointIndex].position);
        _controller.CurrentWaypointIndex =
            (_controller.CurrentWaypointIndex + 1) % _controller.PatrolWaypoints.Length;
    }
}
```

---

## Waypoint Patterns

### Inspector-Defined Waypoints (Simple)

```csharp
[SerializeField] Transform[] _patrolWaypoints;  // → drag waypoint GOs in inspector
```

### Dynamic Waypoints (NavMesh Sampling)

```csharp
/// <summary> Picks a random point on NavMesh within radius. </summary>
public Vector3 GetRandomNavMeshPoint(float radius)
{
    Vector3 randomDir = Random.insideUnitSphere * radius + transform.position;
    if (NavMesh.SamplePosition(randomDir, out NavMeshHit hit, radius, NavMesh.AllAreas))
        return hit.position;
    return transform.position;
}
```

---

## A*Pathfinding Variant

5 projects use A*Pathfinding Pro instead of Unity NavMesh (btycoon, schedule-1, tabs, throneFall, smarket):

```csharp
// A*Pathfinding equivalent of NavMeshAgent
using Pathfinding;

[RequireComponent(typeof(AIPath))]  // replaces NavMeshAgent
public class NPCController : MonoBehaviour
{
    AIPath _aiPath;  // A* movement component

    void Awake() => _aiPath = GetComponent<AIPath>();

    // → Set destination (A* uses different API)
    public void SetDestination(Vector3 target) => _aiPath.destination = target;
    public bool HasReachedDestination() => _aiPath.reachedDestination;
    public void StopMoving() => _aiPath.canMove = false;
    public void ResumeMoving() => _aiPath.canMove = true;
}
```

**Key differences:**
| Feature | Unity NavMesh | A*Pathfinding |
|---------|--------------|---------------|
| Component | `NavMeshAgent` | `AIPath` / `RichAI` |
| Set destination | `agent.SetDestination(pos)` | `aiPath.destination = pos` |
| Reached check | `remainingDistance <= stoppingDistance` | `aiPath.reachedDestination` |
| Stop | `agent.isStopped = true` | `aiPath.canMove = false` |
| Baking | NavMesh window | AstarPath graph scan |

---

## Group Movement

When multiple NPCs move together (squads, crowds):

```csharp
/// <summary> Offsets each NPC's destination to avoid stacking. </summary>
public void SetGroupDestination(Vector3 target, int memberIndex, int totalMembers)
{
    float angle = (360f / totalMembers) * memberIndex * Mathf.Deg2Rad;
    float radius = 1.5f;
    Vector3 offset = new Vector3(Mathf.Cos(angle), 0, Mathf.Sin(angle)) * radius;
    _agent.SetDestination(target + offset);
}
```

---

## Genre Variants

### Tycoon NPC (btycoon, smarket)

Customers/workers follow scheduled routes between service points. Not traditional combat patrol — instead uses time-of-day schedules and queue systems.

- NPCs have daily route lists (`List<Transform> _schedule`) keyed to time phases
- Arrival at waypoint triggers service interaction (buy, work, eat) via GameEvents
- Queue system at busy points — NPC waits in line, dequeues on service completion
- Speed varies by NPC type (customer = slow, employee = normal)

```csharp
/// <summary> I navigate an NPC through a daily schedule of service points. </summary>
public class ScheduledRouteState : IState
{
    NPCController _controller;
    int _currentStop;
    List<Transform> _todayRoute;

    public void Enter()
    {
        _todayRoute = _controller.ScheduleDataService.GetRouteForPhase(TimeManager.CurrentPhase);
        _currentStop = 0;
        NavigateToNext();
    }

    public void Update()
    {
        if (!_controller.Agent.pathPending && _controller.Agent.remainingDistance <= _controller.Agent.stoppingDistance)
        {
            _currentStop++;
            if (_currentStop >= _todayRoute.Count)
                _controller.StateMachine.ChangeState(new IdleState(_controller));
            else
                NavigateToNext();
        }
    }

    void NavigateToNext() => _controller.Agent.SetDestination(_todayRoute[_currentStop].position);
    public void Exit() { }
}
```

### Horror AI (wrngfloor, welcmHome)

Enemy AI focuses on player detection with stealth mechanics. Patrol → Alert → Chase → Search → Return pattern. Line-of-sight and sound detection instead of simple distance triggers.

- Detection via SphereCast (vision cone) + noise radius (player sprinting/using items)
- Alert state on partial detection (heard noise, glimpsed player)
- Chase breaks off after losing line-of-sight for X seconds → Search state
- NavMeshAgent speed varies per state (patrol=slow, chase=fast)

```csharp
public class DetectionState : IState
{
    EnemyController _controller;
    float _alertLevel; // 0-1, triggers chase at 1.0

    public void Update()
    {
        if (HasLineOfSight())
            _alertLevel += Time.deltaTime * _controller.DetectionSpeed;
        else
            _alertLevel -= Time.deltaTime * _controller.CooldownSpeed;

        _alertLevel = Mathf.Clamp01(_alertLevel);
        if (_alertLevel >= 1f)
            _controller.StateMachine.ChangeState(new ChaseState(_controller));
    }

    bool HasLineOfSight()
    {
        var dir = _controller.PlayerTransform.position - _controller.EyePoint.position;
        if (Vector3.Angle(_controller.EyePoint.forward, dir) > _controller.VisionAngle) return false;
        return !Physics.Raycast(_controller.EyePoint.position, dir.normalized, dir.magnitude, _controller.ObstacleMask);
    }

    public void Enter() => _alertLevel = 0f;
    public void Exit() { }
}
```

### Colony Sim (rimWrld)

Colonists choose paths based on job priority, not just distance. Group movement coordination, priority queuing for shared resources, and multi-stop task chains.

- Pathfinding weighted by job priority (urgent tasks override shorter paths)
- Colonists reserve resources at destination before pathing (prevents two colonists walking to same item)
- Group movement uses formation offsets (soldiers patrol together)
- Long paths split into waypoint segments to allow interruption (new higher-priority job)

---

## Pitfalls

- ❌ **SetDestination() every frame** — recalculates path every frame, destroys performance
  → ✅ Set once on Enter(), re-set only when target moves significantly (distance check)

- ❌ **NavMeshAgent on non-baked area** — agent fails silently, NPC frozen or teleporting
  → ✅ Ensure NavMesh is baked. Check `agent.isOnNavMesh` before commands

- ❌ **NPC falls through floor** — NavMesh gaps or dynamic obstacles not accounted for
  → ✅ NavMesh surface must cover walkable geometry. Use NavMeshObstacle for dynamic blockers

- ❌ **States directly accessing NavMeshAgent** — tight coupling between state classes and Unity component
  → ✅ States access via controller's `Agent` property (owner chain pattern)

- ❌ **No stopping distance** — NPC overshoots target, jitters back and forth
  → ✅ Set `stoppingDistance` > 0 — prevents oscillation at destination

- ❌ **Checking remainingDistance without pathPending** — distance reads stale before path calculated
  → ✅ Check `!pathPending && remainingDistance <= stoppingDistance`

- ❌ **Giant NavMesh for small area** — unnecessary computation, NPC finds paths through walls
  → ✅ Use area masks to restrict walkable regions

- ❌ **Missing animation sync** — NPC slides (feet don't match movement speed)
  → ✅ Use `agent.velocity.magnitude` to drive animator blend tree speed parameter