# GUIDE Template — Per-Phase Guide Format

> Copy this into each `phase-X/GUIDE.md`. Replace `[PHASE_X]`, `[PHASE_NAME]`, and all bracketed placeholders.
> Every section is MANDATORY unless marked (if applicable).

---

## Mandatory Sections (in this exact order)

### 1. `## What It Looks Like When Running`

Conversational. Describe the **player experience**, not the code:

```markdown
## What It Looks Like When Running

[Describe what the player sees and does. Walk through each major interaction:
- What the player sees on screen
- What controls they use
- What happens when they interact
- Sensory details: animations, sounds, visual feedback

Write as if the reader has never seen this game. Paint a picture.]

Each system testable independently.
```

**Rules:**
- Conversational voice, not bullet points
- Describe the experience, not the implementation
- Use → for cause/effect ("press E → interaction wheel shows 'Take'")
- End with "Each system testable independently."

---

### 2. `## Folder Structure`

```markdown
## Folder Structure

``
phase-X/Scripts/
├── _-Systems/
│   ├── SystemA/
│   │   ├── SO_A.cs                 → "I define [what]"
│   │   ├── Field_A.cs              → "I display [what]"
│   │   ├── ADataService.cs         → "I manage [what] collections"
│   │   ├── AOrchestrator.cs        → "I wire [what] UI to data"
│   │   ├── AUI.cs                  → "I open/close the [what] panel"
│   │   ├── Interface/
│   │   │   └── IMyContract.cs      → "I enforce [what contract]"
│   │   ├── Bridge/
│   │   │   └── ABridge.cs          → "I push [what context] into this system"
│   │   ├── Test.md                 → "vertical slice test"
│   │   └── Dependency.md           → "L{n} portability analysis"
│   └── SystemB/
│       └── ...
├── 0-Core/
│   └── GameEvents.cs               → "phase-specific events (partial class)"
├── 2-Data/Enums/
│   └── GlobalEnumsX.cs             → "all phase enums in ONE file"
└── 4-Utils/
    └── PhaseXLOG.cs                → "snapshot formatters for DataService collections"
``
```

**Rules:**
- One-liner purpose per file using first-person "I" voice
- Show `_-Systems/` as PRIMARY
- Numbered folders only for shared infra (0-Core, 2-Data/Enums, 4-Utils)

---

### 3. `## Script Purpose`

```markdown
## Script Purpose

| Script | One-Sentence Purpose |
|--------|---------------------|
| `SO_ItemDef.cs` | I define what an item IS — pure data, zero methods. |
| `Field_Item.cs` | I display one item row — SetData only, no logic. |
| `ItemDataService.cs` | I manage all items as a collection — Build, Get, Add, Remove, Snapshot. |
| `ItemOrchestrator.cs` | I wire Field_ instances to DataService and handle AddListener. |
| `ItemUI.cs` | I open and close the item panel — isFirstEnable pattern. |
```

**Rules:**
- One sentence per script, first-person "I"
- If it doesn't fit one sentence, the script should be split

---

### 4. `## Hand-Typing Order`

```markdown
## Hand-Typing Order

### Group 1 — [Category] (compile immediately, zero deps)

1. `GlobalEnumsX.cs` — enums
2. `IMyContract.cs` — interface (7 lines)
3. `SO_ItemDef.cs` — pure data

**Stop & compile. Zero errors.**

### Group 2 — [Category] (compile with Group 1)

4. `WItem.cs` — data wrapper
5. `ItemDataService.cs` — collection service
6. `PhaseXLOG.cs` — snapshot formatting

**Stop & test with DEBUG_Check ✅**

### Group 3 — [Category] (compile with Groups 1-2 + phase-All)

7. `Field_Item.cs` — display only
8. `ItemOrchestrator.cs` — wires UI to data
9. `ItemUI.cs` — SubManager (isFirstEnable)

**Stop & test full UI flow ✅**
```

**Rules:**
- Compile groups with explicit stop-and-test checkpoints
- Interfaces and enums FIRST (zero deps)
- DataService before Orchestrator (data before UI wiring)
- Explain WHY this order: "interfaces first because implementations depend on them"

