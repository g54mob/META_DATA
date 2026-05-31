# ARCHITECTURE Template — Source Code Analysis

> Copy this structure into `LEARN/{PROJECT}/ARCHITECTURE.md`.
> Comprehensive analysis of the ORIGINAL source code — what exists, how it works, where it's coupled.
> This is the INPUT. GOAL.md is the OUTPUT (what to build). These two docs are a before/after pair.

---

## Mandatory Table of Contents

```markdown
# {PROJECT} — Detailed Architecture Documentation

> **Purpose:** This document provides a comprehensive architectural analysis of the {PROJECT} codebase —
> [1-2 sentences: genre, what the player does]. It is intended as a learning reference for understanding
> how each system is designed and how they interconnect.

---

## Table of Contents

1. Project Overview
2. High-Level Architecture Diagram
3. Core Architectural Pattern: Singleton Managers
4. System-by-System Breakdown
   - 4.1 [System Name]
   - 4.2 [System Name]
   - ... (one per major system — typically 10-20)
5. Key Design Patterns & Techniques
6. Coupling Analysis
7. God Objects — Split Candidates
8. Critique & Thoughts
9. File Index
```

---

## Section Requirements

### 1. Project Overview

```markdown
## 1. Project Overview

[1-2 paragraphs: game genre, core gameplay loop, player actions, progression]

### Project Structure

[ASCII folder tree of MAIN-SOURCE/{PROJECT}/ showing:
- Assemblies/
- Assets/ (with sub-counts: Mesh (N items), Sprite (N items), etc.)
- Scripts/ (highlight Assembly-CSharp as ★ GAME CODE (~N scripts))
]

### Third-Party Dependencies

| Library | Purpose | Depth | Wrapper Needed? |
|---------|---------|-------|-----------------|
| [Name] | [What it does in this game] | Shallow/Deep/Pervasive | Yes/No |

**Depth levels:**
- **Shallow** — used in 1-2 scripts, easy to swap (e.g. DOTween for a single tween)
- **Deep** — used across 5+ scripts, requires interface wrapper (e.g. FMOD for all audio)
- **Pervasive** — framework-level dependency, fundamental to architecture (e.g. FishNet networking)

### Genre Classification

| Property | Value |
|----------|-------|
| Genre | [e.g. Business Tycoon, Mining FPS, Horror Adventure] |
| Core Mechanic | [e.g. Grid building + NPC management + economy] |
| Perspective | [FPS / TPS / Isometric / Top-down 2D / 2D Side-scroll] |
| Multiplayer | [None / LAN / Online (library name)] |

### Multiplayer Architecture (if applicable)

| Property | Value |
|----------|-------|
| Library | [FishNet / Photon PUN2 / PhotonBolt / RakNet / Lidgren / None] |
| Authority Model | [Server-authoritative / Host / Peer-to-peer] |
| Sync Pattern | [SyncVar / RPC / State serialization] |
| NetworkBehaviour count | [N scripts extend NetworkBehaviour] |
```

---

### 2. High-Level Architecture Diagram

```markdown
## 2. High-Level Architecture Diagram

[ASCII art showing the major system categories and data flow:]
- Singleton Managers (top)
- Player Systems
- World/Environment Systems
- UI Systems
- Data flow arrows for major game loops (resource lifecycle, progression, etc.)

Example:
┌─────────────────── SINGLETONS ───────────────────┐
│  GameManager ← EconomyManager ← SaveManager      │
│  UIManager ← SoundManager ← SettingsManager      │
└──────────────────────┬───────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
   [Player]       [World/Env]      [UI Panels]
   Movement       OreSpawner       ShopUI
   Inventory      Machines         InventoryUI
   Tools          Conveyors        QuestUI
```

---

### 3. Core Architectural Pattern: Singleton Managers

```markdown
## 3. Core Architectural Pattern: Singleton Managers

### Singleton Base

[Show the ORIGINAL singleton pattern from source code — exact code block]

### Manager Execution Order

| Priority | Manager | Reason |
|----------|---------|--------|
| -100 | [ManagerName] | [Why it needs to init first] |
| -50 | [ManagerName] | [Depends on above] |

### Manager Communication

[How managers talk to each other in the original source:]
- Direct references (tight coupling hotspots)
- Event-driven (good patterns to preserve)
- Static access patterns
```

---

### 4. System-by-System Breakdown

