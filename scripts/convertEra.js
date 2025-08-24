#!/usr/bin/env node
// Replace era designations in the CSV: BCE -> BC, CE -> AD (standalone era tokens)
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
// Replace ' BCE' (space + BCE) to ' BC'
text = text.replace(/(\s)BCE\b/g, '$1BC');
// Replace ' CE' (space + CE) to ' AD' but avoid touching words like ONCE (no leading space)
text = text.replace(/(\s)CE\b/g, '$1AD');
if(text!==before){
  fs.writeFileSync(abs, text, 'utf8');
  const bceCount = (before.match(/\sBCE\b/g)||[]).length;
  const ceCount = (before.match(/\sCE\b/g)||[]).length;
  console.log(`Updated era designations. Replaced ${bceCount} BCE -> BC and ${ceCount} CE -> AD in ${target}.`);
} else {
  console.log('No era tokens (BCE/CE) found to replace.');
}
