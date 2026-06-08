# Axon

<p align="center">
  <img src="assets/axon-product.png" alt="Axon product visual: an axon-like signal connecting workflow nodes" />
  <br>
  <em>Let Codex follow your workflow, not a hardcoded one.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-early%20usable-blue" alt="Status: early usable" />
  <img src="https://img.shields.io/badge/Codex-plugin-black" alt="Codex plugin" />
  <img src="https://img.shields.io/badge/workflow-user--owned-00AEEF" alt="User-owned workflow" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" />
</p>

<p align="center">
  <strong>Language:</strong>
  <a href="./README.md">English</a> ·
  <a href="./README_ZH.md">Chinese</a>
</p>

Axon is a workflow layer for Codex: user-owned `workflow.md`, composable skills, runtime hooks, and workflow history.

It gives coding agents a repeatable way to plan, execute, verify, review, and remember work without forcing a single rigid pipeline.

## Why Axon

Most coding agents can edit code, but they do not naturally preserve a user's working style across tasks. Large workflow systems solve this by adding heavy orchestration, many commands, and fixed paths.

Axon takes a smaller approach:

- `workflow.md` defines how the agent should work in this project.
- Skills provide focused lifecycle behavior.
- Hooks add runtime reminders and event capture.
- project-root `.axon/history` records how the user actually uses the workflow.

The goal is not to make every project follow Axon's workflow. The goal is to let each project define its own workflow and give Codex enough structure to follow it.

## Core Concepts

### `workflow.md`

`workflow.md` is the user-owned behavior protocol for the project.

It can describe planning style, risk tolerance, task classes, confirmation gates, verification policy, output contracts, or any other workflow convention. Axon treats it as advisory context, not a fixed schema. Missing sections are not errors.

### Skills

Axon ships 10 lifecycle skills plus one workflow-authoring skill. Each skill has one job and can be invoked directly from Codex.

### Hooks

Hooks provide lightweight runtime behavior:

- orient new sessions
- prepare skill context
- record skill usage
- request history summaries
- check task progress

Hooks are intentionally small. They do not generate summaries or replace agent judgment.

### History

Axon records real workflow usage in the project-root `.axon/history`.

A run starts with the first Axon skill call. A run closes when `finish` is used. After closing, Axon asks the agent to write a human-readable `summary.md` for that run.

## Features

- 10 lifecycle skills: `dream`, `brainstorm`, `write-plan`, `implement`, `execute`, `tdd`, `debug`, `review`, `finish`, `verify`
- `create-hook` for project-local workflow automation
- root-level `workflow.md` as the agent behavior protocol
- project-root `.axon/history` event logs and summaries
- project-root `.axon/tasks.json` task progress support
- project-root `.axon/project-map.md` and `.axon/interface-registry.md` workflow examples
- no HUD, pane manager, or heavy orchestrator

## Install

Add the Axon marketplace from GitHub:

```bash
codex plugin marketplace add --ref main Strandingsism/axon
```

Install the plugin:

```bash
codex plugin add axon@axon
```

Update later:

```bash
codex plugin marketplace upgrade axon
codex plugin add axon@axon
```

Start a new Codex session after installing or updating so the latest skills and hooks are loaded.

## Usage

Use Axon skills directly inside Codex:

```text
$axon:brainstorm
$axon:write-plan
$axon:execute
$axon:finish
```

One possible flow:

```text
dream / brainstorm -> write-plan -> implement / execute -> review -> finish
                                 |                  |
                                 v                  v
                                tdd               debug
                                 |                  |
                                +------ verify ----+
```

This is an example, not a required Axon pipeline. Project-specific
`workflow.md` should define the real process.

History layout:

```text
.axon/history/
├── index.json
├── active.json
└── runs/
    └── YYYY-MM-DD-001/
        ├── events.jsonl
        └── summary.md
```

`events.jsonl` is written by hooks. `summary.md` is written by the agent after `finish`.

## Status

Axon is early but usable.

Implemented:

- plugin manifest and GitHub marketplace installation
- 10 lifecycle skills
- workflow authoring with `create-hook`
- root `workflow.md` scaffold
- runtime hooks
- skill history runs
- finish-triggered summary requests

Still evolving:

- richer history summaries
- more workflow-aware hook generation
- optional workflow schema or parser
- stronger installer and update tooling

## License

MIT
