import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// PreToolUse hook — state recording + orientation prompt + tasks.json reset
// Never blocks. Only on Skill("implement") | Skill("execute") | Skill("review") | Skill("finish").

const AXON_SKILLS = ['implement', 'execute', 'review', 'finish'];
const CWD = process.cwd();
const STATE_FILE = resolve(CWD, '.axon', 'state.json');
const TASKS_FILE = resolve(CWD, '.axon', 'tasks.json');

// skill → state (one-way recording, no transition validation)
const STATE_MAP = {
  implement: 'implementing',
  execute:   'implementing',
  review:    'reviewing',
  finish:    'finishing',
};

// --- state helper ---

function saveState(state) {
  const dir = resolve(CWD, '.axon');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify({ state, updatedAt: new Date().toISOString() }, null, 2));
}

function loadStateBlock() {
  try {
    if (!existsSync(STATE_FILE)) return '';
    const stateJson = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
    return `\n\nCurrent Axon state:\n\`\`\`json\n${JSON.stringify(stateJson, null, 2)}\n\`\`\``;
  } catch {
    return '';
  }
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

function buildSkillPrompt(skillName, tasksObj) {
  const mode = skillName === 'implement' ? 'subagent-driven' : 'inline';
  const taskNote = tasksObj?.tasks?.length
    ? '\n- .axon/tasks.json has been reset to pending; read it and mirror those tasks in the Codex task system.'
    : '';

  return `Axon skill gate: ${skillName} (${mode}).

Before using this skill:
- Re-check AGENTS.md and relevant docs if the task context is unclear.
- Use .axon/project-map.md for project orientation.
- Use .axon/interface-registry.md for public interfaces and contracts.
- Use .axon/tasks.json for current task progress if it exists.
- Keep TDD coupled to implementation; default new TDD artifacts to tdd/.${taskNote}
- Verify before claiming completion.${loadStateBlock()}`;
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

// --- tasks.json (implement/execute only) ---
let tasksObj = null;
if (skillName === 'implement' || skillName === 'execute') {
  tasksObj = resetTasksJson();
}

const additionalContext = buildSkillPrompt(skillName, tasksObj);

process.stdout.write(JSON.stringify({
  decision: 'allow',
  hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext },
}));
