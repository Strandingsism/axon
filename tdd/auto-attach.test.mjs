import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { runAutoAttachHud, shouldAutoAttachHud } from '../src/auto-attach.mjs';

async function makeTempCwd() {
  return mkdtemp(join(tmpdir(), 'axon-auto-attach-'));
}

test('shouldAutoAttachHud defaults on for interactive Codex sessions', () => {
  assert.equal(shouldAutoAttachHud({ env: {} }), true);
});

test('shouldAutoAttachHud can be disabled with AXON_HUD_AUTO_ATTACH=0', () => {
  assert.equal(shouldAutoAttachHud({ env: { AXON_HUD_AUTO_ATTACH: '0' } }), false);
  assert.equal(shouldAutoAttachHud({ env: { AXON_HUD_AUTO_ATTACH: 'false' } }), false);
  assert.equal(shouldAutoAttachHud({ env: { AXON_HUD_AUTO_ATTACH: 'off' } }), false);
});

test('shouldAutoAttachHud skips non-interactive Codex runs', () => {
  assert.equal(shouldAutoAttachHud({ env: { CODEX_NON_INTERACTIVE: '1' } }), false);
});

test('runAutoAttachHud returns skipped when disabled', () => {
  const result = runAutoAttachHud({
    env: { AXON_HUD_AUTO_ATTACH: '0' },
    attach: () => {
      throw new Error('should not attach');
    },
  });

  assert.deepEqual(result, { status: 'skipped', reason: 'disabled' });
});

test('runAutoAttachHud suppresses attach failures', async () => {
  const result = runAutoAttachHud({
    env: {},
    cwd: await makeTempCwd(),
    attach: () => {
      throw new Error('mux exploded');
    },
  });

  assert.deepEqual(result, { status: 'failed', reason: 'mux exploded' });
});

test('runAutoAttachHud forwards attach result when available', async () => {
  const result = runAutoAttachHud({
    env: {},
    cwd: await makeTempCwd(),
    attach: () => ({ status: 'created', paneId: '%3', mux: 'tmux' }),
  });

  assert.deepEqual(result, { status: 'created', paneId: '%3', mux: 'tmux' });
});
