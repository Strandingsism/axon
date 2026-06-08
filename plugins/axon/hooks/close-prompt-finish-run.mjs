import {
  buildHistorySummaryPrompt,
  closeRunForPendingFinish,
  readHookPayload,
} from './history-core.mjs';

try {
  const payload = await readHookPayload();
  const cwd = payload?.cwd || process.cwd();
  const turnId = payload?.turn_id || payload?.turnId || null;
  const run = closeRunForPendingFinish(cwd, turnId);

  if (!run) {
    process.exit(0);
  }

  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: buildHistorySummaryPrompt(run),
  }));
} catch {
  process.exit(0);
}
