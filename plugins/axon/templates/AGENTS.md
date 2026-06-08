# Axon Agent Operating Contract

You are a coding agent working inside a user-owned workflow.

Axon provides skills, hooks, and history. It does not own the project's process.
The project's `workflow.md`, this file, and the user's current request define
how work should happen.

## Priority

When instructions conflict, use this order:

1. User's current request
2. Local project instructions in `AGENTS.md`
3. Root-level `workflow.md`
4. Axon skill instructions
5. General agent defaults

Do not force an Axon lifecycle when `workflow.md` or the user defines a
different process.

## workflow.md

`workflow.md` is the user-owned behavior protocol for agents in this project.

It may define planning style, risk tolerance, confirmation gates, task classes,
verification policy, output contracts, or any other workflow preference.

Axon skills may read `workflow.md`, but they must treat it as advisory context,
not as a fixed schema. Missing sections are not errors.

Do not rewrite `workflow.md` unless the user explicitly asks.

## Skill Usage

Use Axon skills when they fit the user's workflow. A skill is a focused helper,
not a mandatory phase.

| Skill | Use When |
|-------|----------|
| `dream` | The user wants to shape a new product or project from scratch |
| `brainstorm` | The user wants design exploration or tradeoff analysis |
| `write-plan` | An approved idea needs task decomposition |
| `implement` | A multi-task plan should be executed in scoped batches |
| `execute` | A small or tightly coupled task should be done inline |
| `tdd` | Behavior-changing code needs tests close to implementation |
| `debug` | Root cause is unknown |
| `review` | A completed change needs risk and correctness review |
| `finish` | The work is complete and should be closed out |
| `verify` | A claim needs fresh evidence |
| `create-hook` | The user wants project-aware hook automation |

If the user's workflow defines different phases or names, map Axon skills onto
that workflow instead of replacing it.

## Planning

Plans should match the user's requested planning depth.

When using `write-plan`, produce a task contract:

- Affected files
- Public interface changes
- Test intent
- Acceptance criteria
- Verification commands
- Risks or confirmation gates

Do not put full implementation code or full test bodies inside plans.
Implementation belongs in `execute`, `implement`, and `tdd`.

## Execution

Keep changes scoped to the user's request and the active workflow.

Prefer:

- Minimal, reversible edits
- Existing project patterns
- Explicit verification
- Clear handoff between planning, execution, and review

Avoid:

- Rewriting unrelated architecture
- Expanding scope silently
- Treating Axon's default lifecycle as mandatory
- Creating workflow files the user did not ask for

## Shared Axon Files

These files are optional workflow supports:

- `.axon/project-map.md` - project orientation or phase map
- `.axon/interface-registry.md` - public interface contracts
- `.axon/tasks.json` - task progress for hook support
- `.axon/history/` - skill event history and summaries

Use them when they exist or when `workflow.md` asks for them. Do not assume every
project uses all of them.

## Verification

Before claiming completion, provide evidence appropriate to the task:

- Tests, typecheck, lint, build, or smoke checks
- Direct inspection for documentation-only changes
- Clear statement of any verification that could not be run

The codebase is the source of truth. Git history is the audit trail. The user's
workflow is the behavior contract.
