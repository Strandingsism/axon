---
name: write-plan
description: "Use after an approved design. Break the design into bite-sized implementation tasks with exact file paths, interface contracts, test intent, acceptance criteria, and verification steps. Do not include detailed implementation code."
---

# Writing Implementation Plans

Convert an approved design into a sequence of small, executable tasks.

The plan is a task contract, not an implementation dump. It should tell the
implementer what to change, where to change it, what behavior to prove, and how
to verify success. The actual production code belongs in `implement`,
`execute`, and `tdd`, not inside this skill's output.

## Hard Gate

**NO DETAILED IMPLEMENTATION CODE IN PLANS.**

Do not include complete production functions, full component bodies, full test
files, or copy-paste implementation blocks. A plan may include:

- File paths
- Public signatures
- Data shapes
- Short pseudo-code when it clarifies control flow
- Test names and expected behavior
- Commands and expected verification result

A plan must not include:

- Complete implementation code
- Full test bodies
- Large code blocks copied into tasks
- "TBD", "TODO", "implement later", or unresolved decisions
- Hidden assumptions that the implementer must guess

If you feel the need to write full code in the plan, the task is probably ready
for `execute` instead of `write-plan`.

## When to Use

Use after a design has been approved and the work needs decomposition.

Also use when:

- A bug fix spans multiple files.
- A refactor touches more than one subsystem.
- The user gives a complete, unambiguous spec and wants a plan before changes.

Skip when:

- The task is a single-file, single-function change.
- The user explicitly asks for direct execution.
- The plan would be more verbose than the change itself.

In those cases, move to `execute` and keep TDD close to the code.

## Process

### 1. Load the Source of Truth

Read the approved design, user request, `workflow.md` if present, and any
project instructions that affect planning style.

If `workflow.md` defines planning depth, confirmation gates, output contracts,
or task classes, follow those preferences. If it is absent or incomplete, use
this skill's defaults.

### 2. Scope Check

Split independent concerns into separate plans. A plan should produce working,
testable progress on its own.

If a design touches authentication, database migrations, and frontend UI, that
is usually three plans unless the project workflow says otherwise.

### 3. Map the Files

Before defining tasks, list every expected file change:

```markdown
## Files

### Create
- `src/auth/token-store.ts` - Token persistence module
- `src/auth/token-store.test.ts` - Token persistence behavior tests

### Modify
- `src/auth/login.ts` - Replace in-memory token handling

### Delete
- (none)
```

Include line numbers only when they are stable and useful.

### 4. Declare Interfaces

Before writing task details, declare new or changed public contracts. Use
signatures, not implementations.

```markdown
## Interfaces

- `class TokenStore`
  - `constructor(dir: string)`
  - `set(userId: string, token: string): void`
  - `get(userId: string): string | undefined`
```

If the project uses `.axon/interface-registry.md`, update or reference it. Do
not invent required registry sections when the user's workflow does not use
that file.

### 5. Define Tasks

Each task should be one concrete deliverable.

```markdown
### Task N: <descriptive name>

**Goal**
- <behavior or project state this task creates>

**Files**
- Create: `path/to/file`
- Modify: `path/to/file`
- Test: `path/to/test`

**Interfaces**
- <new or changed public signature, if any>

**Steps**
1. Write or update tests for <behavior>.
2. Implement the minimal behavior needed for those tests.
3. Run <verification command>.
4. Update docs or task records if required by `workflow.md`.

**Acceptance**
- <observable condition>
- <verification command and expected high-level result>

**Risks**
- <edge case, migration concern, or integration risk>
```

Keep the task specific enough to execute, but do not prescribe the full code.

### 6. Write tasks.json When Used

If the project uses `.axon/tasks.json`, write or update it with task titles and
initial status.

```json
{
  "planFile": ".axon/plans/YYYY-MM-DD-topic-plan.md",
  "tasks": [
    { "id": 1, "name": "Add token persistence contract", "status": "pending" },
    { "id": 2, "name": "Integrate token persistence in login", "status": "pending" }
  ]
}
```

Rules:

- `id` matches the task number in the plan.
- `name` matches the task title.
- All new tasks start as `"pending"`.
- Keep names short.

Skip this file when the user's workflow does not use Axon task tracking.

### 7. Self-Review the Plan

Before presenting the plan, verify:

1. Every requirement maps to at least one task.
2. No task contains detailed implementation code.
3. No unresolved placeholder remains.
4. File paths and interface names are consistent.
5. Verification commands are concrete.
6. Confirmation gates from `workflow.md` are respected when present.

### 8. User Review Gate

Present the plan for approval when the workflow or risk level requires it.

Example:

```text
I wrote the implementation plan at `.axon/plans/2026-06-08-token-store-plan.md`.
It has 2 tasks: token persistence and login integration.
Please review before implementation.
```

If the user has already authorized direct execution, continue to `execute` or
`implement` according to task count.

### 9. Handoff

After approval:

- Use `execute` for one tightly coupled task.
- Use `implement` for multiple independent tasks.
- Use `tdd` inside implementation when behavior changes.
- Use `verify` before any completion claim.

## Task Granularity

- Too large: "Implement the authentication system."
- Too small: "Create the file."
- Right: "Add TokenStore persistence contract and behavior tests."

If a task name has "and" in it, it may be two tasks.

## Key Principles

- The user's `workflow.md` is the behavior source of truth when present.
- Plans should be precise but not code-heavy.
- Interfaces are contracts; implementation is deferred.
- TDD belongs close to code execution.
- Verification must be concrete.
- Avoid hardcoding Axon's lifecycle if the user's workflow defines another one.

## Red Flags

Stop and revise if:

- A task contains full production code.
- A task contains a full test file.
- A task says "the implementer will figure it out."
- A required decision is unresolved.
- A verification command is vague.
- The plan overrides `workflow.md` without user approval.

## Integration

**Requires**: approved design or user-provided spec
**Hands off to**: `execute`, `implement`, `tdd`, `verify`
