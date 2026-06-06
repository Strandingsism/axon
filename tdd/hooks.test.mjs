import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

test('SessionStart inject-context hook works without PLUGIN_ROOT', () => {
  const env = { ...process.env };
  delete env.PLUGIN_ROOT;

  const result = spawnSync(process.execPath, ['plugins/axon/hooks/inject-context.mjs'], {
    cwd: process.cwd(),
    env,
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(payload.hookSpecificOutput.additionalContext, /Axon/);
});
