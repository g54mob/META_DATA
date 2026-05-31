---
description: Scan a system for concrete cross-system dependencies — the #1 rework cause. Use after modifying any system, checking coupling, verifying portability level.
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`. Ask: "Which phase?" → `{PHASE}` (or "all")

## Scan

2. For each system in `LEARN/{PROJECT}/phase-{PHASE}/_-Systems/`:
   - Read every `.cs` file in the system folder
   - List every `using` statement, every class reference, every method call
   - Classify each reference:
     - **FREE**: GameEvents, Singleton<T>, UIManager, DataManager, Utils, GlobalEnums, TimeSince/TimeUntil
     - **Interface**: references to `I...` interfaces (portable)
     - **Concrete**: direct class reference to another `_-Systems/` folder (VIOLATION)

## Report

For each system, output:
- Portability level (L0 = zero deps, L1+ = count concrete deps)
- List of violations: `file:line → references ConcreteClass from OtherSystem`
- Suggested fix: GameEvents? Interface? Bridge?

## Fix Rules

| Current | Fix |
|---------|-----|
| Direct method call across systems | GameEvents (fire-and-forget) |
| Type reference in signature | Interface (caller defines contract) |
| Runtime context needed | Bridge (push via MonoBehaviour) |
| Collection shared across systems | Extract to DataService, expose via interface |
