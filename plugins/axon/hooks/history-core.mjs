import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';

export const AXON_SKILLS = [
  'dream',
  'brainstorm',
  'write-plan',
  'implement',
  'execute',
  'tdd',
  'debug',
  'review',
  'finish',
  'verify',
  'create-hook',
];

export function normalizeSkillName(value) {
  if (typeof value !== 'string') return null;
  const skill = value.startsWith('axon:') ? value.slice('axon:'.length) : value;
  return AXON_SKILLS.includes(skill) ? skill : null;
}

export function readHookPayload() {
  return new Promise((resolvePayload) => {
    let data = '';
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => {
      try {
        resolvePayload(JSON.parse(data));
      } catch {
        resolvePayload(null);
      }
    });
  });
}

export function allow() {
  process.stdout.write(JSON.stringify({ decision: 'allow' }));
}

function nowIso() {
  return new Date().toISOString();
}

function localDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function historyRoot(cwd) {
  return resolve(cwd, '.axon', 'history');
}

function activePath(cwd) {
  return resolve(historyRoot(cwd), 'active.json');
}

function indexPath(cwd) {
  return resolve(historyRoot(cwd), 'index.json');
}

function runDirRelative(runId) {
  return `.axon/history/runs/${runId}`;
}

function runDirAbsolute(cwd, runId) {
  return resolve(cwd, runDirRelative(runId));
}

function ensureHistoryRoot(cwd) {
  mkdirSync(resolve(historyRoot(cwd), 'runs'), { recursive: true });
}

function readJson(path, defaultValue) {
  if (!existsSync(path)) return defaultValue;
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function readIndex(cwd) {
  const index = readJson(indexPath(cwd), { runs: [] });
  if (!Array.isArray(index.runs)) return { runs: [] };
  return index;
}

function readActive(cwd) {
  const active = readJson(activePath(cwd), null);
  if (!active || active.status !== 'open' || !active.runId || !active.runDir) return null;
  return active;
}

function nextRunId(index) {
  const date = localDate();
  const count = index.runs.filter(run => String(run.runId || '').startsWith(`${date}-`)).length;
  return `${date}-${String(count + 1).padStart(3, '0')}`;
}

function appendEvent(cwd, run, event) {
  const entry = {
    ts: nowIso(),
    runId: run.runId,
    ...event,
  };
  appendFileSync(resolve(cwd, run.runDir, 'events.jsonl'), `${JSON.stringify(entry)}\n`);
  return entry.ts;
}

function updateIndexRun(cwd, runId, patch) {
  const index = readIndex(cwd);
  index.runs = index.runs.map(run => (
    run.runId === runId ? { ...run, ...patch } : run
  ));
  writeJson(indexPath(cwd), index);
}

function createRun(cwd, skill) {
  ensureHistoryRoot(cwd);
  const index = readIndex(cwd);
  const runId = nextRunId(index);
  const runDir = runDirRelative(runId);
  const startedAt = nowIso();
  const run = {
    runId,
    runDir,
    startedAt,
    lastEventAt: startedAt,
    status: 'open',
  };

  mkdirSync(runDirAbsolute(cwd, runId), { recursive: true });
  index.runs.push({
    runId,
    startedAt,
    finishedAt: null,
    status: 'open',
    summary: `${runDir}/summary.md`,
  });
  writeJson(indexPath(cwd), index);
  writeJson(activePath(cwd), run);
  appendEvent(cwd, run, { event: 'run_started', skill });
  return run;
}

export function recordSkillStarted(cwd, skill) {
  const run = readActive(cwd) || createRun(cwd, skill);
  const lastEventAt = appendEvent(cwd, run, { event: 'skill_started', skill });
  const next = { ...run, lastEventAt, status: 'open' };
  writeJson(activePath(cwd), next);
  updateIndexRun(cwd, run.runId, { status: 'open' });
  return next;
}

export function closeRunForFinish(cwd, skill) {
  const run = readActive(cwd);
  if (!run) return null;

  appendEvent(cwd, run, { event: 'run_finished', skill });
  const finishedAt = appendEvent(cwd, run, { event: 'history_summary_requested', skill });
  const closed = { ...run, lastEventAt: finishedAt, finishedAt, status: 'closed' };
  const summary = `${run.runDir}/summary.md`;

  writeJson(activePath(cwd), closed);
  updateIndexRun(cwd, run.runId, {
    finishedAt,
    status: 'closed',
    summary,
  });

  return { ...closed, summary };
}
