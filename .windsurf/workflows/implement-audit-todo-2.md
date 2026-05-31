---
description: "/implement-audit-todo continuation (part 2/4) — cross-project consensus, skill architecture, core components. Run /implement-audit-todo first."
---

<!-- SPLIT: Part 2 of /implement-audit-todo — exceeds Windsurf's 12K char limit when combined -->

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

Create `.windsurf/skills/{skill-name}/SKILL.md`. Follow this complete template:

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


> **Continue:** Run `/implement-audit-todo-3` to proceed with pitfalls, genre variants, and conventions.
