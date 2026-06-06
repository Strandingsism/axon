import { runAutoAttachHud } from '../src/auto-attach.mjs';

runAutoAttachHud();

process.stdout.write(JSON.stringify({ decision: 'allow' }));
