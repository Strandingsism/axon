---
name: write-plan
description: "Use after an approved design. Break the design into bite-sized implementation tasks with exact file paths, complete code blocks, and verification steps."
---

# Writing Implementation Plans

Convert an approved design document into a sequence of bite-sized tasks. A good plan assumes the implementer has zero context for the codebase and questionable taste. Every step must contain actual code — no placeholders, no hand-waving, no "implement error handling" without showing exactly what that means.

## Hard Gate

**NO PLACEHOLDERS. NO "TBD". NO "IMPLEMENT LATER".**

A plan that contains unresolved steps is not a plan. It's a todo list pretending to be a plan. If you cannot write the exact code for a step, you don't understand the design well enough — go back to `brainstorm`.

## When to Use

Always after `brainstorm` produces an approved design. Also use when:

- A bug fix requires changes across multiple files
- A refactor touches more than one subsystem
- The user gives you a complete, unambiguous spec directly (skipping brainstorm)

Skip when the task is a single-file, single-function change with no architectural implications. In that case, invoke `implement` directly with `tdd`.

## Process

### 1. Load and Understand the Design

Read the design document from `.axon/specs/`. If anything is unclear or contradictory, resolve it with the user before writing the plan. Do not "interpret" ambiguity — ask.

### 2. Scope Check

If the design covers multiple independent subsystems, split it into separate plans. Each plan should produce working, testable software on its own. A plan that touches authentication, database migrations, and frontend components is three plans.

### 3. Map the Files

Before defining tasks, list every file this plan touches:

```markdown
## Files

### Create
- `src/auth/token-store.ts` — Encrypted token persistence
- `src/auth/__tests__/token-store.test.ts` — Token store tests

### Modify
- `src/auth/login.ts:42-78` — Replace in-memory map with token-store

### Delete
- (none)
```

Files should have one clear responsibility. Smaller, focused files beat large ones. Files that change together should live together.

### 4. Declare Interfaces

Before writing task details, declare every new public API in `.axon/interface-registry.md`:

```markdown
## Auth Module
- `login(email: string, password: string): Promise<Session>` — Authenticate user
- `logout(sessionId: string): Promise<void>` — End session
- `class TokenStore(dir: string)` — Encrypted token persistence
  - `set(userId: string, token: string): void`
  - `get(userId: string): string | undefined`
```

This serves two purposes:
- **For the implementer**: clear contract before coding begins
- **For the reviewer**: every public export must have a matching registry entry

Only declare what this plan introduces. Don't list existing APIs unless you're changing their signatures.

### 5. Define Tasks

Each task is **one action (2-5 minutes)** with this structure:

```markdown
### Task N: <descriptive name>

**Files:**
- Create: `path/to/file.ts`
- Modify: `path/to/existing.ts:30-45`
- Test: `path/to/__tests__/file.test.ts`

**Steps:**

- [ ] 1. Write failing test:
  ```ts
  // Complete test code — not a sketch
  describe('tokenStore', () => {
    it('persists tokens across restarts', () => {
      const store = new TokenStore(tmpDir)
      store.set('user-1', 'token-abc')
      const restored = new TokenStore(tmpDir)
      expect(restored.get('user-1')).toBe('token-abc')
    })
  })
  ```
- [ ] 2. Run test, confirm it fails with expected error:
  ```
  npx jest token-store.test.ts
  # Expected: FAIL — "TokenStore not found"
  ```
- [ ] 3. Implement minimal code to pass:
  ```ts
  // Complete implementation — not a skeleton
  export class TokenStore {
    constructor(private dir: string) {}
    set(userId: string, token: string): void { ... }
    get(userId: string): string | undefined { ... }
  }
  ```
- [ ] 4. Run test, confirm it passes:
  ```
  npx jest token-store.test.ts
  # Expected: PASS — 1/1
  ```
- [ ] 5. Commit:
  ```
  git add src/auth/token-store.ts src/auth/__tests__/token-store.test.ts
  git commit -m "feat(auth): add encrypted token persistence"
  ```

**Success**: TokenStore persists and retrieves tokens correctly.

Each step is one atomic action. Write the test → run it → see it fail → write the code → run it → see it pass → commit.

### 5.5. Write tasks.json

After defining all tasks, write `.axon/tasks.json` with the task list. This is the machine-readable manifest that hooks read to track progress and detect completion.

```json
{
  "planFile": ".axon/plans/YYYY-MM-DD-<topic>-plan.md",
  "tasks": [
    { "id": 1, "name": "Write TokenStore with set/get", "status": "pending" },
    { "id": 2, "name": "Integrate login flow", "status": "pending" }
  ]
}
```

Rules:
- `id` matches the task number in the plan
- `name` is the task title (same as `### Task N: <name>`)
- All start as `"pending"`
- Keep names short — hooks inject them into prompts
- Do NOT skip this step. Hooks depend on it.

