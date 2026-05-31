---
mode: agent
description: "Implement .github/ framework improvements by deep-reading MAIN-SOURCE/ projects and applying changes: create new skills from real source patterns, update existing skills with genre variants, modify conventions/templates/prompts. Works from gap reports (audit-required-todo.md), /audit-framework output, or user-specified changes. Use when: after /audit-framework produces a gap report, or when you know exactly what framework changes are needed."
---

# /implement-audit-todo — Apply Framework Improvements from Source

> Reads a gap report (or user instructions), then deep-analyses `MAIN-SOURCE/` projects to extract
> REAL code patterns, and implements all approved changes to `.github/` files — creating new skills,
> updating existing skills with genre variants, modifying conventions, templates, and prompts.

> **This prompt ONLY modifies `.github/` files** — never touches `MAIN-SOURCE/` or `LEARN/` project content.

> **Difference from `/audit-framework`:** That prompt IDENTIFIES gaps. This prompt IMPLEMENTS fixes.
> **Difference from `/rebuild-templates`:** That prompt backports from LEARN/ (built phases). This prompt
> extracts patterns from MAIN-SOURCE/ (raw source) to build new framework content.

> **Designed for future LLMs:** Every step below is self-contained. An LLM with NO prior workspace context
> can follow these instructions and produce correct, framework-compliant output.

---

## Setup

### 1. Locate the gap report

Ask the user:
- "Where is the gap report / TODO list?"
  - Default: `.github/audit-required-todo.md`
  - Or: "I'll describe the changes I want" (no file needed)
  - Or: paste `/audit-framework` output directly

If a file exists, read it fully. Extract every actionable item with:
- **Target file** — which `.github/` file to create or modify
- **Priority** — 🔴 Critical / 🟡 Important / 🟢 Nice-to-have
- **Change type** — one of: `create-skill`, `update-skill`, `edit-convention`, `edit-template`, `edit-prompt`
- **Source projects** — which `MAIN-SOURCE/` projects to scan for real patterns
- **Source evidence** — specific files/classes already identified by the audit (saves re-scanning)

Produce an item inventory:

| # | Type | Target File | Priority | Source Projects to Scan | Pre-identified Files |
|---|------|-------------|----------|----------------------|---------------------|

### 2. Ask the user what to implement

Present the inventory. Ask:
- "Which items? Say **all**, **critical only**, **critical + important**, or list numbers."
- "Any items to skip or defer?"

Set `{APPROVED_ITEMS}` = user's selection.

### 3. Verify workspace

Confirm these exist:
- `MAIN-SOURCE/` with project subfolders (needed for real code extraction)
- `.github/skills/` directory with existing skills (format reference)
- `.github/copilot-instructions.md` (registration target)
- `.github/MANUAL.md` (registration target)

If `MAIN-SOURCE/` is missing but `Scripts/Assembly-CSharp/` exists, treat that as the single source project.
If NEITHER exists, STOP — this prompt requires raw source for code extraction. Cannot create skills from outlines alone.

### 4. Read existing skill format (FORMAT LAW)

Read ALL `.github/skills/*/SKILL.md` files fully. Extract and memorize the exact format:

**YAML Frontmatter:**
```yaml
---
name: "{skill-name}"
description: "{Domain summary} — {comma-separated key patterns}, {integration note} for Unity rebuild projects"
---
```

- `name` MUST match the directory name exactly (e.g., directory `unity-audio/` → `name: "unity-audio"`)
- `description` is ONE line, max ~200 characters, used by VS Code for auto-loading. Must contain enough keywords for the AI to trigger it when the task matches

**Intro Blockquote:**
```markdown
> **Universal pattern — applies to ALL Unity projects in this workspace.**
> This skill defines {what this skill covers in one sentence}.
> {Note about portability or system independence}.
> Examples below reference {primary project name} classes — substitute with your project's equivalents.
```

**Section Organization (in order):**
1. `## Architecture Overview` — ASCII diagram (MANDATORY)
2. `## Core Components` → subsections per component `### {Name} — {Role}`
3. Any additional concept sections (`## Lifecycle`, `## Integration`, etc.)
4. `## Genre Variants` — genre-specific differences (MANDATORY if 2+ genres)
5. `## Pitfalls` — anti-patterns with ❌/✅ format (MANDATORY, minimum 3)

