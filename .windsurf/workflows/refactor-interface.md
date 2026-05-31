---
description: Safely evolve interfaces across multiple phases. Use when an interface needs new methods/properties that affect multiple implementors.
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`. Ask: "Which interface?" → `{INTERFACE}`. Ask: "What change?" → description

## Process

2. Find ALL implementors of `{INTERFACE}` across all phases
3. Find ALL consumers (callers of interface methods) across all phases
4. Assess impact: which files need modification?
5. Generate changes:
   - Update interface definition
   - Update all implementors (add new method stubs or modify signatures)
   - Update all consumers if needed
   - Verify no compilation errors
6. Generate cross-phase mod diffs for earlier phases
7. Run `/decouple-check` on affected systems
