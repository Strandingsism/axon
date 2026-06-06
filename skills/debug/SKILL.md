---
name: debug
description: Use when something is broken and you don't know why. Systematic 4-phase root cause investigation. No fixes without understanding the cause first.
---

# Systematic Debugging

When something is broken, the worst thing you can do is start changing code. Random fixes are not debugging — they're thrashing. Follow the four phases. Fix only after you understand.

## The Iron Law

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**

Symptom fixes are failure. "Quick fix for now, investigate later" means you'll investigate never. If you haven't traced the bug to its origin, you haven't debugged — you've guessed.

## When to Use

Use when:

- A test is failing and you don't immediately know why
- A feature that "should work" doesn't
- You see an error message you don't understand
- Something broke after a change and the connection isn't obvious

Skip when the fix is genuinely obvious (typo, missing import, wrong variable name) and you can verify it in under 30 seconds. If your "obvious fix" doesn't work, invoke this skill immediately — you're in guessing mode.

## Phase 1: Root Cause Investigation

**Goal**: Understand exactly what is broken and where.

### 1.1 Read the Error

Read the **full** error message. Not just the first line. Not just the stack trace summary. Every frame. Every attached value. Error messages are evidence, not inconvenience.

### 1.2 Reproduce It

Make the bug happen on demand. If you can't reproduce it consistently, you can't fix it — only hide it.

- Find the minimal reproduction: the smallest input, the fewest steps
- If the bug is intermittent, run the reproduction 10 times. Is it truly random or does it have a hidden trigger?
- Document the reproduction steps in your response

### 1.3 Check Recent Changes

```bash
git diff HEAD~1          # What changed last commit?
git log --oneline -10     # What's been changing recently?
git bisect start          # For bugs of unknown origin
git bisect bad HEAD
git bisect good <last-known-good-commit>
```

### 1.4 Trace the Data Flow

For bugs where data "becomes wrong" somewhere in a pipeline:

1. Start at the output (the wrong value)
2. Step backward through each function call
3. At each boundary, check: is the input correct? Is the output correct?
4. The bug is between the last correct output and the first wrong output

Add diagnostic instrumentation at component boundaries:

```ts
// At each boundary, log what enters and exits
console.log('[TokenStore.set] input:', { userId, token })
// ... operation ...
console.log('[TokenStore.set] output:', { stored: result })
```

When you find where output diverges from input, you've found the broken component.

### 1.5 Find the Origin

Trace backward through the call stack until you find the exact line where a correct value becomes incorrect, or where an expected operation doesn't happen. This line is your root cause.

## Phase 2: Pattern Analysis

**Goal**: Understand why this case is different from working cases.

### 2.1 Find Similar Working Code

Look for code in the same codebase that does something similar and works. Same pattern, same library, same data flow.

### 2.2 Compare Thoroughly

Read every line of both the broken and working code. Don't skim — read. List every difference:

- Different assumptions about input format?
- Different error handling?
- Different initialization order?
- Different dependency versions?
- Different configuration?

### 2.3 Understand Dependencies

What does the broken code depend on that might have changed? What assumptions does it make about its environment? Check:

- Async timing: could a race condition explain intermittent failures?
- Shared state: could another process be modifying data?
- Ordering: does the code assume something initializes before it runs?

## Phase 3: Hypothesis and Testing

**Goal**: Prove or disprove a specific root cause.

### 3.1 Form One Hypothesis

"I think X is the root cause because Y."

Bad: "Something is wrong with the token storage."
Good: "I think `TokenStore.set` overwrites existing tokens because the upsert logic doesn't check for existing entries before writing."

### 3.2 Test with the Smallest Change

Change **one thing.** One variable. If your test change touches three files, you're testing three hypotheses at once and learning nothing.

### 3.3 If the Hypothesis Fails

Form a new hypothesis. Do NOT:

- Add more changes on top ("maybe this AND that")
- Keep the failed change "just in case"
- Blame the library/tool/OS (it's almost never them)

## Phase 4: Implementation

**Goal**: Fix the root cause, not the symptom.

### 4.1 Write a Failing Test

Before fixing, write a test that reproduces the bug. Follow `tdd`:

```ts
it('does not overwrite existing tokens on upsert', () => {
  const store = new TokenStore(tmpDir)
  store.set('user-1', 'original-token')
  store.set('user-1', 'new-token')
  expect(store.getByValue('original-token')).toBeDefined()
  // This fails: upsert overwrote the original
})
```

### 4.2 Fix the Root Cause

One precise fix addressing the root cause. No bundled refactoring. No "while I'm here" improvements. Fix one thing. Verify. Then improve if needed.

### 4.3 Verify the Fix

Follow `verify`:

1. The new test passes
2. The original reproduction no longer triggers the bug
3. The full test suite still passes
4. Revert the fix → test fails → restore fix → test passes (regression gate)

## The 3+ Fixes Threshold

If you have attempted **three or more fixes** and none have worked:

**Stop. Question the architecture.**

Three failed fixes is not bad luck. It's a signal that the architecture is wrong. Signs include:

- Each fix reveals a new problem in a different place
- Fixes create new symptoms elsewhere
- The code has shared state you can't reason about
- You're fighting the framework instead of working with it

Stop, explain the pattern to your human partner, and discuss restructuring before attempting a fourth fix.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "I know what's wrong, I don't need to trace it" | If you knew, your first fix would work. |
| "No time for process" | Guessing takes longer than systematic debugging. |
| "The issue is simple" | Simple issues don't need debugging. If you're here, it's not simple. |
| "Multiple fixes at once saves time" | You can't know which fix worked. You've learned nothing. |
| "It's probably a library bug" | It's almost never a library bug. Check your code first. |

## Red Flags — Stop and Return to Phase 1

- You're about to try a fix without understanding why it should work
- You've made two fixes and can't explain how either addresses the root cause
- You're changing code you don't understand, hoping it helps
- You're searching Stack Overflow for the error message instead of tracing your code
- You're adding `console.log` everywhere instead of at component boundaries
- You hear yourself say "that's weird" — that's the signal to trace, not guess

## Supporting Techniques

See also:
- `root-cause-tracing.md` — backward tracing through call stacks with instrumentation patterns
- `defense-in-depth.md` — multi-layer validation after finding root cause

## Integration

**Uses**: `tdd` (for regression tests), `verify` (for confirming the fix)
**Hands off to**: `review` (if the fix is substantial), `finish` (if ready to complete)
