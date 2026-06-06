import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { attachHud } from './mux.mjs';

const DISABLED_VALUES = new Set(['0', 'false', 'off', 'no']);
const NON_INTERACTIVE_VALUES = new Set(['1', 'true', 'yes']);

function normalize(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function shouldAutoAttachHud(options = {}) {
  const env = options.env || process.env;
  if (DISABLED_VALUES.has(normalize(env.AXON_HUD_AUTO_ATTACH))) return false;
  if (NON_INTERACTIVE_VALUES.has(normalize(env.CODEX_NON_INTERACTIVE))) return false;
  if (NON_INTERACTIVE_VALUES.has(normalize(env.CI))) return false;
  return true;
}

function recordHudResult(cwd, result) {
  try {
    const dir = resolve(cwd, '.axon');
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'hud.json'), JSON.stringify({
      ...result,
      updatedAt: new Date().toISOString(),
    }, null, 2));
  } catch {
    // HUD attach is best-effort. Recording failure must not affect startup.
  }
}

export function runAutoAttachHud(options = {}) {
  const env = options.env || process.env;
  const cwd = options.cwd || process.cwd();
  const attach = options.attach || attachHud;

  if (!shouldAutoAttachHud({ env })) {
    return { status: 'skipped', reason: 'disabled' };
  }

  try {
    const result = attach({ cwd });
    recordHudResult(cwd, result);
    return result;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const result = { status: 'failed', reason };
    recordHudResult(cwd, result);
    return result;
  }
}
