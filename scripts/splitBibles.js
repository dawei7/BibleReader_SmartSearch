#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

const ROOT = path.join(process.cwd(), 'public', 'bibles');

async function readJSON(file){
  let text = await fs.readFile(file, 'utf8');
  text = text.replace(/^\uFEFF/, '');
  return JSON.parse(text);
}

function normalizeBooks(raw){
  if(!Array.isArray(raw)) throw new Error('Top-level is not array');
  return raw.map((b,i)=>{
    if(!b || !Array.isArray(b.chapters)) throw new Error('Book missing chapters at index '+i);
    return {
      name: b.name || (b.abbrev ? String(b.abbrev).toUpperCase() : 'BOOK_'+(i+1)),
      abbrev: b.abbrev || (b.name ? b.name.slice(0,3).toLowerCase() : 'b'+(i+1)),
      chapters: b.chapters
    };
  });
}

async function splitFile(file){
  const abbr = file.replace(/\.json$/,'');
  const full = path.join(ROOT, file);
  const data = await readJSON(full);
  const books = normalizeBooks(data);
  const outDir = path.join(ROOT, abbr);
  await fs.mkdir(outDir, { recursive: true });
  const meta = { abbreviation: abbr, books: [] };
  for(let i=0;i<books.length;i++){
    const b = books[i];
    const fileName = String(i+1).padStart(2,'0') + '.json';
    await fs.writeFile(path.join(outDir,fileName), JSON.stringify({ name:b.name, abbrev:b.abbrev, chapters:b.chapters }, null, 0), 'utf8');
    meta.books.push({ idx:i, name:b.name, abbrev:b.abbrev, file:fileName, chapterCount:b.chapters.length, verseCounts:b.chapters.map(ch=>ch.length) });
  }
  await fs.writeFile(path.join(outDir,'meta.json'), JSON.stringify(meta,null,2), 'utf8');
  return { file, books: books.length };
}

async function main(){
  const entries = await fs.readdir(ROOT);
  const targets = entries.filter(f=> f.endsWith('.json') && !['index.json'].includes(f));
  const report=[];
  for(const f of targets){
    try { report.push(await splitFile(f)); } catch(e){ report.push({ file:f, error:e.message||String(e) }); }
  }
  await fs.writeFile(path.join(ROOT,'split-report.json'), JSON.stringify(report,null,2), 'utf8');
  console.table(report);
  console.log('Split complete. See split-report.json');
}

main().catch(e=>{ console.error(e); process.exit(1); });
