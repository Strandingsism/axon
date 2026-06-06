# Axon

A lean, focused workflow layer for AI coding agents. **10 skills. No bloat.**

Axon strips the multi-agent orchestration concept down to its essence: a clean development methodology encoded as composable skills. Each skill has a single, non-overlapping purpose.

## Philosophy

- **One skill, one purpose.** No aliases, no deprecated shims, no internal-only tools posing as skills.
- **Hard gates, not suggestions.** Each skill has non-negotiable rules. Violating the letter violates the spirit.
- **Evidence over claims.** No completion claim without fresh verification output.
- **Composable, not orchestrated.** Skills chain naturally. No mega-pipeline that tries to automate everything.

## The 10 Skills

| # | Skill | When | Output |
|---|-------|------|--------|
| 1 | `dream` | Greenfield project from scratch | `docs/specs/YYYY-MM-DD-<topic>-design.md` |
| 2 | `brainstorm` | Brownfield work in an existing codebase | `docs/specs/YYYY-MM-DD-<topic>-design.md` |
| 3 | `write-plan` | After an approved design | `docs/plans/YYYY-MM-DD-<feature>-plan.md` |
| 4 | `implement` | Multi-task plan, subagent execution | Working, tested, reviewed code |
| 5 | `execute` | Single-task plan, inline execution | Working, tested, verified code |
| 6 | `tdd` | During implementation of any feature or fix | Tests that fail first, then pass |
| 7 | `debug` | When something is broken and root cause is unknown | Root cause identified + failing test + fix |
| 8 | `review` | After each task, before merge | Severity-rated findings, all resolved |
| 9 | `finish` | After all tasks pass review | Merged/PR'd/kept/discarded branch |
| 10 | `verify` | Before any completion claim | Fresh command output proving the claim |

## Flow

```
dream / brainstorm ──→ write-plan ──→ implement / execute ──→ review ──→ finish
                              │                  │
                              ▼                  ▼
                             tdd               debug
                              │                  │
                              └────── verify ────┘
```

## HUD

Axon includes a read-only terminal HUD for workflow visibility:

```bash
axon hud          # render once
axon hud --watch  # refresh every second
axon hud --json   # print the raw HUD model
axon hud attach   # open --watch in a tmux-compatible pane
```

The HUD reads only:

- `.axon/state.json` — current recorded phase
- `docs/tasks.json` — task list and completion state

No state transition graph or event timeline is inferred.

`axon hud attach` uses a tmux-compatible mux layer. On Windows it prefers `psmux`; on Unix-like systems it uses `tmux`, including cmux's tmux compatibility shim when present.

When Axon runs in Codex CLI, it tries to attach the HUD automatically at session
start. Set `AXON_HUD_AUTO_ATTACH=0` before launching `codex` to disable this.

## Install

Add the Axon marketplace, then install Axon from `/plugins`:

```bash
codex plugin marketplace add Strandingsism/axon
```

For local development, add this checkout directly:

```bash
codex plugin marketplace add D:/Reaserch/Axon/axon
```

## Directory Structure

```
axon/
├── .agents/plugins/marketplace.json
├── package.json
├── skills/          # 10 skill definitions (SKILL.md each)
├── docs/
│   ├── specs/       # Design documents (brainstorm output)
│   └── plans/       # Implementation plans (write-plan output)
├── tdd/             # TDD tests for Axon itself
├── templates/       # AGENTS.md and other bootstrapping templates
└── src/             # CLI implementation
```

## Compared to OMX

OMX ships 52 skills. Axon ships 10. Here's what was cut and why:

- **Deprecated skills** — dead code. Gone.
- **Role prompts posing as skills** — prompts define agent behavior; skills define workflows. Separate concerns.
- **Tool/utility commands** — `doctor`, `hud`, `cancel`, `skill` are CLI commands, not skills.
- **Redundant planning layers** — `deep-interview` + `ralplan` + `plan` + `best-practice-research` collapse into `dream` / `brainstorm` + `write-plan`.
- **Over-engineered execution** — `ralph` + `ultragoal` + `team` + `pipeline` + `autopilot` collapse into `implement` / `execute`.
- **Triple quality gates** — `code-review` + `ultraqa` + `visual-verdict` collapse into `review` + `verify`.

## Inspiration

- [obra/superpowers](https://github.com/obra/superpowers) — the skills methodology and format
- [Yeachan-Heo/oh-my-codex](https://github.com/Yeachan-Heo/oh-my-codex) — what happens when you ship 52 skills

## License

MIT
