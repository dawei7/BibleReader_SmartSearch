#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';

const BIBLES_DIR = path.join(process.cwd(), 'public', 'bibles');
const OUT_DIR = path.join(BIBLES_DIR, 'fixed');

function isBookLike(o){ return o && typeof o==='object' && Array.isArray(o.chapters); }

function normalizeBook(b){
  if(!b || typeof b !== 'object') throw new Error('Not an object');
  const chaptersRaw = b.chapters;
  let chapters = [];
  if(Array.isArray(chaptersRaw)){
    chapters = chaptersRaw.map((ch,idx)=>{
      if(!Array.isArray(ch)){
        if(typeof ch === 'string') return [ch];
        throw new Error('Chapter not array at index '+idx);
      }
      return ch.filter(v=> typeof v==='string');
    });
  }
  return {
    name: b.name || (b.abbrev ? String(b.abbrev).toUpperCase() : 'UNKNOWN'),
    abbrev: b.abbrev || (b.name ? b.name.slice(0,2).toLowerCase() : undefined),
    chapters
  };
}

function attemptRepairTopLevel(raw){
  if(Array.isArray(raw) && raw.every(isBookLike)) return raw.map(normalizeBook);
  if(raw && typeof raw==='object'){
    for(const key of ['books','bible','data']){
      if(Array.isArray(raw[key])) return attemptRepairTopLevel(raw[key]);
    }
  }
  if(Array.isArray(raw)){
    const repaired=[]; let current=null;
    for(const entry of raw){
      if(isBookLike(entry)) { current=normalizeBook(entry); repaired.push(current); }
      else if(Array.isArray(entry)) { if(!current){ current={ name:'BOOK_'+(repaired.length+1), abbrev:'b'+(repaired.length+1), chapters:[] }; repaired.push(current);} current.chapters.push(entry.filter(v=> typeof v==='string')); }
      else if(entry && typeof entry==='object' && entry.chapters && Array.isArray(entry.chapters)) { current=normalizeBook(entry); repaired.push(current); }
    }
    return repaired;
  }
  throw new Error('Unrecognized structure');
}

async function processFile(file){
  const full = path.join(BIBLES_DIR,file);
  let text = await fs.readFile(full,'utf8');
  text = text.replace(/^\uFEFF/,'');
  const firstBrace = text.search(/[\[{]/);
  if(firstBrace>0){ const junk=text.slice(0,firstBrace); if(/[^\s]/.test(junk)) console.warn('Stripping junk from',file); text=text.slice(firstBrace); }
  let raw;
  try { raw=JSON.parse(text); } catch(e){
    try {
      const cleaned = text.replace(/^\uFEFF/,'').replace(/^[^\[{]+/,'').replace(/,\s*([}\]])/g,'$1');
      raw=JSON.parse(cleaned);
    } catch(e2){ throw new Error('JSON parse error: '+(e.message||e)); }
  }
  let books;
  try { books = attemptRepairTopLevel(raw); } catch(e){ throw new Error('Structure repair failed: '+(e.message||e)); }
  books = books.filter(b=> b.chapters.length>0);
  await fs.mkdir(OUT_DIR,{recursive:true});
  const outPath = path.join(OUT_DIR,file);
  await fs.writeFile(outPath, JSON.stringify(books,null,2), 'utf8');
  return { file, books: books.length };
}

async function main(){
  const entries = await fs.readdir(BIBLES_DIR);
  const targets = entries.filter(f=> f.endsWith('.json') && f !== 'index.json');
  console.log('Found JSON bible files:', targets.length);
  await fs.mkdir(OUT_DIR,{recursive:true});
  const report=[];
  for(const f of targets){
    try { const res=await processFile(f); report.push({ file:f, status:'fixed', books:res.books }); }
    catch(e){ report.push({ file:f, status:'error', error:e.message||String(e) }); }
  }
  console.table(report);
  console.log('Done. Output in', OUT_DIR);
}

main().catch(e=>{ console.error(e); process.exit(1); });
