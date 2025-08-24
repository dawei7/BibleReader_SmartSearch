#!/usr/bin/env node
// Remove tags and rawGroup fields from public/prophecies.json
import fs from 'fs';
import path from 'path';

const file = path.resolve(process.cwd(),'public','prophecies.json');
if(!fs.existsSync(file)){
  console.error('File not found:', file);
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(file,'utf8'));
if(!Array.isArray(data)){
  console.error('Unexpected JSON structure (expected array)');
  process.exit(1);
}
let removedTags=0, removedRaw=0;
for(const obj of data){
  if('tags' in obj){ delete obj.tags; removedTags++; }
  if('rawGroup' in obj){ delete obj.rawGroup; removedRaw++; }
}
fs.writeFileSync(file, JSON.stringify(data,null,2)+'\n','utf8');
console.log(`Stripped tags from ${removedTags} entries and rawGroup from ${removedRaw} entries.`);
