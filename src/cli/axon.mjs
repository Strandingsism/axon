#!/usr/bin/env node
import { loadHudModel, renderHud, renderHudJson, watchHud } from '../hud.mjs';
import { attachHud } from '../mux.mjs';

function printHelp() {
  process.stdout.write(`Axon

Usage:
  axon hud          Show current HUD once
  axon hud --watch  Refresh HUD every second
  axon hud --json   Print HUD state as JSON
  axon hud attach   Open HUD in a tmux-compatible pane
`);
}

function run(argv) {
  const [command, ...flags] = argv;
  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return 0;
  }

  if (command !== 'hud') {
    process.stderr.write(`Unknown command: ${command}\n`);
    printHelp();
    return 1;
  }

  if (flags[0] === 'attach') {
    const result = attachHud();
    if (result.status === 'unavailable') {
      process.stderr.write('No tmux-compatible mux found. Install psmux on Windows or run inside cmux/tmux.\n');
      process.stdout.write(renderHud(loadHudModel(process.cwd())));
      return 1;
    }
    if (result.status === 'failed') {
      process.stderr.write(`Failed to attach Axon HUD with ${result.mux}.\n`);
      return 1;
    }
    process.stdout.write(`Axon HUD ${result.status} in pane ${result.paneId} via ${result.mux}\n`);
    return 0;
  }

  const json = flags.includes('--json');
  if (flags.includes('--watch')) {
    watchHud(process.cwd(), { json });
    return 0;
  }

  const model = loadHudModel(process.cwd());
  process.stdout.write(json ? renderHudJson(model) : renderHud(model));
  return 0;
}

const exitCode = run(process.argv.slice(2));
if (exitCode !== 0) process.exit(exitCode);
