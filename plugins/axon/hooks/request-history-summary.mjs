import {
  buildHistorySummaryPrompt,
  closeRunForFinish,
  normalizeSkillName,
  readHookPayload,
} from './history-core.mjs';

function exitOk() {
  process.exit(0);
}

try {
  const payload = await readHookPayload();
  const skill = normalizeSkillName(payload?.tool_input?.skill);

  if (payload?.tool_name !== 'Skill' || skill !== 'finish') {
    exitOk();
  }

  const run = closeRunForFinish(process.cwd(), skill);
  if (!run) {
    exitOk();
  }

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: buildHistorySummaryPrompt(run),
    },
  }));
} catch {
  exitOk();
}