**Code Example Style:**
- `[AddComponentMenu("Systems/{SystemName}/{ClassName}")]` on every MonoBehaviour
- `/// <summary>` XML doc on class and key public methods
- `// →` inline comments for "what this does" explanations
- `[SerializeField] private` for inspector fields
- `#region` blocks for organization (matches convention file)
- Real code from MAIN-SOURCE/ — NEVER invented examples

**ASCII Diagram Style:**
```
┌─────────────────┐     ┌─────────────────┐
│  ComponentA     │────▶│  ComponentB     │
│  (role)         │     │  (role)         │
└────────┬────────┘     └─────────────────┘
         │ fires event
         ▼
┌─────────────────┐
│  ComponentC     │
│  (role)         │
└─────────────────┘
```
- Use box-drawing characters: `┌─┐│└─┘├┤┬┴┼`
- Use arrows: `──▶`, `───`, `─┬─`, `│`, `▼`, `▲`
- Label relationships on arrows
- Show data flow direction
- Maximum width: 80 characters

**"Key Design Decisions" Format:**
```markdown
**Key Design Decisions:**
- **{Decision name}** — {justification why this approach, not alternatives}
- **{Decision name}** — {justification}
```

This is the **format law** — every new skill and skill update MUST match this exactly.
If an existing skill deviates, the EXISTING skill is the authority (it was written first).

---

## Implementation — Process Items by Type

Work through `{APPROVED_ITEMS}` grouped by type, in this order:
1. Convention edits (they affect how everything else is written)
2. Template edits (they define doc structure)
3. New skills (biggest deliverables)
4. Existing skill updates (genre variants)
5. Prompt edits (they reference skills)
6. Registration (copilot-instructions.md, MANUAL.md)

For each item, follow the matching procedure below.

---

### Procedure A: Create New Skill (`create-skill`) — COMPREHENSIVE

This is the most complex procedure. Follow EVERY sub-step. Do not skip.

---

#### Step A1 — File Discovery Across MAIN-SOURCE/

For the skill's domain, search ALL source projects listed in the TODO item. Use ALL of these strategies (not just one):

**Strategy 1 — Filename glob:**
```
Search: *{domain}*, *{synonym1}*, *{synonym2}*
Example for Save/Load: *Save*, *Load*, *Persist*, *Serializ*
```

**Strategy 2 — Folder structure:**
```
Search: top-level folders matching domain keywords
Example for AI: AI/, Navigation/, Pathfinding/, BehaviorTree/, FSM/
```

**Strategy 3 — Content grep (APIs):**
```
Search inside .cs files for domain-specific Unity/C# APIs
Example for Networking: ServerRpc, ClientRpc, NetworkBehaviour, SyncVar, ObserversRpc
```

**Strategy 4 — Interface grep:**
```
Search for interfaces that define the domain contract
Example for Save: ISaveable, ISavable, ISerializable, IPersistable
```

**Strategy 5 — Base class grep:**
```
Search for abstract classes / base classes
Example for AI: StateMachine, BaseState, BTNode, BehaviorNode
```

**Strategy 6 — Attribute grep:**
```
Search for domain-specific attributes
Example: [Serializable], [SyncVar], [ServerRpc], [Command]
```

**Strategy 7 — Third-party namespace grep:**
```
Search for using statements from domain libraries
Example: using FishNet, using Photon, using Mirror, using Ink
```

Produce a discovery table per project — include EVERY file found:

```markdown
### Project: {project-name}

| # | File Path | Match Strategy | Role | Key Classes |
|---|-----------|---------------|------|-------------|
| 1 | AI/StateMachine.cs | Folder + filename | Core manager | StateMachine<TState> |
| 2 | NPC/NPCBrain.cs | Content (ChangeState) | Consumer | NPCBrain : MonoBehaviour |
| 3 | Interfaces/IState.cs | Interface grep | Contract | IState { Enter(); Update(); Exit(); } |
```

