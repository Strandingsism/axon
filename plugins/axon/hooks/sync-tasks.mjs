import { readFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';

// PostToolUse hook — after Write/Edit to tasks.json, check if all done.
// If all tasks are "done", inject a prompt telling the agent to ask the user about review.
// Never blocks. Only prompts.

const CWD = process.cwd();
const TASKS_FILE = resolve(CWD, 'docs', 'tasks.json');

// --- main ---

function exitOk() {
  process.exit(0);
}

process.on('uncaughtException', exitOk);
process.on('unhandledRejection', exitOk);

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
  exitOk();
}

const filePath = payload.tool_input?.file_path || '';
if (basename(filePath) !== 'tasks.json') {
  exitOk();
}

// Read tasks.json
let tasksObj;
try {
  if (!existsSync(TASKS_FILE)) {
    exitOk();
  }
  tasksObj = JSON.parse(readFileSync(TASKS_FILE, 'utf-8'));
} catch {
  exitOk();
}

if (!tasksObj.tasks?.length) {
  exitOk();
}

// Check completion
const allDone = tasksObj.tasks.every(t => t.status === 'done');
if (!allDone) {
  exitOk();
}

// All done — inject the review prompt
const prompt = `## ALL TASKS COMPLETE (injected by Axon)

\`docs/tasks.json\` shows all tasks are \`"done"\`.

**Ask the user now:**
> "All tasks complete. Proceed to review?"

Do NOT proceed to review without explicit user confirmation.`;

process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PostToolUse',
    additionalContext: prompt,
  },
}));
