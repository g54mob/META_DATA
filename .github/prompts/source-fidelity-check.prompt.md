---
description: "Deep source-vs-rebuild fidelity analysis — reads ALL source files for a phase's domain, finds missed functionality, classifies severity, outputs suggestions only (ask mode). Use when: verifying completeness after delivery, hunting for missed features, before finalizing a phase"
mode: "ask"
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`. Ask: "Which phase?" → `{PHASE}`
2. Read `LEARN/{PROJECT}/PhaseMap.md` — this phase's section (listed files, systems, cross-phase mods)
3. Read `LEARN/{PROJECT}/StructureMap.md` — DataService specs for this phase
4. Read `LEARN/{PROJECT}/CoverageMap.md` — which source files are already assigned to which phase
5. Read `LEARN/{PROJECT}/OptionalFeatures.md` — features already flagged as optional/polish

## In-Depth Source Analysis (MANDATORY — this is the core of this prompt)

6. **Identify the domain.** From PhaseMap, determine this phase's functional domain — what gameplay systems it covers (e.g., "inventory + crafting", "combat + health", "terrain + building").

7. **Scan ALL source files.** Read EVERY `.cs` file in `MAIN-SOURCE/{PROJECT}/` that could possibly belong to this domain. Do NOT limit to what PhaseMap lists. Cast a wide net:
   - Files whose class/namespace name relates to the domain
   - Files referenced by (imported by / called from) already-mapped files
   - Files in the same source folder as mapped files
   - Files containing keywords related to this phase's systems

8. **Extract everything.** For each source file read, extract:
   - Every public/private method (name + signature + what it does)
   - Every field, property, constant, threshold value
   - Every event subscription (`+=`), event raise, delegate
   - Every coroutine (IEnumerator methods)
   - Every Unity lifecycle hook (Awake, Start, OnEnable, OnDisable, Update, FixedUpdate, OnDestroy, OnTriggerEnter, OnCollisionEnter, etc.)
   - Every conditional logic path (`if`/`switch` branches that enable distinct behaviors)
   - Every external reference (calls to other classes, GetComponent, FindObjectOfType)
   - Every string literal, magic number, layer/tag reference
   - Animation triggers, audio clip references, particle system calls, DOTween sequences
   - Serialized fields that imply inspector-wired dependencies

9. **Cross-reference against rebuild.** For each extracted item, check:
   - Is it present in `LEARN/{PROJECT}/phase-{PHASE}/`? (any .cs file)
   - Is it covered by a different phase? (check CoverageMap.md)
   - Is it in OptionalFeatures.md?
   - Is it genuinely dead code / editor-only / unused?

## Classification

10. Classify every gap found:

| Classification | Criteria | Action Required |
|---|---|---|
| **🔴 Critical** | Without this, the phase's core gameplay loop breaks or produces wrong behavior | Must be added to this phase immediately |
| **🟡 Important** | Meaningful gameplay behavior — players would notice its absence | Should be added to this phase |
| **🟢 Nice-to-have** | Polish, VFX, audio, animation flourish, edge-case handling | Add to OptionalFeatures.md or `#region Extra` |
| **⚪ Dead/Unused** | Never called, editor-only, or deprecated logic | Document and skip |

## Output Format (Chat Only — No File Modifications)

Present findings in this structure:

```markdown
# Source Fidelity Check: {PROJECT} phase-{PHASE}

## Domain Scanned
- Phase domain: [description]
- Source files read: N total (N mapped + N unlisted)
- Unlisted files found: N

## 🔴 Critical Gaps (N found)

### [Gap Title]
- **Source file:** `OriginalClass.cs` → method `DoSomething()`
- **What it does:** [2-line explanation of the behavior]
- **Why critical:** [why the phase breaks without it]
- **Suggested placement:** `_-Systems/XxxSystem/` or existing file
- **DataService impact:** [new collection? new method? none?]

---

## 🟡 Important Gaps (N found)

### [Gap Title]
- **Source file:** `OriginalClass.cs` → method/field
- **What it does:** [explanation]
- **Why important:** [what players lose without it]
- **Suggested placement:** [where it should go]

---

## 🟢 Nice-to-have (N found)

### [Gap Title]
- **Source:** `OriginalClass.cs` → [specific reference]
- **What it does:** [explanation]
- **Integration point:** [which existing script would host this, or `#region Extra`]

---

## ⚪ Dead/Unused Code (N found)
| Source File | Item | Reason Classified Dead |

---

## Files Not Assigned to Any Phase
| Source File | Likely Domain | Suggested Phase | Reason |

---

## Suggested PhaseMap Updates
[Bullet list of what to add/move in PhaseMap.md]

## Suggested StructureMap Updates
[New DataService collections or methods discovered]

## Suggested OptionalFeatures.md Additions
[Nice-to-haves not already tracked]
```

## Rules

- **DO NOT modify any files.** This is analysis-only (ask mode).
- **DO NOT skip files** because they look unrelated — cast the widest possible net, then narrow.
- **Read source line-by-line** — do not skim. Every method body matters.
- **Cross-reference calls:** if SourceFileA calls SourceFileB.Method(), and SourceFileB isn't mapped anywhere, that's a Critical gap.
- **Re-runnable:** This prompt can be run multiple times on the same phase. Each run should re-analyze from scratch (source may have been re-read more carefully).
- **Conditional logic = separate features:** An `if (hasUpgrade)` branch inside a mapped method is a SEPARATE feature that might not be covered.
- **Coroutines are features:** Every IEnumerator is a distinct behavior with timing, delays, and state transitions — never skip them.
- **Animation/Audio/VFX references hint at missing systems:** If source calls `PlaySound("hit")` or `animator.SetTrigger("attack")`, the phase needs those triggers defined somewhere.