---

### 5. `## Key Architecture`

**MANDATORY for phases with 2+ systems.** Deep-dive into each key class explaining the architectural rationale — WHY it's designed this way, not just WHAT it does.

```markdown
## Key Architecture

### [ClassName] — [design pattern or decoupling rationale]

[2-5 paragraphs explaining:]
- Why is this a Spider/Adapter/Broadcaster?
- What interfaces does it define or implement? Why?
- How does it avoid concrete cross-system imports?
- What makes it portable (L{n})?
- What would break if this design wasn't used?

### [ClassName2] — [design pattern]

[Same depth per key class...]
```

**Rules:**
- One subsection per architecturally significant class
- Explain the DECOUPLING rationale — not just the feature
- Name the specific interfaces, bridges, and GameEvents involved
- For straightforward phases (1 simple system), keep this section brief

---

### 6. `## Scene Setup Checklist` (if applicable)

```markdown
## Scene Setup Checklist

| # | GO Name | Component | Required Fields | Notes |
|---|---------|-----------|----------------|-------|
| 1 | Managers | UIManager | — | Singleton, always in scene |
| 2 | ShopCanvas | ShopUI | _CATEGORY: [drag SO assets] | SubManager, starts disabled |
| 3 | ShopCanvas/Orchestrator | ShopUIOrchestrator | _pfCategory, _pfShopItem | Prefab refs from Project |
```

**⚠️ Critical Setup Warnings (add per-GO where applicable):**
```markdown
> **⚠️ WITHOUT [BuildingManager]:** ghost won't appear, placement validation won't run.
> **⚠️ Missing [BuildingObject] layer:** raycast returns empty, you can't click buildings.
> **⚠️ [ConveyorBeltManager] missing [DefaultExecutionOrder(-10)]:** conveyors update AFTER belts, items stutter.
```

Add a warning box for every component that causes silent failure or hard-to-debug issues if missing/misconfigured.

