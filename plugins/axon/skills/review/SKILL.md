---
name: review
description: "Use after completing a task, feature, or fix. Two-stage review: spec compliance first, then code quality. Critical issues block progress."
---

# Code Review

Review early, review often. A second pair of eyes catches what the implementer missed. Review after each task, not after the entire feature — issues compound when left unchecked.

## When to Use

**Always** after:

- Each task in `implement` (the two-stage review is built in)
- Completing a feature or substantial change
- Fixing a complex bug
- Before merging to main/master

**Optional** when:

- You're stuck and want a sanity check
- Before a large refactoring
- The change is trivial (typo fix, config update) — review yourself in 30 seconds

## The Two Stages

### Stage 1: Spec Compliance

**Does this implementation match the plan?**

- Every requirement in the plan/design is addressed
- Nothing was built that wasn't specified (scope creep)
- Edge cases mentioned in the design are handled
- Error cases described in the plan are covered
- **Every public export has a matching entry in `.axon/interface-registry.md`** — unregistered exports are scope creep
- **Every registered interface is implemented** — registered but missing = incomplete

If spec compliance fails, **do not proceed to Stage 2.** The implementer must fix gaps first. Code can be beautiful and completely wrong. Spec compliance first, always.

### Stage 2: Code Quality

**Is this implementation good?**

- Clear naming — variables, functions, types say what they mean
- Functions do one thing and are small enough to understand in one screen
- No dead code, no commented-out blocks, no "TODO" markers
- Error handling is explicit, not swallowed
- Tests are meaningful, not coverage-chasing
- No duplicated logic that should be extracted
- No unnecessary abstraction that obscures intent
- Follows existing project conventions

## Severity

| Level | Meaning | Action |
|-------|---------|--------|
| **Critical** | Wrong behavior, security issue, data loss risk, breaks existing functionality | Fix immediately. Blocks merge. |
| **Important** | Performance issue, missing error handling, unclear logic, weak test coverage | Fix before proceeding to next task. |
| **Minor** | Style nits, naming suggestions, optional improvements | Note and move on. Fix when convenient. |

Critical issues block everything. Important issues block the next task. Minor issues are recorded but not blocking.

## How to Review

### 1. Get the Diff

```bash
# For a single task (subagent implementation)
git diff HEAD~1

# For a feature branch
git diff main...HEAD

# For the last N commits
git diff HEAD~3..HEAD
```

### 2. Review Against the Plan

Read the plan/spec first. Then read the diff. Check every requirement. A diff that looks clean but misses a requirement is a failure.

### 3. Leave Actionable Feedback

Bad: "This is wrong."
Good: "`TokenStore.get` returns `undefined` for missing users, but the spec says it should throw `UserNotFoundError`. See `.axon/specs/auth-design.md` line 42."

Bad: "Refactor this."
Good: "`validateEmail` and `validatePassword` share the same regex-splitting logic (lines 15-22 and 34-41). Extract a shared `splitAndValidate` helper."

Every finding cites the file, the line, the problem, and a suggestion.

### 4. Verify Fixes

After the implementer addresses findings, re-review only the changed lines. Don't re-review the entire diff — trust what passed Stage 1 and 2 already. Verify the fix resolves the issue without introducing new problems.

## Review Checklist

Before marking a review complete:

- [ ] Every plan requirement has a corresponding implementation
- [ ] No scope creep — nothing was built that wasn't specified
- [ ] All new code has tests
- [ ] Tests are meaningful (they test behavior, not implementation)
- [ ] Error cases are handled explicitly
- [ ] Critical issues are resolved (re-reviewed and confirmed)
- [ ] Important issues are resolved
- [ ] Minor issues are documented

## When the Reviewer Is Wrong

If you believe a review finding is incorrect, push back with evidence — not argument:

Good: "The reviewer says `TokenStore.get` should throw, but the spec at `.axon/specs/auth-design.md:42` says 'returns undefined for missing users'. The implementation matches the spec."

Bad: "I think returning undefined is fine actually."

Show the code, show the spec, or show a passing test that proves your implementation is correct.

## Red Flags — Never Do

- Skip review because "it's simple" — simple code has bugs too
- Ignore a Critical issue — if you disagree, push back with evidence, don't ignore
- Proceed with unfixed Important issues — they compound
- Argue with valid feedback — if the reviewer is right, fix it
- Review your own code as a replacement for independent review — you have blind spots

## Integration

**Called by**: `implement` (after each task), `finish` (before merge)
**Hands off to**: `implement` (if issues found), `finish` (if approved)
