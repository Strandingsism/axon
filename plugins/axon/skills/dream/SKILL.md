---
name: dream
description: "Use when the user wants to build something new from scratch. Greenfield ideation — use AskUserQuestion to discover vision, explore trade-offs, crystallize scope, and get design approval."
---

# Dream — Greenfield Ideation

You're building something from nothing. The user has an ambition, not a spec. Use `AskUserQuestion` to turn ambition into a crystallized design. Structured choices, not open-ended text walls.

## Dream vs Brainstorm

| | dream | brainstorm |
|---|---|---|
| **Codebase** | Greenfield — nothing exists yet | Brownfield — existing code constraints |
| **Starting point** | "I want to build X" | "Add Y to existing system" |
| **Questioning** | `AskUserQuestion` with multiple-choice options | One open-ended question at a time |
| **Constraints** | Only the user's requirements | Existing architecture, conventions |

## Hard Gate

**NO CODE UNTIL THE VISION IS CRYSTALLIZED AND APPROVED.**

No `npm init`. No scaffolding. No prototype. Vision first.

## The Tool

Use `AskUserQuestion` for every decision. Each call presents the user with concrete options they can select in one click. Rules:

- **2-3 questions per call** — efficient but not overwhelming. Group related questions (e.g., platform + language + hosting in one call).
- **2-4 options per question**, each with a short label + one-line description. Lead with your recommendation: `"(Recommended)"`.
- **Use `multiSelect: true`** when the user can pick more than one (e.g., target platforms, must-have features).
- **Use `preview`** when comparing concrete things — code snippets, architecture diagrams, file trees, API designs.

## Process

### 1. Discovery — Who, Why, What

First `AskUserQuestion` call covers the foundation:

- **Problem**: What problem does this solve? Multiple choice: personal tool, team workflow, public product, experiment/learning.
- **Audience**: Who is this for? Just you, small team, public users, developers.
- **Success**: How will you know it worked? Options: "I use it daily", "solves a specific pain point", "others adopt it", "proves a concept".

Do NOT ask about tech yet. Lock in why and who first.

### 2. Explore — Constraints and Trade-offs

Second call surfaces what the user may not have considered:

- **Platform**: CLI / web / mobile / desktop / library — with trade-off descriptions.
- **Language**: Recommend based on their use case, but present 2-3 viable options with pros/cons in descriptions.
- **Key constraints**: Timeline, budget, must-integrate-with, must-avoid. Use `multiSelect: true`.

Surface blind spots: "You said mobile — native or cross-platform (React Native/Flutter)?" "You said real-time — WebSocket polling or SSE?" Put these as options, not open questions.

### 3. Crystallize — Lock the Scope

Define v0.1 — the minimum that proves the idea:

- **v0.1 must-haves**: List concrete features. `multiSelect: true`. Limit to what can be built in days, not weeks.
- **Explicitly deferred**: Items the user mentioned but belong in v0.2+. List them. Re-confirm they're out for now.
- **Failure threshold**: What would make v0.1 unacceptable? "Must handle 100 concurrent users", "Must pass accessibility audit", or "Just needs to work for me".

The goal is not the perfect system. It's the smallest thing that proves the idea is worth building.

### 4. Design — Define the Architecture

Now design what gets built. Present each area with `AskUserQuestion`:

| Area | What to ask |
|------|-------------|
| **Tech stack** | Language, framework, database, hosting. 2-3 concrete combos with rationale in descriptions. Lead with recommendation. |
| **Architecture** | Monolith vs services, folder layout, key components. Use `preview` to show a file tree or component diagram. |
| **API / Data flow** | REST vs GraphQL vs RPC. Schema sketch in preview. Data storage approach. |
| **Testing strategy** | Unit only? Integration? E2E? What test framework? |

One `AskUserQuestion` call per area. Don't dump all 4 at once. Wait for each answer before the next.

### 5. Write the Design Document

Save to `docs/specs/YYYY-MM-DD-<topic>-design.md`:

- **Vision**: One sentence — what and why
- **Scope**: v0.1 must-haves, explicitly deferred
- **Tech stack**: Chosen stack with rationale
- **Architecture**: Components, communication, file tree
- **Testing strategy**: How correctness will be verified
- **Risks**: Biggest unknowns and mitigation

### 6. Self-Review

1. No placeholders — zero TBD, TODO, "figure out later"
2. Internal consistency — tech matches architecture, file tree matches components
3. Scope check — is v0.1 actually minimal?
4. Ambiguity check — could another dev build this without asking questions?

### 7. User Review Gate

The user must explicitly approve the design doc before you proceed:

> I've written the design at `docs/specs/2026-06-06-<topic>-design.md`. Please review. Once approved, I'll invoke `write-plan`.

Do NOT invoke `write-plan` until the user confirms.

### 8. Update Project Map

Initialize `docs/project-map.md`: set the Goal, mark phase 1 done.

### 9. Handoff

Always go to `write-plan` next. Never jump from dream to code.

## When NOT to Use

- Modifying an existing codebase → use `brainstorm`
- User gives a precise, complete spec → skip to `write-plan`
- Purely mechanical task (typo, version bump) → skip all

## Red Flags

- You asked 3 rounds of questions and still haven't locked scope
- The v0.1 has more than 5 features
- You assumed a tech stack without asking
- You're designing for scale before proving the concept
- User keeps adding features during crystallization → lock v0.1, defer the rest

## Integration

**Alternative to**: `brainstorm` (dream = greenfield, brainstorm = brownfield)
**Hands off to**: `write-plan`
**Uses**: `AskUserQuestion` (primary interaction tool)
**Writes to**: `docs/project-map.md` (initialize)
