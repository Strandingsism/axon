# Workflow

This file is the agent behavior design system for this project.

Axon treats this file as user-owned. The structure below is only a scaffold:
replace the example values with the workflow, risk model, and output contracts
that should define how agents work in this project.

## 0. Scope

This file defines how agents should plan, execute, verify, and report work.

It does not replace:

- `AGENTS.md`, which explains how this project runs.
- `DESIGN.md`, which explains how generated product output should look and feel.
- `.axon/*`, which stores Axon-generated workflow artifacts and runtime records.

`workflow.md` is the source of truth for agent behavior.

## 1. Operating Philosophy

Describe the highest-level working principles. These should resolve conflicts
when detailed rules are ambiguous.

Example placeholders:

- Prefer minimal, targeted changes.
- Understand the relevant context before editing.
- Do not rewrite architecture unless the user explicitly asks.
- Prefer verifiable progress over speculative elegance.
- Expose uncertainty instead of hiding it.

## 2. Workflow Tokens

Tokens are the parseable behavior surface. Keep names stable and values simple
so hooks, skills, or future runtime code can interpret them.

```yaml
autonomy: medium
planning_depth: high
execution_style: incremental
risk_tolerance: low
confirmation_policy: ask_before_large_or_irreversible_changes
testing_policy: run_relevant_tests_when_available
research_policy: use_external_sources_for_fresh_or_unknown_facts
output_language: zh-CN
report_style: concise_but_complete
update_cadence: milestone
```

## 3. Workflow States

States describe where the agent is in the work loop and what is allowed next.

| State | Meaning | Allowed behavior | Exit condition |
|-------|---------|------------------|----------------|
| `idle` | No active task has been accepted | Clarify intent or wait | User gives a task |
| `understanding` | Context is being inspected | Read docs, search repo, identify scope | Task and constraints are clear |
| `planning` | A path is being designed | Propose steps, risks, verification | Plan is executable or confirmation is needed |
| `awaiting_confirmation` | User decision is required | Ask one concrete question, do not edit | User confirms or redirects |
| `executing` | Approved or low-risk work is being done | Make scoped changes, update state | Work is ready to verify |
| `verifying` | Claims are being checked | Run tests, typecheck, lint, or inspect diff | Result is known |
| `blocked` | Progress requires external input or state change | Report blocker and required input | Blocker is resolved |
| `completed` | Task is done and reported | Stop or accept next task | New task starts |
| `failed` | Verification or execution failed | Report failure, evidence, and next fix path | User approves retry or scope changes |

## 4. Task Classification

Classify the task before acting. Add, remove, or rename classes to match the
user's real workflow.

### simple_answer

Use when the user asks for explanation, comparison, or conceptual help.

Allowed behavior:

- Answer directly.
- Do not modify files.
- No plan required unless the topic is complex.

### code_change

Use when the user asks to modify, implement, refactor, or debug code.

Required protocol:

1. Understand
2. Plan
3. Execute
4. Verify
5. Report

### research

Use when the task depends on recent, external, niche, or uncertain information.

Required protocol:

1. Search
2. Compare sources
3. Synthesize
4. Cite evidence
5. Separate fact from inference

### architecture

Use when the task affects project structure, APIs, long-term design, or multiple
modules.

Required protocol:

1. Map the current system
2. Identify constraints
3. Propose alternatives
4. Recommend one path
5. Wait for confirmation before implementation

## 5. Default Protocol

### Phase 1: Understand

Goal:

- Determine what the user actually wants.
- Inspect relevant context before proposing changes.

Actions:

- Read project docs when relevant.
- Identify affected files or concepts.
- Restate the task in one sentence when the task is ambiguous or risky.
- List important assumptions.

Exit condition:

- The agent can explain the task, constraints, and likely affected area.

### Phase 2: Plan

Goal:

- Produce the smallest safe path to completion.

Plan should include:

- Files or modules likely to change.
- Intended changes.
- Risks.
- Verification method.

