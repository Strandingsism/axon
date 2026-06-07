import {
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

  const eventsPath = `${run.runDir}/events.jsonl`;
  const summaryPath = run.summary;
  const prompt = `Axon history run finished.

Read \`${eventsPath}\` and write a detailed workflow summary to \`${summaryPath}\`.

The summary should include:
- Goal
- Skill Sequence
- What Happened
- User Workflow Signals
- Artifacts or files worth remembering
- Follow-up

Use the event log as evidence. Do not invent events that are not present.`;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: prompt,
    },
  }));
} catch {
  exitOk();
}