**File role classification:**
- **Core** — the primary architecture classes (managers, base classes, interfaces)
- **Consumer** — classes that USE the domain (NPCs that use AI, items that use Save)
- **Utility** — helper methods, extensions, serializers
- **Third-party** — library wrappers, adapters

**Discovery completeness check:** If you find fewer than 3 core files across all projects, the domain may be too narrow for its own skill. Consider merging with a broader skill or checking if the audit item was wrong.

---

#### Step A2 — Deep Read and Pattern Extraction

Read EVERY Core and high-priority Consumer file found in Step A1. For EACH file, extract:

```markdown
#### {FileName}.cs ({project-name})

**Location:** `MAIN-SOURCE/{project}/{path}/{FileName}.cs`
**Class:** `{ClassName}` : {BaseClass/Interface}
**Namespace:** `{namespace}`
**Lines:** ~{N}

**Architecture role:** {Core manager / State base / Consumer / Interface contract}

**Key fields:**
- `[SerializeField] private {Type} {name}` — {purpose}
- `private {Type} {name}` — {purpose}

**Key methods:**
| Method | Signature | Purpose |
|--------|-----------|---------|
| Initialize | `public void Initialize({params})` | Sets up the system |
| Process | `public void Process()` | Per-frame logic |
| Cleanup | `public void OnDestroy()` | Teardown |

**Lifecycle hooks used:** Awake / Start / OnEnable / OnDisable / OnDestroy / Update / FixedUpdate / LateUpdate

**Communication pattern:**
- Events fired: `GameEvents.OnXxx`
- Events subscribed: `GameEvents.OnYyy`
- Interfaces required: `IState`, `ISomething`
- Direct references: `{ClassName}` references `{OtherClass}` (coupling!)
- RPCs: `[ServerRpc] DoThing()`, `[ClientRpc] ReceiveThing()`

**Design patterns detected:**
- [ ] Singleton
- [ ] Object pool
- [ ] Factory
- [ ] Observer (events)
- [ ] State machine / FSM
- [ ] Strategy
- [ ] Command
- [ ] Adapter / Wrapper
- [ ] Builder
- [ ] Mediator

**Notable code patterns (verbatim excerpts — max 20 lines each):**
```csharp
// Paste the most instructive code section here
```
```

Repeat for EVERY core file. For consumer files, extract only the interface usage pattern.

---

#### Step A3 — Cross-Project Comparison and Consensus

After reading all projects, build the consensus matrix:

```markdown
## Cross-Project Consensus: {Domain}

### Pattern comparison:

| Pattern / Approach | {Proj-1} | {Proj-2} | {Proj-3} | {Proj-4} | Count | Status |
|--------------------|----------|----------|----------|----------|-------|--------|
| Manager singleton | ✅ | ✅ | ✅ | ❌ | 3/4 | CORE |
| Interface contract (IXxx) | ✅ | ✅ | ✅ | ✅ | 4/4 | CORE |
| JSON serialization | ✅ | ❌ | ✅ | ❌ | 2/4 | VARIANT |
| Binary serialization | ❌ | ✅ | ❌ | ❌ | 1/4 | VARIANT |
| Event-driven | ✅ | ✅ | ❌ | ✅ | 3/4 | CORE |
| Coroutine-based | ❌ | ❌ | ✅ | ❌ | 1/4 | VARIANT |
| Direct coupling to manager | ❌ | ❌ | ❌ | ✅ | 1/4 | PITFALL |
```

**Classification rules:**
- **CORE (3+ projects or universal best practice)** → Goes in main skill body as the standard pattern
- **VARIANT (1-2 projects, still valid)** → Goes in "Genre Variants" section
- **PITFALL (fragile, coupled, or anti-pattern)** → Goes in "Pitfalls" section
- **OUTLIER (1 project, unusual/questionable)** → Omit from skill unless instructive as pitfall

**Cross-project synthesis — what to do when projects disagree:**
1. If one approach is clearly architecturally superior (decoupled > coupled), use it as CORE
2. If approaches are equivalent but genre-specific, present the most common as CORE and others as VARIANT
3. If all approaches are different, identify the shared CONCEPT and present a unified pattern that encompasses all
4. NEVER present the worst implementation as the example — always pick the cleanest/most decoupled

---

#### Step A4 — Plan the Skill Sections

