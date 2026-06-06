# Axon

A lean, focused workflow layer for AI coding agents. **10 lifecycle skills plus workflow authoring.**

Axon strips the multi-agent orchestration concept down to its essence: a clean development methodology encoded as composable skills. Each skill has a single, non-overlapping purpose.

## Philosophy

- **One skill, one purpose.** No aliases, no deprecated shims, no internal-only tools posing as skills.
- **Hard gates, not suggestions.** Each skill has non-negotiable rules. Violating the letter violates the spirit.
- **Evidence over claims.** No completion claim without fresh verification output.
- **Composable, not orchestrated.** Skills chain naturally. No mega-pipeline that tries to automate everything.

## The 10 Lifecycle Skills

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

## Workflow Authoring

| Skill | When | Output |
|-------|------|--------|
| `create-hook` | User wants to customize Codex workflow automation | Project-local `.codex/hooks.json`, hook script, TDD fixture, and docs |

`create-hook` is not part of the lifecycle chain. It creates tested Codex hooks for project-specific workflow automation.

## Flow

```
dream / brainstorm ──→ write-plan ──→ implement / execute ──→ review ──→ finish
                              │                  │
                              ▼                  ▼
                             tdd               debug
                              │                  │
                              └────── verify ────┘
```

## Directory Structure

```
axon/
├── .agents/
│   └── plugins/
│       └── marketplace.json   # Codex marketplace entry
├── plugins/
│   └── axon/                  # Published plugin payload
│       ├── .codex-plugin/
│       │   └── plugin.json    # Plugin manifest
│       ├── skills/            # Lifecycle and workflow-authoring skills
│       ├── hooks/             # Lifecycle hooks
│       ├── docs/              # Bundled workflow examples/templates
│       └── templates/         # AGENTS.md and bootstrapping templates
└── README.md
```

## Compared to OMX

OMX ships 52 skills. Axon keeps 10 lifecycle skills and one workflow-authoring skill. Here's what was cut and why:

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
