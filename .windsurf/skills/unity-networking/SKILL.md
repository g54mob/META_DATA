---
name: "unity-networking"
description: "Networking architecture — client/server split, RPC patterns ([ServerRpc]/[ObserversRpc]), ownership model, SyncVar/SyncList state sync, NetworkBehaviour lifecycle, authority validation, DataService integration, Photon vs FishNet variants, coupling allowlist for Unity rebuild projects"
---

# Unity Networking — Multiplayer Architecture

> **Applies to Unity projects with multiplayer (5/29 projects).**
> This skill defines the networking architecture: client/server split, RPC patterns,
> state synchronization, and authority model.
> These patterns cover FishNet, Photon PUN2, PhotonBolt, and generic concepts.
> Examples below reference SCHEDULE-1 (FishNet) and SMARKET (Photon PUN2).

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                          SERVER                                  │
│  Authoritative state — validates all mutations                   │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐  │
│  │ NetworkManager    │  │ Server-side Systems                  │  │
│  │ Connection mgmt   │  │ DataService (authoritative)          │  │
│  │ Spawn/Despawn     │  │ Validation logic                     │  │
│  └──────────────────┘  └──────────────────────────────────────┘  │
│         │ [ObserversRpc] / SyncVar                                │
│         ▼                                                        │
├──────────────────────────────────────────────────────────────────┤
│                         CLIENTS                                  │
│  Visual representation — request changes via [ServerRpc]         │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐  │
│  │ Local Prediction  │  │ Client-side Systems                  │  │
│  │ Optimistic UI     │  │ Field_ display, UI, input            │  │
│  └──────────────────┘  └──────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### Network Tiers

| Tier | Runs On | Purpose | Example Scripts |
|------|---------|---------|-----------------|
| **Server** | Server/Host only | Validate, mutate authoritative state | `[ServerRpc]` handlers, spawn logic |
| **Client** | All clients | Input, prediction, visual display | Input reading, UI, Field_ |
| **Shared** | Both | Synced state, common logic | `NetworkBehaviour`, SyncVar fields |

### Authority Model

```
Client A                    Server                     Client B
   │                          │                           │
   │ ──[ServerRpc]──────────→ │                           │
   │   "I want to toggle X"   │                           │
   │                          │ validate                  │
   │                          │ update state              │
   │                          │                           │
   │ ←──[ObserversRpc]─────── │ ──[ObserversRpc]────────→ │
   │   "X is now ON"          │   "X is now ON"           │
```

---

## FishNet Pattern (SCHEDULE-1)

### NetworkBehaviour Base

```csharp
/// <summary> I am a networked interactable toggle (door, switch, machine).
/// Client requests toggle via ServerRpc. Server validates and broadcasts to all. </summary>
[AddComponentMenu("[PROJECT]/Network/NetworkedToggleable")]
public class NetworkedToggleable : NetworkBehaviour
{
    #region private API
    [SyncVar(OnChange = nameof(OnStateChanged))]
    bool _isActivated;
    #endregion
    #region public API
    /// <summary> Client requests toggle. Server validates ownership. </summary>
    [ServerRpc(RequireOwnership = false)]
    public void SendToggle(NetworkConnection sender = null)
    {
        // → server-side validation
        if (!CanBeToggled(sender)) return;
        _isActivated = !_isActivated;
        // → SyncVar auto-broadcasts to all clients via OnStateChanged callback
    }
    #endregion
    #region private API
    /// <summary> Called on ALL clients when SyncVar changes.
    /// Updates visual state. </summary>
    void OnStateChanged(bool prev, bool next, bool asServer)
    {
        // → update visuals on all clients
        UpdateVisuals(next);
    }

    void UpdateVisuals(bool activated)
    {
        // → toggle animator, lights, sounds
    }
    #endregion
}
```

### RPC Attributes (FishNet)

| Attribute | Direction | Runs On | Use |
|-----------|-----------|---------|-----|
| `[ServerRpc]` | Client → Server | Server | Request state change |
| `[ObserversRpc]` | Server → All Clients | All clients | Broadcast state update |
| `[TargetRpc]` | Server → One Client | One client | Send player-specific data |
| `RequireOwnership = false` | — | — | Any client can call (not just owner) |
| `RunLocally = true` | — | — | Also runs on the calling side |

### State Sync

| Mechanism | Use When | Example |
|-----------|----------|---------|
| `[SyncVar]` | Simple values that change rarely | `bool isOpen`, `int health` |
| `[SyncList]` | Collections that change | `SyncList<ItemData> inventory` |
| `[SyncDictionary]` | Keyed collections | `SyncDictionary<string, int> stats` |
| `[ObserversRpc]` | Complex one-time broadcasts | "Player X scored", "Wave started" |

---

## Photon PUN2 Pattern (SMARKET, CONTENTWARN)

```csharp
using Photon.Pun;
using Photon.Realtime;

/// <summary> Photon-networked player controller. RPCs use [PunRPC] attribute. </summary>
public class NetworkedPlayer : MonoBehaviourPunCallbacks
{
    [PunRPC]
    void RPC_UpdateState(int newState)
    {
        // → runs on all clients
        _currentState = newState;
        UpdateVisuals();
    }

    void RequestStateChange(int state)
    {
        photonView.RPC("RPC_UpdateState", RpcTarget.All, state);
    }
}
```

