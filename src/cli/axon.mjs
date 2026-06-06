#!/usr/bin/env node
import { loadHudModel, renderHud, renderHudJson, watchHud } from '../hud.mjs';

function printHelp() {
  process.stdout.write(`Axon

Usage:
  axon hud          Show current HUD once
  axon hud --watch  Refresh HUD every second
  axon hud --json   Print HUD state as JSON
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
