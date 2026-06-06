import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { delimiter, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_HUD_HEIGHT = 8;

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

export function buildHudWatchCommand(options = {}) {
  const nodePath = options.nodePath || process.execPath;
  const cliPath = options.cliPath || fileURLToPath(new URL('./cli/axon.mjs', import.meta.url));
  return `exec env AXON_HUD=1 ${shellEscapeSingle(nodePath)} ${shellEscapeSingle(cliPath)} hud --watch`;
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

function readCurrentPane(execMux) {
  try {
    return parsePaneId(execMux(['display-message', '-p', '#{pane_id}']));
  } catch {
    return process.env.TMUX_PANE || null;
  }
}

export function attachHud(options = {}) {
  const cwd = options.cwd || process.cwd();
  const muxBinary = options.muxBinary || resolveMuxBinary();
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
