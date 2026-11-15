import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const baseline = 'bafdfb5';
const roots = ['data/captions/', 'data/source-assisted-captions/', 'data/captune/', 'public/research/'];
const paths = execFileSync('git', ['ls-tree', '-r', '--name-only', baseline, '--', ...roots], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
for (const path of paths) {
  const expected = digest(execFileSync('git', ['show', `${baseline}:${path}`], { maxBuffer: 64 * 1024 * 1024 }));
  assert.equal(digest(readFileSync(path)), expected, `Protected data changed: ${path}`);
}
const changed = execFileSync('git', ['diff', '--name-only', baseline, '--', ...roots], { encoding: 'utf8' }).trim();
assert.equal(changed, '', `Protected tree changed: ${changed}`);
console.log(`Protected hashes match ${baseline}: ${paths.length} files.`);
