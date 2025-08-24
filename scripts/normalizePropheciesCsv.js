#!/usr/bin/env node
/**
 * Normalize unicode punctuation in prophecies CSV to plain ASCII equivalents.
 * Replacements:
 *  – (en dash), — (em dash)  -> -
 *  ’ ‘ (curly single quotes) -> '
 *  “ ” (curly double quotes) -> "
 *  … (ellipsis)             -> ...
 *  → (right arrow)          -> ->
 *  Non‑breaking spaces / narrow no-break spaces -> regular space
 */
import fs from 'fs';
import path from 'path';

const target = process.argv[2] || 'public/prophecies.csv';
const abs = path.resolve(process.cwd(), target);
if(!fs.existsSync(abs)){
  console.error('File not found:', abs);
  process.exit(1);
}
let text = fs.readFileSync(abs,'utf8');
const before = text;
const NBSP = /\u00A0|\u202F|\u2007|\u2009/g; // common non-breaking / thin spaces
const map = [
  [/\u2013/g,'-'], // en dash
  [/\u2014/g,'-'], // em dash
  [/\u2018/g,"'"], // left single quote
  [/\u2019/g,"'"], // right single quote / apostrophe
  [/\u201C/g,'"'], // left double quote
  [/\u201D/g,'"'], // right double quote
  [/\u2026/g,'...'], // ellipsis
  [/\u2192/g,'->'], // right arrow
  [NBSP,' '],
];
for(const [re, rep] of map){ text = text.replace(re, rep); }
if(text!==before){
  fs.writeFileSync(abs, text, 'utf8');
  console.log('Normalization complete.');
} else {
  console.log('No unicode punctuation replacements applied (already normalized).');
}
