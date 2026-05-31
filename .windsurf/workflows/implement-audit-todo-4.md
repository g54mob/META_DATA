---
description: "/implement-audit-todo continuation (part 4/4) — registration, verification checklist, completion. Run /implement-audit-todo-3 first."
---

<!-- SPLIT: Part 4 of /implement-audit-todo — exceeds Windsurf's 12K char limit when combined -->

## Registration — Final Step (After All Items)

After ALL approved items are implemented, update registration files IN THIS ORDER:

### For each NEW skill created:

**1. `copilot-instructions.md` — Workspace Structure tree:**

Find the `skills/` section in the tree and add:
```
│   │   ├── {skill-name}/SKILL.md         ← {description matching YAML}
```
- Alphabetical order within skills/ section
- Description matches the YAML frontmatter `description` field exactly (first clause)

**2. `copilot-instructions.md` — Skills table:**

Find the `| Skill | When Loaded | Provides |` table and add:
```
| `{skill-name}` | {Trigger phrase — when VS Code loads this skill} | {What knowledge it gives} |
```
- Trigger phrase = the condition from YAML description that causes auto-loading
- Provides = 3-5 word summary of what agents learn from it

**3. `MANUAL.md` — Workspace Layout tree:**

Same format as copilot-instructions tree — add in alphabetical order.

**4. `MANUAL.md` — Skills table:**

Add row matching the format of existing rows in MANUAL.md's skills table.

**5. `MANUAL.md` — Key Facts:**

Find the "N skills currently exist" line. Update the count and the comma-separated list.

**6. Prompt skill references — add to ALL THREE prompts:**

For `build-phase.prompt.md`:
```
- If phase includes {domain trigger} → load `../skills/{skill-name}/SKILL.md`
```

For `audit-phase.prompt.md`:
```
- If verifying {what to verify} → check against `../skills/{skill-name}/SKILL.md`
```

For `add-system-to-phase.prompt.md`:
```
- If the system involves {domain} → reference `../skills/{skill-name}/SKILL.md`
```

### For each convention/template/prompt edit:

No registration needed — the edit IS the deliverable. But verify:
- No broken cross-references (links to renamed/moved sections still work)
- No project-specific names leaked into generic framework files
- Table formatting is consistent (column widths, alignment markers)

---

## Verification Checklist — COMPREHENSIVE

After ALL items are implemented, verify every single one:

### Skills Verification

| # | Check | How to Verify | Status |
|---|-------|---------------|--------|
| 1 | YAML `name` matches directory name | Compare directory name to frontmatter | |
| 2 | YAML `description` is single line, ≤200 chars | Character count | |
| 3 | YAML `description` contains domain keywords | Would VS Code trigger it for the right tasks? | |
| 4 | Intro blockquote has "Universal pattern" + "substitute" note | Text search | |
| 5 | Architecture diagram exists and uses box-drawing chars | Visual inspection | |
| 6 | Diagram shows ALL core components mentioned in skill | Cross-reference | |
| 7 | Diagram is ≤80 chars wide | Line length check | |
| 8 | Every core component has code example | Section-by-section check | |
| 9 | Code has `[AddComponentMenu]` on MonoBehaviours | Grep | |
| 10 | Code has `/// <summary>` on classes | Grep | |
| 11 | Code has `// →` inline comments | Grep | |
| 12 | Code uses `#region` blocks | Grep | |
| 13 | All code is from real MAIN-SOURCE/ (not invented) | Can trace back to source file | |
| 14 | Genre Variants section has concrete values/code (not vague) | Read each entry | |
| 15 | Pitfalls section has ≥3 items with ❌/✅ format | Count | |
| 16 | No project-specific names in prose | Text search for project names | |
| 17 | Skill length is 150-400 lines | Line count | |
| 18 | An agent with no context could implement the domain from this skill alone | Read as outsider | |

### Registration Verification