| FishNet | Photon PUN2 | Notes |
|---------|-------------|-------|
| `NetworkBehaviour` | `MonoBehaviourPunCallbacks` | Base class |
| `[ServerRpc]` | `photonView.RPC(..., RpcTarget.Server)` | Client → Server |
| `[ObserversRpc]` | `photonView.RPC(..., RpcTarget.All)` | Server → All |
| `[SyncVar]` | Custom property sync | State sync |
| `NetworkConnection` | `PhotonPlayer` | Player identity |

---

## DataService Integration

```csharp
/// <summary> Server-authoritative DataService pattern.
/// Server owns the real data. Clients get read-only snapshots. </summary>
public class NetworkedShopDataService
{
    // → Server-side: full mutable DataService
    // → Client-side: read-only snapshot refreshed by RPCs

    public void ServerProcessPurchase(string itemID, int qty)
    {
        // → validate on server
        if (!CanAfford(itemID, qty)) return;
        // → mutate authoritative state
        DeductMoney(GetPrice(itemID) * qty);
        AddToInventory(itemID, qty);
        // → broadcast result to all clients
    }
}
```

---

## Coupling Allowlist

**Networking is an EXCEPTION to normal decoupling rules.** These imports are allowed:

| Import | Why Allowed |
|--------|------------|
| `NetworkBehaviour` | Required base class for any networked script |
| `[ServerRpc]` / `[ObserversRpc]` attributes | Core networking mechanism |
| `NetworkConnection` | Parameter for player identity |
| `SyncVar` / `SyncList` | State synchronization |
| `NetworkManager` | Spawn/despawn authority |
| `PhotonView` / `MonoBehaviourPunCallbacks` | Photon equivalents |

**Still NOT allowed:**
- Cross-`_-Systems/` concrete class imports (use interfaces + GameEvents)
- Direct references to other players' scripts (use RPCs)

---

## Genre Variants

### Co-op PvE (schedule-1, contentWarn)

Host-authoritative with all players on the same team. Simpler sync model — host runs simulation, clients mirror state. Trust model is relaxed (no anti-cheat needed).

- Host = server + client. Non-host players are pure clients
- Shared inventory/money uses single authoritative DataService on host
- Player actions validated on host, but no rollback needed (cooperative)
- Late-join sync: new player receives full state snapshot on connect

```csharp
/// <summary> Host-authoritative shared money. Clients request spend, host validates. </summary>
[ServerRpc(RequireOwnership = false)]
void SpendMoneyServerRpc(float amount, ServerRpcParams rpcParams = default)
{
    if (_moneyDataService.GetBalance() < amount) return; // → reject
    _moneyDataService.Subtract(amount);
    NotifyBalanceChangedObserversRpc(_moneyDataService.GetBalance()); // → all clients
}

[ObserversRpc]
void NotifyBalanceChangedObserversRpc(float newBalance)
{
    GameEvents.OnMoneyChanged?.Invoke(newBalance);
}
```

### Competitive (tabs, stickfgt)

Server-authoritative with strict validation. Anti-cheat concerns drive architecture — clients send inputs, server simulates, clients receive results. Rollback/reconciliation for responsive feel.

- Dedicated server or host with full authority (clients never trusted)
- Input-based sync: clients send input frames, server applies and broadcasts results
- Rollback: client predicts locally, server sends authoritative state, client reconciles
- Health/damage ONLY on server — clients show predicted VFX, server confirms

### Lobby-only (smarket)

Shared world state with no real-time combat sync. Relaxed timing requirements — eventual consistency is acceptable. Players see each other but don't interact at millisecond precision.

- Sync player positions at reduced rate (5-10 updates/sec, not 60)
- World state changes (building, buying) use reliable RPCs (not realtime)
- No rollback needed — actions are turn-based or async in nature
- Simpler NetworkObject pool — fewer simultaneous synced objects

---

## Pitfalls

- ❌ **Client mutating state directly** — client writes to game state without server validation, desyncs guaranteed
  → ✅ All mutations via `[ServerRpc]` — server validates first, then broadcasts

- ❌ **Missing authority check on server** — any client can invoke any ServerRpc, exploitable
  → ✅ Validate ownership/permission in every ServerRpc handler before processing

- ❌ **Syncing too much data every frame** — bandwidth explosion, lag spikes, packet loss
  → ✅ Use `[SyncVar]` for rare-change state, RPCs for one-shot events

- ❌ **FindObjectOfType for network objects** — unreliable with spawn timing, returns wrong instance
  → ✅ Use `NetworkManager.SpawnedObjects` or custom registry pattern

- ❌ **No prediction / laggy feel** — player waits full RTT for every action to show result
  → ✅ Optimistic prediction on client, reconcile on server response

- ❌ **Forgetting RequireOwnership = false** — non-owner players can't interact with shared objects
  → ✅ Default requires ownership — set `RequireOwnership = false` for public interactions

- ❌ **Spawning without NetworkManager.Spawn()** — object exists locally but invisible to other clients
  → ✅ All networked objects must go through `NetworkManager.Spawn()`

- ❌ **Testing with one client only** — race conditions and sync bugs only appear with 2+ clients
  → ✅ Always test with 2+ clients — use ParrelSync or multiple builds