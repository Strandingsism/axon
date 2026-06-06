import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const hookDir = dirname(fileURLToPath(import.meta.url));
const root = process.env.PLUGIN_ROOT || resolve(hookDir, '..');
const tmpl = resolve(root, 'templates', 'AGENTS.md');
const context = existsSync(tmpl) ? readFileSync(tmpl, 'utf-8') : '';

// Inject current workflow state if available
const stateFile = resolve(process.cwd(), '.axon', 'state.json');
let stateBlock = '';
if (existsSync(stateFile)) {
  try {
    const { state, updatedAt } = JSON.parse(readFileSync(stateFile, 'utf-8'));
    if (state && state !== 'idle') {
      stateBlock = `\n\n## Axon Workflow State\nCurrent phase: **${state}** (since ${updatedAt})\n`;
    }
  } catch {}
}

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'SessionStart',
    additionalContext: context + stateBlock
  }
}));
