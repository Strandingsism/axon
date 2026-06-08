---
name: create-hook
description: "Use when the user wants to create, modify, or document project-aware Codex hooks for a custom workflow."
---

# Create Hook

Create project-aware Codex hooks that turn a user's documented workflow into runtime automation. The input is not only the user's sentence. The input is the target project's docs, rules, workflow context, and existing hook setup.

## Hard Gate

**NO HOOK WITHOUT PROJECT CONTEXT, AN EXPLICIT SCOPE, AND A TEST.**

Before writing or editing any hook:

1. Read the project's workflow docs.
2. Infer the workflow rule behind the user's request.
3. Confirm the behavior in user-facing workflow language.
4. Write a minimal test or fixture that proves the hook input/output contract.

Do not start by asking the user for Codex hook internals such as `PreToolUse` or `PostToolUse`. Translate workflow intent into hook mechanics yourself.

## Default Scope

Default to project-local hooks:

```text
.codex/hooks.json
.codex/hooks/<hook-name>.mjs
tdd/hooks/<hook-name>.test.mjs
.axon/hooks/<hook-name>.md
```

All `.axon/...` paths in this skill are project-root-relative. Do not create nested `.axon` directories when the user is working from a subdirectory.

Use another scope only when the user explicitly asks:

| Scope | Paths | Use when |
|-------|-------|----------|
| project-local | `.codex/hooks.json`, `.codex/hooks/*.mjs` | The workflow belongs to this repo |
| user-global | `~/.codex/hooks.json`, `~/.codex/hooks/*.mjs` | The workflow should affect all Codex sessions |
| plugin-bundled | plugin `hooks/hooks.json`, plugin `hooks/*.mjs` | The workflow should ship as a plugin |
| installed-plugin | `~/.codex/plugins/cache/...` | Emergency patch only; cache upgrades can overwrite it |

Do not edit an installed plugin cache unless the user explicitly requests it and understands that upgrades may replace the change.

## Project Context

Read the relevant project docs before asking hook API questions or writing code. Prefer these sources, if they exist:

```text
workflow.md
AGENTS.md
README.md
.axon/project-map.md
.axon/interface-registry.md
.axon/tasks.json
.axon/specs/*.md
.axon/plans/*.md
.axon/hooks/*.md
.axon/history/index.json
.axon/history/active.json
.axon/history/runs/*/events.jsonl
.codex/hooks.json
```

`workflow.md` is the canonical user-owned workflow file. Its default location is the project root only. Do not create or assume `.axon/workflow.md`, `docs/workflow.md`, or any nested workflow file unless the user explicitly points to one.

Treat `workflow.md` as the project's agent behavior design system, not as a generic rule dump. When present, read these sections before designing a hook:

- Operating Philosophy
- Workflow Tokens
- Workflow States
- Task Classification
- Example Protocol or project-specific protocol sections
- Confirmation Gates
- Tool Policy
- Output Contract
- Examples

Infer hooks from the workflow protocol. For example, a confirmation gate should usually become a prompt or gate hook, while a workflow state should usually become a history entry or a short reminder.

Axon may create a root-level `workflow.md` structure placeholder only when the user asks for one. The content belongs to the user. Do not fill it with Axon policy beyond neutral section headings, parseable token examples, and brief placeholder prompts.

Summarize the project workflow in your own notes:

- Operating philosophy and conflict-resolution principles
- Workflow tokens that affect autonomy, planning, risk, testing, research, language, or report style
- Current workflow states and state transitions
- Task classes and their configured protocols
- Confirmation gates and restricted tool behavior
- Output contracts
- Current phases and task flow
- Source-of-truth docs and runtime artifacts
- Interface or API boundaries that need protection
- TDD expectations and test locations
- Existing hooks and their events
- Rules that should prompt, sync, audit, or gate

If docs conflict with the user's request, surface the conflict before writing. Example: "The docs say public APIs must be registered, but the requested hook only reminds after review. Should this check happen after file edits instead?"

## Workflow Intent

Ask the user in workflow language first:

| User-facing intent | Likely event | Likely hook type |
|--------------------|--------------|------------------|
| Before starting a session, remind the agent what to read | `SessionStart` | prompt |
| Before using a tool, check a rule | `PreToolUse` | audit or gate |
| After writing files, sync docs or task progress | `PostToolUse` | sync |
| After a skill completes, record workflow history | `PostToolUse` | history |
| Before risky operations, require confirmation | `PermissionRequest` or `PreToolUse` | gate |
| When the agent is about to stop, check completion | `Stop` | audit |

Only expose event and matcher details when:

- The user asks for them
- Multiple valid implementations exist
- The choice changes safety or user experience

## Hook Types

Choose the smallest hook type that fits the project docs:

