---
description: "/build-phase continuation (part 2/2) — generates GUIDE.md, FLOW.md, runs audit/decouple/cross-phase checks. Run /build-phase first."
---

<!-- SPLIT: Part 2 of /build-phase — exceeds Windsurf's 12K char limit when combined -->

## Documentation

18. Create `GUIDE.md` — follow `.windsurf/templates/GUIDE-template.md` for section order and format. Beginner-friendly, conversational voice. Must include ALL of:
    - **What It Looks Like When Running** — describe the player experience conversationally
    - **Folder Structure** — numbered folders with one-liner purpose per file
    - **Script Purpose** — one sentence per script (the script's "I do X" contract)
    - **Hand-Typing Order** — compile groups with stop-and-test points between groups
    - **Vertical Slice Tests** — beginner-friendly step-by-step per test (intro, "what you need to type first", "what you DON'T need", scene setup with numbered steps + `| Field | Drag From |` tables, `| Key | What it does | What you should see |` table, checklist)
    - **How It Works** prose sections for complex systems — when a system involves non-obvious data flow (e.g., equip→unequip→drop→stack, conveyor→merger→splitter chains), write a dedicated "How It Works" narrative explaining the FULL lifecycle in story form: what triggers it, what data changes, what UI updates, what events fire, in what order. This is the deep-dive that makes `Manual/*.md` test guides self-sufficient.
    - **Art & Scene Work (Non-Script)** — animations, audio, shaders, prefab hierarchies, layers/tags, SO assets
    - **Scene Setup** — full step-by-step (every GO, every component, every SerializeField wiring)
    - **Modifications to Earlier Phases** — table: `| File | How (partial/direct) | Change | Why |` with exact code diffs showing what to add
    - **Source vs Phase Diff** — table: `| What | Original Did | What We Did | Why |`
    - **Systems & Testability** (at end) — Individual Systems table + Testability Matrix + final count

19. Create `FLOW.md` — follow `.windsurf/templates/FLOW-template.md` for section order and format. System connections. Must include ALL of:
    - **System Map** — ASCII box diagram: all systems, what each owns, connections via GameEvents/[SerializeField]
    - **Data Flows** — one per major user action. Conversation-style prose with **bold** = visible change, *italic* = context, `code` = exact reference. Written as a narrative story, NOT swim lanes.
    - **Event Registry** — table: `| Event | Fired By | Subscribed By |` for every GameEvent in this phase
    - **Portability Diagram** — which systems are L0, which are L1+, dependency arrows

20. Update `LEARN/{PROJECT}/phase-All/` if this phase requires new shared infra (new entries in GlobalEnumsAll.cs TagType, new core GameEvents, new Utils methods). Document what was added and why.

21. Create or update 3D/asset documentation if this phase introduces new 3D models, animations, or world setup:
    - `LEARN/{PROJECT}/phase-All/7-3D/MODEL.md` — append `## Phase {PHASE}` section listing: models needed, source (from .stub), how they're used in scene, prefab hierarchy
    - `LEARN/{PROJECT}/phase-All/7-3D/ANIM.md` — append `## Phase {PHASE}` section listing: animations needed, animator controllers, state machines, transitions, parameters
    - `LEARN/{PROJECT}/phase-All/7-3D/WORLD.md` — append `## Phase {PHASE}` section listing: terrain, environment objects, lighting, post-processing, layers/tags setup
    - If these files don't exist yet, create them with a header and the Phase section.
    - If this phase has NO 3D/asset requirements, skip this step entirely.

## Post-Delivery Checks

22. **Self-audit (mandatory):** For every original source file mapped to this phase, do a method-by-method comparison. Every public method, every field, every interface, every event must be accounted for. List gaps and fix them before proceeding. This is the `/audit-phase` check — run it now.

23. **Decouple check:** For each `_-Systems/` folder, scan for concrete cross-system imports. Classify as FREE/interface/concrete. Fix any concrete deps. This is the `/decouple-check` — run it now.

24. **Cross-phase mod check:** Scan all scripts for references to methods/fields in earlier phases that don't exist yet. Generate exact code diffs with `// ← ADD` markers. This is the `/cross-phase-mod` — run it now.

25. **GOAL.md Pattern Evolution:** Review what was built in this phase. If any of these emerged, append them to the "Game-Specific Patterns" section in `LEARN/{PROJECT}/GOAL.md`:
    - New interaction patterns not covered by existing GOAL.md examples (e.g., equip/drop/stack flow, conveyor chain logic, physics pipeline)
    - New Bridge usage patterns worth documenting as examples
    - New interface design patterns that future phases should follow
    - New `#region` patterns or code organization patterns the user introduced
    - If nothing new emerged, skip this step.
    - **Format:** Add a `### [Pattern Name]` subsection with: what it does, which system introduced it, code snippet showing the pattern, when to reuse it.

26. **Update GameStateSoFar.md:** Append a new `## After phase-{PHASE}` section to `LEARN/{PROJECT}/GameStateSoFar.md`:
    - Describe the CUMULATIVE player experience — what can the player do NOW (including all earlier phases)?
    - **Player-experience language ONLY** — no class names, no system names, no architecture terms
    - Include "New this phase" bullet list (2-5 new capabilities)
    - Include "Still missing" bullet list (1-3 obvious things not there yet)
    - Keep it to 3-8 sentences max
    - If `GameStateSoFar.md` doesn't exist yet (skipped `/init`), create it with header + "After /init" section first, then add this phase section

27. Append entry to `LEARN/{PROJECT}/surfer.md`:
    ```
    ## Prompt N — Phase {PHASE} Build

    **Asked:** Build phase {PHASE} — [description].

    **Key Discoveries:**
    - [source fidelity findings, god-object splits, coupling solutions]

    **Decisions Made:**
    - [architectural choices: system boundaries, DataService extraction, interface ownership]

    **What Changed:** Created phase-{PHASE}/ with [N] scripts, GUIDE.md, FLOW.md, [N] Dependency.md files, [N] test scripts, [N] manual test guides. Updated GameStateSoFar.md.
    ```