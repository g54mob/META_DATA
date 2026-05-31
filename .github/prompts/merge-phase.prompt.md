---
mode: agent
description: "Merge two adjacent underpopulated phases into one — combines files, documentation, and recalculates all cross-references. Use when: two phases are too small to justify separation, dependency order allows merging, simplifying the phase structure"
---

# /merge-phase — Combine Two Phases Into One

> Run when two phases are underpopulated (few files each) and logically related enough to merge.
> This combines all scripts, docs, tests, and regenerates living documentation.

## Prerequisites

Ask the user for:
1. **Which project?** `{PROJECT}`
2. **Phase to absorb (will be deleted)?** `{ABSORBED_PHASE}` (e.g., `D`)
3. **Phase to keep (absorbs the other)?** `{SURVIVING_PHASE}` (e.g., `C`)
4. **Reason?** (too few files / logical overlap / simplify structure)

## Validation

### 1. Adjacency Check

- Read `LEARN/{PROJECT}/PhaseMap.md` — get phase dependency DAG
- The absorbed phase must be ADJACENT to the surviving phase in dependency order
  - Valid: merge phase-D into phase-C (D depends on C, nothing between them)
  - Valid: merge phase-C into phase-D (absorb earlier into later)
  - Invalid: merge phase-E into phase-B (phases C and D are between them)
- If not adjacent → abort with explanation. Suggest `/move-system` for individual system relocation instead.

### 2. Size Check

- Count combined files after merge:
  - ✅ ≤25 files — ideal merge candidate
  - ⚠️ 26-30 files — warn user, acceptable if tightly coupled
  - ❌ 31+ files — abort. Too large after merge. Suggest moving only specific systems.

### 3. Dependency Check

- If absorbing a LATER phase into an EARLIER one: are there systems in the absorbed phase that depend on phases between them? (This shouldn't happen if adjacent.)
- If absorbing an EARLIER phase into a LATER one: do any OTHER phases depend on the absorbed phase? If yes, those references must update to point to the surviving phase.

## Execution

### 4. Merge Scripts

Move all script folders from absorbed phase into surviving phase:
```
LEARN/{PROJECT}/phase-{ABSORBED}/Scripts/_-Systems/*/
  → LEARN/{PROJECT}/phase-{SURVIVING}/Scripts/_-Systems/*/

LEARN/{PROJECT}/phase-{ABSORBED}/Scripts/0-Core/GameEvents.cs
  → merge contents into phase-{SURVIVING}/Scripts/0-Core/GameEvents.cs

LEARN/{PROJECT}/phase-{ABSORBED}/Scripts/2-Data/Enums/GlobalEnums{ABSORBED}.cs
  → merge contents into GlobalEnums{SURVIVING}.cs (rename enum file)

LEARN/{PROJECT}/phase-{ABSORBED}/Scripts/4-Utils/Phase{ABSORBED}LOG.cs
  → merge LOG methods into Phase{SURVIVING}LOG.cs

LEARN/{PROJECT}/phase-{ABSORBED}/Scripts/5-Tests/
  → merge into phase-{SURVIVING}/Scripts/5-Tests/
```

### 5. Merge GameEvents

- Combine both partial GameEvents.cs files:
  - Keep `// when X >>` / `// << when X` blocks from both
  - Remove duplicate event declarations (if any overlap)
  - Ensure `LogSubscribersCount` on every Raise method

### 6. Merge Enums

- Combine both GlobalEnums files into one `GlobalEnums{SURVIVING}.cs`
- Remove duplicate enum types
- Preserve all values

### 7. Merge LOG

- Combine all LOG methods into `Phase{SURVIVING}LOG.cs`
- Rename methods if they had phase-specific prefixes

### 8. Handle Prototypes

- If `phase-{ABSORBED}/prototype/` exists → move to `phase-{SURVIVING}/prototype/`

### 9. Handle 3D Docs

- If `phase-{ABSORBED}` had sections in MODEL.md/ANIM.md/WORLD.md:
  - Rename phase references: "Phase {ABSORBED}" → "Phase {SURVIVING}"

### 10. Delete Absorbed Phase Folder

After all content is moved:
- Delete `LEARN/{PROJECT}/phase-{ABSORBED}/` (now empty)

### 11. Renumber Subsequent Phases (if needed)

If the absorbed phase was NOT the last phase:
- Ask user: "Should subsequent phases be renumbered? (e.g., if D was absorbed into C, should E become D?)"
- If yes: rename phase folders AND update ALL references across all docs
- If no: leave gaps in numbering (acceptable, just note it in PhaseMap)

### 12. Regenerate Documentation

| Doc | Changes |
|-----|---------|
| `PhaseMap.md` | Remove absorbed phase section, merge file listings into surviving phase, update dependency DAG, recalculate sizes, update phase order |
| `StructureMap.md` | Merge DataService specs into one phase section |
| `phase-{SURVIVING}/GUIDE.md` | Full regeneration — combine both phases' content |
| `phase-{SURVIVING}/FLOW.md` | Full regeneration — combine system maps, data flows, event registries |
| `SystemPortabilityMap.md` | Update all systems from absorbed phase to show surviving phase |
| `SystemIsolationAnalysis.md` | Update communication matrix |
| `CoverageMap.md` | Update all file→phase mappings |
| `Estimate.md` | Recalculate (fewer phases = less overhead) |
| `GameStateSoFar.md` | Merge the two phase sections into one combined section with updated descriptor |
| `NewAgent.md` | Update phase references if they mention the absorbed phase |

### 13. Cross-Reference Scan

Search ALL remaining phase docs for references to `phase-{ABSORBED}`:
- GUIDE.md modification tables in other phases
- FLOW.md references
- Dependency.md files mentioning the absorbed phase
- Update all to reference `phase-{SURVIVING}` instead

### 14. Verify Compile Order

Walk through all phases in order after merge — verify no forward references.

### 15. Summary

```
## Merge Summary: phase-{ABSORBED} → phase-{SURVIVING}

Systems merged: [list]
Files combined: [count from absorbed] + [count in surviving] = [total]
GameEvents merged: [count]
Enums merged: [count]
LOG methods merged: [count]
Tests merged: [count]
Docs regenerated: GUIDE.md, FLOW.md, PhaseMap.md, StructureMap.md, + [others]
Phase size after merge: [count] files (✅/⚠️)
Subsequent phases renumbered: yes/no
Compile order: ✅ valid
```

## Auto-chains

None. Recommend running `/decouple-check` on the merged phase afterward.