| Type | Behavior | Default decision |
|------|----------|------------------|
| prompt | Inject a short reminder with `additionalContext` | `allow` |
| history | Append local workflow events | `allow` |
| sync | Keep docs, tasks, or maps aligned after file changes | `allow` |
| audit | Read-only check that reports a short reminder | `allow` |
| gate | Block or require confirmation for risky actions | explicit user approval required |

Default hooks should not block. Use `gate` only when the user asks for enforcement or the docs explicitly define a hard gate.

## Process

### 1. Read Project Workflow Context

Inspect the docs listed in **Project Context**. Do not bulk-read unrelated source files unless the hook rule depends on them.

Produce a short internal mapping:

```text
workflow rule -> source doc -> source of truth -> possible hook point
```

Example:

```text
Public APIs must be registered -> .axon/interface-registry.md -> registry file -> PostToolUse Write|Edit audit
```

### 2. Infer the Hook Intent

Translate the user's request into:

- Workflow rule
- Source `workflow.md` section, token, state, gate, or output contract
- Trigger moment in normal language
- Event and matcher
- Hook type
- Files read and written
- Output behavior
- Failure behavior

Prefer docs-derived behavior over generic templates. If the project already has project-root `.axon/tasks.json`, `.axon/project-map.md`, or `.axon/interface-registry.md`, make the hook understand those files by name.

### 3. Confirm the Behavior

Confirm the design using user-facing language:

```text
I will create a non-blocking hook that runs after Write/Edit. It will read .axon/interface-registry.md and inject a short reminder when source files changed, without blocking the edit.
```

Ask one question only if needed. Good questions:

- "Should this be a reminder or a blocking gate?"
- "Should this apply only to source files or to all writes?"
- "Should this update docs automatically or only prompt the agent?"

Avoid asking:

- "Which Codex event should I use?"
- "What matcher do you want?"

### 4. Design the Contract

Record the expected stdin payload and stdout response before writing implementation.

For tool hooks, include:

```json
{
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "src/api.ts"
  }
}
```

For output, prefer:

```json
{
  "decision": "allow"
}
```

Only include `hookSpecificOutput.additionalContext` when the hook must guide the agent. Keep it short and project-specific.

### 5. Write TDD First

Create:

```text
tdd/hooks/<hook-name>.test.mjs
```

The test must:

- Run the hook as a Node process
- Pass JSON through stdin
- Parse stdout as JSON
- Assert `decision`, `hookSpecificOutput`, file writes, or block behavior
- Cover malformed input and no-op input
- Include fixtures for the relevant project docs when the hook depends on docs

If the target repo already has a test runner, integrate with it. Otherwise, use a plain Node test file.

### 6. Implement the Hook

Create:

```text
.codex/hooks/<hook-name>.mjs
```

Implementation requirements:

- Read stdin JSON defensively
- Never throw uncaught errors
- Default to `{"decision":"allow"}`
- Avoid network access
- Do not read secrets
- Do not inject long documents
- Use stable paths based on `process.cwd()` for project-local hooks
- Use `PLUGIN_ROOT` only for plugin-bundled hooks
- Treat docs as source-of-truth inputs, not as optional decoration

### 7. Register the Hook

Update:

```text
.codex/hooks.json
```

Include both `command` and `commandWindows`:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node .codex/hooks/interface-registry-audit.mjs",
            "commandWindows": "node .codex/hooks/interface-registry-audit.mjs",
            "statusMessage": "Workflow: checking interface registry"
          }
        ]
      }
    ]
  }
}
```

Merge with existing hooks. Do not overwrite unrelated hook groups.

### 8. Document the Hook

Create:

```text
.axon/hooks/<hook-name>.md
```

Document:

- Purpose
- Source docs used to derive the rule
- Scope and paths
- Event and matcher
- Input payload shape
- Output behavior
- Failure behavior
- How to test
- How to trust or disable it with `/hooks`

### 9. Verify

Run the hook test and a direct stdin smoke test. Read the output before claiming success.

After verification, tell the user:

- Which docs shaped the hook behavior
- Which files changed
- Whether the hook is blocking or non-blocking
- Whether `/hooks` trust is required
- That existing Codex sessions may need restart or hook review before the change applies

## Safety Rules

- Do not create broad blocking hooks without explicit approval.
- Do not make hooks depend on network availability.
- Do not store credentials in hook files, docs, fixtures, or logs.
- Do not write outside the selected scope.
- Do not silently modify global hooks when project-local hooks would work.
- Do not rely on installed plugin cache as source of truth.
- Do not ignore project docs when they define workflow rules.

## Integration

**Uses**: `tdd` for hook tests, `verify` before completion.
**Reads**: project workflow docs before implementation.
**Primary workflow doc**: root-level `workflow.md`.
**Related docs**: `.axon/hooks/<hook-name>.md`.
**Does not replace**: lifecycle skills. This is project-aware workflow authoring, not implementation execution.
