---
name: create-hook
description: "Use when the user wants to create, modify, or document Codex hooks for a custom workflow."
---

# Create Hook

Create project-local Codex hooks that turn a user's workflow into runtime automation. A hook is code with operational impact, so design it, test it, register it, and document it.

## Hard Gate

**NO HOOK WITHOUT AN EXPLICIT SCOPE AND A TEST.**

Before writing or editing any hook, identify where it will live and write a minimal test or fixture that proves the hook input/output contract.

## Default Scope

Default to project-local hooks:

```text
.codex/hooks.json
.codex/hooks/<hook-name>.mjs
tdd/hooks/<hook-name>.test.mjs
docs/hooks/<hook-name>.md
```

Use another scope only when the user explicitly asks:

| Scope | Paths | Use when |
|-------|-------|----------|
| project-local | `.codex/hooks.json`, `.codex/hooks/*.mjs` | The workflow belongs to this repo |
| user-global | `~/.codex/hooks.json`, `~/.codex/hooks/*.mjs` | The workflow should affect all Codex sessions |
| plugin-bundled | plugin `hooks/hooks.json`, plugin `hooks/*.mjs` | The workflow should ship as a plugin |
| installed-plugin | `~/.codex/plugins/cache/...` | Emergency patch only; cache upgrades can overwrite it |

Do not edit an installed plugin cache unless the user explicitly requests it and understands that upgrades may replace the change.

## Hook Types

Choose the smallest hook type that fits:

| Type | Behavior | Default decision |
|------|----------|------------------|
| prompt | Inject a short reminder with `additionalContext` | `allow` |
| state | Record local workflow state such as `.axon/state.json` | `allow` |
| sync | Keep docs, tasks, or maps aligned after file changes | `allow` |
| audit | Read-only check that reports a short reminder | `allow` |
| gate | Block or require confirmation for risky actions | explicit user approval required |

Default hooks should not block. Use `gate` only when the user asks for enforcement.

## Process

### 1. Clarify the Workflow

Ask one question at a time until these are known:

- Scope: project-local, user-global, plugin-bundled, or installed-plugin
- Event: `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`, `PostToolUse`, `Stop`, or `SubagentStop`
- Matcher: event-specific matcher, if any
- Type: prompt, state, sync, audit, or gate
- Output: no context, short `additionalContext`, state write, or block reason

If the user has no preference, use project-local scope, non-blocking behavior, and short prompt/state output.

### 2. Design the Contract

Record the expected stdin payload and stdout response before writing implementation.

For tool hooks, include:

```json
{
  "hook_event_name": "PreToolUse",
  "tool_name": "Write",
  "tool_input": {}
}
```

For output, prefer:

```json
{
  "decision": "allow"
}
```

Only include `hookSpecificOutput.additionalContext` when the hook must guide the agent. Keep it short.

### 3. Write TDD First

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

If the target repo already has a test runner, integrate with it. Otherwise, use a plain Node test file.

### 4. Implement the Hook

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

### 5. Register the Hook

Update:

```text
.codex/hooks.json
```

Include both `command` and `commandWindows`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node .codex/hooks/example.mjs",
            "commandWindows": "node .codex/hooks/example.mjs",
            "statusMessage": "Workflow: checking write"
          }
        ]
      }
    ]
  }
}
```

Merge with existing hooks. Do not overwrite unrelated hook groups.

### 6. Document the Hook

Create:

```text
docs/hooks/<hook-name>.md
```

Document:

- Purpose
- Scope and paths
- Event and matcher
- Input payload shape
- Output behavior
- Failure behavior
- How to test
- How to trust or disable it with `/hooks`

### 7. Verify

Run the hook test and a direct stdin smoke test. Read the output before claiming success.

After verification, tell the user:

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

## Integration

**Uses**: `tdd` for hook tests, `verify` before completion.
**Related docs**: `docs/hooks/<hook-name>.md`.
**Does not replace**: lifecycle skills. This is workflow authoring, not implementation execution.
