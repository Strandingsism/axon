# Changelog

All notable changes to Axon will be documented in this file.

This project follows a pragmatic version history. Versions refer to the Codex plugin version in `plugins/axon/.codex-plugin/plugin.json`.

## [0.1.18] - 2026-06-08

### Changed

- Apply concise skill context to every Axon skill except `brainstorm` and `dream`.
- Add a short project-root `.axon/project-map.md` and `.axon/interface-registry.md` maintenance reminder to skill context.

## [0.1.17] - 2026-06-08

### Fixed

- Resolve Axon runtime artifacts to the project root when hooks run from a subdirectory.
- Clarify skill prompts so `.axon/...` artifacts are generated under the project root.

## [0.1.16] - 2026-06-08

### Fixed

- Removed the `Stop` hook to avoid Stop-event failures in Codex sessions.
- Close explicit `$axon:finish` history runs during `UserPromptSubmit` and inject the summary prompt there.

## [0.1.15] - 2026-06-08

### Changed

- Changed `write-plan` to produce task contracts instead of detailed implementation code.
- Clarified that `workflow.md` is user-owned and should not be replaced by a fixed Axon lifecycle.
- Updated Axon template and hook prompts to treat skills as composable helpers.

## [0.1.14] - 2026-06-08

### Fixed

- Record explicit `$axon:<skill>` prompt invocations through a `UserPromptSubmit` hook.
- Close explicit `$axon:finish` history runs through a `Stop` hook after the turn completes.

## [0.1.13] - 2026-06-07

### Added

- GitHub marketplace installation flow.
- Public README with product visual and Chinese translation.
- 10 lifecycle skills:
  - `dream`
  - `brainstorm`
  - `write-plan`
  - `implement`
  - `execute`
  - `tdd`
  - `debug`
  - `review`
  - `finish`
  - `verify`
- `create-hook` workflow authoring skill.
- Root-level `workflow.md` scaffold as the user-owned agent behavior protocol.
- Runtime hooks for session orientation, skill context preparation, task progress checks, and workflow history.
- `.axon/history` run tracking:
  - `index.json`
  - `active.json`
  - `runs/<run-id>/events.jsonl`
  - finish-triggered `summary.md` requests

### Changed

- Removed the legacy `.axon/state.json` marker design.
- Replaced state tracking hooks with skill history recording.
- Moved generated workflow artifacts toward `.axon`.
- Reworked README into a public GitHub release page.

### Removed

- HUD and pane management direction.
- Legacy `update-state.mjs` and `check-finish.mjs` hooks.

[0.1.13]: https://github.com/Strandingsism/axon/releases/tag/v0.1.13
