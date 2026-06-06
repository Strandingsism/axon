import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCodexCommand,
  buildHudWatchCommand,
  buildSessionName,
  findExistingHudPane,
  resolveMuxBinary,
  attachHud,
  launchCodexWorkspace,
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

test('resolveMuxBinary accepts psmux pmux alias on native Windows', () => {
  const found = new Set(['C:\\Tools\\pmux.exe']);

  const resolved = resolveMuxBinary({
    platform: 'win32',
    pathValue: 'C:\\Tools',
    existsFile: (path) => found.has(path),
  });

  assert.equal(resolved, 'C:\\Tools\\pmux.exe');
});

test('buildHudWatchCommand marks the pane without tmux -e env injection', () => {
  const command = buildHudWatchCommand({
    platform: 'linux',
    nodePath: '/usr/bin/node',
    cliPath: '/repo/src/cli/axon.mjs',
  });

  assert.match(command, /^exec env AXON_HUD=1 /);
  assert.match(command, /'\/usr\/bin\/node' '\/repo\/src\/cli\/axon\.mjs' hud --watch$/);
  assert.doesNotMatch(command, / -e AXON_HUD=1 /);
});

test('buildHudWatchCommand uses PowerShell on Windows for psmux', () => {
  const command = buildHudWatchCommand({
    platform: 'win32',
    nodePath: 'D:\\Dev\\nodejs\\node.exe',
    cliPath: 'D:\\Reaserch\\Axon\\axon\\src\\cli\\axon.mjs',
  });

  assert.match(command, /^powershell\.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command /);
  assert.match(command, /\$env:AXON_HUD='1'/);
  assert.match(command, /'D:\\Dev\\nodejs\\node\.exe' 'D:\\Reaserch\\Axon\\axon\\src\\cli\\axon\.mjs' hud --watch/);
});

test('buildCodexCommand forwards codex arguments', () => {
  const command = buildCodexCommand({
    platform: 'linux',
    codexCommand: 'codex',
    codexArgs: ['--model', 'gpt-5'],
  });

  assert.equal(command, 'codex --model gpt-5');
});

test('buildCodexCommand uses PowerShell on Windows for psmux', () => {
  const command = buildCodexCommand({
    platform: 'win32',
    codexCommand: 'codex',
    codexArgs: ['--model', 'gpt-5'],
  });

  assert.equal(command, 'powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "& \'codex\' \'--model\' \'gpt-5\'"');
});

test('buildSessionName keeps tmux-safe characters', () => {
  assert.equal(buildSessionName({ prefix: 'axon dev', suffix: 'test:1' }), 'axon-dev-test-1');
});

test('findExistingHudPane detects Axon HUD watch panes', () => {
  const paneId = findExistingHudPane([
    { paneId: '%1', currentCommand: 'node', startCommand: "node other.mjs hud --watch" },
    { paneId: '%2', currentCommand: 'node', startCommand: "powershell.exe -Command \"$env:AXON_HUD='1'; node axon.mjs hud --watch\"" },
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
    platform: 'linux',
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

test('launchCodexWorkspace creates codex and HUD panes before attach', () => {
  const calls = [];
  const result = launchCodexWorkspace({
    cwd: '/repo',
    platform: 'linux',
    muxBinary: 'tmux',
    sessionName: 'axon-test',
    nodePath: '/usr/bin/node',
    cliPath: '/repo/src/cli/axon.mjs',
    codexArgs: ['--model', 'gpt-5'],
    execMux: (args) => {
      calls.push(args);
      return '';
    },
    attachMux: (args) => {
      calls.push(args);
      return { status: 0 };
    },
  });

  assert.deepEqual(result, { status: 'attached', sessionName: 'axon-test', mux: 'tmux', exitCode: 0 });
  assert.deepEqual(calls[0], ['new-session', '-d', '-s', 'axon-test', '-c', '/repo', 'codex --model gpt-5']);
  assert.deepEqual(calls[1], [
    'split-window',
    '-v',
    '-p',
    '20',
    '-t',
    'axon-test',
    '-c',
    '/repo',
    "exec env AXON_HUD=1 '/usr/bin/node' '/repo/src/cli/axon.mjs' hud --watch",
  ]);
  assert.deepEqual(calls[2], ['select-pane', '-t', 'axon-test:0.0']);
  assert.deepEqual(calls[3], ['attach-session', '-t', 'axon-test']);
});

test('launchCodexWorkspace uses psmux-compatible PowerShell commands on Windows', () => {
  const calls = [];
  const result = launchCodexWorkspace({
    platform: 'win32',
    cwd: 'D:\\repo',
    muxBinary: 'psmux',
    sessionName: 'axon-test',
    nodePath: 'D:\\Dev\\nodejs\\node.exe',
    cliPath: 'D:\\repo\\src\\cli\\axon.mjs',
    execMux: (args) => {
      calls.push(args);
      return '';
    },
    attachMux: (args) => {
      calls.push(args);
      return { status: 0 };
    },
  });

  assert.deepEqual(result, { status: 'attached', sessionName: 'axon-test', mux: 'psmux', exitCode: 0 });
  assert.equal(calls[0][0], 'new-session');
  assert.match(calls[0].at(-1), /^powershell\.exe .*'codex'/);
  assert.deepEqual(calls[1].slice(0, 6), ['split-window', '-v', '-p', '20', '-t', 'axon-test']);
  assert.match(calls[1].at(-1), /\$env:AXON_HUD='1'/);
});

test('launchCodexWorkspace reports unavailable when no mux exists', () => {
  const result = launchCodexWorkspace({ muxBinary: null });

  assert.deepEqual(result, { status: 'unavailable', sessionName: null, mux: null, exitCode: 1 });
});
