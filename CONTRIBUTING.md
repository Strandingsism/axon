# Contributing

Thanks for your interest in contributing to Axon.

Axon is a workflow layer for Codex built around a small surface area: user-owned `workflow.md`, composable skills, lightweight hooks, and workflow history. Contributions should preserve that shape.

## Development Setup

Clone the repository:

```bash
git clone https://github.com/Strandingsism/axon.git
cd axon
```

Install the local plugin while developing:

```bash
codex plugin marketplace add --ref main Strandingsism/axon
codex plugin add axon@axon
```

For local iteration, you may temporarily register the repository root as a local marketplace:

```bash
codex plugin marketplace remove axon
codex plugin marketplace add .
codex plugin add axon@axon
```

Switch back to GitHub before testing marketplace installation:

```bash
codex plugin marketplace remove axon
codex plugin marketplace add --ref main Strandingsism/axon
codex plugin add axon@axon
```

## Project Structure

```text
workflow.md
README.md
README_ZH.md
plugins/axon/
  .codex-plugin/plugin.json
  hooks/
  skills/
  templates/
```

The published Codex plugin payload lives in `plugins/axon`.

## Contribution Principles

- Keep Axon small and composable.
- Prefer user-owned workflow over hardcoded workflow.
- Treat `workflow.md` as advisory context, not a required schema.
- Keep hooks lightweight, deterministic, and non-blocking unless a blocking gate is explicitly designed.
- Do not reintroduce HUD or pane management.
- Do not store secrets, credentials, or private user data.
- Prefer history over hidden state.

## Making Changes

Before opening a pull request:

1. Keep changes scoped to one concern.
2. Update documentation when behavior changes.
3. Bump `plugins/axon/.codex-plugin/plugin.json` only when the plugin payload changes.
4. Verify JSON files parse correctly.
5. Verify hooks do not crash on malformed input.
6. Check that generated runtime files are not committed.

Useful checks:

```bash
git diff --check
node -e "const fs=require('fs'); JSON.parse(fs.readFileSync('plugins/axon/hooks/hooks.json','utf8')); JSON.parse(fs.readFileSync('plugins/axon/.codex-plugin/plugin.json','utf8'))"
```

## Commit Style

Use short conventional-style commit messages:

```text
feat: record skill history runs
fix: harden hook parsing
docs: prepare public readme
chore: bump plugin version
```

## Pull Requests

Pull requests should include:

- What changed
- Why it changed
- How it was verified
- Any remaining risks or follow-up work

## Reporting Issues

Open a GitHub issue with:

- Axon version
- Codex CLI version
- Operating system
- Steps to reproduce
- Expected behavior
- Actual behavior
- Relevant hook output or error text
