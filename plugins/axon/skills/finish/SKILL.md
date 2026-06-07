---
name: finish
description: "Use after all tasks pass review. Verify tests, detect the environment, present merge/PR/keep/discard options, and clean up."
---

# Finishing a Development Branch

You've implemented, tested, and reviewed all tasks. Now finish cleanly. Verify everything one last time, then present clear options for what happens next.

## The Iron Law

**VERIFY TESTS BEFORE PRESENTING OPTIONS.**

If tests don't pass, you're not finishing — you're debugging. Go back to `debug`, find the issue, fix it, then return here.

## Process

### 1. Verify Tests

Run the project's full test suite:

```bash
# Node.js
npm test

# Rust
cargo test

# Python
pytest

# Go
go test ./...
```

**If any test fails**: report the failures and stop. Do not proceed to Step 2. Go to `debug`.

### 2. Detect Environment

Determine where you are and what branch you're on:

```bash
git rev-parse --git-dir
git rev-parse --git-common-dir
git branch --show-current
git rev-parse --abbrev-ref HEAD
```

You are in one of:

| Environment | Detection | Behavior |
|-------------|-----------|----------|
| **Normal repo** | `GIT_DIR` = `GIT_COMMON_DIR` | Present merge/PR/keep/discard |
| **Linked worktree** | `GIT_DIR` ≠ `GIT_COMMON_DIR`, on a named branch | Present merge/PR/keep/discard |
| **Detached HEAD** | `git branch --show-current` is empty or `HEAD` | Present PR/keep/discard (no merge) |

### 3. Determine Base Branch

Find where this branch diverged:

```bash
git merge-base main HEAD
git merge-base master HEAD
```

If neither `main` nor `master` is the base, ask the user to confirm the target branch.

### 4. Final Project Map Update

Update `.axon/project-map.md` one last time:
- Mark the `finish` phase checkbox
- Record the outcome in the Goal section
- Ensure the file is under 100 lines — compress if needed

### 5. Present Options

Present exactly these options. No more. No explanations — just the options:

**Normal repo or named-branch worktree:**

> All tests pass. What would you like to do with `feature/auth`?
>
> 1. **Merge** — merge into `main`, delete branch, clean up
> 2. **PR** — push and create a pull request
> 3. **Keep** — preserve everything as-is
> 4. **Discard** — delete the branch and all changes

**Detached HEAD:**

> All tests pass. What would you like to do?
>
> 2. **PR** — push and create a pull request
> 3. **Keep** — preserve everything as-is
> 4. **Discard** — delete all changes

### 6. Execute the Choice

#### Option 1: Merge

```bash
git checkout main          # or master
git pull origin main       # get latest
git merge feature/auth     # merge the feature
# Run tests one final time
npm test                   # or equivalent
# If tests pass:
git push origin main
git branch -d feature/auth # delete local branch
git push origin --delete feature/auth  # delete remote if it exists
```

Then clean up the worktree if one was used (see Step 6).

#### Option 2: PR

```bash
git push origin feature/auth
gh pr create \
  --title "feat: descriptive title" \
  --body "## Summary

  Brief description of the changes.

  ## Verification

  - [ ] Tests pass
  - [ ] Linter clean
  - [ ] Reviewed

  🤖 Generated with [Axon](https://github.com/your-org/axon)"
```

**Do NOT clean up the worktree.** The user needs it for PR iteration.

#### Option 3: Keep

Report what's preserved:

> Branch `feature/auth` and all work are preserved as-is. Worktree at `/path/to/worktree` remains.

No cleanup. No deletion. Nothing changes.

#### Option 4: Discard

**Requires explicit confirmation.** Ask the user to type "discard" to confirm:

> Are you sure you want to discard all changes on `feature/auth`? Type "discard" to confirm.

After confirmation:

```bash
git checkout main          # or master
git branch -D feature/auth # force delete
git push origin --delete feature/auth  # delete remote if it exists
```

Then clean up the worktree (see Step 6).

### 7. Clean Up Worktree

Only for Options 1 and 4. Check the worktree's location:

```bash
git worktree list
```

**If the worktree is under a project-local directory** (`.worktrees/`, `worktrees/`, or `~/.config/superpowers/worktrees/`):

```bash
git worktree remove /path/to/worktree
git worktree prune
```

**If the worktree is NOT under a project-local directory**, the harness owns it. Do not remove it. Report that it needs manual cleanup.

**Never** run `git worktree remove` from inside the worktree you're removing. Check out of it first.

## Quick Reference

| Option | Merges? | Pushes? | Deletes branch? | Cleans worktree? |
|--------|---------|---------|-----------------|------------------|
| 1. Merge | Yes | Yes | Yes | Yes |
| 2. PR | No | Yes | No | No |
| 3. Keep | No | No | No | No |
| 4. Discard | No | No | Yes (force) | Yes |

## Common Mistakes

- **Skipping the final test run**: "Tests passed 5 minutes ago." Run them now.
- **Cleaning worktree for PR**: User needs it. Don't touch it.
- **Deleting branch before removing worktree**: `git worktree remove` fails if the branch is gone. Order matters.
- **Running `git worktree remove` from inside the worktree**: You can't delete the directory you're in. Check out first.
- **No confirmation for discard**: Discard is irreversible. Always confirm.
- **Open-ended questions**: "What now?" is not an option. Present the four choices.

## Red Flags

- Tests don't pass → stop, go to `debug`
- User chose an option but you haven't verified tests → verify first
- About to `git worktree remove` from inside the worktree → checkout first
- About to clean worktree for Option 2 (PR) → don't

## Integration

**Requires**: All tasks reviewed and approved (`review`)
**Uses**: `verify` (for the final test run)
