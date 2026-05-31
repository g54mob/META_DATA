---
description: "Regenerate all phase documentation from actual code — every Dependency.md, GUIDE.md, and FLOW.md rewritten from scratch. Use when: after /decouple-check fixes, after manual edits, after /add-system-to-phase, anytime phase docs feel stale"
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`. Ask: "Which phase?" → `{PHASE}`

**In-depth detailed analysis is MANDATORY.** Read every `.cs` file in the phase completely. Trace every import, every event, every interface. Do NOT skim.

## Context Load

2. Read `.windsurf/templates/Dependency-template.md` — exact structure to follow for each system
3. Read `.windsurf/templates/GUIDE-template.md` — exact structure for GUIDE.md
4. Read `.windsurf/templates/FLOW-template.md` — exact structure for FLOW.md
5. Read `LEARN/{PROJECT}/GOAL.md` — architecture rules (naming, shapes, levels, conventions)
6. Read `LEARN/{PROJECT}/phase-All/` — know what's FREE (GameEvents core, Singleton, Utils, UIManager)
7. Read ALL `.cs` files in `LEARN/{PROJECT}/phase-{PHASE}/` — the actual code being documented

## Phase 1 — Regenerate Every Dependency.md

8. For EACH system folder in `_-Systems/`:
   a. Read every `.cs` file in that system folder
   b. Extract ALL dependencies:
      - `using` statements (which reference other systems?)
      - `Singleton<X>.Ins` calls (skip FREE: UIManager, DataManager)
      - `GetComponent<T>()` calls (interface or concrete?)
      - `GameEvents.On...` subscriptions (which events, from where?)
      - `GameEvents.Raise...()` calls (which events, who subscribes?)
      - Interface implementations (`: IInterface` — where is it defined?)
      - Interface definitions (what does this system OWN?)
      - Direct class refs from other `_-Systems/` folders
   c. Classify portability level:
      - **L0** = zero imports from other `_-Systems/` (only FREE infra)
      - **L1+** = each interface/concrete import from another `_-Systems/` = +1
   d. Determine system shape(s):
      - 🕷️ **Spider** = defines interfaces others implement
      - 🔍 **Hunter** = scans via `GetComponent<IInterface>()`
      - 🔌 **Adapter** = implements interfaces from other systems
      - 📡 **Broadcaster** = fires GameEvents only (no direct consumer knowledge)
      - 👂 **Listener** = subscribes to GameEvents only
      - 🏗️ **Infrastructure** = FREE (phase-All utilities)
   e. Write `Dependency.md` following Dependency-template.md EXACTLY:
      - Header with system name, level, portability status
      - Property table (Phase, Level, Shape, Scripts, Owns Interface, Implements, Concrete deps)
      - FREE Requirements table
      - Internal File Dependency Graph (INTERNAL → BOUNDARY → EXTERNAL zones)
      - Future Phase Modifications table (if known from PhaseMap.md)

## Phase 2 — Regenerate GUIDE.md

9. Write `GUIDE.md` following GUIDE-template.md EXACTLY, in this section order:
   a. **What It Looks Like When Running** — conversational player-experience description. Paint a picture for someone who has NEVER seen this game. Describe what they see, what they press, what happens. Use → for cause/effect
   b. **Folder Structure** — ASCII tree with one-liner "I do X" per file (first-person voice)
   c. **Script Purpose** — table with one-sentence purpose per script (first-person "I")
   d. **Hand-Typing Order** — compile groups with explicit stop-and-test checkpoints:
      - Group 1: enums + interfaces (zero deps, compile immediately)
      - Group 2: SO_ + W + DataService (data layer)
      - Group 3: Field_ + Orchestrator + SubManager (UI layer)
      - Each group ends with "Stop & compile" or "Stop & test"
   e. **Key Architecture** — per architecturally-significant class, explain WHY it's designed this way (shapes, decoupling rationale, interfaces, bridges, what would break without this design)
   f. **Modifications to Earlier Phases** (if any) — table: `| File | Change | Why |`
   g. **Stats** — file count, system count, L0/L1+ breakdown, 80% rule status

**GUIDE.md voice:** Beginner-friendly. Assume the reader has ZERO knowledge of this codebase. Every technical term briefly explained on first use. Conversational, not robotic.

## Phase 3 — Regenerate FLOW.md

10. Write `FLOW.md` following FLOW-template.md EXACTLY, in this section order:
    a. **Portability Diagram** — FREE infra list, then L0 systems, then L1+ with counted deps, then game-specific. End with Portability Scorecard table
    b. **Event Registry** — table: `| Event | Type | Fired By | Subscribed By | Purpose |`
       - MUST match actual `GameEvents.cs` code in this phase
       - Type column uses `Action<IInterface>` (never concrete classes)
       - Purpose = same as `// purpose:` comment in code
    c. **System Map** — ASCII box diagram showing all systems with:
       - Name, portability level, shape emoji
       - Connections labelled with GameEvent names, interface names, or [SerializeField]
       - Direction arrows for event flow / interface implementation
    d. **Data Flows** — one per major user action, written as **story-style prose**:
       - **bold** = visible change player sees
       - *italic* = context/internal note
       - `code` = exact script/method/field reference
       - Trace FULL path: player action → detection → event → subscriber → data change → UI refresh → what player sees

**FLOW.md voice:** Story-style narrative. Technical but readable. The reader should understand the full system interconnection by reading this file.

## Verification

11. Cross-check consistency:
    - Every event in FLOW.md Event Registry matches actual `GameEvents.cs`
    - Every system in FLOW.md System Map has a matching `Dependency.md`
    - GUIDE.md file count matches actual file count in phase folder
    - GUIDE.md Hand-Typing Order references every script in the phase
    - Every `// purpose:` comment in code is reflected in Event Registry
    - 80% rule verified: count scripts inside vs outside `_-Systems/`

## Output

12. Write all files:
    - `LEARN/{PROJECT}/phase-{PHASE}/_-Systems/[each system]/Dependency.md`
    - `LEARN/{PROJECT}/phase-{PHASE}/GUIDE.md`
    - `LEARN/{PROJECT}/phase-{PHASE}/FLOW.md`

**These are FULL rewrites** — not patches. Delete existing content and write from scratch using templates.