Before writing, plan the complete section outline:

```markdown
## Planned Skill Sections: unity-{domain}

1. **Architecture Overview** (diagram)
   - Components to show: {list}
   - Relationships: {A→B via events, B→C via interface}
   - Data flow: {direction}

2. **Core Components** (one subsection each):
   - {ComponentA} — {its role} — source: {project}/{file}
   - {ComponentB} — {its role} — source: {project}/{file}
   - {ComponentC} — {its role} — source: {project}/{file}

3. **Additional concept sections** (0-3 sections):
   - {Concept} — {what it covers}

4. **Genre Variants** (mandatory if 2+ genres):
   - {Genre1} ({projects}) — {how it differs}
   - {Genre2} ({projects}) — {how it differs}

5. **Pitfalls** (minimum 3):
   - {Anti-pattern 1}
   - {Anti-pattern 2}
   - {Anti-pattern 3}
```

**Section planning rules:**
- Minimum 2, maximum 5 "Core Components" subsections
- Each core component MUST have a code example (real code from source)
- Architecture diagram MUST show ALL core components and their relationships
- Genre Variants MUST be concrete (values, code snippets) not vague ("adjust as needed")
- Pitfalls MUST come from real mistakes observed in source or known agent failure modes

---

#### Step A5 — Write the SKILL.md File

Create `.github/skills/{skill-name}/SKILL.md`. Follow this complete template:

````markdown
---
name: "{skill-name}"
description: "{Domain noun} patterns — {key-pattern-1}, {key-pattern-2}, {key-pattern-3}, {integration-hook} for Unity rebuild projects"
---

# Unity {Domain Noun} — {Short Subtitle Describing Core Architecture}

> **Universal pattern — applies to ALL Unity projects in this workspace.**
> This skill defines {one-sentence summary of what the skill teaches}.
> {Statement about system independence/portability: e.g., "The save system is fully decoupled — depends only on GameEvents and interfaces."}.
> Examples below reference {primary-project-name} classes — substitute with your project's equivalents.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    {Top-Level Manager}                       │
│  {responsibility summary}                                   │
├─────────────────────────────────────────────────────────────┤
│  • {Key responsibility 1}                                   │
│  • {Key responsibility 2}                                   │
│  • {Key responsibility 3}                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │ {relationship label}
          ┌────────────┼────────────┐
          ▼            ▼            ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ {CompA}     │ │ {CompB}     │ │ {CompC}     │
│ ({role})    │ │ ({role})    │ │ ({role})    │
└─────────────┘ └─────────────┘ └─────────────┘
```

---

## Core Components

### {ComponentName} — {One-Phrase Role Description}

```csharp
[AddComponentMenu("Systems/{SystemName}/{ComponentName}")]
/// <summary>
/// {One-sentence description of what this component does.}
/// {Second sentence about how it fits the architecture.}
/// </summary>
public class {ComponentName} : {BaseClass}
{
    #region Serialized Fields

    [SerializeField] private {Type} {fieldName};  // → {purpose}
    [SerializeField] private {Type} {fieldName};  // → {purpose}

    #endregion

    #region Private State

    private {Type} {fieldName};  // → {purpose}

    #endregion

    #region Lifecycle

    private void Awake()
    {
        // → {what happens at awake}
    }

    private void OnEnable()
    {
        GameEvents.On{EventName} += Handle{EventName};  // → subscribe
    }

    private void OnDisable()
    {
        GameEvents.On{EventName} -= Handle{EventName};  // → unsubscribe
    }

    #endregion

    #region Public API

    /// <summary>
    /// {What this method does.}
    /// </summary>
    public {ReturnType} {MethodName}({params})
    {
        // → {step-by-step logic}
    }

    #endregion

    #region Event Handlers

    private void Handle{EventName}({params})
    {
        // → {what happens when event fires}
    }

