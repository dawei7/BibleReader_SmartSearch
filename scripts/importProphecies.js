#!/usr/bin/env node
/**
 * Convert a CSV (exported from Excel) into public/prophecies.json
 * Supports THREE schemas (auto-detected by header – case-insensitive):
 * 1) LEGACY:
 *    id,prophecyRef,prophecyText,category,status,fulfillmentRef,fulfillmentText,sources,notes,tags
 *    - sources: semicolon-separated; tags: comma-separated.
 * 2) NEW (provided CSV template):
 *    Category,Prophecy,Scripture_Prophecy,Fulfillment_Status,Fulfillment_Description,Fulfillment_Date,
 *    Fulfillment_Scripture,External_Sources,Notes
 *    - External_Sources: semicolon / comma separated
 *    - No explicit id / tags; we derive both.
 * 3) OVERVIEW (simplified future schema):
 *    Category,Overview,Prophecy_Scripture,Fulfillment_Scripture,Status,Date,External_Sources,Notes
 *    - Overview: combined or single free text (displayed as summary/explanation)
 *    - No derived tags/rawGroup/date in output; minimal fields only.
 *
 * Derivations for NEW schema:
 *  - id: stable slug from first Scripture_Prophecy ref + first 4 words of Prophecy text.
 *  - category: thematic auto-mapped (Messiah / Kingdoms / Atonement / Eschatology / Restoration / Judgment / History)
 *              based on keyword heuristics across Prophecy + Fulfillment_Description. Original section name stored as rawGroup.
 *  - tags: union of (status fragments, thematic category, detected themes, key concepts, rawGroup if different).
 *  - date: Fulfillment_Date (kept as 'date' field if present).
 *
 * Heuristic THEMATIC detection (adds category if stronger match not already chosen):
 *  Messiah    => keywords: messiah, christ, servant, branch, immanuel, cornerstone, bethlehem, king comes, donkey, pierced, resurrection, virgin, child is born, shepherd-king
 *  Kingdoms   => kingdom, nations rage, throne, rule, scepter, empires, four-kingdom
 *  Atonement  => atone, atonement, sin, sins, bear our, sacrifice, priest, priesthood, lamb
 *  Eschatology=> last days, consummation, end, eternal, forever, new covenant, new heart, pour out spirit, glory, stone (Dan 2 context), not yet, futures?
 *  Restoration=> restore, regather, return, rebuild, bones, aliyah, gathered, renewal
 *  Judgment   => judge, judgment, doom, destroy, desolation, fall, woe, wrath
 *  History (fallback)
 *
 * NOTE: This is intentionally lightweight & deterministic; fine-tune by editing keyword lists below.
 */
import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd());
const input = process.argv[2];
if(!input){
  console.error('Usage: node scripts/importProphecies.js <file.csv>');
  process.exit(1);
}
const csvPath = path.resolve(root, input);
if(!fs.existsSync(csvPath)){
  console.error('File not found:', csvPath);
  process.exit(1);
}

function parseCSV(text){
  // Simple CSV parser supporting quoted fields with commas/newlines
  const rows=[]; let cur=''; let inQ=false; let field=[]; const pushField=()=>{ field.push(cur); cur=''; }; const pushRow=()=>{ rows.push(field); field=[]; };
  for(let i=0;i<text.length;i++){
    const c=text[i]; const next=text[i+1];
    if(inQ){
      if(c==='"' && next==='"'){ cur+='"'; i++; continue; }
      if(c==='"'){ inQ=false; continue; }
      cur+=c; continue;
    } else {
      if(c==='"'){ inQ=true; continue; }
      if(c==='\n'){ pushField(); pushRow(); continue; }
      if(c===',' ){ pushField(); continue; }
      if(c==='\r'){ if(next==='\n'){ continue; } else { pushField(); pushRow(); continue; } }
      cur+=c;
    }
  }
  if(cur.length || field.length) { pushField(); pushRow(); }
  return rows.filter(r=> r.some(v=> v.trim().length));
}

const raw = fs.readFileSync(csvPath,'utf8');
const rows = parseCSV(raw);
if(!rows.length){
  console.error('No rows found.');
  process.exit(1);
}
const header = rows[0].map(h=> h.trim().toLowerCase());
const idx = (name)=> header.indexOf(name);

