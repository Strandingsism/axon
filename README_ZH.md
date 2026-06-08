# Axon

<p align="center">
  <img src="assets/axon-product.png" alt="Axon product visual" />
  <br>
  <em>让 Codex 遵循你的 workflow，而不是一条硬编码流程。</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-early%20usable-blue" alt="Status: early usable" />
  <img src="https://img.shields.io/badge/Codex-plugin-black" alt="Codex plugin" />
  <img src="https://img.shields.io/badge/workflow-user--owned-00AEEF" alt="User-owned workflow" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" />
</p>

<p align="center">
  <strong>语言：</strong>
  <a href="./README.md">English</a> ·
  <a href="./README_ZH.md">中文</a>
</p>

Axon 是 Codex 的 workflow layer：用户拥有的 `workflow.md`、可组合的 skills、运行时 hooks，以及 workflow history。

它让 coding agent 能以可重复的方式完成规划、执行、验证、审查和沉淀，而不是强迫所有项目进入同一套固定流水线。

## 为什么需要 Axon

大多数 coding agent 可以修改代码，但不会自然保留用户自己的工作方式。大型 workflow 系统通常通过重编排、大量命令和固定路径来解决这个问题。

Axon 选择更小的方式：

- `workflow.md` 定义这个项目里 agent 应该如何工作。
- skills 提供聚焦的生命周期能力。
- hooks 提供运行时提醒和事件记录。
- 项目根目录 `.axon/history` 记录用户真实使用 workflow 的方式。

目标不是让所有项目遵循 Axon 的 workflow，而是让每个项目定义自己的 workflow，并给 Codex 足够的结构去遵循它。

## 核心概念

### `workflow.md`

`workflow.md` 是项目中由用户拥有的 agent 行为协议。

它可以描述规划方式、风险偏好、任务分类、确认门、验证策略、输出契约，或其他 workflow 约定。Axon 把它当作建议性上下文，而不是固定 schema。缺少某些 section 不是错误。

### Skills

Axon 提供 10 个生命周期 skills，以及 1 个 workflow authoring skill。每个 skill 只负责一个明确任务，并且可以在 Codex 中直接调用。

### Hooks

Hooks 提供轻量的运行时行为：

- 引导新 session
- 准备 skill 上下文
- 记录 skill 使用情况
- 请求 history summary
- 检查任务进度

Hooks 刻意保持很小。它们不生成总结，也不替代 agent 判断。

### History

Axon 会把真实 workflow 使用记录到项目根目录的 `.axon/history`。

第一次 Axon skill 调用会开始一个 run。使用 `finish` 后 run 关闭。关闭后，Axon 会要求 agent 为该 run 编写人类可读的 `summary.md`。

## 功能

- 10 个生命周期 skills：`dream`、`brainstorm`、`write-plan`、`implement`、`execute`、`tdd`、`debug`、`review`、`finish`、`verify`
- `create-hook` 用于项目本地 workflow 自动化
- 根目录 `workflow.md` 作为 agent 行为协议
- 项目根目录 `.axon/history` event logs 和 summaries
- 项目根目录 `.axon/tasks.json` 任务进度支持
- 项目根目录 `.axon/project-map.md` 和 `.axon/interface-registry.md` workflow 示例
- 没有 HUD、pane manager 或重型 orchestrator

## 安装

从 GitHub 添加 Axon marketplace：

```bash
codex plugin marketplace add --ref main Strandingsism/axon
```

安装插件：

```bash
codex plugin add axon@axon
```

后续更新：

```bash
codex plugin marketplace upgrade axon
codex plugin add axon@axon
```

安装或更新后，重新打开一个 Codex session，以加载最新 skills 和 hooks。

## 使用

在 Codex 中直接调用 Axon skills：

```text
$axon:brainstorm
$axon:write-plan
$axon:execute
$axon:finish
```

一种可能的流程：

```text
dream / brainstorm -> write-plan -> implement / execute -> review -> finish
                                 |                  |
                                 v                  v
                                tdd               debug
                                 |                  |
                                 +------ verify ----+
```

这只是示例，不是 Axon 强制管线。项目真实流程应该由项目自己的
`workflow.md` 定义。

History 结构：

```text
.axon/history/
├── index.json
├── active.json
└── runs/
    └── YYYY-MM-DD-001/
        ├── events.jsonl
        └── summary.md
```

`events.jsonl` 由 hooks 写入。`summary.md` 由 agent 在 `finish` 后编写。

## 状态

Axon 仍然早期，但已经可用。

已经实现：

- plugin manifest 和 GitHub marketplace 安装
- 10 个生命周期 skills
- 使用 `create-hook` 进行 workflow authoring
- 根目录 `workflow.md` scaffold
- 运行时 hooks
- skill history runs
- `finish` 后请求 summary

仍在演进：

- 更丰富的 history summaries
- 更理解 workflow 的 hook 生成
- 可选 workflow schema 或 parser
- 更强的工具

## License

MIT
