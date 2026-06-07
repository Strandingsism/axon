const prompt = `Axon is active.

Before working, orient yourself in the current project:
- Inspect the repository structure.
- Read AGENTS.md and any local instructions that apply.
- Read README.md, .axon/project-map.md, .axon/interface-registry.md, and .axon/tasks.json if they exist.
- Follow Axon workflow: clarify intent, plan, TDD, verify, review, then finish.`;

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: prompt
  }
}));
