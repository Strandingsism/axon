import {
  readHookPayload,
  recordExplicitPromptSkills,
} from './history-core.mjs';
import { prepareSkillContext } from './skill-context-core.mjs';

try {
  const payload = await readHookPayload();
  const prompt = payload?.prompt;
  const cwd = payload?.cwd || process.cwd();
  const turnId = payload?.turn_id || payload?.turnId || null;

  const result = recordExplicitPromptSkills(cwd, prompt, { turnId });
  const additionalContext = result.skills
    .map(skill => prepareSkillContext(cwd, skill))
    .filter(Boolean)
    .join('\n\n');

  if (additionalContext) {
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'UserPromptSubmit',
        additionalContext,
      },
    }));
  }
} catch {
  process.exit(0);
}