| # | Check | Status |
|---|-------|--------|
| 1 | copilot-instructions.md tree has the skill (alphabetical) | |
| 2 | copilot-instructions.md table has the skill | |
| 3 | MANUAL.md tree has the skill | |
| 4 | MANUAL.md table has the skill | |
| 5 | MANUAL.md Key Facts count is correct | |
| 6 | build-phase.prompt.md references the skill | |
| 7 | audit-phase.prompt.md references the skill | |
| 8 | add-system-to-phase.prompt.md references the skill | |
| 9 | Skill table entries match YAML description keywords | |
| 10 | All relative paths are correct (`../skills/{name}/SKILL.md`) | |

### Convention/Template/Prompt Verification

| # | Check | Status |
|---|-------|--------|
| 1 | Convention edits are phrased as universal rules | |
| 2 | Convention code examples compile conceptually | |
| 3 | Template edits use only established placeholders | |
| 4 | Template edits don't break document structure | |
| 5 | Prompt edits have consistent step numbering | |
| 6 | Prompt conditionals don't break for non-applicable genres | |
| 7 | No project-specific names in any `.windsurf/` file prose | |

---

## After Completion

### Update the gap report

If `.windsurf/audit-required-todo.md` exists:
- Mark completed items: change `### TODO-{N}:` to `### ✅ TODO-{N}:`
- Add implementation notes under each completed item
- Note any deviations from the original plan
- Flag any NEW gaps discovered during implementation

### Report to user

Summarize:
```
## Implementation Complete

**Implemented:** {N} items
- {N} new skills created: {list}
- {N} existing skills updated: {list}
- {N} convention edits applied
- {N} template edits applied
- {N} prompt edits applied

**Registration:** All skills registered in copilot-instructions.md, MANUAL.md, and 3 prompts.

**New gaps discovered:** {list or "none"}
```

### Suggest follow-up

- Run `/rebuild-prompts` to verify prompt consistency
- Run `/rebuild-templates` to verify template consistency
- Run `/audit-framework` again to verify gaps are closed
- If many skills were added, consider running `/rebuild-prompts` to check all prompt-skill references

---

## Key Principles (For Future LLMs)

1. **Source code is ground truth** — every pattern in a skill MUST trace back to real `MAIN-SOURCE/` code. Never invent patterns, never guess what a system does. Read the actual files.

2. **Cross-project consensus drives structure** — a pattern in 3+ projects becomes skill CORE content. A pattern in 1-2 projects becomes a VARIANT. A pattern that's clearly wrong becomes a PITFALL. This is not optional.

3. **Existing format is law** — read the existing skills before writing new ones. Match their format EXACTLY. If unsure about formatting, copy the structure from the closest existing skill.

4. **Universal by default** — prose in skills, conventions, and templates must work for ANY Unity3D game genre. Genre-specific guidance lives ONLY in "Genre Variants" sections or conditional blocks.

5. **Skills must be self-sufficient** — an agent reading ONLY the skill (without seeing source code) should be able to implement the domain correctly. If additional context is needed, the skill isn't detailed enough.

6. **Convention edits cascade** — a convention change affects how ALL future code is generated across ALL projects. Be extremely precise. Test the wording against multiple genres mentally.

7. **Registration completes the work** — an unregistered skill is invisible to agents. ALWAYS register in ALL 5 locations (copilot-instructions tree, copilot-instructions table, Manual tree, Manual table, Manual key facts) plus the 3 prompt references.

8. **Merge, don't fragment** — if two projects use the same domain differently, they belong in ONE skill with Genre Variants. Don't create separate skills for "unity-save-json" and "unity-save-binary" — create ONE "unity-persistence" skill.

9. **Concrete over vague** — "Adjust pool size as needed" is WRONG. "Pool size: mining games ~30, horror games ~5, 2D games 0 (direct AudioSource)" is CORRECT. Always give specific values.

10. **Every TODO maps to a file change** — the output of this prompt is modified `.windsurf/` files. If a TODO item can't be translated to a specific file edit, it's not actionable and should be reported back to the user for clarification.