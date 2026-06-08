---
name: execute
description: "Use for single-task plans or tightly coupled tasks. Main agent executes inline with a self-referential loop — no subagents. TDD per task, self-verify, iterate until done."
---

# Inline Execution Loop

When the plan is too small to justify subagent overhead, the main agent executes inline. Work → verify → fix → repeat. No delegating, no handoffs. You are the executor.

## Hard Gate

**NO COMPLETION CLAIM WITHOUT FRESH VERIFICATION EVIDENCE.**

If you didn't run the tests in this message and see `0 failing`, you're not done. Go back to the loop.

## When to Use

- Single-task plan from `write-plan`
- Tasks are tightly coupled and can't be split across subagents
- User says "just do it", "execute this", "implement this directly"
- The task touches 1-3 files

## When NOT to Use

- Multi-task plan with independent tasks → use `implement` (subagent mode)
- Task touches 5+ files → subagents catch more with two-stage review
- You need an independent reviewer's perspective → use `implement`

## The Loop

Hooks have reset the project-root `.axon/tasks.json` and injected the task list into context. Create matching tasks in the Codex Task system. Update the project-root `.axon/tasks.json` after each task completes.

**Greenfield note**: If this project came from `dream` and the repo is empty, scaffold first — init, directory structure, config files, dependency manifest. The first task typically covers this.

For each task in the plan:

### 1. TDD — RED

Write the failing test. Run it. Confirm it fails for the expected reason. Not "it failed somehow" — "it failed because `TokenStore` is not defined."

### 2. TDD — GREEN

Write minimal code to pass. Run the test. Confirm it passes. Run the full suite — no regressions.

### 3. TDD — REFACTOR

Clean up. Remove duplication. Improve names. Do NOT add new behavior. Run tests again.

### 4. Self-Verify

Check against the plan:

- Does the implementation match the task specification?
- Is every new public export registered in the project-root `.axon/interface-registry.md`?
- Does every registered interface have an implementation?
- Are tests meaningful (behavior, not coverage-chasing)?
- Is the linter clean?

### 5. Iterate or Advance

| Outcome | Action |
|---------|--------|
| All checks pass | Mark task done, update the project-root `.axon/project-map.md`, next task |
| Issues found | Fix the issues, go back to step 1 for this task |
| Same issue 3rd time | **Stop.** Report the pattern. Question the approach. |

### 6. Full Suite

After all tasks pass: run the complete test suite. If any test fails, go to `debug`.

### 7. Handoff

All tasks complete, full suite green → hand off to `review`.

## Stop Conditions

- **3 failed attempts** on the same issue: stop and question the approach (not the code — the architecture)
- **Missing dependency**: stop and report what's needed
- **User says stop**: exit the loop, report progress

## Key Principles

- **Evidence before claims.** "Should work" = not done. Fresh test output or it didn't happen.
- **Minimal code.** Write only what the test demands. YAGNI.
- **Fail fast.** A test that passes before implementation proves nothing. Delete it, write a better one.
- **Stay in the loop.** Don't hand off to subagents. Don't ask for help prematurely. Fix and continue.

## Integration

**Requires**: `write-plan` (approved plan)
**Uses**: `tdd` (each task), `verify` (self-check gate), `debug` (if stuck)
**Hands off to**: `review`
**Alternative to**: `implement` (subagent mode — use for multi-task plans)