**Rules:**
- Every GO, every component, every field wiring — no shortcuts
- "Drag from Hierarchy" vs "Drag from Project" must be explicit
- Warn about scene instance vs prefab (Pitfall #2)

### 6b. `## Required Layers` (if applicable)

```markdown
## Required Layers

| Layer Name | Layer # | Used By | ⚠️ Pitfall |
|-----------|---------|---------|----------|
| BuildingObject | 10 | BuildingManager raycast | LayerMask defaults to Nothing — must set in inspector |
| Interactable | 8 | PlayerInteraction raycast | Missing = can't interact with anything |
```

Separate from Scene Setup because layers must be configured in Project Settings, not per-GO.

---

### 7. `## Modifications to Earlier Phases`

```markdown
## Modifications to Earlier Phases

### 1. `phase-Y/Scripts/path/FileName.cs` — **ADD** [what]

```csharp
// In FileName.cs, inside #region [which region]
// ← ADD these lines:
public void NewMethod()
{
    // → [what it does]
}
```

### 2. `phase-Y/Scripts/path/OtherFile.cs` — **MODIFY** [what]

```csharp
// BEFORE:
oldCode();
// AFTER:
newCode(); // ← CHANGED: [reason]
```
```

**Rules:**
- Exact file path (which phase, which folder)
- What to change: ADD / REPLACE / MODIFY
- **Exact code in fenced blocks** with `// ← ADD` or `// ← CHANGED` markers
- Reason for each change

---

### 8. `## Source vs Phase Diff`

```markdown
## Source vs Phase Diff

| What | Original Did | What We Did | Why |
|------|-------------|-------------|-----|
| [Feature] | [Original approach] | [Our approach] | [Architectural reason] |
```

---

### 8b. `## Cross-Phase Interfaces Implemented` (for phases implementing interfaces from earlier phases)

```markdown
## Cross-Phase Interfaces Implemented

| Interface | Defined In | Implemented By | Purpose |
|-----------|-----------|----------------|----------|
| IInteractable | Phase A InteractionSystem | ComputerTerminal, OreSled | World objects the player can interact with |
| IHighlightable | Phase B HighlightSystem | BuildingObject, OrePiece | Objects that glow when looked at |
| IDamageable | Phase B-1 ToolSystem | MiningNode, StaticBreakable | Objects the pickaxe can damage |
```

Only include for phases that IMPLEMENT interfaces from earlier phases (not phases that only DEFINE them).

---

### 8c. `## Data Entities` (if applicable)

```markdown
## Data Entities

| Type | Kind | Purpose |
|------|------|----------|
| CastingMoldType | enum | Mold variants: none, ingot, gear, doubleIngot |
| BoxContentEntry | [Serializable] class | One item type in a packaged box: ResourceType, PieceType, IsPolished, Count |
| ProcessingRecipe | struct | Input→Output mapping for a machine: inputPieceType, outputPieceType, duration |
```

List all enums and serializable data classes defined in this phase that DON'T live inside a specific system folder (shared types in 2-Data/).

---

### 9. `## Systems & Testability`

```markdown
## Systems & Testability

### Individual Systems

| System | Scripts | Level | Shape | Decoupled Via |
|--------|---------|-------|-------|---------------|
| [Name] | [List] | L{n} | 🕷️ Spider / 🔌 Adapter | [GameEvents / Interfaces used] |

### Testability Matrix

| System | .cs Test | Manual/*.md | Needs other systems? |
|--------|----------|-------------|---------------------|
| [Name (data)] | DEBUG_Check | — | Nothing — plain C# new |
| [Name (UI)] | — | ManualTest.md | No [other system] needed |

### Portability Scorecard

| System | Level | Shape | External Deps | Portable? |
|--------|-------|-------|---|---|
| [SystemA] | **L0** | 🕷️ Spider | — | ✅ |
| [SystemB] | **L2** | 🔌 Adapter | IInterfaceA, IInterfaceB | ✅ interface-only |
| [SystemC] | **L5** | 🔌+📡 | ConcreteClass | ❌ game-specific |

Phase [X]: N/N = 100% portable ✅

### Final Count

X systems, Y scripts, Z .cs tests, W manual tests. Zero tight coupling.
```

---

### 10. `## Vertical Slice Tests`

```markdown
## Vertical Slice Tests

### DEBUG_CheckX — [SystemName]DataService (Data-Level)

> This test proves [System]DataService works as pure C# — zero scene, zero UI.
> One GO, press keys, check the console. If this passes, your data layer is solid.

**What you need to type first:** `[DataService].cs`, `GlobalEnumsX.cs`
**What you DON'T need:** [list what's NOT needed — proves independence]

**Step-by-step scene setup:**
1. Create a new empty scene
2. Create an Empty GO → name it `DEBUG_CheckX`
3. Add the `DEBUG_CheckX` component to it
4. [Inspector wiring if needed — or "No inspector wiring needed"]
5. Press Play

| Key | What it does | What you should see in Console |
|-----|-------------|-------------------------------|
| [Key] | [Action] | [Expected console output] |

**Checklist:**
- [ ] [Pass/fail item 1]
- [ ] [Pass/fail item 2]
- [ ] Zero console errors
```

---

### 11. `## Art & Scene Work (Non-Script)` (if applicable)

```markdown
## Art & Scene Work (Non-Script)

### Prefab Hierarchies
- [Prefab name]: [child GO hierarchy with components]

### Animation Assets
- [Clip name]: [what it animates, duration]

### SO Assets to Create
- [SO name]: [fields to fill in inspector]

### Layers & Tags
- [Layer/Tag name]: [what uses it]
```

---

## Formatting Rules

- One-sentence summaries are MANDATORY for Script Purpose
- Use code blocks with `// ← ADD` markers for modifications
- Tables use: `| Header1 | Header2 |` format
- Scene setup uses: `| # | GO Name | Component | Fields | Notes |`
- Assume the reader has **never opened Unity** — every click, every field, every GO is explicit
- Conversational voice throughout — the GUIDE is a friend walking you through the codebase