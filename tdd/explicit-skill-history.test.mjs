import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';

import {
  closeRunForPendingFinish,
  extractExplicitAxonSkills,
  recordExplicitPromptSkills,
} from '../plugins/axon/hooks/history-core.mjs';
import { prepareSkillContext } from '../plugins/axon/hooks/skill-context-core.mjs';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function readEvents(cwd, runDir) {
  return readFileSync(resolve(cwd, runDir, 'events.jsonl'), 'utf-8')
    .trim()
    .split('\n')
    .map(line => JSON.parse(line));
}

test('extracts explicit axon skill references from user prompts', () => {
  const prompt = 'Use $axon:brainstorm, then $axon:tdd. Ignore $foo:bar and $axon:missing.';

  assert.deepEqual(extractExplicitAxonSkills(prompt), ['brainstorm', 'tdd']);
});

test('records explicit prompt skill events and closes finish at stop', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'axon-history-'));

  try {
    const result = recordExplicitPromptSkills(cwd, '$axon:brainstorm then $axon:finish', {
      turnId: 'turn-1',
    });

    assert.deepEqual(result.skills, ['brainstorm', 'finish']);

    const activeBeforeStop = readJson(resolve(cwd, '.axon', 'history', 'active.json'));
    assert.equal(activeBeforeStop.status, 'open');
    assert.equal(activeBeforeStop.pendingFinishTurnId, 'turn-1');

    const closed = closeRunForPendingFinish(cwd, 'turn-1');

    assert.equal(closed.status, 'closed');

    const activeAfterStop = readJson(resolve(cwd, '.axon', 'history', 'active.json'));
    assert.equal(activeAfterStop.status, 'closed');

    const events = readEvents(cwd, closed.runDir);
    assert.deepEqual(events.map(event => event.event), [
      'run_started',
      'skill_started',
      'skill_started',
      'run_finished',
      'history_summary_requested',
    ]);
    assert.equal(events[1].skill, 'brainstorm');
    assert.equal(events[1].invocation, 'explicit_prompt');
    assert.equal(events[2].skill, 'finish');
    assert.equal(events[2].turnId, 'turn-1');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('does not close a pending finish run from a different turn', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'axon-history-'));

  try {
    recordExplicitPromptSkills(cwd, '$axon:finish', { turnId: 'turn-1' });

    const closed = closeRunForPendingFinish(cwd, 'turn-2');
    const active = readJson(resolve(cwd, '.axon', 'history', 'active.json'));

    assert.equal(closed, null);
    assert.equal(active.status, 'open');
    assert.equal(active.pendingFinishTurnId, 'turn-1');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test('prepares prompt skill context and resets tasks for explicit execute', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'axon-history-'));

  try {
    const tasksDir = resolve(cwd, '.axon');
    const tasksPath = resolve(tasksDir, 'tasks.json');
    mkdirSync(tasksDir, { recursive: true });
    writeFileSync(tasksPath, JSON.stringify({
      tasks: [
        { title: 'one', status: 'done' },
        { title: 'two', status: 'in_progress' },
      ],
    }));

    const context = prepareSkillContext(cwd, 'execute');
    const tasks = readJson(tasksPath);

    assert.match(context, /Axon skill gate: execute/);
    assert.deepEqual(tasks.tasks.map(task => task.status), ['pending', 'pending']);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
