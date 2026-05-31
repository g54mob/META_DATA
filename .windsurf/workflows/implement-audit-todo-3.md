---
description: "/implement-audit-todo continuation (part 3/4) — pitfalls, genre variants, convention updates. Run /implement-audit-todo-2 first."
---

<!-- SPLIT: Part 3 of /implement-audit-todo — exceeds Windsurf's 12K char limit when combined -->

## Pitfalls

- ❌ **{Anti-pattern name}** — {what agents do wrong and why it breaks}
  → ✅ {Correct approach in one sentence}

- ❌ **{Anti-pattern name}** — {what goes wrong}
  → ✅ {Correct approach}

- ❌ **{Anti-pattern name}** — {what goes wrong}
  → ✅ {Correct approach}
````

---

#### Step A6 — Skill Quality Checklist (Self-Verify)

Before saving, verify the skill against ALL of these:

| # | Check | Pass? |
|---|-------|-------|
| 1 | YAML `name` matches directory name exactly | |
| 2 | YAML `description` is single line, ≤200 chars, contains domain keywords for auto-loading | |
| 3 | Intro blockquote has "Universal pattern" + "substitute" note | |
| 4 | Architecture diagram uses box-drawing chars, shows ALL core components, ≤80 chars wide | |
| 5 | Every core component has real code from MAIN-SOURCE/ (not invented) | |
| 6 | Code has `[AddComponentMenu]`, `/// <summary>`, `// →` comments, `#region` blocks | |
| 7 | Minimum 2 code examples (one per core component) | |
| 8 | Genre Variants section exists with concrete differences (not vague) | |
| 9 | Pitfalls section has ≥3 items with ❌/✅ format | |
| 10 | No project-specific names in prose (only in code with "substitute" note) | |
| 11 | Total skill length: 150-400 lines (not too short, not bloated) | |
| 12 | All code compiles conceptually (correct C# syntax, proper types) | |
| 13 | Design decisions have clear justifications, not just "because source does it" | |
| 14 | Skill teaches enough that an agent can implement the domain without reading source | |

If any check fails, fix it before proceeding.

---

#### Step A7 — Queue for Registration

Add to the registration batch (done in final step). Record:
- Skill name: `{skill-name}`
- Directory: `.windsurf/skills/{skill-name}/`
- Description for tables: `{short description}`
- Auto-load trigger: `{when this skill should activate}`
- What it provides: `{what knowledge it gives the agent}`

---

### Procedure B: Update Existing Skill (`update-skill`) — DETAILED

#### Step B1 — Read Current Skill

Read the FULL current skill body. Note:
- What genres/project types does it currently cover?
- What values are hardcoded (pool sizes, counts, timing)?
- What assumptions does it make about the game type?
- Does it already have a "Genre Variants" section?
- What code examples exist and from which project?

#### Step B2 — Scan Source for Alternatives

For EACH project NOT currently covered by the skill's examples:

1. Search for the skill's domain using the same 7 strategies from Step A1
2. Read the found files
3. Compare against the skill's current patterns
4. Note differences:

```markdown
| Current Skill Says | {project-name} Does Instead | Impact |
|--------------------|----------------------------|--------|
| Pool size = 30 | No pool, direct AudioSource | Architecture change |
| spatialBlend = 1 always | spatialBlend = 0 (2D game) | Parameter change |
| Manager is Singleton | Manager is static class | Lifecycle change |
```

#### Step B3 — Draft Genre Variants Section

```markdown
## Genre Variants

> The core patterns above work for {original genre}. Adjust for these genres:

### {New Genre} ({project-names})

{Architecture-level explanation of WHY this genre differs (1-2 sentences).}

- **{Difference 1}** — {concrete: values, class names, approach}
- **{Difference 2}** — {concrete}

```csharp
// → {What this shows}
{5-15 lines of real code from the variant project}
```

### {Another Genre} ({project-names})

- **{Difference}** — {concrete}
```

**Genre Variant writing rules:**
- Each variant entry must have at least ONE code snippet OR concrete values (not "adjust as needed")
- Explain WHY the genre differs (game design reason), not just WHAT differs
- If the variant fundamentally changes architecture (not just values), note "Consider separate manager class"
- Order variants by frequency: most common genre first

#### Step B4 — Find Insertion Point

- If skill has no "Genre Variants" section: insert BEFORE the last section (Pitfalls/Decision Flowchart)
- If skill already HAS "Genre Variants": MERGE new entries into existing section
- Never duplicate an existing genre entry — update/expand it instead

#### Step B5 — Check Hardcoded Values in Main Body

Scan the skill's main body for any hardcoded numbers/assumptions:
- Pool sizes → add "(calibratable: {genre} needs ~{N}, {other genre} needs ~{M})"
- Timing values → add "(adjust per game pace)"
- Component counts → add "(depends on project complexity)"

#### Step B6 — Add New Pitfalls

If source scanning revealed anti-patterns specific to new genres:
- Add to Pitfalls section using ❌/✅ format
- Place genre-specific pitfalls after generic ones

---

### Procedure C: Edit Convention (`edit-convention`) — DETAILED

#### Step C1 — Read the Full Convention File

Read `csharp-conventions.instructions.md` completely. Understand:
- What sections exist
- The writing style (imperative, brief, example-heavy)
- How conditionals are expressed
- Where related rules cluster

#### Step C2 — Draft the New Convention

Rules for writing conventions:
- **Phrased as imperative rule:** "Use X" / "Never Y" / "Always Z"
- **Universal by default:** Must apply to ALL project types
- **Conditional when genre-specific:** Use "When Project Has {feature}:" sub-header
- **Include code example** if the pattern has any ambiguity
- **Code examples use the same style** as existing examples in the file
- **Include `/// <summary>`** on interfaces and key classes in examples
- **Include "Rules" sub-list** with bullet points for related sub-rules
- **Maximum 30 lines** per convention entry (keep it scannable)

**Convention writing template:**
```markdown
### {Convention Title}

{1-2 sentence explanation of the rule and why it matters.}

Rules:
- {Rule 1}
- {Rule 2}
- {Rule 3}

```csharp
// ✅ Correct
{code}

// ❌ Wrong
{code}
```

When Project Has {Conditional Feature}:
- {Additional rule specific to that feature}
```

#### Step C3 — Find Correct Insertion Point

Group with related conventions:
- Naming rules → near other naming rules
- Architecture rules → near other architecture rules
- Pattern rules → near other pattern rules
- Pitfalls → at end of file or in pitfalls section

Never insert in the middle of an existing section — always at section boundaries.

#### Step C4 — Apply and Verify

- Apply the edit
- Read surrounding 20 lines — does it flow logically?
- Does the new rule contradict any existing rule? If so, resolve the conflict
- Does the code example compile conceptually?

---

### Procedure D: Edit Template (`edit-template`) — DETAILED

#### Step D1 — Read the Full Template

Read the target template file completely. Note:
- Placeholder conventions: `{PROJECT}`, `{PHASE}`, `{SYSTEM}`, `{N}`
- Section header style (##, ###)
- Table column naming
- Conditional markers ("(if applicable)", "(multiplayer only)")
- How much is structural vs. content-guiding

#### Step D2 — Draft the Addition

Rules:
- Uses established placeholders — no project-specific names
- Conditional sections marked clearly: "(if applicable)", "(if multiplayer project)", "(when project has AI)"
- Follows existing column/field naming style
- Adds new fields/columns at the END of existing tables (don't rearrange)
- New sections go in logical order relative to existing sections
- Include a brief "Purpose:" note after new section headers

**Template edit categories and rules:**
| Edit Type | Rule |
|-----------|------|
| New table column | Add at rightmost position, add header explanation |
| New section | Add after the most related existing section |
| New conditional block | Wrap in "(if {condition})" markers |
| Modified field | Keep old field name, add clarification |

#### Step D3 — Apply and Verify

- Apply the edit
- Read the full template — does it render as a coherent document?
- Could a NEW agent follow this template for ANY genre without confusion?
- Are all placeholders consistent (no `{project}` vs `{PROJECT}` mix)?

---

### Procedure E: Edit Prompt (`edit-prompt`) — DETAILED

#### Step E1 — Read the Full Prompt

Read the target prompt file completely. Note:
- Step numbering scheme (numbered, sub-steps with letters?)
- Skill reference format: `../skills/{name}/SKILL.md`
- Conditional phrasing: "If the project uses [domain], also check..."
- Table formats and column names
- What the prompt already covers vs. where the gap is

#### Step E2 — Draft the Addition

Rules:
- **Numbering:** Use sub-steps (e.g., "6b", "Step 3.1") to avoid renumbering ALL following steps
- **Skill refs:** Always use relative path `../skills/{name}/SKILL.md`
- **Conditionals:** "If the project uses [domain], also check/do..." — never assume all projects have it
- **Genre-agnostic:** Fix must work for ALL project types, not just the one that exposed the gap
- **Style match:** Match the prompt's existing writing voice (imperative/instructive)
- **Tables:** If adding to an existing table, add rows — don't restructure

**Types of prompt edits and their patterns:**
| Edit Type | Pattern |
|-----------|---------|
| Add skill reference | "If {condition}, load `../skills/{name}/SKILL.md` for {what it provides}" |
| Add verification step | "Verify: {check} — if fails, {action}" |
| Add genre conditional | "If the project uses {domain}: {additional steps}" |
| Fix blind spot | Insert sub-step that catches the missed case |
| Add output column | Add to existing output table with "(optional)" note |

#### Step E3 — Apply and Verify

- Apply the edit
- Read 30 lines before and after — does the flow still make sense?
- Is step numbering consistent (no gaps, no duplicates)?
- Does the edit work for a project that DOESN'T have the domain? (must not break for non-applicable genres)

---


> **Continue:** Run `/implement-audit-todo-4` to proceed with registration, verification, and completion.
