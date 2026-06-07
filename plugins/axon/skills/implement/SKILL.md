---
name: implement
description: "Use after an approved plan. Execute tasks one at a time with fresh subagents, two-stage review per task, and continuous progress."
---

# Subagent-Driven Implementation

Execute an implementation plan by dispatching a fresh subagent for each task. Each task gets spec compliance review, then code quality review — before the next task starts. Catch issues early, when they're cheapest to fix.

## Core Principle

**Fresh subagent per task + two-stage review = high quality, fast iteration.**

Each subagent starts with zero context — they don't carry forward the mistakes, assumptions, or confusion of the previous task. You curate exactly what they need. The two-stage review catches scope creep and quality issues before they compound.

## When to Use

Use when:

- You have an approved implementation plan from `write-plan`
- Tasks are mostly independent (each task can be understood on its own)
- You're staying in the current session

For single-task plans or tightly coupled tasks that can't be split, use `execute` instead — the main agent runs an inline execution loop. Subagents add overhead — only pay it when the plan has multiple independent tasks.

## Process

### 1. Load the Plan

Read the plan file from `.axon/plans/`. Extract every task with its full text. Interface registry and project map are injected by hooks — no need to read them manually.

Note:
- The overall goal
- File structure (what's created, modified, deleted)
- Task dependencies (does Task 3 depend on Task 2?)
- Registered interfaces (subagents must match these signatures)

Hooks have reset `.axon/tasks.json` and injected the task list into context. Create matching tasks in the Codex Task system. After each task completes, update its status in `.axon/tasks.json` to `"done"`.

Update `.axon/project-map.md`: mark the `implement` phase as started.

**Greenfield note**: If this project came from `dream` and the repo is empty, set up the project scaffold first — `init`, directory structure, config files, dependency manifest. The plan's first task typically covers this.

### 2. For Each Task

Execute one task at a time. Never dispatch two implementation subagents in parallel — they'll conflict.

#### 2.1 Dispatch the Implementer

Spawn a subagent with the `Agent` tool (or your platform's equivalent). Provide:

- The full task text from the plan (do NOT tell the subagent to read the plan file — paste the text directly into the prompt)
- Relevant project context (conventions, file structure, dependencies)
- The instruction to follow `tdd`
- Read `skills/implement/implementer-prompt.md` and include its content as the subagent's system prompt (this enforces interface-registry.md registration)

#### 2.2 Handle Subagent Responses

| Status | Action |
|--------|--------|
| **Done** | Proceed to spec compliance review |
| **Needs context** | Answer the question with specific information, re-dispatch |
| **Blocked** | Assess: need more context? re-dispatch. Task too large? break it into sub-tasks. Plan is wrong? escalate to user. |
| **Done with concerns** | Read concerns. If about correctness or scope, address first. If observations, note and proceed. |

**Never** ignore a subagent's question. **Never** force the same subagent to retry without changing something (more context, clearer instructions, different model).

#### 2.3 Spec Compliance Review

Spawn a spec reviewer subagent. Read `skills/implement/spec-reviewer-prompt.md` and provide it as the subagent's system prompt, along with the plan task and the implementer's output. One question to answer: **does the implementation match the plan?**

If the spec reviewer finds gaps:
1. Send the findings to the implementer
2. Implementer fixes the gaps
3. Re-run spec review
4. Repeat until spec compliance is ✅

Do not proceed to code quality review until spec compliance passes.

#### 2.4 Code Quality Review

Spawn a code quality reviewer subagent. Read `skills/implement/code-quality-reviewer-prompt.md` and provide it as the subagent's system prompt, along with the implementation diff. One question to answer: **is the implementation good?**

Follow the `review` skill's severity system:
- **Critical**: fix immediately, re-review
- **Important**: fix before next task
- **Minor**: note and move on

If the code quality reviewer finds issues:
1. Send the findings to the implementer
2. Implementer fixes the issues
3. Re-run code quality review
4. Repeat until approved

#### 2.5 Mark Complete

After both reviews pass, mark the task complete. Update `.axon/project-map.md`:
- Check the task checkbox
- Add created/modified files to the Files section
- If the file exceeds 100 lines, compress it — merge redundant entries, drop completed-task detail older than 2 phases, keep only the current state

Move to the next task.

### 3. Final Review

After all tasks are complete, run a final review of the entire implementation:

1. Run the full test suite
2. Run the linter
3. Review the complete diff against the plan one last time
4. If anything is off, fix it now

### 4. Handoff

After final review passes, the next skill is `finish`.

## Model Selection

Use the least powerful model that can handle the role:

| Role | Model guidance |
|------|---------------|
| **Implementer** (1-2 files, mechanical) | Fast/cheap model |
| **Implementer** (multi-file, integration) | Standard model |
| **Spec reviewer** | Standard model (pattern matching, not generation) |
| **Code quality reviewer** | Most capable available model |
| **Final review** | Most capable available model |

## Advantages Over Inline Execution

| Inline | Subagent-Driven |
|--------|----------------|
| You carry all context → context window fills | Fresh context per task |
| You can miss your own mistakes | Independent reviewer catches them |
| Hard to maintain TDD discipline | Subagents follow `tdd` by default |
| Quality review is self-review | Two-stage independent review |
| Sequential debugging of issues | Issues caught before next task |

## Red Flags — Never Do

- Start implementation without an approved plan
- Skip either review stage
- Proceed to the next task while reviews have open issues
- Dispatch multiple implementation subagents in parallel
- Make the subagent read the plan file (provide the full text)
- Skip project context that the subagent can't discover on its own
- Ignore a subagent's question or concern
- Accept "close enough" on spec compliance
- Let the implementer self-review as a replacement for independent review
- Proceed to `finish` without the final full-suite test run

## Integration

**Requires**: `write-plan` (approved plan)
**Uses**: `tdd` (subagents follow it), `review` (the two-stage review), `verify` (confirmation at each stage)
**Hands off to**: `finish`
