---
name: verify
description: Use before any completion claim. Run the verification command, read the full output, then claim the result. Evidence before claims, always.
---

# Verification Before Completion

Evidence before claims, always. Claiming work is complete without fresh verification output is not efficiency — it's dishonesty.

## The Iron Law

**NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**

"Fresh" means the verification command was run in this message. Not the previous message. Not earlier in the session. Now. With the output visible.

You cannot claim something passes unless you've run the verification command in this very message and read the full output.

## The Gate

Before any completion claim, you must:

1. **Identify** what command proves the claim
2. **Run** the full command freshly
3. **Read** the full output — exit code, failure counts, every line
4. **Check** whether the output actually confirms the claim
5. **Claim** only after all four steps are satisfied

Skip any step = not verifying, just pretending.

## Claim → Required Evidence

| Claim | Must Show |
|-------|-----------|
| "Tests pass" | Test command output showing `0 failing` |
| "Linter clean" | Linter output showing `0 errors` |
| "Build succeeds" | Build command returning exit 0 |
| "Bug is fixed" | Original reproduction steps now succeeding |
| "Regression test works" | Full RED→GREEN cycle: test fails without fix, passes with fix |
| "All requirements met" | Line-by-line checklist with each item confirmed |
| "Ready to merge" | Tests pass + linter clean + build succeeds |

## Red Flags — Words That Mean STOP

If you hear yourself about to say any of these, stop. You haven't verified:

- "Should work now"
- "Probably fine"
- "Seems to work"
- "I'm confident it passes"
- "The agent said it succeeded"
- "It worked earlier"
- "I don't need to run it again"
- "It's the same as last time"
- "Just this once"

**ANY wording implying success without having run verification in this message is a red flag.** Stop. Run the command. Read the output. Then speak.

## Common Failure Patterns

### Pattern 1: Trusting the Agent

> Subagent: "All tests pass!"
> You: "Tests pass."

**Wrong.** The subagent's claim is hearsay. Run the tests yourself. Read the output.

### Pattern 2: Partial Verification

> Ran linter, it's clean. Ship it.

**Wrong.** Linter clean ≠ tests pass ≠ build succeeds. Verify everything the claim requires.

### Pattern 3: Stale Evidence

> Tests passed 5 minutes ago. Nothing changed.

**Wrong.** Something might have changed. Run them again. If nothing changed, it takes 5 seconds to confirm.

### Pattern 4: Confirmation Bias

> Output: `3 failed, 1 skipped`
> You: "Mostly passing, good enough."

**Wrong.** Failed is failed. Skipped is skipped. "Mostly" is not "all."

## Verification Checklist

Before saying "done" or "complete" or "ready", run through this:

- [ ] I ran the command that proves my claim
- [ ] The command was run in this message, not before
- [ ] I read the full output, not just the last line
- [ ] The output confirms exactly what I'm claiming
- [ ] No tests were skipped, no warnings were ignored
- [ ] Exit code is 0 (or the expected success code)
- [ ] I can paste the output if asked

## Integration

**Used by**: Every skill that makes a completion claim. `implement`, `debug`, `review`, `finish` all depend on this.

This is not a standalone workflow. It's the quality gate embedded in every other skill. When any skill says "verify", this is what it means.
