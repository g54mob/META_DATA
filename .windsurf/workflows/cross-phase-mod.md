---
description: "Check if new phase references methods/fields missing from earlier phases. Use when: before typing a new phase, verifying cross-phase dependencies exist, generating modification diffs"
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`. Ask: "Which phase?" → `{PHASE}`

**In-depth detailed analysis is MANDATORY.** Read ALL referenced earlier-phase files completely. Trace every call chain. Do not skim.

## Scan

2. Read all `.cs` in `LEARN/{PROJECT}/phase-{PHASE}/`
3. Extract all calls/field accesses on types from EARLIER phases
4. Scan for **new interface implementations** on existing classes — e.g., an earlier-phase class now needs to implement a new interface defined in the current phase (`:` list changes, new method stubs required)
5. For each: read the actual earlier phase file in `LEARN/{PROJECT}/phase-{earlier}/`
6. Flag any method/field/enum/interface implementation that doesn't exist yet

## Generate

7. Output: `| Earlier Phase File | What to Add | Why | Impact |`
    - Impact ratings:
      - ❌ **Non-breaking** (partial class extension, new event, additive field)
      - ⚠️ **Direct modify** (new `[SerializeField]`, new method on existing class, new interface implementation on existing class)
      - 🔴 **Breaking** (renamed method, changed signature, removed field — all callers must update)
8. For each: exact code diff with `// ← ADD` markers showing BEFORE context (3+ lines above) and the new code

## Convention Enforcement on Generated Code

9. Every code diff generated in step 8 MUST follow [C# Conventions](../rules/csharp-conventions.md). Key rules for diffs:
   - **GameEvents additions** — signatures use interfaces only (`Action<IInventoryItem>` not `Action<BaseHeldTool>`). Include `// when X >>` / `// << when X` blocks. Every new `Raise...()` must call `LogSubscribersCount()`
   - **`// purpose:`** comment on every new `.Raise...()` call and every new `+=` subscription
   - **Enum values** — camelCase (`TagType.grabbable`, `AnimParamType.attack1`). No raw strings for animator params
   - **Prefer `partial` extension** over direct modify when possible. Only direct-modify when `[SerializeField]`, inheritance (`: INewInterface`), or method body changes require it
   - **`/// <summary>`** on every new method — 2-line explanation
   - **`[AddComponentMenu]`** if adding a new MonoBehaviour class to an earlier phase
   - **No new public members** unless another script actually calls/reads them

## Compile Gate

10. **Verify earlier phases still compile after mods:**
    - For each modified earlier-phase file, mentally trace all existing callers
    - Confirm no existing code is broken by the addition (additive changes should never break)
    - If any mod changes a signature or renames something (🔴), list ALL files that must also change
    - Output: `| Modified File | Compiles After Mod? | Callers Verified |`

## Update Docs

11. Add to `LEARN/{PROJECT}/phase-{PHASE}/GUIDE.md` → "Modifications to Earlier Phases" section: `| File | Change | Why |`
12. Update `LEARN/{PROJECT}/phase-{PHASE}/FLOW.md` → "Event Registry" section if any cross-phase mod adds new event subscriptions or changes event signatures. New events mean new entries in the registry table.
13. Update affected `Dependency.md` files in earlier phases — add entries to their "Future Phase Modifications" table if not already present