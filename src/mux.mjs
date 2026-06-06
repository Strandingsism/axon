import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { delimiter, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_HUD_HEIGHT = 8;
const DEFAULT_SESSION_PREFIX = 'axon';

function existsFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function windowsCommandCandidates(command) {
  const extension = extname(command);
  if (extension) return [command];
  return ['.exe', '.com', '.cmd', '.bat', ''].map((ext) => `${command}${ext}`);
}

function resolveFromPath(command, pathValue, existsFileImpl, platform = process.platform) {
  const entries = String(pathValue || '')
    .split(delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const entry of entries) {
    const candidates = platform === 'win32'
      ? windowsCommandCandidates(command).map((candidate) => join(entry, candidate))
      : [join(entry, command)];
    for (const candidate of candidates) {
      if (existsFileImpl(candidate)) return candidate;
    }
  }
  return null;
}

export function resolveMuxBinary(options = {}) {
  const platform = options.platform || process.platform;
  const pathValue = options.pathValue ?? process.env.Path ?? process.env.PATH ?? '';
  const existsFileImpl = options.existsFile || existsFile;

  if (platform === 'win32') {
    return (
      resolveFromPath('psmux', pathValue, existsFileImpl, platform)
      || resolveFromPath('tmux', pathValue, existsFileImpl, platform)
    );
  }

  // cmux exposes tmux compatibility through a tmux shim, so the adapter uses
  // tmux-compatible commands instead of calling cmux-specific internals.
  return resolveFromPath('tmux', pathValue, existsFileImpl, platform) || (existsSync('/usr/bin/tmux') ? '/usr/bin/tmux' : null);
}

export function shellEscapeSingle(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function shellEscapeToken(value) {
  const text = String(value);
  return /^[A-Za-z0-9_./:@%+=,-]+$/.test(text) ? text : shellEscapeSingle(text);
}

export function buildHudWatchCommand(options = {}) {
  const nodePath = options.nodePath || process.execPath;
  const cliPath = options.cliPath || fileURLToPath(new URL('./cli/axon.mjs', import.meta.url));
  return `exec env AXON_HUD=1 ${shellEscapeSingle(nodePath)} ${shellEscapeSingle(cliPath)} hud --watch`;
}

export function buildCodexCommand(options = {}) {
  const codexCommand = options.codexCommand || 'codex';
  const codexArgs = Array.isArray(options.codexArgs) ? options.codexArgs : [];
  return [codexCommand, ...codexArgs].map(shellEscapeToken).join(' ');
}

export function parsePaneSnapshot(output) {
  return String(output || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [paneId = '', currentCommand = '', ...rest] = line.split('\t');
      return {
        paneId: paneId.trim(),
        currentCommand: currentCommand.trim(),
        startCommand: rest.join('\t').trim(),
      };
    })
    .filter((pane) => pane.paneId.startsWith('%'));
}

export function isAxonHudPane(pane) {
  const command = `${pane?.startCommand || ''} ${pane?.currentCommand || ''}`;
  return /\bAXON_HUD=1\b/.test(command) && /\bhud\b/.test(command) && /--watch\b/.test(command);
}

export function findExistingHudPane(panes, currentPaneId) {
  return (Array.isArray(panes) ? panes : [])
    .filter((pane) => pane.paneId !== currentPaneId)
    .find(isAxonHudPane)?.paneId || null;
}

function parsePaneId(output) {
  const paneId = String(output || '').split('\n')[0]?.trim() || '';
  return paneId.startsWith('%') ? paneId : null;
}

function defaultExecMux(muxBinary) {
  return (args) => execFileSync(muxBinary, args, {
    encoding: 'utf8',
    ...(process.platform === 'win32' ? { windowsHide: true } : {}),
  });
}

function defaultAttachMux(muxBinary) {
  return (args) => spawnSync(muxBinary, args, {
    stdio: 'inherit',
    ...(process.platform === 'win32' ? { windowsHide: false } : {}),
  });
}

function readCurrentPane(execMux) {
  try {
    return parsePaneId(execMux(['display-message', '-p', '#{pane_id}']));
  } catch {
    return process.env.TMUX_PANE || null;
  }
}

export function attachHud(options = {}) {
  const cwd = options.cwd || process.cwd();
  const muxBinary = Object.hasOwn(options, 'muxBinary') ? options.muxBinary : resolveMuxBinary();
  if (!muxBinary) return { status: 'unavailable', paneId: null, mux: null };

  const execMux = options.execMux || defaultExecMux(muxBinary);
  const currentPaneId = options.currentPaneId || readCurrentPane(execMux);
  const paneOutput = execMux([
    'list-panes',
    '-F',
    '#{pane_id}\t#{pane_current_command}\t#{pane_start_command}',
  ]);
  const existing = findExistingHudPane(parsePaneSnapshot(paneOutput), currentPaneId);
  if (existing) return { status: 'reused', paneId: existing, mux: muxBinary };

  const height = Number.isFinite(options.heightLines) && options.heightLines > 0
    ? Math.floor(options.heightLines)
    : DEFAULT_HUD_HEIGHT;
  const hudCommand = buildHudWatchCommand({
    nodePath: options.nodePath,
    cliPath: options.cliPath,
  });
  const splitArgs = [
    'split-window',
    '-v',
    '-l',
    String(height),
    '-d',
    ...(currentPaneId ? ['-t', currentPaneId] : []),
    '-c',
    cwd,
    '-P',
    '-F',
    '#{pane_id}',
    hudCommand,
  ];

  const paneId = parsePaneId(execMux(splitArgs));
  return paneId
    ? { status: 'created', paneId, mux: muxBinary }
    : { status: 'failed', paneId: null, mux: muxBinary };
}

export function buildSessionName(options = {}) {
  const prefix = options.prefix || DEFAULT_SESSION_PREFIX;
  const suffix = options.suffix || `${Date.now()}-${process.pid}`;
  return `${prefix}-${suffix}`.replace(/[^A-Za-z0-9_.-]/g, '-');
}

export function launchCodexWorkspace(options = {}) {
  const cwd = options.cwd || process.cwd();
  const muxBinary = Object.hasOwn(options, 'muxBinary') ? options.muxBinary : resolveMuxBinary();
  if (!muxBinary) return { status: 'unavailable', sessionName: null, mux: null, exitCode: 1 };

  const execMux = options.execMux || defaultExecMux(muxBinary);
  const attachMux = options.attachMux || defaultAttachMux(muxBinary);
  const sessionName = options.sessionName || buildSessionName(options);
  const codexCommand = buildCodexCommand({
    codexCommand: options.codexCommand,
    codexArgs: options.codexArgs,
  });
  const hudCommand = buildHudWatchCommand({
    nodePath: options.nodePath,
    cliPath: options.cliPath,
  });

  try {
    execMux(['new-session', '-d', '-s', sessionName, '-c', cwd, codexCommand]);
    execMux(['split-window', '-h', '-t', sessionName, '-c', cwd, hudCommand]);
    execMux(['select-pane', '-t', `${sessionName}:0.0`]);

    if (options.attach === false) {
      return { status: 'created', sessionName, mux: muxBinary, exitCode: 0 };
    }

    const attached = attachMux(['attach-session', '-t', sessionName]);
    const exitCode = attached.status ?? 0;
    return {
      status: exitCode === 0 ? 'attached' : 'failed',
      sessionName,
      mux: muxBinary,
      exitCode,
    };
  } catch (error) {
    return {
      status: 'failed',
      sessionName,
      mux: muxBinary,
      exitCode: 1,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
