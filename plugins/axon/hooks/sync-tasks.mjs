import { readFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';

// PostToolUse hook — after Write/Edit to tasks.json, check if all done.
// If all tasks are "done", inject a prompt telling the agent to ask the user about review.
// Never blocks. Only prompts.

const CWD = process.cwd();
const TASKS_FILE = resolve(CWD, 'docs', 'tasks.json');

// --- main ---

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

// Only care about Write or Edit on tasks.json
if (!payload || !['Write', 'Edit'].includes(payload.tool_name)) {
  process.stdout.write(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}

const filePath = payload.tool_input?.file_path || '';
if (basename(filePath) !== 'tasks.json') {
  process.stdout.write(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}

// Read tasks.json
let tasksObj;
try {
  if (!existsSync(TASKS_FILE)) {
    process.stdout.write(JSON.stringify({ decision: 'allow' }));
    process.exit(0);
  }
  tasksObj = JSON.parse(readFileSync(TASKS_FILE, 'utf-8'));
} catch {
  process.stdout.write(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}

if (!tasksObj.tasks?.length) {
  process.stdout.write(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}

// Check completion
const allDone = tasksObj.tasks.every(t => t.status === 'done');
if (!allDone) {
  process.stdout.write(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}

// All done — inject the review prompt
const prompt = `## ALL TASKS COMPLETE (injected by Axon)

\`docs/tasks.json\` shows all tasks are \`"done"\`.

**Ask the user now:**
> "All tasks complete. Proceed to review?"

Do NOT proceed to review without explicit user confirmation.`;

process.stdout.write(JSON.stringify({
  decision: 'allow',
  hookSpecificOutput: {
    hookEventName: 'PostToolUse',
    additionalContext: prompt,
  },
}));
