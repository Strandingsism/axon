import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Inject current workflow state if available
const stateFile = resolve(process.cwd(), '.axon', 'state.json');
let stateBlock = '';
if (existsSync(stateFile)) {
  try {
    const stateJson = JSON.parse(readFileSync(stateFile, 'utf-8'));
    if (stateJson.state && stateJson.state !== 'idle') {
      stateBlock = `\n\nCurrent Axon state: ${stateJson.state}. Read .axon/state.json if exact state metadata is needed.`;
    }
  } catch {}
}

const prompt = `Axon is active.

Before working, orient yourself in the current project:
- Inspect the repository structure.
- Read AGENTS.md and any local instructions that apply.
- Read README.md, .axon/project-map.md, .axon/interface-registry.md, and .axon/tasks.json if they exist.
- Follow Axon workflow: clarify intent, plan, TDD, verify, review, then finish.${stateBlock}`;

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: prompt
  }
}));
