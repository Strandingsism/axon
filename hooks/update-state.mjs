import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// PreToolUse hook — state recording + doc injection + tasks.json reset
// Never blocks. Only on Skill("implement") | Skill("execute") | Skill("review") | Skill("finish").

const AXON_SKILLS = ['implement', 'execute', 'review', 'finish'];
const CWD = process.cwd();
const STATE_FILE = resolve(CWD, '.axon', 'state.json');
const TASKS_FILE = resolve(CWD, 'docs', 'tasks.json');

// skill → state (one-way recording, no transition validation)
const STATE_MAP = {
  implement: 'implementing',
  execute:   'implementing',
  review:    'reviewing',
  finish:    'finishing',
};

// skill → injected docs
const REQUIRED_DOCS = {
  implement: ['docs/interface-registry.md', 'docs/project-map.md'],
  execute:   ['docs/interface-registry.md', 'docs/project-map.md'],
  review:    ['docs/interface-registry.md', 'docs/project-map.md'],
  finish:    ['docs/project-map.md'],
};

// --- state helper ---

function saveState(state) {
  const dir = resolve(CWD, '.axon');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify({ state, updatedAt: new Date().toISOString() }, null, 2));
}

// --- doc helpers ---

function loadDoc(relPath) {
  try {
    const abs = resolve(CWD, relPath);
    if (!existsSync(abs)) return null;
    return readFileSync(abs, 'utf-8');
  } catch { return null; }
}

function buildDocBlock(path) {
  const content = loadDoc(path);
  if (!content) return null;
  const label = path === 'docs/interface-registry.md' ? 'INTERFACE REGISTRY' : 'PROJECT MAP';
  return `## ${label} (injected by Axon)\n${content}`;
}

// --- tasks.json helpers ---

function resetTasksJson() {
  try {
    if (!existsSync(TASKS_FILE)) return null;
    const obj = JSON.parse(readFileSync(TASKS_FILE, 'utf-8'));
    if (!obj.tasks) return null;
    obj.tasks.forEach(t => t.status = 'pending');
    writeFileSync(TASKS_FILE, JSON.stringify(obj, null, 2));
    return obj;
  } catch { return null; }
}

function buildTaskPrompt(skillName, tasksObj) {
  if (!tasksObj || !tasksObj.tasks?.length) return '';
  const names = tasksObj.tasks.map(t => `${t.id}. ${t.name}`).join('\n');
  const mode = skillName === 'implement' ? 'subagent-driven' : 'inline';
  return `## TASK SYNC (injected by Axon — ${skillName} / ${mode})

\`docs/tasks.json\` has been reset. All tasks are \`pending\`.

**You MUST:**
1. Create matching tasks in the Codex Task system from the list below
2. After completing each task, update its status in \`docs/tasks.json\` to \`"done"\`
3. When \`docs/tasks.json\` shows all tasks \`"done"\`, ask the user:
   > "All tasks complete. Proceed to review?"

**Task list:**
${names}`;
}

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

if (!payload || payload.tool_name !== 'Skill') {
  process.stdout.write(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}

const skillName = payload.tool_input?.skill;
if (!AXON_SKILLS.includes(skillName)) {
  process.stdout.write(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}

// --- state ---
const next = STATE_MAP[skillName];
if (next) saveState(next);

// --- docs ---
const docBlocks = (REQUIRED_DOCS[skillName] || [])
  .map(buildDocBlock)
  .filter(Boolean);

// --- tasks.json (implement/execute only) ---
let taskPrompt = '';
if (skillName === 'implement' || skillName === 'execute') {
  const tasksObj = resetTasksJson();
  taskPrompt = buildTaskPrompt(skillName, tasksObj);
}

const additionalContext = [...docBlocks, taskPrompt].filter(Boolean).join('\n\n---\n\n');

process.stdout.write(JSON.stringify({
  decision: 'allow',
  ...(additionalContext ? { hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext } } : {}),
}));