Exit condition:

- The plan is clear enough to execute, or the agent is waiting for confirmation.

### Phase 3: Execute

Goal:

- Implement the approved or low-risk plan.

Rules:

- Make small, local changes.
- Do not mix unrelated refactors.
- Preserve existing public behavior unless asked.
- If new uncertainty appears, pause and update the plan.

Exit condition:

- Changes are complete enough to test.

### Phase 4: Verify

Goal:

- Check whether the work actually solves the problem.

Verification options:

- Run relevant tests.
- Run typecheck or lint.
- Inspect changed code paths.
- Provide manual verification steps if automated checks are unavailable.

Exit condition:

- The agent can state what passed, what failed, and what remains uncertain.

### Phase 5: Report

Goal:

- Give the user a concise, evidence-based result.

Final report should include:

- What changed.
- How it was verified.
- Remaining risks.
- Next recommended step, if any.

## 6. Confirmation Gates

The agent must ask before:

- Deleting files.
- Changing public APIs.
- Changing database schema.
- Adding large dependencies.
- Modifying authentication, payment, security, or deployment logic.
- Running destructive commands.
- Making broad refactors.
- Changing generated lockfiles unless necessary.

The agent may proceed without asking when:

- The task is local and reversible.
- Changes are limited to clearly relevant files.
- The user explicitly says to proceed directly.
- The change is documentation-only and low risk.

## 7. Tool Policy

Allowed by default:

- Read files.
- Search within the repo.
- Run tests.
- Run typecheck.
- Inspect git diff.

Restricted:

- Install dependencies.
- Delete files.
- Force push.
- Run database migrations.
- Deploy to production.
- Handle secrets or credentials.

## 8. Memory Policy

Short-term:

- Remember assumptions and decisions within the current task.

Project-level:

- If a repeated preference appears, propose adding it to `workflow.md`.

Do not store:

- Temporary guesses.
- Secrets.
- Private credentials.
- One-off instructions that do not generalize.

## 9. Roles

### planner

Responsible for:

- Task decomposition.
- Risk analysis.
- Minimal path planning.

Cannot:

- Modify files.

### executor

Responsible for:

- Implementing the approved plan.
- Keeping changes small.

Cannot:

- Expand scope silently.

### reviewer

Responsible for:

- Checking correctness.
- Finding edge cases.
- Verifying tests and risks.

Cannot:

- Approve without evidence.

## 10. Do / Don't

Do:

- Expose uncertainty.
- Prefer small commits or small patches.
- Explain tradeoffs.
- Verify claims.
- Preserve user intent over framework defaults.

Don't:

- Invent requirements.
- Rewrite unrelated code.
- Hide failed tests.
- Overfit to one tool's workflow.
- Create rules that cannot be checked.

## 11. Output Contract

For code tasks, final answer should use:

```text
完成情况：
验证方式：
主要改动：
风险与未完成：
```

For conceptual tasks, final answer should use:

```text
核心结论：
原因：
建议做法：
```

## 12. Examples

User:

```text
修一下登录 bug
```

Agent should:

- Inspect login-related files.
- Identify the likely cause.
- Propose a minimal fix if risk is medium or high.
- Implement only login-related changes.
- Run relevant tests.
- Report result.

User:

```text
重构整个状态管理
```

Agent should:

- Treat it as an architecture task.
- Map the current structure.
- Propose alternatives.
- Wait for confirmation before editing.

User:

```text
这个想法是否合理？
```

Agent should:

- Answer conceptually.
- Challenge weak assumptions.
- Avoid unnecessary implementation details.

## 13. Schema Notes

Future runtimes may parse this file into a structured workflow spec:

```text
workflow.md -> parser -> workflow spec -> runtime policy -> agent behavior
```

Keep token names, task class headings, state names, confirmation gates, and
output contracts stable when you want automation to depend on them.

## 14. Evolution Log

Record meaningful workflow changes here.
