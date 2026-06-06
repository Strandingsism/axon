import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BAR_WIDTH = 10;

const STATUS_ICONS = {
  done: '✓',
  in_progress: '⟳',
  pending: '-',
  failed: '!',
  blocked: '!',
};

function readJson(path, fallback) {
  try {
    if (!existsSync(path)) return fallback;
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
}

function normalizeStatus(status) {
  const value = String(status || 'pending').trim().toLowerCase();
  if (value === 'done' || value === 'completed' || value === 'complete') return 'done';
  if (value === 'in_progress' || value === 'in-progress' || value === 'running' || value === 'active') return 'in_progress';
  if (value === 'failed' || value === 'error') return 'failed';
  if (value === 'blocked') return 'blocked';
  return 'pending';
}

function normalizeTasks(tasks) {
  const items = Array.isArray(tasks)
    ? tasks.map((task, index) => ({
        id: task?.id ?? index + 1,
        name: String(task?.name || task?.title || `Task ${index + 1}`),
        status: normalizeStatus(task?.status),
      }))
    : [];

  return {
    done: items.filter((task) => task.status === 'done').length,
    total: items.length,
    items,
  };
}

export function loadHudModel(cwd = process.cwd()) {
  const statePath = resolve(cwd, '.axon', 'state.json');
  const tasksPath = resolve(cwd, 'docs', 'tasks.json');

  const state = readJson(statePath, {});
  const tasks = readJson(tasksPath, {});

  return {
    state: String(state.state || 'idle'),
    updatedAt: state.updatedAt || null,
    tasks: normalizeTasks(tasks.tasks),
  };
}

export function renderProgress(done, total, width = BAR_WIDTH) {
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 0;
  const safeDone = Number.isFinite(done) && done > 0 ? Math.min(done, safeTotal) : 0;
  const filled = safeTotal === 0 ? 0 : Math.round((safeDone / safeTotal) * width);
  return `[${'#'.repeat(filled)}${'-'.repeat(width - filled)}]`;
}

export function renderHud(model) {
  const tasks = model?.tasks || { done: 0, total: 0, items: [] };
  const lines = [
    'Axon HUD',
    `State: ${model?.state || 'idle'}`,
    `Tasks: ${renderProgress(tasks.done, tasks.total)} ${tasks.done}/${tasks.total} done`,
  ];

  for (const [index, task] of tasks.items.entries()) {
    const id = task.id ?? index + 1;
    const label = `Task ${id}: ${task.name}`;
    const icon = STATUS_ICONS[task.status] || STATUS_ICONS.pending;
    lines.push(`${label.padEnd(34)} ${icon}`);
  }

  return `${lines.join('\n')}\n`;
}

export function renderHudJson(model) {
  return `${JSON.stringify(model, null, 2)}\n`;
}

export function watchHud(cwd = process.cwd(), options = {}) {
  const intervalMs = Number.isFinite(options.intervalMs) ? options.intervalMs : 1000;
  const render = () => {
    const model = loadHudModel(cwd);
    const output = options.json ? renderHudJson(model) : renderHud(model);
    process.stdout.write('\x1b[2J\x1b[H');
    process.stdout.write(output);
  };

  render();
  const timer = setInterval(render, intervalMs);
  process.on('SIGINT', () => {
    clearInterval(timer);
    process.stdout.write('\n');
    process.exit(0);
  });
}