Every step must contain **complete, copy-pasteable content.** These are failures:

| Instead of... | Write the actual... |
|---------------|-------------------|
| `// TBD` | The complete implementation |
| `// TODO: add error handling` | The exact try/catch with specific error types |
| `// implement later` | The implementation, now |
| `// similar to Task 3` | The full code, repeated if necessary |
| `add appropriate error handling` | The exact error types and handling logic |
| `describe('...')` with no test body | The complete test with assertions |
| "Create the component" with no code | The full component source |

### 7. Self-Review the Plan

Before presenting the plan to the user, verify:

1. **Coverage**: Does every requirement in the design doc map to at least one task? Walk through the spec line by line.
2. **Placeholders**: Grep for `TBD`, `TODO`, `implement later`, `...`, `etc.`, `similar to`. Remove every hit.
3. **Consistency**: Do file paths match between tasks? Do Task 3's imports reference files created in Task 1? Are types and method names consistent across tasks?
4. **Completeness**: If I were a junior developer with zero context, could I execute every step without asking a single question?

Fix issues inline.

### 8. User Review Gate

Present the plan for approval:

> I've written the implementation plan at `.axon/plans/2026-06-05-token-store-plan.md`. It has N tasks covering:
> - Task 1-2: Core implementation
> - Task 3: Integration
> - Task 4: Cleanup
>
> Interfaces are registered in `.axon/interface-registry.md`. Please review. Once approved, I'll invoke `implement` to execute it.

The user must explicitly approve before you proceed to `implement`.

### 9. Update Project Map

After user approval, update `.axon/project-map.md`:
- Mark `2. write-plan` as done with the plan doc path
- List the task stubs under `3. implement`

### 10. Handoff

After approval, the next skill is `implement` (dispatches one subagent per task). For single-task plans, skip directly to `tdd` — subagent overhead isn't worth it for one task.

## Task Granularity

- **Too large**: "Implement the authentication system" — this is a plan, not a task
- **Too small**: "Create the file" with no code — pedantic
- **Right**: "Write TokenStore with set/get/delete methods, including tests" — one concrete deliverable

If a task name has "and" in it, it's probably two tasks.

## Key Principles

- **Assume zero context.** The implementer (subagent) has no session history. Every instruction must stand alone.
- **Copy-paste ready.** Code blocks must compile. Commands must run. Expected output must match reality.
- **Atomic commits.** One commit per task. If a task produces a broken intermediate state, it's too large.
- **Tests first.** Every task that produces code starts with a failing test. No exceptions.
- **DRY in code, not in plans.** Repeating a file path across tasks is fine. Referencing "the file from Task 3" is not.

## Red Flags — Stop and Fix

- You wrote "similar to Task N" instead of repeating the code
- A task has more than 7 steps
- You can't write the expected command output because you're not sure it'll work
- You catch yourself thinking "the implementer will figure out the details"
- A code block contains `...` or `// etc.`
- You're not sure what error a test should produce, so you wrote "should fail"

**All of these mean the plan is incomplete. Fix it before presenting to the user.**

## Integration

**Requires**: `brainstorm` (or user-provided spec)
**Hands off to**: `implement`, or direct `tdd` for single-task plans
