---
name: brainstorm
description: Use before any creative or implementation work. Clarify user intent, explore approaches, and get design approval before writing code.
---

# Brainstorming Ideas Into Designs

Turn rough ideas into fully-formed designs through natural collaborative dialogue. The goal is not to document everything — it's to catch bad assumptions before they become code.

## Hard Gate

**NO CODE UNTIL THE DESIGN IS APPROVED.**

No implementation skills. No scaffolding. No "quick prototype to explore." Not even a single line of production code. This applies regardless of project size, language, or how "obvious" the solution seems.

If you are already mid-implementation and realize you skipped design, **stop and invoke this skill now.**

## The "Too Simple" Trap

> "This is trivial. Brainstorming would take longer than just building it."

These are the projects where undetected assumptions cause the most rework. A "simple CLI tool" turns out to need cross-platform support. A "quick fix" touches three subsystems. A "tiny feature" has five edge cases the user assumed you'd handle.

Even a few sentences of agreed-upon design prevent hours of rewriting. If the idea is truly trivial, the design will take 30 seconds.

## Process

### 1. Understand the Project Context

Before asking the user anything, orient yourself:

- Check the project structure, existing code, conventions
- Read relevant AGENTS.md, README, or docs
- Identify which subsystems the idea touches
- Flag multi-subsystem requests early ("This touches auth, database, and the API layer — let's take them one at a time")

### 2. Ask One Question at a Time

Ask clarifying questions **one at a time.** Never present a wall of questions. Each answer shapes the next question.

Prefer multiple-choice when possible — it's faster for the user and reveals your current understanding:

> "Should this configuration live in (A) a JSON file, (B) environment variables, or (C) both with env vars overriding JSON?"

Not:

> "Where should configuration live?"

Ask until ambiguity is resolved. The standard depth is enough when you can describe what to build and why without guessing. If the user says "just build it" and you still have open questions, list the 2-3 biggest unknowns and ask them one at a time.

### 3. Propose Approaches

After clarifying intent, propose **2-3 approaches** with trade-offs. Lead with your recommendation and explain why.

Structure each option as:

- **Approach**: One sentence describing the path
- **Pros**: Why you'd choose it
- **Cons**: What you're trading off
- **Complexity**: Low / Medium / High

If only one approach is viable, explain why alternatives don't apply. Never present a single option without justifying why.

### 4. Present the Design

Present the design in sections. After each section, pause for approval before continuing. This prevents wasting work on a direction the user doesn't want.

Cover these areas (skip any that don't apply):

| Area | Questions to answer |
|------|-------------------|
| **Architecture** | What components exist? How do they communicate? |
| **Data flow** | What goes in? What comes out? What changes? |
| **File structure** | What files are created, modified, or deleted? |
| **Error handling** | What can go wrong? How is each failure handled? |
| **Testing strategy** | What gets tested? Unit vs integration vs e2e? |
| **Dependencies** | New libraries? Version constraints? Why each one? |

### 5. Design for Isolation

Smaller units with single purposes, well-defined interfaces, and testability are always better. File size is a signal: if a file exceeds ~300 lines, the design likely conflates multiple concerns.

When working in existing codebases, follow established patterns. Include targeted cleanup only when the change touches code that already needs it. Never bundle unrelated refactoring.

### 6. Write the Design Document

Save the agreed-upon design to:

```
docs/specs/YYYY-MM-DD-<topic>-design.md
```

The document must contain:

- **Goal**: One sentence describing what this achieves
- **Scope**: What's included and explicitly excluded
- **Approach**: The chosen approach with rationale
- **Architecture**: Component diagram or description
- **Files**: List of files to create, modify, delete
- **Testing strategy**: How you'll verify correctness
- **Risks**: What could go wrong and mitigation

### 7. Self-Review the Spec

Before asking the user to review, check four things:

1. **No placeholders**: Scan for "TBD", "TODO", "implement later", "add error handling". Remove every one.
2. **Internal consistency**: Does section 3 contradict section 1? Do file paths in "Files" match the architecture description?
3. **Scope check**: Did scope creep in? Are you designing more than was asked?
4. **Ambiguity check**: Would another developer know exactly what to build?

Fix issues inline. No need for a second review pass.

### 8. User Review Gate

The user must read and approve the spec file before you proceed. Present it clearly:

> I've written the design document at `docs/specs/2026-06-05-auth-flow-design.md`. Please review it. Once approved, I'll invoke `write-plan` to break this into implementation tasks.

Do not invoke `write-plan` or any other implementation skill until the user confirms approval. "Looks good", "Approved", or any explicit confirmation counts. Silence does not.

### 9. Update Project Map

After user approval, update `docs/project-map.md`:
- Set the Goal
- Mark `1. brainstorm` as done with the design doc path
- Initialize phase checkboxes for `write-plan`, `implement`, `review`, `finish`

### 10. Handoff to Implementation

After user approval, the next skill is always `write-plan`. Never jump directly from design to code.

## Key Principles

- **One question at a time.** Walls of questions overwhelm users and produce shallow answers.
- **Multiple choice preferred.** It's faster and shows your thinking.
- **YAGNI ruthlessly.** "Might need later" is not a reason to build now.
- **Explore alternatives.** If you can only think of one approach, you haven't thought hard enough.
- **Incremental validation.** Section-by-section approval prevents wasted work.
- **Be flexible.** Some users want deep architecture discussions. Others want a 3-sentence design. Match their style.

## When NOT to Use

Skip brainstorming when:

- The task is purely mechanical (e.g., "update the copyright year in LICENSE", "add this exact string to the README")
- The user gives you a complete, unambiguous spec and explicitly says "don't brainstorm, just implement"
- You're working from an existing, approved design document

When in doubt, use this skill. The cost of a 2-minute brainstorm is always lower than the cost of building the wrong thing.

## Red Flags — Stop and Restart

- You hear yourself thinking "this is obvious, I'll just start coding"
- You're in the middle of Step 4 and you haven't asked a single clarifying question
- The user says "just build it" and you still have unanswered questions
- You're writing the design document and realizing you don't know what success looks like
- You catch yourself adding features not requested by the user
- The design document has a "TBD" anywhere in it

**All of these mean: pause, return to the appropriate step, and do it properly.**

## Integration

This skill hands off to `write-plan`. It does NOT hand off directly to `implement`, `tdd`, or any other execution skill.

Writes to: `docs/project-map.md` (initialize)

Required reading before invoking this skill: none — brainstorming is the entry point.
