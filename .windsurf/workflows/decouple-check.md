---
description: "Scan a system for concrete cross-system deps — the #1 rework cause. Use when: after modifying any system, checking coupling, verifying portability level"
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`. Ask: "Which system folder?" (or "all in phase X" or **"all phases"** for aggregate analysis)

## Scan

All decoupling rules are defined in [C# Conventions](../rules/csharp-conventions.md). Scan for violations:

2. For every `.cs` in the target `_-Systems/XxxSystem/`:
   - List `using` statements
   - Grep `Singleton<X>.Ins` (skip FREE: UIManager, DataManager)
   - Grep `GetComponent<ConcreteClass>()` (should be `<IInterface>()`)
   - Grep direct class refs from other `_-Systems/` folders
   - Grep `FindObjectOfType` → ❌ always bad, replace with [SerializeField] / Owner chain / GameEvents
   - Grep `FindObjectsByType` → ✅ acceptable ONLY in Bridge `Start()` for one-time initialization (Push-to-All variant). Flag if used outside Bridge or in Update/FixedUpdate.
   - Check GameEvents signatures for concrete types

## Classify

3. Per dependency:
   - **FREE** (GameEvents, Singleton<T>, UIManager, DataManager, Utils.*, GlobalEnumsX, phase-All/) → OK
   - **Interface dep** (only imports an interface .cs) → OK, portable
   - **Concrete dep** (imports class from another system) → ❌ MUST FIX

   **Domain-Specific Allowlists:**
   - **FSM:** States MAY reference their owner class (NPCController, PlayerController) — this is NOT a coupling violation. States should NOT reference other states or other systems.
   - **Networking:** Network scripts MAY import their DataService directly (server-authoritative pattern). Network scripts should NOT import other systems' concrete classes.
   - **Save/Load:** SaveManager MAY iterate ISaveable implementations. Individual ISaveable implementors should NOT reference SaveManager directly — they respond to GameEvents.

4. **80% rule check:** Count total scripts in the phase. Verify at least 80% live inside `_-Systems/`. If violated, flag every script outside `_-Systems/` and question whether it belongs to a system.

## Fix

4. Per concrete dep, suggest:
   - New interface (caller-defines or implementor-defines)
   - GameEvent (fire-and-forget)
   - Bridge script (1-3 method runtime context, lives on game-specific side)
   - Static accessor (display-only queries)

## Report

5. Per-system report: `# SystemName — L{n} ✅/❌` with deps table

## Aggregate Analysis (when scanning "all phases" or "all in phase X")

6. **Communication Matrix** — Build a cross-system relationship grid:
    ```
    | From \ To | SystemA | SystemB | SystemC | ... |
    |-----------|---------|---------|---------|-----|
    | SystemA   | —       | Event   | Interface | ... |
    | SystemB   | Read    | —       | Bridge  | ... |
    ```
    Legend: Event = GameEvents, Read = Singleton.Ins.Get*(), Interface = implements I*, Bridge = context push, Direct = concrete import (❌ BAD)

7. **Bridge Pattern Inventory** — Catalog every Bridge class found:
    ```
    | Bridge | Lives In (System) | Pattern | Pushes Context To | Phase |
    |--------|-------------------|---------|-------------------|-------|
    ```
    - For each bridge, classify using the 5 canonical variant names: **event-push** (subscribe to GameEvent → push context), **event-response** (listen + respond with data), **push-to-all** (FindObjectsByType in Start()), **event-chain** (bridge triggers secondary event), **static-accessor** (static property with `{ get; private set; }`)

8. **Interface Ownership Map** — Every interface across all scanned systems:
    ```
    | Interface | Owner System | Phase | Implementors (System → Phase) |
    |-----------|-------------|-------|-------------------------------|
    ```

9. **Coupling Hotspots** — Identify:
    - Systems with 3+ incoming connections (integration hubs — high risk if changed)
    - Systems with 3+ outgoing connections (dependency-heavy — consider splitting)
    - Any concrete deps (must fix)

## Update Global Docs

10. **Update `SystemPortabilityMap.md`** with corrected portability levels for all scanned systems and updated aggregate counts.

11. **Update `SystemIsolationAnalysis.md`** with the communication matrix, bridge inventory, and interface ownership map from steps 6-8. If it doesn't exist, recommend running `/init` step 26b to create it.