    #endregion
}
```

**Key Design Decisions:**
- **{Decision}** — {justification referencing real source behavior}
- **{Decision}** — {justification}

---

### {ComponentName2} — {Role}

{Same format as above — real code, real comments}

**Key Design Decisions:**
- **{Decision}** — {why}

---

## {Optional Concept Section — e.g., "Lifecycle", "Data Flow", "Integration Points"}

{Prose explaining a concept that doesn't fit in one component — e.g., initialization order,
serialization format, event sequences. Include a small code snippet or sequence diagram.}

---

## Genre Variants

> The core patterns above work for {primary genre}. Adjust for these genres:

### {Genre Name} ({project-1}, {project-2})

{1-2 sentences explaining what differs at architecture level.}

- **{Specific difference}** — {value/approach} instead of {core approach}
- **{Specific difference}** — {code-level change}

```csharp
// Example: how this genre does it differently
{Real code snippet from the variant project — 5-15 lines}
```

### {Genre Name} ({project-3})

- **{Specific difference}** — {concrete value/pattern}
- **{Specific difference}** — {concrete value/pattern}

---

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
- Directory: `.github/skills/{skill-name}/`
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

## Registration — Final Step (After All Items)

After ALL approved items are implemented, update registration files IN THIS ORDER:

### For each NEW skill created:

**1. `copilot-instructions.md` — Workspace Structure tree:**

Find the `skills/` section in the tree and add:
```
│   │   ├── {skill-name}/SKILL.md         ← {description matching YAML}
```
- Alphabetical order within skills/ section
- Description matches the YAML frontmatter `description` field exactly (first clause)

**2. `copilot-instructions.md` — Skills table:**

Find the `| Skill | When Loaded | Provides |` table and add:
```
| `{skill-name}` | {Trigger phrase — when VS Code loads this skill} | {What knowledge it gives} |
```
- Trigger phrase = the condition from YAML description that causes auto-loading
- Provides = 3-5 word summary of what agents learn from it

**3. `MANUAL.md` — Workspace Layout tree:**

Same format as copilot-instructions tree — add in alphabetical order.

**4. `MANUAL.md` — Skills table:**

Add row matching the format of existing rows in MANUAL.md's skills table.

**5. `MANUAL.md` — Key Facts:**

Find the "N skills currently exist" line. Update the count and the comma-separated list.

**6. Prompt skill references — add to ALL THREE prompts:**

For `build-phase.prompt.md`:
```
- If phase includes {domain trigger} → load `../skills/{skill-name}/SKILL.md`
```

For `audit-phase.prompt.md`:
```
- If verifying {what to verify} → check against `../skills/{skill-name}/SKILL.md`
```

For `add-system-to-phase.prompt.md`:
```
- If the system involves {domain} → reference `../skills/{skill-name}/SKILL.md`
```

### For each convention/template/prompt edit:

No registration needed — the edit IS the deliverable. But verify:
- No broken cross-references (links to renamed/moved sections still work)
- No project-specific names leaked into generic framework files
- Table formatting is consistent (column widths, alignment markers)

---

## Verification Checklist — COMPREHENSIVE

After ALL items are implemented, verify every single one:

### Skills Verification

| # | Check | How to Verify | Status |
|---|-------|---------------|--------|
| 1 | YAML `name` matches directory name | Compare directory name to frontmatter | |
| 2 | YAML `description` is single line, ≤200 chars | Character count | |
| 3 | YAML `description` contains domain keywords | Would VS Code trigger it for the right tasks? | |
| 4 | Intro blockquote has "Universal pattern" + "substitute" note | Text search | |
| 5 | Architecture diagram exists and uses box-drawing chars | Visual inspection | |
| 6 | Diagram shows ALL core components mentioned in skill | Cross-reference | |
| 7 | Diagram is ≤80 chars wide | Line length check | |
| 8 | Every core component has code example | Section-by-section check | |
| 9 | Code has `[AddComponentMenu]` on MonoBehaviours | Grep | |
| 10 | Code has `/// <summary>` on classes | Grep | |
| 11 | Code has `// →` inline comments | Grep | |
| 12 | Code uses `#region` blocks | Grep | |
| 13 | All code is from real MAIN-SOURCE/ (not invented) | Can trace back to source file | |
| 14 | Genre Variants section has concrete values/code (not vague) | Read each entry | |
| 15 | Pitfalls section has ≥3 items with ❌/✅ format | Count | |
| 16 | No project-specific names in prose | Text search for project names | |
| 17 | Skill length is 150-400 lines | Line count | |
| 18 | An agent with no context could implement the domain from this skill alone | Read as outsider | |

