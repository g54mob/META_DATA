---
description: Deep source analysis in ask mode — compare generated code against original source for behavioral fidelity. Use when verifying source accuracy, checking missed logic, confirming formula correctness.
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`. Ask: "Which system or file?" → target

## Process

2. Read the ORIGINAL source file(s) from `MAIN-SOURCE/{PROJECT}/`
3. Read the GENERATED file(s) from `LEARN/{PROJECT}/phase-{X}/`
4. Compare method-by-method:
   - Every method in original → present in generated?
   - Signatures match? (params, return type, access modifier)
   - Core logic preserved? (formulas, conditionals, constants)
   - Edge cases handled? (bounds checks, null paths from runtime)
   - Coroutines preserved? (yield patterns, timing)
   - Event subscriptions match?

## Report (ASK MODE — don't auto-fix)

For each discrepancy:
- **File**: `OriginalFile.cs:lineN` vs `GeneratedFile.cs:lineN`
- **Type**: Missing method | Wrong formula | Missing edge case | Structural change
- **Original**: exact code snippet
- **Generated**: what we have (or "MISSING")
- **Severity**: Critical (breaks gameplay) | Important (changes behavior) | Cosmetic

Ask user which items to fix before proceeding.
