#!/usr/bin/env node
/**
 * Convert existing prophecies.csv (current mixed schema) into a simplified
 * Overview schema CSV:
 *   Category,Overview,Prophecy_Scripture,Fulfillment_Scripture,Status,Date,External_Sources,Notes
 *
 * Overview = (Prophecy || '') + (Fulfillment_Description ? ' — ' + Fulfillment_Description : '')
 * Status   = Fulfillment_Status (normalized spacing)
 * Date     = Fulfillment_Date
 * Sources  = External_Sources (kept as-is)
 *
 * This does not attempt to merge duplicate rows or dedupe references – one line in, one line out.
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const inputPath = process.argv[2] || 'public/prophecies.csv';
const outPath = process.argv[3] || 'public/prophecies_overview.csv';

function parseCSV(text){
  const rows=[]; let cur=''; let inQ=false; let row=[];
  const pushField=()=>{ row.push(cur); cur=''; };
  const pushRow=()=>{ rows.push(row); row=[]; };
  for(let i=0;i<text.length;i++){
    const c=text[i]; const n=text[i+1];
    if(inQ){
      if(c==='"' && n==='"'){ cur+='"'; i++; continue; }
      if(c==='"'){ inQ=false; continue; }
      cur+=c; continue;
    }
    if(c==='"'){ inQ=true; continue; }
    if(c==='\n'){ pushField(); pushRow(); continue; }
    if(c===','){ pushField(); continue; }
    if(c==='\r'){ if(n==='\n'){ continue; } else { pushField(); pushRow(); continue; } }
    cur+=c;
  }
  if(cur.length || row.length){ pushField(); pushRow(); }
  return rows.filter(r=> r.some(v=> v.trim().length));
}

function csvEscape(v){
  if(v==null) return '';
  const s=String(v);
  if(/[",\n\r]/.test(s)) return '"'+s.replace(/"/g,'""')+'"';
  return s;
}

const absIn = path.resolve(root, inputPath);
if(!fs.existsSync(absIn)){
  console.error('Input CSV not found:', absIn);
  process.exit(1);
}
const raw = fs.readFileSync(absIn,'utf8');
const rows = parseCSV(raw);
if(!rows.length){ console.error('No rows.'); process.exit(1); }
const header = rows[0].map(h=> h.trim());
const hmap = Object.fromEntries(header.map((h,i)=> [h.toLowerCase(), i] ));
function col(...names){
  for(const n of names){ const i=hmap[n.toLowerCase()]; if(i!=null) return i; }
  return -1;
}
const IDX = {
  category: col('category'),
  prophecy: col('prophecy'),
  scriptureProphecy: col('scripture_prophecy','prophecy_scripture'),
  status: col('fulfillment_status','status'),
  fulfillmentDesc: col('fulfillment_description'),
  fulfillmentScripture: col('fulfillment_scripture'),
  date: col('fulfillment_date','date'),
  sources: col('external_sources','sources'),
  notes: col('notes')
};

function get(r, idx){ return idx>-1? (r[idx]||'').trim(): ''; }
function normStatus(s){ return s.split('/').map(x=> x.trim()).filter(Boolean).join(' / '); }

const outRows = [];
outRows.push(['Category','Overview','Prophecy_Scripture','Fulfillment_Scripture','Status','Date','External_Sources','Notes']);
for(let i=1;i<rows.length;i++){
  const r=rows[i]; if(!r || !r.length) continue;
  const category = get(r,IDX.category);
  const prophecy = get(r,IDX.prophecy);
  const fulfillmentDesc = get(r,IDX.fulfillmentDesc);
  const overview = [prophecy, fulfillmentDesc].filter(Boolean).join(' — ');
  const pScript = get(r,IDX.scriptureProphecy);
  const fScript = get(r,IDX.fulfillmentScripture);
  const status = normStatus(get(r,IDX.status));
  const date = get(r,IDX.date);
  const sources = get(r,IDX.sources);
  const notes = get(r,IDX.notes);
  outRows.push([category, overview, pScript, fScript, status, date, sources, notes]);
}

const csvOut = outRows.map(row=> row.map(csvEscape).join(',')).join('\n') + '\n';
fs.writeFileSync(path.resolve(root,outPath), csvOut, 'utf8');
console.log(`Wrote ${outRows.length-1} rows to ${outPath}`);
