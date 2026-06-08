import { existsSync } from 'node:fs';
import { dirname, parse, resolve } from 'node:path';

function ancestorPaths(start) {
  const paths = [];
  let current = resolve(start || process.cwd());
  const root = parse(current).root;

  while (true) {
    paths.push(current);
    if (current === root) return paths;
    current = dirname(current);
  }
}

function nearestAncestor(start, names) {
  for (const dir of ancestorPaths(start)) {
    if (names.some(name => existsSync(resolve(dir, name)))) {
      return dir;
    }
  }
  return null;
}

export function resolveAxonRoot(cwd) {
  const start = resolve(cwd || process.cwd());

  return nearestAncestor(start, ['.git'])
    || nearestAncestor(start, ['workflow.md'])
    || nearestAncestor(start, ['.axon'])
    || start;
}

export function axonPath(cwd, ...segments) {
  return resolve(resolveAxonRoot(cwd), '.axon', ...segments);
}
