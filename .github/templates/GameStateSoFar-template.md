# GameStateSoFar Template — Progressive Gameplay State Guide

> Copy this structure into `LEARN/{PROJECT}/GameStateSoFar.md`.
> Plain-English description of what the game looks and plays like at each milestone.
> NO technical jargon — no DataService, no Orchestrator, no file names. Pure player experience.
> This is the ONE doc a non-coder could read and understand what the game does right now.

---

## Rules

- **Player-experience language ONLY.** Describe what happens on screen, what the player presses, what they see and hear. Never mention class names, scripts, systems, or architecture.
- **Cumulative.** Each section builds on ALL previous sections. The latest section describes the FULL playable experience.
- **Only cover what's IMPLEMENTED.** Never describe future phases or planned features. If it's not built yet, it doesn't exist in this doc.
- **One section per milestone.** A milestone = after `/init` (no code yet), after each `/build-phase` delivery, or after a `/merge-phase` or `/move-system` that changes the playable scope.
- **Update, don't rewrite earlier sections.** Earlier milestone sections are historical snapshots — append new sections, never edit old ones (unless `/post-delivery-sync` reveals the hand-typed code changed the gameplay scope from what was planned).
- **Keep it short.** Each milestone section = 3-8 sentences max. If you need more than 8 sentences, you're being too detailed.
- **What to expect format.** Each section answers: What can the player DO? What do they SEE? What do they HEAR? What happens when they interact? What DOESN'T work yet?

---

## Mandatory Sections

### 1. Header

```markdown
# GameStateSoFar — {PROJECT}

> What the game looks and plays like right now. Updated after each phase delivery.
> Read the latest section for the current state. Earlier sections are historical snapshots.
```

### 2. After /init Section

```markdown
## After /init — Game Plan Only (Nothing Playable)

**Target game:** [1-2 sentence pitch — genre, core loop, what makes it interesting]

Nothing is playable yet. Architecture docs exist but no code has been generated.
The sections below will grow as each phase is built.
```

### 3. Per-Phase Sections (one per delivered phase)

```markdown
## After phase-{X} — [Short Descriptor]

[3-8 sentences describing the CUMULATIVE player experience. What can the player do NOW
that they couldn't before? What does the world look/feel like? What's still missing?]

**New this phase:**
- [Bullet list: 2-5 new capabilities the player gained]

**Still missing:**
- [Bullet list: 1-3 obvious things a player would expect but aren't there yet]
```

### 4. After Hand-Typing Update (optional, via /post-delivery-sync)

If the hand-typed code differs meaningfully from the planned code (e.g., user added a feature,
removed a feature, or changed how something works), append a note:

```markdown
> **Post-typing update (phase-{X}):** [1-2 sentences describing what changed from the plan.
> e.g., "Added a minimap that wasn't in the original phase plan" or
> "Removed the tooltip system — moved to phase-{Y} instead"]
```

---

## Example (Mining Game)

```markdown
# GameStateSoFar — minemgl

> What the game looks and plays like right now. Updated after each phase delivery.
> Read the latest section for the current state. Earlier sections are historical snapshots.

## After /init — Game Plan Only (Nothing Playable)

**Target game:** A first-person mining game where you dig ores, smelt them, sell products, and expand your underground operation. Think Minecraft meets factory automation.

Nothing is playable yet. Architecture docs exist but no code has been generated.

## After phase-a — World Foundation

You spawn into a 3D world. You can walk around using WASD, look around with the mouse, and jump with Space. The terrain exists but there's nothing to interact with — no items, no ores, no UI. It's just you and an empty world.

**New this phase:**
- First-person movement (walk, sprint, jump, look)
- Basic terrain with ground collision

**Still missing:**
- No items or inventory
- No interactable objects
- No UI of any kind

## After phase-b — Economy & Interaction

A shop UI opens when you approach the shop counter and press E. You can buy basic tools (pickaxe, shovel) using starting money shown in the corner of the screen. Items appear in an inventory grid when you press Tab. You can equip tools by clicking them in inventory, and see the tool model in your hand. There's still nothing to mine — but you have the tools and economy ready.

**New this phase:**
- Shop with buyable items (tools, materials)
- Money display and transactions
- Inventory grid (open/close with Tab)
- Tool equipping — visible in first-person view
- Interaction system (approach + press E)

**Still missing:**
- No mineable ores or resources in the world
- No crafting or smelting
- No progression beyond buying items

## After phase-c — Mining & Resources

Ore nodes dot the underground tunnels. Walk up to one, equip your pickaxe, and left-click to mine. Chunks break off and drop as collectible items. Pick them up to add raw ore to your inventory. Different ore types have different colors and values. Your pickaxe degrades with use — you can see the durability bar shrinking.

**New this phase:**
- Mineable ore nodes (copper, iron, gold — color-coded)
- Mining animation and particle effects on hit
- Resource drops as 3D pickup items
- Tool durability (visible bar, breaks when empty)
- Ore types with different hardness and value

**Still missing:**
- No way to process raw ores (smelting comes next)
- No save/load — progress lost on exit
- No enemies or hazards
```

---

## When This Doc Gets Updated

| Command | What Happens to GameStateSoFar.md |
|---------|-----------------------------------|
| `/init` | Created — header + "After /init" section with game pitch |
| `/build-phase` | New "After phase-{X}" section appended |
| `/post-delivery-sync` | Optional "Post-typing update" note if hand-typed code changed scope |
| `/refresh-learn-docs` | Full rebuild — regenerate all sections from actual phase code |
| `/add-system-to-phase` | Update the relevant phase section's "New this phase" bullets |
| `/move-system` | Update affected phase sections (feature moved = bullets move) |
| `/merge-phase` | Merge the two phase sections into one, update descriptor |