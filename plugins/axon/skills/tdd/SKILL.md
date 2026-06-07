---
name: tdd
description: "Use when implementing any feature or bugfix. Write the test first, watch it fail, then write minimal code to pass."
---

# Test-Driven Development

RED → GREEN → REFACTOR. No production code without a failing test first. If you didn't watch the test fail, you don't know if it tests the right thing.

## The Iron Law

**NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.**

If you write implementation code before the test, delete it and start over. No keeping it as reference. No adapting it. No "I'll write the test right after." Delete it. Write the test. Then write the code again.

Violating the letter of this rule violates its spirit.

## When to Use

**Always** for: new features, bug fixes, refactoring, behavior changes.

**Skip only with explicit user consent** for: throwaway prototypes, generated code (e.g., GraphQL schema types), configuration files with no logic.

When in doubt, use it. A 30-second test is cheaper than a 30-minute debug.

## Where TDD Code Lives

By default, write TDD tests and supporting test fixtures in the target project's root-level `tdd/` directory.

This skill directory (`axon/skills/tdd/`) contains the workflow instructions only. It is not where project test code goes.

Use the target project's existing test location only when the user, plan, or repository convention explicitly requires it. If you do, record the chosen path in `.axon/project-map.md` and make the task plan name the exact test file.

## The Cycle

### RED — Write a Failing Test

Write **one minimal test** that:

- Tests real behavior, not implementation details
- Has a clear name describing what it verifies (`persists tokens across restarts`, not `test1`)
- Uses real code, not mocks, unless the dependency is external, slow, or non-deterministic
- Asserts one thing (if the name has "and", split it)

```ts
// Good: clear name, real behavior, one assertion
it('rejects empty email addresses', () => {
  expect(() => validate({ email: '' })).toThrow('Email is required')
})
```

```ts
// Bad: vague name, mocks without reason
it('test validation', () => {
  const mock = jest.fn()
  // ...
})
```

#### Verify RED (mandatory)

Run the test and **confirm it fails for the expected reason.** Not "it failed somehow" — "it failed because `validate` is not a function." If it fails for the wrong reason (syntax error, wrong import), fix the test, not the code.

If the test **passes** immediately:
- The feature already exists (you're not testing new behavior)
- The test is wrong (it tests nothing)
- The bug isn't reproducible with this test

In all cases: delete the test, write a better one. A test that passes before implementation proves nothing.

### GREEN — Write Minimal Code

Write the **simplest code that makes the test pass.** No more.

- No error handling beyond what the test demands
- No abstraction beyond what's needed now
- No "I'll need this later" code — YAGNI
- No refactoring during this phase

The test says "reject empty email." Write exactly that validation. Don't add regex patterns, don't add a validation pipeline, don't add localization. Just reject empty email.

#### Verify GREEN (mandatory)

Confirm:

1. Your new test passes
2. **All other tests still pass** — run the full suite
3. Output is pristine — no new warnings, no skipped tests, no flaking

### REFACTOR — Clean Up

**Only after green.** You now have a safety net. Remove duplication, improve names, extract helpers. Never add new behavior during refactor. If your refactor breaks the test, you changed behavior — revert and refactor differently.

## Bug Fixes: The Regression Test

For bugs, the TDD cycle has special meaning:

1. **RED**: Write a test that reproduces the bug. It must fail — proving the bug exists.
2. **GREEN**: Fix the bug. The test passes — proving the fix works.
3. **REFACTOR**: Clean up the fix without changing behavior.

Then, and only then, verify:

```ts
// 1. Write regression test → it fails (bug confirmed)
// 2. Fix the bug → test passes (bug fixed)
// 3. Revert the fix → test fails again (test catches the bug)
// 4. Restore the fix → test passes (verification complete)
```

Step 3 is critical. If reverting the fix doesn't make the test fail, your test doesn't actually catch the bug.

## Why Order Matters

### "I'll write tests after" — Why this fails

- Tests written after the implementation pass immediately. You never see them fail, so you don't know if they test the right thing.
- Tests written after are biased by your implementation. They test what the code *does*, not what it *should do*.
- Without seeing RED, you ship untested tests. The worst kind of false confidence.

### "Manual testing is faster" — Why this fails

- Manual testing has no record. You can't re-run it next week.
- You forget edge cases. The machine doesn't.
- Manual testing doesn't block regressions. Automated tests do.

### "Deleting code I wrote is wasteful" — Why this fails

Sunk cost fallacy. The 5 minutes you "waste" deleting code and writing a test first saves 50 minutes of debugging when the untested code breaks in production.

## Good Tests

- **Minimal**: One thing per test. If the name has "and" or "or", split it.
- **Clear**: The name describes behavior, not implementation. `rejects expired tokens` not `throws TokenExpiredError`.
- **Shows intent**: Reading the test tells you what the API should look like. The test is the first consumer of your code.

## Common Rationalizations (and their rebuttals)

| Excuse | Reality |
|--------|---------|
| "This is too simple to test" | Simple code breaks. A test takes 30 seconds. |
| "TDD will slow me down" | Debugging untested code in production is slower. |
| "I'll add tests after it works" | You won't. And if you do, they'll test the wrong things. |
| "It's just a quick fix" | Every regression was once a "quick fix." |
| "The test is more code than the fix" | Good. The fix is simple *because* the test defines exactly what's needed. |
| "I'm confident it works" | Confidence ≠ evidence. Watch it pass. |

## Red Flags — STOP and Start Over

- You wrote implementation code before the test
- The test passes immediately (it's not testing new behavior)
- You're rationalizing "just this once"
- You kept the pre-test code "as reference"
- You're writing a test that would pass regardless of the implementation
- You're mocking things that don't need mocking

**Any of these: delete the code, write the test, start over.**

## When Stuck

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| Test is hard to write | Design is too coupled | Simplify the interface |
| Test needs too many mocks | Too many dependencies | Inject dependencies |
| Test is 50+ lines | Testing too much at once | Split into smaller tests |
| Can't reproduce the bug | Don't understand the bug | Go back to `debug` |

## Integration

**Used by**: `implement`, `debug`
**References**: See `testing-anti-patterns.md` for common pitfalls
