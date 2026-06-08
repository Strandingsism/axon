import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const GATED_SKILLS = ['implement', 'execute', 'review', 'finish'];

function tasksPath(cwd) {
  return resolve(cwd, '.axon', 'tasks.json');
}

export function resetTasksJson(cwd) {
  const path = tasksPath(cwd);

  if (!existsSync(path)) return null;

  const obj = JSON.parse(readFileSync(path, 'utf-8'));
  if (!Array.isArray(obj.tasks)) return null;

  obj.tasks.forEach(task => task.status = 'pending');
  writeFileSync(path, JSON.stringify(obj, null, 2));
  return obj;
}

export function buildSkillPrompt(skillName, tasksObj) {
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
- Verify before claiming completion.`;
}

export function prepareSkillContext(cwd, skillName) {
  if (!GATED_SKILLS.includes(skillName)) return null;

  const tasksObj = skillName === 'implement' || skillName === 'execute'
    ? resetTasksJson(cwd)
    : null;

  return buildSkillPrompt(skillName, tasksObj);
}
