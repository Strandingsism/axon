import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

function collectSkillFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) files.push(...collectSkillFiles(path));
    if (stat.isFile() && entry === 'SKILL.md') files.push(path);
  }
  return files;
}

test('all skill descriptions are quoted YAML scalars', () => {
  const files = collectSkillFiles('skills');
  assert.ok(files.length > 0, 'expected skill files');

  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    assert.ok(frontmatter, `${file} has frontmatter`);

    const description = frontmatter[1]
      .split(/\r?\n/)
      .find((line) => line.startsWith('description:'));
    assert.ok(description, `${file} has description`);
    assert.match(description, /^description:\s*"[^"]*"$/, `${file} description is double-quoted`);
  }
});
