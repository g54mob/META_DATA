# Surfer Template — Critical Thoughts Log

> Copy this structure into `LEARN/{PROJECT}/surfer.md`.
> Captures critical thinking for each agent prompt — what was considered, why choices were made, what was deliberately avoided.
> Appended (never overwritten) with each new request.

---

## Format

```markdown
# Surfer — Critical Thoughts Log

> This file captures my critical thinking for each prompt — what I considered, why I made certain choices, and what I deliberately avoided. Appended with each new request.

---

## Prompt Number N: "[User's request summary]"

**What I thought:**

- [Key architectural decision and WHY]
- [What was considered but rejected and WHY]
- [Coupling/decoupling rationale]
- [What was deliberately scoped OUT]
- [Patterns applied from GOAL.md]

**Source fidelity:**
- [What was preserved from original source — exact method names, algorithms, data structures kept]
- [What was changed and WHY — splits, renames, pattern replacements]
- [What was intentionally omitted — features deferred to later phases or OptionalFeatures]

---
```

---

## Rules

- **Append only** — never overwrite previous entries
- Each entry starts with `## Prompt N: "[summary]"` followed by `**What I thought:**`
- Bullet points under "What I thought:" — each is a DECISION with rationale
- Focus on WHY, not WHAT (the code shows what — surfer explains why)
- Include: scoping decisions, coupling analysis, pattern choices, source fidelity notes
- Keep entries concise — 5-15 bullet points per prompt
- Number prompts sequentially (Prompt 1, Prompt 2, ...)
- If a prompt spans multiple agent turns, combine into one surfer entry