const isLegacy = idx('prophecyref')>-1; // legacy
const isNew = !isLegacy && idx('scripture_prophecy')>-1; // intermediate new
const isOverview = !isLegacy && !isNew && idx('overview')>-1 && idx('prophecy_scripture')>-1; // future simplified
if(!isLegacy && !isNew && !isOverview){
  console.error('Unrecognized CSV schema. Expected one of: legacy (prophecyRef), new (Scripture_Prophecy), overview (Overview + Prophecy_Scripture).');
  process.exit(1);
}

// ---------- UTILITIES ----------
const keywordLists = {
  messiah: /(messiah|christ|servant|branch|immanuel|cornerstone|bethlehem|king comes|donkey|pierced|resurrection|virgin|shepherd-king|child is born)/i,
  kingdoms: /(kingdom|nations?\b.*(inherit|discipled)|throne|rule|scepter|empire|empires|four-kingdom|stone the builders|stone becomes|eternal kingdom)/i,
  atonement: /(aton(e|ement)|\bbear(s|ing)? our|sacrifice|priest|priesthood|lamb|sins?\b)/i,
  eschatology: /(last days|consummation|end of the age|eternal|forever|new covenant|new heart|pour out|spirit poured|glory|not yet|future|coming)/i,
  restoration: /(restore|regather|return|rebuild|bones|aliyah|gathered|renewal|plant(ed)? again)/i,
  judgment: /(judge|judgment|doom|destroy|desolation|fall of|woe|wrath|devour|consume)/i,
};
function thematicCategory(text){
  if(!text) return 'History';
  if(keywordLists.messiah.test(text)) return 'Messiah';
  if(keywordLists.atonement.test(text)) return 'Atonement';
  if(keywordLists.kingdoms.test(text)) return 'Kingdoms';
  if(keywordLists.restoration.test(text)) return 'Restoration';
  if(keywordLists.eschatology.test(text)) return 'Eschatology';
  if(keywordLists.judgment.test(text)) return 'Judgment';
  return 'History';
}
function normalizeStatus(s){
  if(!s) return 'Unknown';
  return s.split('/').map(x=> x.trim().replace(/\s+/g,' ')).join(' / ');
}
function slugify(str){
  return str.toLowerCase().replace(/[–—]/g,'-').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/--+/g,'-');
}
function buildId(scripture, prophecy){
  const firstRef = (scripture||'').split(/[;,]/)[0].trim();
  const base = slugify(firstRef).slice(0,40)||'ref';
  const words = (prophecy||'').split(/\s+/).slice(0,4).map(w=> slugify(w)).filter(Boolean).join('-');
  return (base + (words? ('-'+words): '')).replace(/-$/,'');
}
function extractBooks(ref){
  if(!ref) return [];
  const parts = ref.split(/[,;]/);
  const books=[];
  for(const p of parts){
    const m = p.trim().match(/^[1-3]?\s*[A-Za-z]+(?:\s+[A-Za-z]+)*/);
    if(m){
      const b = m[0].trim();
      if(!books.includes(b)) books.push(b);
    }
  }
  return books;
}

// Track uniqueness of IDs
const usedIds = new Set();
function ensureUniqueId(id){
  if(!usedIds.has(id)){ usedIds.add(id); return id; }
  let n=2; while(usedIds.has(id+'-'+n)) n++; const out=id+'-'+n; usedIds.add(out); return out;
}

