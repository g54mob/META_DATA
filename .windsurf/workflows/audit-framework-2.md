---
description: "/audit-framework continuation (part 2/2) — convention gaps, template gaps, prompt blind spots, output report. Run /audit-framework first."
---

<!-- SPLIT: Part 2 of /audit-framework — exceeds Windsurf's 12K char limit when combined -->

### 7. Convention gap analysis

For EACH pattern found in 3+ projects that `csharp-conventions.instructions.md` doesn't document:

| Convention Gap | Projects Using It | Source Evidence | Impact if Missing |
|---------------|------------------|----------------|-------------------|
| async/await for networking | schedule-1, smarket, bsge | `async Task ConnectAsync()` in NetworkManager.cs | 🔴 Convention actively blocks correct code |
| FSM IState pattern | schedule-1, smarket, twFactory, bsge | `IState.cs`, `StateManager.cs` in AI folders | 🟡 Agents produce ad-hoc switch statements |
| Generic object pool | minemgl, schedule-1, bsge, twFactory | `Pool<T>.cs`, `ObjectPool.cs` | 🟡 Agents instantiate/destroy repeatedly |

### 8. Template gap analysis

For each template, check if ANY project's source reveals patterns the template doesn't handle:

| Template | Gap | Which Projects Expose It | What to Add |
|----------|-----|-------------------------|-------------|
| PhaseMap-template.md | No network tier column | schedule-1, smarket | "Network Tier" column for client/server/shared |
| GOAL-general.md | No save/load architecture | 8 projects | ISaveable section with rules |
| FLOW-template.md | No networked event flow | schedule-1, smarket | Client→Server→AllClients diagram |

### 9. Prompt gap analysis

For each prompt, check if its steps produce wrong output for specific genres:

| Prompt | Step/Area | Issue | Genre That Breaks It | Fix |
|--------|-----------|-------|---------------------|-----|
| init.prompt.md | Phase ordering | Assumes "economy first" | NPC-centric games | Add genre-aware ordering |
| build-phase.prompt.md | Skills reference | Missing 4+ domains | All | Add new skill refs |
| audit-phase.prompt.md | Fidelity checks | No persistence completeness | Tycoon/sim | Add save state audit |
| decouple-check.prompt.md | Coupling rules | Flags NetworkBehaviour refs | Multiplayer | Add intentional coupling allowlist |

---

## Phase 1 Output — Structured TODO

Save the full report as `.windsurf/audit-required-todo.md` with this structure:

```markdown
# .windsurf/ Framework — Audit-Required TODO

> Last assessed: {date} | Projects scanned: {N} | Source: MAIN-SOURCE/ only

## Project Inventory
{Table from Step 1}

## Domain Demand Matrix  
{Table from Step 4}

## 🔴 Critical Items
### TODO-{N}: {title}
**Type:** `create-skill` | `update-skill` | `edit-convention` | `edit-template` | `edit-prompt`
**File:** {target file to create or modify}
**Priority:** 🔴
**Projects affected:** {list}
**Source evidence:** {key files/classes found}
**What to change:** {exact description — detailed enough for /implement-audit-todo to act without re-scanning}
**Acceptance criteria:** {checklist}

## 🟡 Important Items
{Same format — every item MUST have the Type field}

## 🟢 Nice-to-Have Items
{Same format}

## Existing Skill Genre-Blindness Fixes
{Summary table}

## Verification Checklist
{Post-implementation checks}

## Implementation Order
{Batch sequence}
```

Each TODO item MUST include:
1. **Type** — one of: `create-skill`, `update-skill`, `edit-convention`, `edit-template`, `edit-prompt`
2. **Target file** — exact path of file to create or modify
3. **Priority** — with justification
4. **Projects affected** — which projects exposed the gap
5. **Source evidence** — specific files/classes/patterns found (saves `/implement-audit-todo` from re-scanning)
6. **What to change** — detailed enough for `/implement-audit-todo` to execute without re-scanning
7. **Acceptance criteria** — checkboxes for verification

---

## STOP — Present Report

Present the Phase 1 report to the user. Ask:
- "Save this as `.windsurf/audit-required-todo.md`?"
- "Run `/implement-audit-todo` to start implementing?"

Do NOT implement anything in this prompt — implementation is `/implement-audit-todo`'s job.
This prompt's ONLY job is thorough analysis and reporting.

---

## Key Principles

- **Scan MAIN-SOURCE/ exclusively** — don't analyse LEARN/ (that's `/rebuild-templates`' job)
- **Deep file reading, not surface scanning** — open files, read classes, count patterns. Don't just look at folder names
- **Cross-project consensus drives decisions** — a pattern in 3+ projects becomes "core", 1-2 becomes "variant"
- **Every gap maps to a specific file change** — vague "we should improve X" is useless. Say "add section Y to file Z"
- **Skills are the primary extension mechanism** — when agents need domain knowledge, create a SKILL
- **The TODO file is the deliverable** — it must be detailed enough that `/implement-audit-todo` can execute without re-scanning source
- **Universal framework** — changes must work for ALL Unity3D genres, not just the ones currently in MAIN-SOURCE/