Repeat this structure for every major system (10-20 subsections typically):

```markdown
### 4.N [System Name]

**Files:** [list every .cs file in this system]

**Responsibilities:** [what this system does — 2-3 sentences]

**Class Hierarchy:**
[If inheritance exists: Base → Child1, Child2, Child3]

**Key Code Patterns:**
[Notable patterns: state machines, coroutines, pooling, etc.]

**Data Flow:**
[What data comes in, what goes out, what events fire]

**SerializeField Dependencies:**
[Inspector-wired references to other systems — coupling indicators]

**Public API:**
| Method | What It Does |
|--------|-------------|
| `MethodName(params)` | [description] |

**Events (fired/subscribed):**
- Fires: [list events this system raises]
- Subscribes to: [list events this system listens to]

**God-Object Analysis:** (if >200 lines doing 3+ things)
[What it does, how to split into: SO_, DataService, Orchestrator, SubManager, Field_]
```

---

### 5. Key Design Patterns & Techniques

```markdown
## 5. Key Design Patterns & Techniques

[For each pattern found in source:]

### [Pattern Name]

**Where:** [which scripts use it]
**How:** [brief code example or description]
**Preserve?** ✅ Keep / ❌ Replace with [alternative] / ⚠️ Adapt to [new pattern]
```

Common patterns to look for:
- Object pooling
- Interfaces (IInteractable, IDamageable, etc.)
- Coroutine chains
- Event-driven communication
- State machines
- Observer pattern
- Factory pattern
- Command pattern

---

### 6. Coupling Analysis

```markdown
## 6. Coupling Analysis

### FindObjectOfType Calls (MUST eliminate)

| File | Target Type | How to Decouple |
|------|------------|-----------------|
| [script.cs] | [Type] | [SerializeField / GameEvents / Interface] |

### Direct Cross-System References (tight coupling)

| File A | File B | Relationship | How to Decouple |
|--------|--------|-------------|-----------------|
| [script.cs] | [other.cs] | [calls/reads/commands] | [GameEvents / Interface / Bridge] |

### Static Instance Access

| File | Singleton | Read or Command? | Acceptable? |
|------|-----------|-------------------|-------------|
| [script.cs] | [Manager].Instance | Read (GetValue) | ✅ |
| [script.cs] | [Manager].Instance | Command (DoAction) | ❌ → use GameEvents |
```

---

### 7. God Objects — Split Candidates

```markdown
## 7. God Objects — Split Candidates

| File | Lines | Responsibilities | Suggested Split |
|------|-------|-----------------|-----------------|
| [BigScript.cs] | ~N | [1. Does X, 2. Does Y, 3. Does Z] | SO_Xxx + XxxDataService + XxxOrchestrator + XxxUI |
```

For each god object, describe:
- What it currently does (list 3+ responsibilities)
- Suggested split into new architecture roles (SO_, DataService, Orchestrator, SubManager, etc.)
- Which responsibility maps to which new class

---

### 8. Critique & Thoughts

```markdown
## 8. Critique & Thoughts

### What the Original Source Does Well (PRESERVE)

[List patterns worth keeping — these inform GOAL.md's "preserve" decisions:]
- [Pattern]: [why it works, how to adapt]

### What to Improve (TRANSFORM)

[List problems that drive the architecture transformation:]
- [Problem]: [impact on code quality, how the new architecture fixes it]
```

---

### 9. File Index

```markdown
## 9. File Index

| # | File | Lines | Purpose |
|---|------|-------|---------|
| 1 | `FileName.cs` | ~N | [One-line purpose] |
| 2 | ... | ... | ... |

**Total: N scripts, ~N lines of game code.**
```

Every script in `MAIN-SOURCE/{PROJECT}/` must appear here. Cross-check count against actual file listing.

---

## Rules

- This doc analyzes the ORIGINAL source — what EXISTS, not what to BUILD
- GOAL.md defines the transformation target — ARCHITECTURE.md is the "before" picture
- Be thorough: missing systems here = missing phases in PhaseMap later
- Every file in the source must appear in at least Section 4 (breakdown) or Section 9 (index)
- God objects (>200 lines, 3+ responsibilities) MUST be identified — they drive phase splits
- Coupling analysis is critical — it drives the decoupling strategy in GOAL.md
- File counts must be verifiable: state "Total: N scripts" and the reader can recount
- Third-party dependency table helps identify what Unity packages the project needs