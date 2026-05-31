---
description: In-depth project overview — deeply analyze a MAIN-SOURCE/ project, explain what it is, how it plays, architecture insights, system relationships, script/asset breakdown, estimated build hours. Chat-only — no files created or modified.
---

## Setup

1. Ask: "Which project?" → `{PROJECT}`

## Analysis (CHAT ONLY — no file writes)

2. Read `MAIN-SOURCE/entire-{PROJECT}.stub` — full file hierarchy
3. Read 10-15 largest `.cs` files in `MAIN-SOURCE/{PROJECT}/`
4. Identify: game genre, core mechanics, art style (from asset names), target platform

## Report to User

- **What is it?** — genre, gameplay loop, art style
- **How does it play?** — core mechanics, player actions, win/lose conditions
- **Architecture insights** — god objects, singletons, event patterns, coupling issues
- **System relationships** — dependency graph (what depends on what)
- **Scale** — total .cs files, estimated phases, estimated build hours
- **Challenges** — what will be hardest to reconstruct cleanly
- **Skills needed** — which `.windsurf/skills/` are relevant