### Registration Verification

| # | Check | Status |
|---|-------|--------|
| 1 | copilot-instructions.md tree has the skill (alphabetical) | |
| 2 | copilot-instructions.md table has the skill | |
| 3 | MANUAL.md tree has the skill | |
| 4 | MANUAL.md table has the skill | |
| 5 | MANUAL.md Key Facts count is correct | |
| 6 | build-phase.prompt.md references the skill | |
| 7 | audit-phase.prompt.md references the skill | |
| 8 | add-system-to-phase.prompt.md references the skill | |
| 9 | Skill table entries match YAML description keywords | |
| 10 | All relative paths are correct (`../skills/{name}/SKILL.md`) | |

### Convention/Template/Prompt Verification

| # | Check | Status |
|---|-------|--------|
| 1 | Convention edits are phrased as universal rules | |
| 2 | Convention code examples compile conceptually | |
| 3 | Template edits use only established placeholders | |
| 4 | Template edits don't break document structure | |
| 5 | Prompt edits have consistent step numbering | |
| 6 | Prompt conditionals don't break for non-applicable genres | |
| 7 | No project-specific names in any `.github/` file prose | |

---

## After Completion

### Update the gap report

If `.github/audit-required-todo.md` exists:
- Mark completed items: change `### TODO-{N}:` to `### ✅ TODO-{N}:`
- Add implementation notes under each completed item
- Note any deviations from the original plan
- Flag any NEW gaps discovered during implementation

### Report to user

Summarize:
```
## Implementation Complete

**Implemented:** {N} items
- {N} new skills created: {list}
- {N} existing skills updated: {list}
- {N} convention edits applied
- {N} template edits applied
- {N} prompt edits applied

**Registration:** All skills registered in copilot-instructions.md, MANUAL.md, and 3 prompts.

**New gaps discovered:** {list or "none"}
```

### Suggest follow-up

- Run `/rebuild-prompts` to verify prompt consistency
- Run `/rebuild-templates` to verify template consistency
- Run `/audit-framework` again to verify gaps are closed
- If many skills were added, consider running `/rebuild-prompts` to check all prompt-skill references

---

## Key Principles (For Future LLMs)

1. **Source code is ground truth** — every pattern in a skill MUST trace back to real `MAIN-SOURCE/` code. Never invent patterns, never guess what a system does. Read the actual files.

2. **Cross-project consensus drives structure** — a pattern in 3+ projects becomes skill CORE content. A pattern in 1-2 projects becomes a VARIANT. A pattern that's clearly wrong becomes a PITFALL. This is not optional.

3. **Existing format is law** — read the existing skills before writing new ones. Match their format EXACTLY. If unsure about formatting, copy the structure from the closest existing skill.

4. **Universal by default** — prose in skills, conventions, and templates must work for ANY Unity3D game genre. Genre-specific guidance lives ONLY in "Genre Variants" sections or conditional blocks.

5. **Skills must be self-sufficient** — an agent reading ONLY the skill (without seeing source code) should be able to implement the domain correctly. If additional context is needed, the skill isn't detailed enough.

6. **Convention edits cascade** — a convention change affects how ALL future code is generated across ALL projects. Be extremely precise. Test the wording against multiple genres mentally.

7. **Registration completes the work** — an unregistered skill is invisible to agents. ALWAYS register in ALL 5 locations (copilot-instructions tree, copilot-instructions table, Manual tree, Manual table, Manual key facts) plus the 3 prompt references.

8. **Merge, don't fragment** — if two projects use the same domain differently, they belong in ONE skill with Genre Variants. Don't create separate skills for "unity-save-json" and "unity-save-binary" — create ONE "unity-persistence" skill.

9. **Concrete over vague** — "Adjust pool size as needed" is WRONG. "Pool size: mining games ~30, horror games ~5, 2D games 0 (direct AudioSource)" is CORRECT. Always give specific values.

10. **Every TODO maps to a file change** — the output of this prompt is modified `.github/` files. If a TODO item can't be translated to a specific file edit, it's not actionable and should be reported back to the user for clarification.