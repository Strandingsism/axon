import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildHudWatchCommand,
  findExistingHudPane,
  resolveMuxBinary,
  attachHud,
} from '../src/mux.mjs';

test('resolveMuxBinary prefers psmux on native Windows', () => {
  const found = new Set([
    'C:\\Tools\\psmux.exe',
    'C:\\Tools\\tmux.exe',
  ]);

  const resolved = resolveMuxBinary({
    platform: 'win32',
    pathValue: 'C:\\Tools',
    existsFile: (path) => found.has(path),
  });

  assert.equal(resolved, 'C:\\Tools\\psmux.exe');
});

test('buildHudWatchCommand marks the pane without tmux -e env injection', () => {
  const command = buildHudWatchCommand({
    nodePath: '/usr/bin/node',
    cliPath: '/repo/src/cli/axon.mjs',
  });

  assert.match(command, /^exec env AXON_HUD=1 /);
  assert.match(command, /'\/usr\/bin\/node' '\/repo\/src\/cli\/axon\.mjs' hud --watch$/);
  assert.doesNotMatch(command, / -e AXON_HUD=1 /);
});

test('findExistingHudPane detects Axon HUD watch panes', () => {
  const paneId = findExistingHudPane([
    { paneId: '%1', currentCommand: 'node', startCommand: "node other.mjs hud --watch" },
    { paneId: '%2', currentCommand: 'node', startCommand: "exec env AXON_HUD=1 node axon.mjs hud --watch" },
  ], '%1');

  assert.equal(paneId, '%2');
});

test('attachHud reuses an existing HUD pane', () => {
  const calls = [];
  const result = attachHud({
    cwd: '/repo',
    muxBinary: 'tmux',
    currentPaneId: '%1',
    execMux: (args) => {
      calls.push(args);
      if (args[0] === 'list-panes') {
        return "%1\tnode\tnode codex\n%2\tnode\texec env AXON_HUD=1 node axon.mjs hud --watch\n";
      }
      throw new Error(`unexpected call: ${args.join(' ')}`);
    },
  });

  assert.deepEqual(result, { status: 'reused', paneId: '%2', mux: 'tmux' });
  assert.equal(calls.some((args) => args[0] === 'split-window'), false);
});

test('attachHud creates a detached split pane when none exists', () => {
  const calls = [];
  const result = attachHud({
    cwd: '/repo',
    muxBinary: 'tmux',
    currentPaneId: '%1',
    nodePath: '/usr/bin/node',
    cliPath: '/repo/src/cli/axon.mjs',
    execMux: (args) => {
      calls.push(args);
      if (args[0] === 'list-panes') return "%1\tnode\tnode codex\n";
      if (args[0] === 'split-window') return '%3\n';
      throw new Error(`unexpected call: ${args.join(' ')}`);
    },
  });

  const split = calls.find((args) => args[0] === 'split-window');
  assert.deepEqual(result, { status: 'created', paneId: '%3', mux: 'tmux' });
  assert.deepEqual(split.slice(0, 8), ['split-window', '-v', '-l', '8', '-d', '-t', '%1', '-c']);
  assert.equal(split.at(-1), "exec env AXON_HUD=1 '/usr/bin/node' '/repo/src/cli/axon.mjs' hud --watch");
});
