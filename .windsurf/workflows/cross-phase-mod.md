---
description: Check if new phase references methods/fields missing from earlier phases. Use before typing a new phase, verifying cross-phase dependencies exist, generating modification diffs.
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`. Ask: "Which phase?" → `{PHASE}`

## Scan

2. Read all scripts in `LEARN/{PROJECT}/phase-{PHASE}/`
3. For each file, find references to scripts in earlier phases (phase-All, phase-A...phase-{PREV})
4. For each cross-phase reference, verify the target method/field/event EXISTS in the earlier phase
5. Check PhaseMap.md "Cross-Phase Modifications" section for this phase

## Report

For each missing dependency:
- **Target**: `EarlierPhaseFile.cs` in `phase-{X}`
- **Needed**: method/field/event that current phase expects
- **Action**: Add to earlier phase (generate diff)

## Generate Diffs

For each modification needed:
```
--- LEARN/{PROJECT}/phase-{EARLIER}/path/File.cs
+++ LEARN/{PROJECT}/phase-{EARLIER}/path/File.cs (modified)
@@ context @@
+ added code
```

Prefer `partial` extend over direct modify. Only direct-modify when `[SerializeField]` or inheritance requires it.
