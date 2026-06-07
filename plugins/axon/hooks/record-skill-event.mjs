import {
  allow,
  normalizeSkillName,
  readHookPayload,
  recordSkillStarted,
} from './history-core.mjs';

try {
  const payload = await readHookPayload();
  const skill = normalizeSkillName(payload?.tool_input?.skill);

  if (payload?.tool_name === 'Skill' && skill) {
    recordSkillStarted(process.cwd(), skill);
  }

  allow();
} catch {
  allow();
}
