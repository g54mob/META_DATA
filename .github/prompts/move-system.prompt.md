---
mode: agent
description: "Move a system from one phase to another — relocates files, updates all cross-references, dependency docs, and living docs. Use when: a system was placed in the wrong phase, phase rebalancing after size cap exceeded, dependency order correction"
---

# /move-system — Relocate a System Between Phases

> Run when a system needs to move from one phase to another. This handles file relocation,
> cross-reference updates, dependency recalculation, and doc regeneration.

## Prerequisites

Ask the user for:
1. **Which project?** `{PROJECT}`
2. **System name?** `[SYSTEM_NAME]` (e.g., `InventorySystem`)
3. **Move from phase?** `{SOURCE_PHASE}` (e.g., `C`)
4. **Move to phase?** `{TARGET_PHASE}` (e.g., `B`)
5. **Reason?** (wrong dependency order / phase too large / logical grouping)

## Validation

### 1. Dependency Order Check

Before moving, verify the move doesn't violate phase ordering:

- Read `LEARN/{PROJECT}/PhaseMap.md` — get phase dependency DAG
- If `{TARGET_PHASE}` comes AFTER `{SOURCE_PHASE}` → moving forward is safe (no back-deps)
- If `{TARGET_PHASE}` comes BEFORE `{SOURCE_PHASE}` → verify the system has NO dependencies on systems in phases between target and source. If it does, abort with explanation.

### 2. Size Check

- Count files in `{TARGET_PHASE}` after the move:
  - ✅ ≤25 files — proceed
  - ⚠️ 26-30 files — warn user, ask for confirmation
  - ❌ 31+ files — recommend `/merge-phase` or alternative split instead

### 3. Dependency Analysis

Read `_-Systems/[SYSTEM_NAME]/Dependency.md` from the source phase:
- List all systems this system DEPENDS ON — which phase are they in?
- List all systems that DEPEND ON this system — which phase are they in?
- After the move, do all dependencies still point to earlier-or-same phase?
- If any dependency would now point FORWARD → flag as blocker

## Execution

### 4. Relocate Files

Move the entire `_-Systems/[SYSTEM_NAME]/` folder from source to target phase:
```
LEARN/{PROJECT}/phase-{SOURCE}/Scripts/_-Systems/[SystemName]/
  → LEARN/{PROJECT}/phase-{TARGET}/Scripts/_-Systems/[SystemName]/
```

### 5. Update GameEvents

- If `phase-{SOURCE}/0-Core/GameEvents.cs` has events ONLY used by this system:
  - Move those event declarations to `phase-{TARGET}/0-Core/GameEvents.cs`
- If events are shared with other systems in the source phase → leave them, add `// also used by phase-{TARGET}` comment

### 6. Update Enums

- If `GlobalEnums{SOURCE}.cs` has enums ONLY used by this system:
  - Move those enums to `GlobalEnums{TARGET}.cs`
- If shared → leave in source, add using reference in target

### 7. Update LOG Methods

- Move relevant LOG methods from `Phase{SOURCE}LOG.cs` to `Phase{TARGET}LOG.cs`

### 8. Update Tests

- Move relevant test files from source phase `5-Tests/` to target phase `5-Tests/`
- Move relevant `5-Tests/Manual/*.md` guides

### 9. Cross-Phase Modification Audit

After the move:
- Does the target phase now need `using` statements for earlier-phase types it didn't need before?
- Do systems in the source phase that DEPENDED on the moved system now have a cross-phase dep?
- Generate exact code diffs for any required modifications (same format as `/cross-phase-mod`)

### 10. Regenerate Documentation

Update ALL affected docs:

| Doc | Changes |
|-----|---------|
| `PhaseMap.md` | Move file listings, update both phase sections, recalculate file counts, verify size caps, update dependency DAG |
| `StructureMap.md` | Move DataService spec to target phase section |
| `phase-{SOURCE}/GUIDE.md` | Remove system from folder structure, script purpose, hand-typing order, scene setup |
| `phase-{SOURCE}/FLOW.md` | Remove system from system map, event registry, data flows |
| `phase-{TARGET}/GUIDE.md` | Add system to all sections |
| `phase-{TARGET}/FLOW.md` | Add system to all sections |
| `SystemPortabilityMap.md` | Update system's phase assignment |
| `SystemIsolationAnalysis.md` | Update communication matrix (phase column) |
| `CoverageMap.md` | Update source file → phase mapping |
| `GameStateSoFar.md` | Update affected phase sections — moved feature = bullets move between phase sections |

### 11. Verify Compile Order

After all changes:
- Walk through phases in order: does each phase compile with ONLY earlier phases present?
- If not → identify the specific import that fails and report to user

### 12. Summary

Output a move summary:
```
## Move Summary: [SystemName] → phase-{TARGET}

Files moved: [count]
Events relocated: [count]
Enums relocated: [count]
Cross-phase mods needed: [count]
Docs updated: [list]
Compile order: ✅ valid / ❌ broken at [specific import]
```

## Auto-chains

None. Run `/decouple-check` manually afterward if concerned about coupling.