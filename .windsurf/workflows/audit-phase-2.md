---
description: "/audit-phase continuation (part 2/2) — domain-specific completeness, doc consistency, pattern discovery, report. Run /audit-phase first."
---

<!-- SPLIT: Part 2 of /audit-phase — exceeds Windsurf's 12K char limit when combined -->

   - [ ] Every DataService with persistent state has a matching `SaveData` pure C# class
   - [ ] SaveData has NO methods, NO MonoBehaviour refs — only serializable fields
   - [ ] ISaveable.Save() maps DataService → SaveData; ISaveable.Load() maps SaveData → DataService
   - [ ] SaveManager fires GameEvents (OnSaveRequested/OnLoadCompleted), not direct calls
   - [ ] Round-trip test exists: build state → save → load → compare snapshots

8c. **FSM Completeness** (if phase has state machines):
   - [ ] Every state implements IState with Enter(), Update(), Exit()
   - [ ] Exit() cleans up subscriptions, timers, coroutines (not just Enter() logic)
   - [ ] States reference only their owner (NPCController, etc.), not other states directly
   - [ ] Transitions go through StateMachine.ChangeState(), not direct state field assignment
   - [ ] No giant switch/case for state behavior in a single class — one class per state

8d. **Network Authority** (if phase has multiplayer):
   - [ ] State mutations only on server (ServerRpc / [Server] methods)
   - [ ] Client-only code has no write access to game state
   - [ ] DataService access is server-authoritative — clients read SyncVars or receive ObserversRpc
   - [ ] Network-specific using statements isolated to NetworkTier scripts, not in DataService

## DataService & Testing Completeness

9. For every DataService in this phase:
   - [ ] Every `List<T>` / `Dictionary<K,V>` is in the DataService, not in a MonoBehaviour
   - [ ] Every collection has a PhaseXLOG method (`LIST_X__TO__JSON` / `DOC_X__TO__JSON`)
   - [ ] `GetSnapShotForTest()` calls ALL LOG methods
   - [ ] DEBUG_Check or equivalent test creates DataService via `new`, builds, mutates, logs snapshot
   - [ ] Nested types (e.g. CartItem) live inside the DataService

## Doc Consistency

10. Verify GUIDE.md:
    - Filenames match actual files in phase folder
    - Typing order is valid (no forward dependencies within compile groups)
    - All vertical slice tests have: prerequisites, NOT required, scene setup, controls, checklist
    - Modifications table matches actual cross-phase changes
    - Source vs Phase diff covers all major architectural differences

11. Verify FLOW.md:
    - Event registry matches actual GameEvents.cs (every event listed, correct fire/subscribe)
    - Data flows use correct script/method names
    - System map covers all systems in this phase

12. Verify each Dependency.md:
    - Level (L0/L1+) matches actual imports
    - Shape matches actual behavior (Spider/Hunter/Adapter/Broadcaster)
    - All concrete deps are flagged and addressed

13. Verify Manual/*.md test guides:
    - Every system with visual/physics behavior has a Manual test guide
    - Each guide has: prerequisites, step-by-step scene setup, DO/EXPECT steps, pass/fail checklist
    - Complex systems have a **"How It Works"** prose section explaining the full data-flow lifecycle
    - Scene setup tables include every GO, component, and `| Field | Drag From |` wiring

## Pattern Discovery for GOAL.md

14. Review the phase for **new architectural patterns** not already in GOAL.md:
    - Did this phase introduce a new interaction flow (equip/drop/stack, conveyor chain, multi-step crafting)?
    - Did this phase create a new Bridge pattern variant?
    - Did this phase establish a new interface design worth reusing?
    - Did this phase introduce a new `#region` or code organization pattern?
    - For each discovery: describe the pattern, cite the specific scripts that use it, explain when future phases should reuse it.
    - Output: `| Pattern | Scripts | Should Add to GOAL.md? | Reason |`
    - If YES for any pattern, generate the exact `### [Pattern Name]` section to append to GOAL.md's "Game-Specific Patterns" section.

## SystemPortabilityMap.md Update

15. After verifying all Dependency.md files, update `LEARN/{PROJECT}/SystemPortabilityMap.md` with:
    - Corrected portability levels for any systems where the audit found misclassification
    - New aggregate counts: total L0, total L1, total L2+, total interfaces, total bridges
    - If `LEARN/{PROJECT}/SystemIsolationAnalysis.md` exists, verify its communication matrix is still accurate after this audit

## Report

13. Output comprehensive audit table:
    ```
    ## Source Fidelity
    | Original File | Methods Checked | ✅ | ❌ | ⚠️ | Notes |

    ## Architecture Violations
    | Violation Type | File | Line | Fix Applied |

    ## Common Mistakes
    | Mistake # | Status (Clean/Found) | File | Details |

    ## Pitfall Susceptibility
    | Pitfall # | Status (Safe/At Risk) | File | Details |

    ## DataService Completeness
    | DataService | Collections | LOG Methods | Snapshot | Test |

    ## Doc Consistency
    | Check | Pass/Fail | Details |

    ## Manual Test Quality
    | System | Has Manual/*.md? | Has "How It Works"? | Scene Setup Complete? |

    ## Pattern Discovery
    | Pattern | Scripts | Add to GOAL.md? | Reason |

    ## Portability Update
    | System | Previous Level | Audited Level | Changed? |

    ## Unlisted Functionality Discovered
    | Source File | Method/Feature | Classification | Action |

    ## Summary
    Source fidelity: X/Y methods matched
    Architecture violations: N found, N fixed
    Common mistakes: N found, N fixed
    Pitfalls: N at risk, N addressed
    DataService: N complete, N incomplete
    Doc consistency: N pass, N fail
    Manual tests: N complete, N missing "How It Works"
    New patterns for GOAL.md: N discovered
    Portability corrections: N systems updated
    Unlisted functionality: N critical, N important, N nice-to-have discovered
    ```