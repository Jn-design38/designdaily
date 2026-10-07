const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
console.log('Testing HTML files:', files);

let hasError = false;
files.forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  
  // Check image src
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1].split('?')[0].split('#')[0];
    if (src.startsWith('http') || src.startsWith('data:') || src === '') continue;
    if (!fs.existsSync(src)) {
      console.error(`ERROR in ${file}: image not found: "${src}"`);
      hasError = true;
    }
  }

  // Check link href
  const linkRegex = /<a[^>]+href=["']([^"']+)["']/g;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1].split('?')[0].split('#')[0];
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) continue;
    if (!fs.existsSync(href)) {
      console.error(`ERROR in ${file}: link target not found: "${href}"`);
      hasError = true;
    }
  }
});

if (!hasError) {
  console.log('SUCCESS: All HTML files passed asset and link verification!');
} else {
  process.exit(1);
}
