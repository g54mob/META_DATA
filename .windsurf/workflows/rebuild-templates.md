---
description: "Deep-analyse a project's LEARN/{PROJECT}/ folder (all phases, scripts, docs) and update .windsurf/templates/*-general.md AND *-template.md to reflect battle-tested conventions. Use when: after completing multiple phases, before starting a new project, whenever templates feel stale."
---

# /rebuild-templates — Evolve Universal Templates from Real Code

> Reads every `.cs` and `.md` across all built phases, extracts the actual conventions being used, compares against ALL template files (`*-general.md` + `*-template.md`), and backports proven patterns into them.

> **This prompt does NOT modify project-specific files** (`LEARN/{PROJECT}/GOAL.md`, `LEARN/{PROJECT}/NewAgent.md`). It only updates the universal `.windsurf/templates/` files that feed into `/init` for future projects.

> **Scope:** `GOAL-general.md`, `NewAgent-general.md`, `GUIDE-template.md`, `FLOW-template.md`, `Dependency-template.md` — ALL are first-class targets.

---

## Setup

### 1. Ask for paths

Ask the user:
- "Where is the **learn folder** that houses all phase folders + GOAL.md + NewAgent.md + all `.cs` scripts?"
  - Default: `LEARN/{PROJECT}/` (future convention) or `learn/` (legacy single-project)
  - Set `{LEARN}` = user's answer
- "Where are the **template files** (`*-general.md` and `*-template.md`)?"
  - Default: `.windsurf/templates/`

### 2. Verify structure

Confirm these exist:
- `{LEARN}/GOAL.md` — project-specific architecture bible
- `{LEARN}/NewAgent.md` — project-specific agent instructions
- At least 2 `{LEARN}/phase-*/` folders with `.cs` files inside
- `{TEMPLATES}/GOAL-general.md` — universal architecture template
- `{TEMPLATES}/NewAgent-general.md` — universal agent instruction template

Also read ALL other templates (analyse each for gaps against actual code):
- `{TEMPLATES}/ARCHITECTURE-template.md`
- `{TEMPLATES}/GUIDE-template.md`
- `{TEMPLATES}/FLOW-template.md`
- `{TEMPLATES}/Dependency-template.md`
- `{TEMPLATES}/PhaseMap-template.md`
- `{TEMPLATES}/StructureMap-template.md`
- `{TEMPLATES}/SystemPortabilityMap-template.md`
- `{TEMPLATES}/SystemIsolationAnalysis-template.md`
- `{TEMPLATES}/CoverageMap-template.md`
- `{TEMPLATES}/Estimate-template.md`
- `{TEMPLATES}/OptionalFeatures-template.md`
- `{TEMPLATES}/surfer-template.md`

Also read project docs for comparison:
- `{LEARN}/SystemIsolationAnalysis.md`
- `{LEARN}/SystemPortabilityMap.md`
- `{LEARN}/CoverageMap.md`
- `{LEARN}/OptionalFeatures.md`

### 3. Inventory all phases

List every `{LEARN}/phase-*/` folder. For each:
- Count `.cs` files recursively
- Count `_-Systems/*/` folders (system count)
- Note whether GUIDE.md, FLOW.md exist
- Note whether any `_-Systems/*/Dependency.md` exist

Report: `| Phase | Scripts | Systems | GUIDE | FLOW | Dependencies |`

---

## Phase 1 — Deep Convention Extraction (Read-Only)

> Read ALL code. Extract ACTUAL conventions. Do not skip files.

### 4. Extract `#region` ordering

Read every `.cs` file across all phases. For each, extract the `#region` names in declaration order. Group by script role:

| Role | Scripts Sampled | Actual `#region` Order Found |
|------|----------------|------------------------------|
| SubManager | ... | ... |
| Orchestrator | ... | ... |
| DataService | ... | ... |
| Field_ | ... | ... |
| DataWrapper (W) | ... | ... |
| MonoBehaviour (base class) | ... | ... |
| MonoBehaviour (multi-interface) | ... | ... |
| Manager (Singleton) | ... | ... |

Compare against `GOAL-general.md`'s `#region` order specification. Note every deviation.

### 5. Extract `using` import blocks

Read the first 15 lines of every `.cs` file. Extract the `using` import pattern:
- What namespaces appear?
- In what order?
- Is there a blank-line grouping pattern (System → UnityEngine → TMPro → Project)?
- Is there a project-specific namespace (e.g., `using SPACE_UTIL;`) used consistently?

Compare against `GOAL-general.md`. Note if the template documents this or not.

### 6. Extract field visibility patterns

Scan all `.cs` files for field declarations. Classify by script role:

| Pattern | Where Found | Script Role | Count |
|---------|-------------|-------------|-------|
| `[SerializeField] private` | ... | MonoBehaviour, Manager | ... |
| `public` (no attribute) | ... | Field_, DataWrapper, entity | ... |
| `[HideInInspector] public` | ... | BasePhysicsObject, etc. | ... |
| `protected` | ... | Base classes | ... |
| `protected ... { set => }` | ... | Base classes (write-only) | ... |
| `public static` constants | ... | DataService config | ... |

Compare against `GOAL-general.md`'s `[SerializeField]` and property rules. Note which exceptions are documented vs which are missing.

### 7. Extract property usage

Find all `{ get; set; }`, `{ get; private set; }`, `=> _field`, and expression-bodied property patterns:

| Pattern | File | Script Role | Purpose |
|---------|------|-------------|---------|
| `=> _field` | ... | Singleton (Owner chain) | Read-only inspector ref |
| `{ get; private set; }` | ... | UIManager, Bridge | Singleton read state / static accessor |
| `=> derivedExpression` | ... | Entity / DataWrapper | Derived computed field |

Compare against `GOAL-general.md`'s no-property rule and its exceptions list.

### 8. Extract Bridge implementations

Find all `*Bridge.cs` files across all phases. For each:

| Bridge | Phase | System | Pattern Variant | Placement (provider/consumer?) |
|--------|-------|--------|----------------|-------------------------------|

Classify each into one of these variants (or discover NEW variants):
1. **Event-push** — Inspector-wired → cast to interface → fire GameEvent on Start
2. **Event-response** — Subscribe to GameEvent → call interface method on received object
3. **Push-to-all** — `FindObjectsByType<T>()` on Start → loop + push self to each
4. **Event-chain** — Subscribe to GameEvent → fire ANOTHER GameEvent with `this` as interface
5. **Static-accessor** — Inspector-wired → `static IXxx Provider { get; private set; }` on Start

Determine the ACTUAL placement rule: does bridge live on consumer side? provider side? non-portable side?

Compare against `GOAL-general.md`'s Bridge Pattern section.

### 9. Extract interface conventions

Find all `interface I*` declarations across all phases. For each:

| Interface | Owner System | Phase | Location (root vs Interface/) | Has Owner/Implementor/Caller doc? |
|-----------|-------------|-------|-------------------------------|-----------------------------------|

Extract patterns:
- When is `Interface/` subfolder used vs root of system? (correlate with interface count per system)
- Do interfaces have `<summary>` with Owner/Implementor/Caller documentation?
- Are there multi-tier interface sets (e.g., Identity/Mutation/Progress tiers on same implementor)?

Compare against `GOAL-general.md`'s interface rules and System Subfolder Convention table.

### 10. Extract GameEvents format

Read every `GameEvents.cs` (phase-All + each phase's `0-Core/`). Extract:
- `LogSubscribersCount` parameter order: `(nameof(OnX), OnX)` or `(OnX, nameof(OnX))`?
- Invoke style: `GameEvents.OnX?.Invoke(...)` or `OnX?.Invoke(...)`?
- Comment block style: `// when X >>` / `// << when X` or `// purpose:`?
- `.colorTag("lime")` in log helper or not?

Compare against `GOAL-general.md`'s Foundation Templates GameEvents code.

### 11. Extract system subfolder patterns

List all subfolder names found under any `_-Systems/*/`:

| Subfolder | Occurrences | Systems That Use It |
|-----------|-------------|---------------------|

Compare against `GOAL-general.md`'s System Subfolder Convention table.

### 12. Extract inheritance chains

Find all `: BaseClassName` declarations. Trace multi-level chains:

```
BaseA (phase-All/3-MonoBehaviours/)
  └── BaseB (phase-All/3-MonoBehaviours/)
        └── ConcreteC (phase-X/_-Systems/XxxSystem/)
              └── SubD (phase-X/_-Systems/XxxSystem/BaseSub/)
```

Note: where does each level live (phase-All shared vs system folder)?

Compare against `GOAL-general.md` — does it document inheritance chain conventions?

### 13. Extract GUIDE.md format

Read every `{LEARN}/phase-*/GUIDE.md`. Extract section headings per phase:

| Phase | Sections Found |
|-------|---------------|

Compare against `GUIDE-template.md`'s mandatory sections list. Note sections that appear in real GUIDEs but not in the template.

### 14. Extract FLOW.md format

Read every `{LEARN}/phase-*/FLOW.md`. Extract section headings per phase:

| Phase | Sections Found |
|-------|---------------|

Compare against `FLOW-template.md`'s mandatory sections list.

### 15. Extract Dependency.md format

Read every `{LEARN}/phase-*/_-Systems/*/Dependency.md`. Extract section headings:

| System | Sections Found |
|--------|---------------|

Compare against `Dependency-template.md`'s mandatory sections list. Note sections in real Dependency docs not in template (e.g., Scene Setup).

### 16. Extract custom extensions used

Grep all `.cs` files for method calls matching project extension patterns (`.map()`, `.find()`, `.all()`, `.gc<T>()`, `.destroyLeaves()`, `.colorTag()`, `.formatMoneyShort()`, `C.method()`, `INPUT.K.InstantDown()`, `INPUT.UI.SetCursor()`, `.flatMap()`, `.forEach()`, `.ToNSJson()`, `.GetOrCreate()`, etc.)

| Extension | Occurrences | In Template's Extensions List? |
|-----------|-------------|-------------------------------|

### 17. Extract doc types in LEARN/{PROJECT}/ root

List all `.md` files in `{LEARN}/` root:

| Doc | Exists? | Mentioned in Templates? |
|-----|---------|------------------------|

Check specifically for: `SystemIsolationAnalysis.md`, `OptionalFeatures.md`, `CoverageMap.md`, `SystemPortabilityMap.md`.

### 18. Extract naming conventions

Scan for:
- ALL_CAPS list/dictionary fields — any used for static config constants too?
- `DOC__` dictionary prefixes — consistently used?
- `Field_` public field naming — `_prefix` on public fields?
- Extension classes — co-located in same file as the extended class?


<!-- SPLIT: This workflow exceeds Windsurf's 12K char limit. Continues in /rebuild-templates-2 -->

> **Continue:** Run `/rebuild-templates-2` to proceed with micro-conventions extraction and gap report.
