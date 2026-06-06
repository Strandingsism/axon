import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { loadHudModel, renderHud } from '../src/hud.mjs';

async function makeWorkspace(files) {
  const root = await mkdir(join(tmpdir(), `axon-hud-${Date.now()}-${Math.random().toString(16).slice(2)}`), { recursive: true });
  for (const [path, content] of Object.entries(files)) {
    const abs = join(root, path);
    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, content, 'utf8');
  }
  return root;
}

test('loadHudModel reads Axon state and task progress', async () => {
  const cwd = await makeWorkspace({
    '.axon/state.json': JSON.stringify({ state: 'implementing', updatedAt: '2026-06-06T10:00:00.000Z' }),
    'docs/tasks.json': JSON.stringify({
      tasks: [
        { id: 1, name: 'Write TokenStore', status: 'done' },
        { id: 2, name: 'Integrate login', status: 'done' },
        { id: 3, name: 'Write docs', status: 'in_progress' },
      ],
    }),
  });

  const model = loadHudModel(cwd);

  assert.equal(model.state, 'implementing');
  assert.equal(model.updatedAt, '2026-06-06T10:00:00.000Z');
  assert.equal(model.tasks.done, 2);
  assert.equal(model.tasks.total, 3);
  assert.deepEqual(model.tasks.items.map((task) => task.status), ['done', 'done', 'in_progress']);
});

test('renderHud shows compact state and task status lines', () => {
  const output = renderHud({
    state: 'implementing',
    updatedAt: '2026-06-06T10:00:00.000Z',
    tasks: {
      done: 3,
      total: 4,
      items: [
        { id: 1, name: 'Write TokenStore', status: 'done' },
        { id: 2, name: 'Integrate login', status: 'done' },
        { id: 3, name: 'Add error handling', status: 'done' },
        { id: 4, name: 'Write docs', status: 'in_progress' },
      ],
    },
  });

  assert.match(output, /^Axon HUD/m);
  assert.match(output, /State: implementing/);
  assert.match(output, /Tasks: \[########--\] 3\/4 done/);
  assert.match(output, /Task 1: Write TokenStore\s+✓/);
  assert.match(output, /Task 4: Write docs\s+⟳/);
});
