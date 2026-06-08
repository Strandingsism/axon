const prompt = `Axon is active.

Before working, orient yourself in the current project:
- Inspect the repository structure.
- Read AGENTS.md and any local instructions that apply.
- Read README.md, .axon/project-map.md, .axon/interface-registry.md, and .axon/tasks.json if they exist.
- If workflow.md exists, treat it as the project-owned behavior protocol.
- Use Axon skills as composable helpers; do not override the user's workflow with a fixed Axon sequence.`;

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: prompt
  }
}));
