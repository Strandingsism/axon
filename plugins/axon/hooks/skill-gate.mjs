import { prepareSkillContext } from './skill-context-core.mjs';

// PreToolUse hook — orientation prompt + tasks.json reset.
// Never blocks. Only on Skill("implement") | Skill("execute") | Skill("review") | Skill("finish").

function readStdin() {
  return new Promise((resolvePayload) => {
    let data = '';
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => {
      try {
        resolvePayload(JSON.parse(data));
      } catch {
        resolvePayload(null);
      }
    });
  });
}

const payload = await readStdin();

if (!payload || payload.tool_name !== 'Skill') {
  process.stdout.write(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}

const skillName = payload.tool_input?.skill;
const additionalContext = prepareSkillContext(process.cwd(), skillName);
if (!additionalContext) {
  process.stdout.write(JSON.stringify({ decision: 'allow' }));
  process.exit(0);
}

process.stdout.write(JSON.stringify({
  decision: 'allow',
  hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext },
}));
