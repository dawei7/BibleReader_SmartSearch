// Simple node script to rasterize SVG icons to PNGs (optional). Requires sharp.
// Usage: npm i -D sharp && node scripts/gen-icons.js
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const root = path.resolve(process.cwd(), 'public', 'icons');
const targets = [
  { src: 'icon.svg', out: 'icon-192.png', size: 192 },
  { src: 'icon.svg', out: 'icon-512.png', size: 512 },
  { src: 'maskable.svg', out: 'maskable-192.png', size: 192 },
  { src: 'maskable.svg', out: 'maskable-512.png', size: 512 },
];

(async () => {
  for (const t of targets) {
    const svg = fs.readFileSync(path.join(root, t.src));
    const out = path.join(root, t.out);
    await sharp(svg).resize(t.size, t.size).png({ quality: 90 }).toFile(out);
    console.log('Generated', out);
  }
})();
