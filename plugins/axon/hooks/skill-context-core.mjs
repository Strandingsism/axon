import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { axonPath } from './axon-root.mjs';

const GATED_SKILLS = ['implement', 'execute', 'review', 'finish'];

function tasksPath(cwd) {
  return axonPath(cwd, 'tasks.json');
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
    ? '\n- The project-root .axon/tasks.json has been reset to pending; read it and mirror those tasks in the Codex task system.'
    : '';

  return `Axon skill context: ${skillName} (${mode}).

Before using this skill:
- Re-check AGENTS.md and relevant docs if the task context is unclear.
- If workflow.md exists, follow its planning, confirmation, verification, and reporting preferences.
- Treat all .axon/... paths as project-root-relative, not current-subdirectory-relative.
- Use .axon/project-map.md for project orientation if it exists or workflow.md requires it.
- Use .axon/interface-registry.md for public interfaces if it exists or workflow.md requires it.
- Use .axon/tasks.json for task progress if it exists.
- Keep TDD coupled to implementation; default new TDD artifacts to tdd/.${taskNote}
- Do not force a fixed Axon lifecycle when the user has defined a different workflow.
- Verify before claiming completion.`;
}

export function prepareSkillContext(cwd, skillName) {
  if (!GATED_SKILLS.includes(skillName)) return null;

  const tasksObj = skillName === 'implement' || skillName === 'execute'
    ? resetTasksJson(cwd)
    : null;

  return buildSkillPrompt(skillName, tasksObj);
}