const out=[];
if(isLegacy){
  const required = ['id','prophecyref','prophecytext','status'];
  for(const r of required){ if(idx(r)===-1){ console.error('Missing column:', r); process.exit(1);} }
  for(let i=1;i<rows.length;i++){
    const r=rows[i]; if(!r.length) continue;
    const g=(col)=>{ const j=idx(col); return j>-1 ? (r[j]||'').trim() : ''; };
    const sourcesRaw=g('sources');
    const tagsRaw=g('tags');
    const obj={
      id: g('id'),
      prophecyRef: g('prophecyref'),
      prophecyText: g('prophecytext'),
      category: g('category')||undefined,
      status: normalizeStatus(g('status'))||'Unknown',
      fulfillmentRef: g('fulfillmentref')||undefined,
      fulfillmentText: g('fulfillmenttext')||undefined,
      sources: sourcesRaw? sourcesRaw.split(/\s*[;|,]\s*/).filter(Boolean): undefined,
      notes: g('notes')||undefined,
      tags: tagsRaw? tagsRaw.split(/\s*,\s*/).filter(Boolean): undefined,
    };
    Object.keys(obj).forEach(k=> obj[k]===undefined && delete obj[k]);
    if(obj.id){ obj.id = ensureUniqueId(slugify(obj.id)); out.push(obj); }
  }
} else if(isNew){
  const requiredNew = ['scripture_prophecy','prophecy','fulfillment_status'];
  for(const r of requiredNew){ if(idx(r)===-1){ console.error('Missing column (new schema):', r); process.exit(1);} }
  for(let i=1;i<rows.length;i++){
    const r=rows[i]; if(!r.length) continue;
    const g=(col)=>{ const j=idx(col); return j>-1 ? (r[j]||'').trim() : ''; };
    const rawGroup=g('category'); // original grouping (book section)
    const scripture=g('scripture_prophecy');
    const prophecyText=g('prophecy');
    const statusRaw=g('fulfillment_status');
    const status = normalizeStatus(statusRaw);
    const fulfillmentText=g('fulfillment_description');
    const fulfillmentRef=g('fulfillment_scripture');
    const date=g('fulfillment_date');
    const sourcesRaw=g('external_sources');
    const notes=g('notes');
    const id = ensureUniqueId(buildId(scripture, prophecyText));
    const joinedForTheme=(prophecyText+'\n'+fulfillmentText).toLowerCase();
  const category=thematicCategory(joinedForTheme);
    const obj={
      id,
      prophecyRef: scripture,
      prophecyText: prophecyText||undefined,
      category,
      status: status||'Unknown',
      fulfillmentRef: fulfillmentRef||undefined,
      fulfillmentText: fulfillmentText||undefined,
      date: date||undefined,
      sources: sourcesRaw? sourcesRaw.split(/\s*[;|,]\s*/).filter(Boolean): undefined,
      notes: notes||undefined,
      // rawGroup & tags suppressed in minimal display
    };
    Object.keys(obj).forEach(k=> obj[k]===undefined && delete obj[k]);
    out.push(obj);
  }
} else if(isOverview){
  // Simplified: Category,Overview,Prophecy_Scripture,Fulfillment_Scripture,Status,Date,External_Sources,Notes
  const req = ['overview','prophecy_scripture','status'];
  for(const r of req){ if(idx(r)===-1){ console.error('Missing required overview column:', r); process.exit(1);} }
  for(let i=1;i<rows.length;i++){
    const r=rows[i]; if(!r.length) continue;
    const g=(col)=>{ const j=idx(col); return j>-1 ? (r[j]||'').trim() : ''; };
    const category=g('category')||undefined;
    const overview=g('overview');
    const pScript=g('prophecy_scripture');
    const fScript=g('fulfillment_scripture');
    const status=normalizeStatus(g('status'))||'Unknown';
    const date=g('date');
    const sourcesRaw=g('external_sources');
    const notes=g('notes');
    const id = ensureUniqueId(buildId(pScript, overview));
    const obj={
      id,
      category,
      prophecyRef: pScript,
      fulfillmentRef: fScript||undefined,
      // Store overview into prophecyText (summary) and fulfillmentText left undefined unless we later split
      prophecyText: overview || undefined,
      status,
      date: date||undefined,
      sources: sourcesRaw? sourcesRaw.split(/\s*[;|,]\s*/).filter(Boolean): undefined,
      notes: notes||undefined,
    };
    Object.keys(obj).forEach(k=> obj[k]===undefined && delete obj[k]);
    out.push(obj);
  }
}

const outPath = path.resolve(root,'public','prophecies.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2)+'\n','utf8');
let schemaName = 'legacy'; if(isNew) schemaName='new'; else if(isOverview) schemaName='overview';
console.log(`Schema: ${schemaName} | Wrote ${out.length} entries to ${outPath}`);
