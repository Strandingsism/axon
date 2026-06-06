import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// PostToolUse hook — mark done after finish completes
const CWD = process.cwd();
const STATE_FILE = resolve(CWD, '.axon', 'state.json');

function loadState() {
  try {
    if (!existsSync(STATE_FILE)) return { state: 'idle', updatedAt: null };
    const { state, updatedAt } = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
    return { state: state || 'idle', updatedAt: updatedAt || null };
  } catch { return { state: 'idle', updatedAt: null }; }
}

function saveState(state) {
  const dir = resolve(CWD, '.axon');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify({ state, updatedAt: new Date().toISOString() }, null, 2));
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => {
      try { resolve(JSON.parse(data)); } catch { resolve(null); }
    });
  });
}

const payload = await readStdin();

if (!payload || payload.tool_name !== 'Skill' || payload.tool_input?.skill !== 'finish') {
  process.stdout.write(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}

// finish skill completed → mark done
const current = loadState();
if (current.state === 'finishing') saveState('done');

process.stdout.write(JSON.stringify({ decision: 'allow' }));
