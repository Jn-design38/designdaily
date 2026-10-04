import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = import.meta.dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const styles = [...html.matchAll(/href="([^"#]+\.css)"/g)].map(match => match[1]);
const css = styles.map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(match => match[1]);
for (const script of scripts) execFileSync(process.execPath, ['--check', path.join(root, script)]);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate section IDs');
for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
  assert(ids.includes(id), `Missing section: ${id}`);
}
for (const [, file] of html.matchAll(/(?:src|href)="((?:assets\/|styles\.css|script\.js)[^"]*)"/g)) {
  assert(fs.existsSync(path.join(root, file)), `Missing local asset: ${file}`);
}
for (const [, file] of css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) {
  if (!/^(?:data:|https?:)/.test(file)) assert(fs.existsSync(path.join(root, file)), `Missing CSS asset: ${file}`);
}
console.log('PASS: JavaScript syntax, section links, unique IDs, and local assets.');
const library = JSON.parse(fs.readFileSync(path.join(root, 'assets/design-library.json'), 'utf8'));
assert(library.length >= 50, 'Expected at least 50 designs');
assert.equal(new Set(library.map(asset => asset.id)).size, library.length, 'Duplicate artwork IDs');
for (const category of ['Branding', 'Packaging', 'Social', 'Website', 'Campaign']) {
  assert(library.some(asset => asset.category === category), `Missing discipline: ${category}`);
}
for (const asset of library) {
  assert(fs.existsSync(path.join(root, asset.src)), `Missing library artwork: ${asset.src}`);
  assert(asset.width > 0 && asset.height > 0 && asset.title && asset.description, `Incomplete artwork: ${asset.id}`);
}
console.log(`PASS: ${library.length} distinct artwork records across five disciplines.`);
