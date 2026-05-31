---
description: "Implement .windsurf/ framework improvements by deep-reading MAIN-SOURCE/ projects and applying changes: create new skills from real source patterns, update existing skills with genre variants, modify conventions/templates/prompts. Works from gap reports (audit-required-todo.md), /audit-framework output, or user-specified changes. Use when: after /audit-framework produces a gap report, or when you know exactly what framework changes are needed."
---

# /implement-audit-todo — Apply Framework Improvements from Source

> Reads a gap report (or user instructions), then deep-analyses `MAIN-SOURCE/` projects to extract
> REAL code patterns, and implements all approved changes to `.windsurf/` files — creating new skills,
> updating existing skills with genre variants, modifying conventions, templates, and prompts.

> **This prompt ONLY modifies `.windsurf/` files** — never touches `MAIN-SOURCE/` or `LEARN/` project content.

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
  - Default: `.windsurf/audit-required-todo.md`
  - Or: "I'll describe the changes I want" (no file needed)
  - Or: paste `/audit-framework` output directly

If a file exists, read it fully. Extract every actionable item with:
- **Target file** — which `.windsurf/` file to create or modify
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
- `.windsurf/skills/` directory with existing skills (format reference)
- `.windsurf/copilot-instructions.md` (registration target)
- `.windsurf/MANUAL.md` (registration target)

If `MAIN-SOURCE/` is missing but `Scripts/Assembly-CSharp/` exists, treat that as the single source project.
If NEITHER exists, STOP — this prompt requires raw source for code extraction. Cannot create skills from outlines alone.

### 4. Read existing skill format (FORMAT LAW)

Read ALL `.windsurf/skills/*/SKILL.md` files fully. Extract and memorize the exact format:

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

<!-- SPLIT: This workflow exceeds Windsurf's 12K char limit. Continues in /implement-audit-todo-2 -->

> **Continue:** Run `/implement-audit-todo-2` to proceed with cross-project consensus and skill structure.
