import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { AXON_SKILLS } from './history-core.mjs';
import { axonPath } from './axon-root.mjs';

const CONTEXT_SKILLS = AXON_SKILLS.filter(skill => !['brainstorm', 'dream'].includes(skill));

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
  const taskNote = tasksObj?.tasks?.length
    ? '\n- Reset project-root .axon/tasks.json to pending; mirror it in Codex tasks.'
    : '';

  return `Axon skill context: ${skillName}.
- Follow workflow.md when present; do not force a fixed Axon sequence.
- Treat .axon/... as project-root-relative.
- Keep project-root .axon/project-map.md and project-root .axon/interface-registry.md current when structure or public interfaces change.
- Keep TDD artifacts in tdd/ unless project conventions say otherwise.${taskNote}`;
}

export function prepareSkillContext(cwd, skillName) {
  if (!CONTEXT_SKILLS.includes(skillName)) return null;

  const tasksObj = skillName === 'implement' || skillName === 'execute'
    ? resetTasksJson(cwd)
    : null;

  return buildSkillPrompt(skillName, tasksObj);
}
