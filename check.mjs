import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = import.meta.dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
execFileSync(process.execPath, ['--check', path.join(root, 'script.js')]);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate section IDs');
for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
  assert(ids.includes(id), `Missing section: ${id}`);
}
for (const [, file] of html.matchAll(/(?:src|href)="((?:assets\/|styles\.css|script\.js)[^"]*)"/g)) {
  assert(fs.existsSync(path.join(root, file.split('?')[0])), `Missing local asset: ${file}`);
}
for (const [, file] of css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) {
  if (!/^(?:data:|https?:)/.test(file)) assert(fs.existsSync(path.join(root, file)), `Missing CSS asset: ${file}`);
}
console.log('PASS: JavaScript syntax, section links, unique IDs, and local assets.');
