import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
// Tiny inline SVG icons (stroke-based, inherit currentColor)
const Icon = {
  Read: (props)=> (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 18c-1.2-1-2.6-1.5-4.5-1.5H5a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v12z"/>
      <path d="M12 18c1.2-1 2.6-1.5 4.5-1.5H19a3 3 0 0 0 3-3V6a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v12z"/>
    </svg>
  ),
  Search: (props)=> (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="6"/>
      <path d="M20 20l-3.5-3.5"/>
    </svg>
  ),
  Install: (props)=> (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v10"/>
      <path d="M8.5 9.5L12 13l3.5-3.5"/>
      <path d="M5 21h14"/>
    </svg>
  ),
  Save: (props)=> (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 4h10l4 4v12H5z"/>
      <path d="M9 4v6h6"/>
      <rect x="8" y="14" width="8" height="6" rx="1"/>
    </svg>
  ),
  Settings: (props)=> (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Sliders icon (distinct from sun) */}
      <line x1="6" y1="3" x2="6" y2="21"/>
      <line x1="12" y1="3" x2="12" y2="21"/>
      <line x1="18" y1="3" x2="18" y2="21"/>
      <g fill="currentColor" stroke="none">
        <rect x="4" y="7" width="4" height="4" rx="1"/>
        <rect x="10" y="11" width="4" height="4" rx="1"/>
        <rect x="16" y="5" width="4" height="4" rx="1"/>
      </g>
    </svg>
  ),
  Sun: (props)=> (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>
    </svg>
  ),
  Moon: (props)=> (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 15.5A8.5 8.5 0 1 1 8.5 4 6.5 6.5 0 0 0 20 15.5z"/>
    </svg>
  ),
  Play: (props)=> (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="currentColor" stroke="none" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  Stop: (props)=> (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="currentColor" stroke="none" {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  ),
  Clock: (props)=> (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  ),
  Reset: (props)=> (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Refresh/Reset: turn arrow */}
      <path d="M4 10a8 8 0 1 1-1.9 5.1"/>
      <path d="M4 4v6h6"/>
    </svg>
  ),
  Clear: (props)=> (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Backspace/Clear key with X */}
      <path d="M20 7H9l-5 5 5 5h11a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      <path d="M12 10l4 4m0-4l-4 4" />
    </svg>
  ),
  Prophecy: (props)=> (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Open book */}
      <path d="M12 18c-1.25-1.05-2.7-1.55-4.6-1.55H6A2 2 0 0 1 4 14.5v-9A1.5 1.5 0 0 1 5.5 4H11a1 1 0 0 1 1 1v13z"/>
      <path d="M12 18c1.25-1.05 2.7-1.55 4.6-1.55H18a2 2 0 0 0 2-2V5.5A1.5 1.5 0 0 0 18.5 4H13a1 1 0 0 0-1 1v13z"/>
      {/* Even larger magnifying glass overlapping book */}
      <circle cx="15.5" cy="14.5" r="5.2"/>
      <path d="M18.9 17.9l3.1 3.1"/>
    </svg>
  ),
};
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList, Cell } from 'recharts';

// Sample fallback
const SAMPLE_BIBLE = [
  { name: 'Genesis', abbrev: 'gn', chapters: [[
    'In the beginning God created the heaven and the earth.',
    'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.',
    'And God said, Let there be light: and there was light.',
    'And God saw the light, that it was good: and God divided the light from the darkness.',
    'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.',
  ]]} ,
];

// Helpers
function escapeRegExp(str){ return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function clamp(n,min,max){ return Math.max(min, Math.min(max,n)); }
function classNames(...xs){ return xs.filter(Boolean).join(' '); }
// Exact abbreviations mapping requested (English canonical names)
const BOOK_ABBREV_MAP = {
  // OSIS-style abbreviations
  'Genesis':'Gen','Exodus':'Exod','Leviticus':'Lev','Numbers':'Num','Deuteronomy':'Deut','Joshua':'Josh','Judges':'Judg','Ruth':'Ruth',
  '1 Samuel':'1Sam','2 Samuel':'2Sam','1 Kings':'1Kgs','2 Kings':'2Kgs','1 Chronicles':'1Chr','2 Chronicles':'2Chr',
  'Ezra':'Ezra','Nehemiah':'Neh','Esther':'Esth','Job':'Job','Psalms':'Ps','Proverbs':'Prov','Ecclesiastes':'Eccl','Song of Solomon':'Song',
  'Isaiah':'Isa','Jeremiah':'Jer','Lamentations':'Lam','Ezekiel':'Ezek','Daniel':'Dan','Hosea':'Hos','Joel':'Joel','Amos':'Amos','Obadiah':'Obad','Jonah':'Jonah','Micah':'Mic','Nahum':'Nah','Habakkuk':'Hab','Zephaniah':'Zeph','Haggai':'Hag','Zechariah':'Zech','Malachi':'Mal',
  'Matthew':'Matt','Mark':'Mark','Luke':'Luke','John':'John','Acts':'Acts','Romans':'Rom','1 Corinthians':'1Cor','2 Corinthians':'2Cor','Galatians':'Gal','Ephesians':'Eph','Philippians':'Phil','Colossians':'Col','1 Thessalonians':'1Thess','2 Thessalonians':'2Thess','1 Timothy':'1Tim','2 Timothy':'2Tim','Titus':'Titus','Philemon':'Phlm','Hebrews':'Heb','James':'Jas','1 Peter':'1Pet','2 Peter':'2Pet','1 John':'1John','2 John':'2John','3 John':'3John','Jude':'Jude','Revelation':'Rev'
};
function deriveAbbrev(name){ if(!name) return ''; const parts=name.split(/\s+/); if(/^\d/.test(parts[0])&&parts[1]){ return (parts[0].replace(/[^\d]/g,'')+parts[1].slice(0,3)); } return parts[0].slice(0,3); }
function normalizeNameForMap(n){ if(!n) return ''; let s=String(n).trim(); // unify common variants
  s=s.replace(/^Song of Songs$/i,'Song of Solomon');
  s=s.replace(/^Song of Solomon$/i,'Song of Solomon');
  s=s.replace(/^Psalm(s)?$/i,'Psalms');
  s=s.replace(/^Canticles$/i,'Song of Solomon');
  s=s.replace(/^The Revelation( of John)?$/i,'Revelation');
  s=s.replace(/^1st /,'1 ').replace(/^2nd /,'2 ').replace(/^3rd /,'3 ');
  // Capitalize numeric book patterns
  return s.replace(/\b(\w)/g, (m)=> m.toUpperCase());
} 
function bookAbbrev(name, fallback){
  if(fallback && typeof fallback==='string') return fallback; // prefer provided abbrev
  const key=normalizeNameForMap(name);
  return BOOK_ABBREV_MAP[key] || deriveAbbrev(name);
}

function buildSearchRegex(query, mode, { caseSensitive }) {
  if (!query.trim()) return null;
  // remove common punctuation characters from query so searches ignore them
  // includes: , . ; : * ? ! quotes brackets dashes etc.
  const PUNCT_RE = /[\.,;:*!?"'“”‘’`´()\[\]{}<>/\\\-]+/g;
  const sanitize = (s)=> s.replace(PUNCT_RE,'');
  const flags = (caseSensitive ? 'g' : 'gi') + 'u';
  const WORD_CLASS = 'A-Za-z0-9_\\u00C0-\\u02AF\\u0370-\\u03FF\\u0400-\\u04FF\\u0590-\\u05FF\\u0600-\\u06FF\\u0900-\\u097F\\u3040-\\u30FF\\u3400-\\u4DBF\\u4E00-\\u9FFF';
  const LB = `(?<![${WORD_CLASS}])`;
  const RB = `(?![${WORD_CLASS}])`;
  function tokenPattern(t){ const escaped = escapeRegExp(t); return `(?:${LB}${escaped}(?=[${WORD_CLASS}])|(?<=[${WORD_CLASS}])${escaped}${RB}|${LB}${escaped}${RB})`; }
  if (mode === 'phrase') {
    const core = sanitize(query.trim());
    if(!core) return null;
    return new RegExp(tokenPattern(core), flags);
  }
  const rawWords = query.split(/\s+/).map(w => sanitize(w.trim())).filter(Boolean); if(!rawWords.length) return null;
  const words = rawWords.map(w => escapeRegExp(w));
  if(!words.length) return null;
  const orBody = words.map(w => tokenPattern(w)).join('|');
  const highlight = new RegExp(orBody, flags);
  return { highlight, words, mode, caseSensitive, __edge:true };
}

function countMatches(text, search){
  if (!search) return { count:0, matched:false };
  if (search instanceof RegExp) { const r = new RegExp(search.source, search.flags.includes('g')? search.flags : search.flags + 'g'); const m = text.match(r); const c = m? m.length:0; return { count: c, matched: c>0 }; }
  const { words, caseSensitive, mode } = search;
  const flags = (caseSensitive? 'g':'gi') + 'u';
  const WORD_CLASS = 'A-Za-z0-9_\\u00C0-\\u02AF\\u0370-\\u03FF\\u0400-\\u04FF\\u0590-\\u05FF\\u0600-\\u06FF\\u0900-\\u097F\\u3040-\\u30FF\\u3400-\\u4DBF\\u4E00-\\u9FFF';
  const LB = `(?<![${WORD_CLASS}])`; const RB = `(?![${WORD_CLASS}])`;
  let total=0; const pres=[];
  for(const w of words){ const pattern = `(?:${LB}${w}(?=[${WORD_CLASS}])|(?<=[${WORD_CLASS}])${w}${RB}|${LB}${w}${RB})`; const r=new RegExp(pattern,flags); const m=text.match(r); pres.push(!!m); total+= m? m.length:0; }
  const matched = mode==='all'? pres.every(Boolean): pres.some(Boolean);
  return { count: matched? total:0, matched };
}

function highlightText(text, regexOrObj){
  if(!regexOrObj) return text;
  let highlightRegex=null;
  if(regexOrObj instanceof RegExp){ highlightRegex=regexOrObj; }
  else if(regexOrObj.highlight){ highlightRegex=regexOrObj.highlight; }
  if(!highlightRegex) return text;
  const parts=[]; let lastIndex=0; const r=new RegExp(highlightRegex.source, highlightRegex.flags.includes('g')? highlightRegex.flags: highlightRegex.flags+'g');
  for(let m; (m=r.exec(text));){
    const i=m.index; if(i>lastIndex) parts.push(text.slice(lastIndex,i));
    parts.push(<mark key={i+text} className="bg-yellow-200 dark:bg-yellow-600/50 rounded px-0.5">{m[0]}</mark>);
    lastIndex=i+m[0].length;
    if(r.lastIndex===i) r.lastIndex++; // avoid zero-length loops
  }
  if(lastIndex<text.length) parts.push(text.slice(lastIndex));
  return parts.length? parts : text;
}

// Tabbed prophecy card component
function ProphecyCard({ p, versions, version, extractVersesFromRef, isGerman, openPassages, highlight }) {
  // Support both legacy flat fields and new hierarchical schema.
  function splitRefs(refStr){
    if(!refStr) return [];
    const raw = refStr.split(/\s*;\s*/).filter(Boolean);
    const out=[]; let lastBook='';
    for(const partRaw of raw){
      let part=partRaw.trim();
      const m = part.match(/^([1-3]?\s*[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+\d/);
      if(m){ lastBook=m[1]; }
      else if(/^\d+:\d/.test(part) && lastBook){ part = lastBook+" "+part; }
      out.push(part);
    }
    return out;
  }
  const prophecyRefStr = p.prophecyRef || '';
  const fulfillmentRefStr = (p.fulfillment && p.fulfillment.biblicalRef) || '';
  const prophecyRefs = splitRefs(prophecyRefStr);
  const fulfillRefs = splitRefs(fulfillmentRefStr);
  const prophecyRefsDisplay = prophecyRefs.join('; ');
  const fulfillRefsDisplay = fulfillRefs.length? fulfillRefs.join('; ') : '';
  const combinedRef = fulfillRefsDisplay? { prophecy: prophecyRefsDisplay, fulfillment: fulfillRefsDisplay } : { prophecy: prophecyRefsDisplay };
  // Overview: new schema uses summary.{prophecy,fulfillment}
  const overviewParts = [];
  let prophecyTxt = '';
  let fulfillmentTxt = '';
  if(p.summary){
    const langBlock = isGerman ? p.summary.de || p.summary.en : p.summary.en || p.summary.de;
    prophecyTxt = (langBlock && langBlock.prophecy) || p.summary.prophecy || '';
    fulfillmentTxt = (langBlock && langBlock.fulfillment) || p.summary.fulfillment || '';
    if(prophecyTxt) overviewParts.push(prophecyTxt);
    if(fulfillmentTxt) overviewParts.push(fulfillmentTxt);
  }
  const overview = overviewParts.length ? true : false; // presence flag
  // Category label: could be string or {en,de}
  let categoryLabel='';
  if(p.category && typeof p.category==='object'){
    categoryLabel = isGerman ? (p.category.de || p.category.en || '') : (p.category.en || p.category.de || '');
  }
  const status = p.status || '';
  return (
    <li className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
        <button
          type="button"
          onClick={()=> openPassages(p)}
          className="group relative flex items-center justify-center h-9 w-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 dark:focus:ring-offset-slate-900 transition transform hover:scale-110"
          title={isGerman? 'Passagen öffnen':'Open passages'}
        >
          <Icon.Prophecy className="h-6 w-6" />
          <span className="sr-only">{isGerman? 'Passagen öffnen':'Open passages'}</span>
        </button>
        <span className="text-sm font-semibold select-text flex flex-wrap items-center gap-1">
          <span className="text-amber-600 dark:text-amber-400">{highlight? highlightText(combinedRef.prophecy, highlight): combinedRef.prophecy}</span>
          {combinedRef.fulfillment && <span className="text-slate-400 dark:text-slate-500">—</span>}
          {combinedRef.fulfillment && <span className="text-emerald-600 dark:text-emerald-400">{highlight? highlightText(combinedRef.fulfillment, highlight): combinedRef.fulfillment}</span>}
        </span>
        {categoryLabel && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">{categoryLabel}</span>}
        {status && <span className={"text-xs px-2 py-0.5 rounded-full border "+(status==='Fulfilled'? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300': status.includes('Partial')? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300': status==='Future'? 'bg-sky-50 border-sky-300 text-sky-700 dark:bg-sky-900/30 dark:border-sky-700 dark:text-sky-300':'bg-slate-50 border-slate-300 text-slate-600 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300')}>{status}</span>}
      </div>
      {overview && (
        <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 mb-0 space-y-1">
          {prophecyTxt && (
            <div className="pl-2 border-l-2 border-amber-500/60 dark:border-amber-400/60 text-slate-600 dark:text-slate-300">
              {highlight? highlightText(prophecyTxt, highlight): prophecyTxt}
            </div>
          )}
          {fulfillmentTxt && (
            <div className="pl-2 border-l-2 border-emerald-500/60 dark:border-emerald-400/60 text-slate-600 dark:text-slate-300">
              {highlight? highlightText(fulfillmentTxt, highlight): fulfillmentTxt}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

// Passage block with expandable long content (separate component to keep hooks order stable)
function PassageBlock({ refStr, verseObjs, isGerman }) {
  const [showModal, setShowModal] = useState(false);
  const overLimit = verseObjs.length > 5;
  const displayObjs = overLimit ? verseObjs.slice(0,5) : verseObjs;
  useEffect(()=>{
    // Lock background scroll when modal open
    const original = document.documentElement.style.overflow;
    if(showModal) document.documentElement.style.overflow='hidden';
    return ()=> { document.documentElement.style.overflow = original; };
  }, [showModal]);
  return (
    <>
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[12px] font-semibold text-indigo-600 dark:text-indigo-400">{refStr}</div>
          {overLimit && (
            <button onClick={()=> setShowModal(true)} className="text-[11px] px-2 py-0.5 rounded border border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
              {isGerman? 'Mehr':'More'}
            </button>
          )}
        </div>
        <div className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-300">
          {displayObjs.length ? displayObjs.map(vObj=> (
            <span key={vObj.n} className="mr-1">
              <sup className="align-super text-[10px] font-semibold text-slate-500 dark:text-slate-400 mr-0.5">{vObj.n}</sup>
              {vObj.text}
            </span>
          )) : <span className="text-slate-500 dark:text-slate-400 text-xs">(No verses extracted)</span>}
          {overLimit && <span className="text-slate-500 dark:text-slate-400 text-xs ml-1">…</span>}
        </div>
      </div>
      {showModal && createPortal(
        <div className="fixed inset-0 z-[1000] flex flex-col w-full h-full bg-white dark:bg-slate-900" role="dialog" aria-modal="true">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
              <h3 className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 truncate pr-4">{refStr}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{verseObjs.length} {isGerman? 'Verse':'verses'}</span>
                <button onClick={()=> setShowModal(false)} className="text-xs px-3 py-1 rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                  {isGerman? 'Schließen':'Close'}
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 text-[14px] leading-relaxed text-slate-700 dark:text-slate-300">
              {verseObjs.map(vObj=> (
                <span key={vObj.n} className="mr-1">
                  <sup className="align-super text-[10px] font-semibold text-slate-500 dark:text-slate-400 mr-0.5">{vObj.n}</sup>
                  {vObj.text}
                </span>
              ))}
            </div>
        </div>, document.body)
      }
    </>
  );
}

// (Inline VersePicker removed; replaced by full-screen overlay)

// (Verse range slider removed)

// Main component
export default function BibleApp(){
  // Core state (some variables referenced further below were originally defined earlier in file)
  const [bible,setBible]=useState(null);
  const [version,setVersion]=useState('de_schlachter');
  const [mode,setMode]=useState('read');
  // Prophecy section state
  const [prophecies,setProphecies]=useState([]);
  const [prophecyError,setProphecyError]=useState(null);
  const [prophecySearch,setProphecySearch]=useState('');
  const [prophecySearchDraft,setProphecySearchDraft]=useState(''); // draft input; apply commits
  const [prophecySearchMode,setProphecySearchMode]=useState('all'); // all|any|phrase
  const [prophecyCaseSensitive,setProphecyCaseSensitive]=useState(false);
  const [prophecyLang,setProphecyLang]=useState('en'); // 'en' | 'de'
  // Passages overlay
  const [showPassages,setShowPassages]=useState(false);
  const [activeProphecy,setActiveProphecy]=useState(null); // prophecy object
  const [bookIdx,setBookIdx]=useState(0);
  // (Legacy passageModalCount removed; portal-based passage modals now overlay without needing global tracking)
  const [chapterIdx,setChapterIdx]=useState(0);
  const [vStart,setVStart]=useState(1);
  const [vEnd,setVEnd]=useState(0);
  const [query,setQuery]=useState('');
  const [queryInput,setQueryInput]=useState('');
  const [searchMode,setSearchMode]=useState('all');
  const [searchScope,setSearchScope]=useState('all');
  const [chapFrom,setChapFrom]=useState(1);
  const [chapTo,setChapTo]=useState(0);
  const [caseSensitive,setCaseSensitive]=useState(false);
  const [versions,setVersions]=useState([]);
  const [loadingVersion,setLoadingVersion]=useState(false);
  const [versionError,setVersionError]=useState(null);
  const [attemptLog,setAttemptLog]=useState([]);
  const [lastAttempt,setLastAttempt]=useState(null);
  const [lazyMode,setLazyMode]=useState(false);
  const [theme,setTheme]=useState('system');
  const [metaMap,setMetaMap]=useState({});
  const [showAbout,setShowAbout]=useState(false);
    const [highlightInRead,setHighlightInRead]=useState(false);
    const [pendingScrollVerse,setPendingScrollVerse]=useState(null);
  const [stickyReadHeight,setStickyReadHeight]=useState(0);
  // PWA install
  const [deferredPrompt,setDeferredPrompt]=useState(null);
  const [canInstall,setCanInstall]=useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallConfirm, setShowInstallConfirm] = useState(false);
  // Quick confirmation when saving a bookmark
  const [showSaveToast,setShowSaveToast]=useState(false);
  // Share/copy confirmation toast for long-press on a verse
  const [shareToast,setShareToast] = useState('');
  // Service worker update toast
  const [updateReady,setUpdateReady] = useState(false);
  const swRegRef = useRef(null);
  const [lpAction,setLpAction] = useState(null); // { verseN:number, verseText:string }
  // Settings management helpers (import/export/share)
  // (No visible settings sharing UI; persistence via localStorage happens automatically)
  // Settings overlay and reader preferences
  const [showSettings,setShowSettings] = useState(false);
  const [readerFontSize,setReaderFontSize] = useState(16); // px
  const [readerFontFamily,setReaderFontFamily] = useState('sans'); // 'sans' | 'serif'
  // Line height (px) slider replaces old lineSpacing options
  const [lineHeightPx,setLineHeightPx] = useState(28);
  const [readerWidth,setReaderWidth] = useState('normal'); // deprecated: kept for migration
  const [readerWidthPct,setReaderWidthPct] = useState(100); // 20–100
  const [verseLayout,setVerseLayout] = useState('blocks'); // 'blocks' | 'continuous'
  const [showNumbers,setShowNumbers] = useState(true);
  const [numberStyle,setNumberStyle] = useState('superscript'); // 'inline' | 'superscript'
  const [justifyText,setJustifyText] = useState(false);
  const [hoverHighlight,setHoverHighlight] = useState(true);
  const [autoHighlightInRead,setAutoHighlightInRead] = useState(false);
  // TTS (Text-to-Speech) state
  const ttsSupported = (typeof window !== 'undefined' && 'speechSynthesis' in window);
  const [ttsStatus,setTtsStatus] = useState('idle'); // 'idle' | 'playing' | 'paused'
  const [ttsRate,setTtsRate] = useState(0.95);
  const [ttsPitch,setTtsPitch] = useState(0.85);
  // Experimental: allow TTS to continue when tab/app is hidden (browser-dependent)
  const [allowBackgroundTTS, setAllowBackgroundTTS] = useState(false);
  const [ttsActiveIndex,setTtsActiveIndex] = useState(-1);
  const ttsVoiceRef = useRef(null);
  const ttsIndexRef = useRef(-1);
  const ttsStoppedRef = useRef(false);
  const voicesRef = useRef([]);
  // Trigger re-render when voices list changes
  const [voicesTick, setVoicesTick] = useState(0);
  // Remember preferred voice per language code (e.g., { 'en': 'Microsoft ... voiceURI' })
  const [voicePrefMap, setVoicePrefMap] = useState(()=>{
    try { const raw = localStorage.getItem('br_tts_voice_prefs'); return raw? JSON.parse(raw) : {}; } catch { return {}; }
  });
  // Manual refresh no longer exposed in UI; voices update via 'voiceschanged' event below.
  const ttsRunIdRef = useRef(0); // increments each time a new reading session starts/stops
  const currentUtterRef = useRef(null);
  // Remember the last verse index across stops (reset on version/book/chapter change)
  const ttsLastIndexRef = useRef(0);
  const [ttsLastVisibleIndex, setTtsLastVisibleIndex] = useState(0);
  // Suppress stop while auto-advancing to next chapter/book
  const ttsAdvancingRef = useRef(false);
  // Sleep timer and stop-at target (declared early to avoid TDZ in hooks below)
  const [showSleepTimer,setShowSleepTimer] = useState(false);
  const [readForMinutes,setReadForMinutes] = useState(0); // 0 = off
  const sleepDeadlineRef = useRef(0);
  const readForMinutesRef = useRef(0);
  useEffect(()=>{ readForMinutesRef.current = readForMinutes||0; },[readForMinutes]);
  // Keep-screen-on while TTS playing (Wake Lock API; Android Chrome; not iOS). Released on stop/hidden.
  const wakeLockRef = useRef(null);
  // Countdown ticker (for UI countdown while reading)
  const [nowMs, setNowMs] = useState(()=> Date.now());
  // Secondary overlay to pick a preset duration
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  // Close duration picker on Escape
  useEffect(()=>{
    if(!(mode==='read' && showSleepTimer && showDurationPicker)) return;
    const onKey = (e)=>{ if(e.key==='Escape'){ setShowDurationPicker(false); } };
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  },[mode, showSleepTimer, showDurationPicker]);
  // Preset durations and formatter for display
  const presetMinutes = useMemo(()=>[
    1,5,10,15,20,25,30,45,60,75,90,120,180,240,300,360,420,480,540,600
  ],[]);
  const formatMinutes = useCallback((m)=>{
    if(!m || m<=0) return '—';
    const h = Math.floor(m/60), min = m%60;
    if(h>0 && min>0) return `${h}h ${min}m`;
    if(h>0) return `${h}h`;
    return `${min}m`;
  },[]);

  // Build tag list from loaded prophecies
  // (Tag system removed – no tag derivation)

  const prophecySearchObj = useMemo(()=> buildSearchRegex(prophecySearch,prophecySearchMode,{caseSensitive:prophecyCaseSensitive}),[prophecySearch,prophecySearchMode,prophecyCaseSensitive]);
  const prophecySearchDraftObj = useMemo(()=> buildSearchRegex(prophecySearchDraft,prophecySearchMode,{caseSensitive:prophecyCaseSensitive}),[prophecySearchDraft,prophecySearchMode,prophecyCaseSensitive]);

  // Generic matcher that can operate on either committed or draft search objects
  const prophecyMatchesWith = useCallback((p, searchObjLocal)=>{
    if(!searchObjLocal) return true;
    const hay = [
      p.prophecyRef,
      p.summary && p.summary.prophecy,
      p.summary && p.summary.fulfillment,
      p.fulfillment && p.fulfillment.biblicalRef,
      p.fulfillment && p.fulfillment.externalRef && p.fulfillment.externalRef.en,
      p.fulfillment && p.fulfillment.externalRef && p.fulfillment.externalRef.de,
      p.notes && p.notes.en,
      p.notes && p.notes.de,
      p.category && p.category.en,
      p.category && p.category.de,
      p.status
    ].filter(Boolean).join('\n');
    if(searchObjLocal instanceof RegExp){ return searchObjLocal.test(hay); }
    const { words, mode } = searchObjLocal;
    if(mode==='phrase'){
      const r = buildSearchRegex((searchObjLocal.highlight && prophecySearch) || prophecySearch,'phrase',{caseSensitive:prophecyCaseSensitive});
      return r? (r instanceof RegExp? r.test(hay): false) : true;
    }
    const lcHay = prophecyCaseSensitive? hay : hay.toLowerCase();
    const testWord=(w)=> lcHay.includes(prophecyCaseSensitive? w : w.toLowerCase());
    if(mode==='all') return words.every(testWord);
    return words.some(testWord);
  },[prophecyCaseSensitive,prophecySearch]);

  const prophecyMatches = useCallback((p)=> prophecyMatchesWith(p, prophecySearchObj),[prophecyMatchesWith,prophecySearchObj]);

  const filteredProphecies = useMemo(()=> prophecies.filter(prophecyMatches),[prophecies,prophecyMatches]);
  // Draft preview count (dynamic while typing). If draft empty -> all.
  const prophecyDraftCount = useMemo(()=>{
    if(!prophecies.length) return 0;
    if(!prophecySearchDraftObj) return prophecies.length;
    let c=0; for(const p of prophecies){ if(prophecyMatchesWith(p, prophecySearchDraftObj)) c++; }
    return c;
  },[prophecies,prophecySearchDraftObj,prophecyMatchesWith]);
  const formatCountdown = useCallback((ms)=>{
    if(!ms || ms<=0) return '0:00';
    const total = Math.ceil(ms/1000);
    const s = total % 60;
    const m = Math.floor(total/60);
    if(m >= 60){
      const h = Math.floor(m/60);
      const mm = String(m % 60).padStart(2,'0');
      return `${h}:${mm}`;
    }
    return `${m}:${String(s).padStart(2,'0')}`;
  },[]);
  const [stopAtBookIdx,setStopAtBookIdx] = useState(null); // null = none
  const [stopAtChapterIdx,setStopAtChapterIdx] = useState(null);
  // Scroll position preservation for each mode
  const [readScrollY,setReadScrollY]=useState(0);
  const [searchScrollY,setSearchScrollY]=useState(0);
  // Persistence refs
  const storedVersionRef = useRef(null);
  // Initialize persisted theme & version preference
  useEffect(()=>{
    try {
      const t = localStorage.getItem('br_theme');
      if(t==='dark' || t==='light' || t==='system') setTheme(t);
      else setTheme('system');
      const v = localStorage.getItem('br_version');
      if(v) storedVersionRef.current = v;
      if(v){
        try { const raw = localStorage.getItem(`br_default_pos_${v}`); if(raw){ const p=JSON.parse(raw); setDefaultBookIdx(typeof p.bookIdx==='number'? p.bookIdx: null); setDefaultChapterIdx(typeof p.chapterIdx==='number'? p.chapterIdx: null); } } catch {}
      }
    } catch { /* ignore */ }
  },[]);
  // Track system color scheme
  const [systemPrefersDark, setSystemPrefersDark] = useState(()=>{
    try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; } catch { return false; }
  });
  useEffect(()=>{
    try {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = (e)=> setSystemPrefersDark(!!e.matches);
      // update now
      setSystemPrefersDark(mql.matches);
      if(mql.addEventListener) mql.addEventListener('change', onChange); else mql.addListener(onChange);
      return ()=>{ if(mql.removeEventListener) mql.removeEventListener('change', onChange); else mql.removeListener(onChange); };
    } catch { /* ignore */ }
  },[]);

  // Populate available speech voices (if supported)
  useEffect(()=>{
    if(!ttsSupported) return;
    const updateVoices = ()=>{
  try { voicesRef.current = window.speechSynthesis.getVoices(); setVoicesTick(t=>t+1); }
      catch { voicesRef.current = []; }
    };
    updateVoices();
    try {
      window.speechSynthesis.addEventListener?.('voiceschanged', updateVoices);
    } catch {}
    return ()=>{
      try { window.speechSynthesis.removeEventListener?.('voiceschanged', updateVoices); } catch {}
    };
  },[ttsSupported]);

  // Derive locale hint from version abbreviation (e.g., de_schlachter -> de)
  const versionLangCode = useMemo(()=>{
    try {
      const abbr = String(version||'').toLowerCase();
      const code = (abbr.split('_')[0]||'').slice(0,2);
      return code || 'en';
    } catch { return 'en'; }
  },[version]);

  function defaultLocaleFor(code){
    switch((code||'').toLowerCase()){
      case 'en': return 'en-US';
      case 'de': return 'de-DE';
      case 'zh': return 'zh-CN';
      case 'es': return 'es-ES';
      case 'pt': return 'pt-PT';
      case 'fr': return 'fr-FR';
      case 'ru': return 'ru-RU';
      case 'ro': return 'ro-RO';
      case 'vi': return 'vi-VN';
      case 'el': return 'el-GR';
      case 'ko': return 'ko-KR';
      case 'fi': return 'fi-FI';
      case 'eo': return 'eo';
      case 'ar': return 'ar-SA';
      default: return code || 'en-US';
    }
  }

  function pickVoiceFor(code){
    const list = voicesRef.current || [];
    const lc = (code||'').toLowerCase();
    // Prefer voices starting with the language code; for zh, also match name keywords
    const nameMatches = (v)=>{
      const name = (v.name||'').toLowerCase();
      if(lc==='zh') return /(chinese|mandarin|cantonese|zh|han)/i.test(v.name||'');
      if(lc==='ko') return /korean/i.test(v.name||'');
      if(lc==='ja') return /japanese/i.test(v.name||'');
      if(lc==='ar') return /arabic/i.test(v.name||'');
      if(lc==='ru') return /russian/i.test(v.name||'');
      if(lc==='el') return /greek/i.test(v.name||'');
      if(lc==='vi') return /vietnamese/i.test(v.name||'');
      if(lc==='pt') return /portuguese/i.test(v.name||'');
      if(lc==='es') return /spanish/i.test(v.name||'');
      if(lc==='fr') return /french/i.test(v.name||'');
      if(lc==='ro') return /romanian/i.test(v.name||'');
      if(lc==='fi') return /finnish/i.test(v.name||'');
      if(lc==='eo') return /esperanto/i.test(v.name||'');
      return false;
    };
    const matchesLang = (v)=> (v.lang||'').toLowerCase().startsWith(lc) || nameMatches(v);
    const primary = list.filter(matchesLang);
    // Heuristic: prefer names that hint at male/deep if available
    const score = (v)=>{
      let s=0;
      const name=(v.name||'').toLowerCase();
      const lang=(v.lang||'').toLowerCase();
      if(lang.startsWith(lc)) s+=5;
      if(v.localService) s+=1; if(v.default) s+=1;
      if(/male|baritone|bass|deep|low/.test(name)) s+=2;
      return -s; // smaller is better for Array.sort
    };
  const candidates = (primary.length? primary: list).slice().sort((a,b)=> score(a)-score(b));
    return candidates[0] || null;
  }

  // (Removed gender hint; voice names are not reliable indicators.)

  // TTS controls will be defined after readVerses and versesContainerRef to avoid TDZ errors
  const loadTokenRef=useRef(0); const bibleCacheRef=useRef({}); const bookCache=useRef({});
  const BASE=import.meta?.env?.BASE_URL || '/';
  const FETCH_TIMEOUT_MS=8000;
  const MAX_SEARCH_RESULTS=5000;
  // Derived counts & groupings declared later to avoid duplication after refactor
  function normalizeBible(data){ data.forEach(b=>{ if(!b.name) b.name = b.abbrev? String(b.abbrev).toUpperCase():'Unknown'; }); }
  function validateBibleStructure(raw){ return Array.isArray(raw) && raw.every(b=> b && typeof b==='object' && Array.isArray(b.chapters)); }
  function coerceBible(raw){ if(validateBibleStructure(raw)) return raw; if(raw && typeof raw==='object'){ const cand = raw.books || raw.bible || raw.data; if(validateBibleStructure(cand)) return cand; } throw new Error('Invalid JSON format'); }
  async function loadBibleVersion(abbr, opts={}){
    const persist = opts.persist !== false;
    if(!abbr) return false;
  // Retrieve saved default (from Settings) and last position (from reading). Default takes precedence.
  let savedPos = null; let defaultPos = null;
  try { const raw = localStorage.getItem(`br_pos_${abbr}`); if(raw) savedPos = JSON.parse(raw); } catch {}
  try { const rawD = localStorage.getItem(`br_default_pos_${abbr}`); if(rawD) defaultPos = JSON.parse(rawD); } catch {}
    // Cache hit
    if(bibleCacheRef.current[abbr]){
      const data = bibleCacheRef.current[abbr];
      setBible(data);
      setVersion(abbr);
  try { if(persist) localStorage.setItem('br_version', abbr); } catch {}
      // Apply default (book required; chapter optional=>first), else last position, else start
      let posB = null, posC = null;
      if(defaultPos && typeof defaultPos.bookIdx==='number'){
        posB = defaultPos.bookIdx;
        posC = (typeof defaultPos.chapterIdx==='number') ? defaultPos.chapterIdx : 0;
      } else if(savedPos && typeof savedPos.bookIdx==='number' && typeof savedPos.chapterIdx==='number'){
        posB = savedPos.bookIdx; posC = savedPos.chapterIdx;
      }
      if(posB!=null && posC!=null){
        const bMax = Math.max(0, (data?.length||1)-1);
        const bIdx = Math.min(Math.max(0, posB|0), bMax);
        const cMax = Math.max(0, ((data?.[bIdx]?.chapters?.length)||1)-1);
        const cIdx = Math.min(Math.max(0, posC|0), cMax);
        const vCount = (data?.[bIdx]?.chapters?.[cIdx]?.length)||0;
        const vStartSaved = Math.max(1, Number((defaultPos&&typeof defaultPos.bookIdx==='number')? defaultPos.vStart : savedPos?.vStart)||1);
        const vEndSaved = Math.max(0, Number((defaultPos&&typeof defaultPos.bookIdx==='number')? defaultPos.vEnd : savedPos?.vEnd)||0);
        const vEndEff = vEndSaved===0? 0 : Math.min(Math.max(1, vEndSaved), vCount);
        const vStartEff = Math.min(vStartSaved, vEndEff||vStartSaved);
        setBookIdx(bIdx); setChapterIdx(cIdx); setVStart(vStartEff); setVEnd(vEndEff);
      } else {
        setBookIdx(0); setChapterIdx(0); setVStart(1); setVEnd(0);
      }
      setAttemptLog(l=>[...l,`cacheHit:${abbr}`].slice(-60));
      return true;
    }
    setLastAttempt(abbr);
    setAttemptLog(l=>[...l,`try:${abbr}`].slice(-60));
    setLoadingVersion(true);
    setVersionError(null);
    const myToken=++loadTokenRef.current;
    let data=null;
    try {
      // Direct whole-bible JSON fetch
      try {
        const controller=new AbortController();
        const to=setTimeout(()=>controller.abort(),FETCH_TIMEOUT_MS);
        let res;
        try {
          res=await fetch(`${BASE}bibles/${abbr}.json`,{cache:'no-cache',signal:controller.signal});
        } finally { clearTimeout(to); }
        if(res?.ok){
          setAttemptLog(l=>[...l,`status:${abbr}:200`].slice(-60));
          const buf=await res.arrayBuffer();
          const dec=new TextDecoder('utf-8');
            let text=dec.decode(buf);
            if(text.charCodeAt(0)===0xFEFF) text=text.slice(1);
            let raw;
            try { raw=JSON.parse(text); }
            catch { setAttemptLog(l=>[...l,`parseErr:${abbr}`].slice(-60)); throw new Error('JSON parse error'); }
            try { data=coerceBible(raw); }
            catch { setAttemptLog(l=>[...l,`structureErr:${abbr}`].slice(-60)); throw new Error('Structure error'); }
        } else if(res){
          setAttemptLog(l=>[...l,`status:${abbr}:${res.status}`].slice(-60));
        }
      } catch(fetchErr){
        setAttemptLog(l=>[...l,`fetchErr:${abbr}`].slice(-60));
        if(!versionError) setVersionError(String(fetchErr?.message||fetchErr));
      }
      // Lazy mode fallback (meta + first book)
      if(!data && lazyMode){
        try {
          const metaRes=await fetch(`${BASE}bibles/${abbr}/meta.json`,{cache:'no-cache'});
          if(metaRes.ok){
            const meta=await metaRes.json();
            setMetaMap(m=>({...m,[abbr]:meta}));
            setAttemptLog(l=>[...l,`meta:${abbr}`].slice(-60));
            const first=meta.books?.[0];
            if(first){
              const bRes=await fetch(`${BASE}bibles/${abbr}/${first.file}`,{cache:'no-cache'});
              if(bRes.ok){
                const bRaw=await bRes.json();
                const book={name:bRaw.name,abbrev:bRaw.abbrev,chapters:bRaw.chapters};
                data=[book];
                bookCache.current[`${abbr}:0`]=book;
                setAttemptLog(l=>[...l,`lazyFirstBook:${abbr}`].slice(-60));
              }
            }
          }
        } catch { /* ignore */ }
      }
  // Bundled import fallback removed to avoid dynamic import issues in dev.
      if(!data) throw new Error('No data loaded');
      normalizeBible(data);
      if(loadTokenRef.current!==myToken){
        setAttemptLog(l=>[...l,`staleDrop:${abbr}`].slice(-60));
        return false;
      }
      setBible(data);
      setVersion(abbr);
  try { if(persist) localStorage.setItem('br_version', abbr); } catch {}
      if(data.length>=3) bibleCacheRef.current[abbr]=data;
      setAttemptLog(l=>[...l,`success:${abbr}`].slice(-60));
      // Apply default (book required; chapter optional=>first), else last position, else start
      let posB2 = null, posC2 = null;
      if(defaultPos && typeof defaultPos.bookIdx==='number'){
        posB2 = defaultPos.bookIdx;
        posC2 = (typeof defaultPos.chapterIdx==='number') ? defaultPos.chapterIdx : 0;
      } else if(savedPos && typeof savedPos.bookIdx==='number' && typeof savedPos.chapterIdx==='number'){
        posB2 = savedPos.bookIdx; posC2 = savedPos.chapterIdx;
      }
      if(posB2!=null && posC2!=null){
        const bMax = Math.max(0, (data?.length||1)-1);
        const bIdx = Math.min(Math.max(0, posB2|0), bMax);
        const cMax = Math.max(0, ((data?.[bIdx]?.chapters?.length)||1)-1);
        const cIdx = Math.min(Math.max(0, posC2|0), cMax);
        const vCount = (data?.[bIdx]?.chapters?.[cIdx]?.length)||0;
        const vStartSaved = Math.max(1, Number((defaultPos&&typeof defaultPos.bookIdx==='number')? defaultPos.vStart : savedPos?.vStart)||1);
        const vEndSaved = Math.max(0, Number((defaultPos&&typeof defaultPos.bookIdx==='number')? defaultPos.vEnd : savedPos?.vEnd)||0);
        const vEndEff = vEndSaved===0? 0 : Math.min(Math.max(1, vEndSaved), vCount);
        const vStartEff = Math.min(vStartSaved, vEndEff||vStartSaved);
        setBookIdx(bIdx); setChapterIdx(cIdx); setVStart(vStartEff); setVEnd(vEndEff);
      } else {
        setBookIdx(0); setChapterIdx(0); setVStart(1); setVEnd(0);
      }
      return true;
    } catch(e){
      setVersionError(`Error loading "${abbr}": ${e.message||e}`);
      setAttemptLog(l=>[...l,`fail:${abbr}`].slice(-60));
      return false;
    } finally {
      setLoadingVersion(false);
    }
  }
  async function attemptLoadAny(list){ for(const v of list){ const ok=await loadBibleVersion(v.abbreviation); if(ok) return true; } if(!bible){ setBible(SAMPLE_BIBLE); setVersion('sample'); } return false; }

  // Load versions index on mount
  useEffect(()=>{ let cancelled=false; (async()=>{
    try {
      const res=await fetch(`${BASE}bibles/index.json`,{cache:'no-cache'});
      if(!res.ok) throw new Error('index fetch');
      const idx=await res.json(); if(cancelled) return;
      const flat = idx.flatMap(g=> g.versions.map(v=>({language:g.language,name:v.name,abbreviation:v.abbreviation})));
      // Priority order: de_schlachter, en_kjv then rest alphabetical
      const priority=['de_schlachter','en_kjv'];
      const picked = priority.map(ab=> flat.find(v=> v.abbreviation===ab)).filter(Boolean);
      const rest = flat.filter(v=> !priority.includes(v.abbreviation)).sort((a,b)=> a.name.localeCompare(b.name));
      const ordered=[...picked,...rest];
      setVersions(ordered);
      if(ordered.length){
        let loadedAny = false;
        const stored = storedVersionRef.current && ordered.find(v=> v.abbreviation===storedVersionRef.current);
        if(stored){
          const ok = await loadBibleVersion(stored.abbreviation);
          loadedAny = loadedAny || ok;
          if(!ok){
            // fall back to first priority
            const preferred=ordered[0];
            if(preferred){
              const ok2 = await loadBibleVersion(preferred.abbreviation);
              loadedAny = loadedAny || ok2;
            }
          }
        } else {
          const preferred=ordered[0];
          if(preferred){
            const ok = await loadBibleVersion(preferred.abbreviation);
            loadedAny = loadedAny || ok;
          }
        }
        // Do NOT attempt to load other versions if we've already loaded one;
        // this avoids overriding the user's stored selection on startup.
        if(!loadedAny){
          const others=ordered.slice(1);
          if(others.length) attemptLoadAny(others);
        }
      }
    } catch {
      if(!cancelled){ setBible(SAMPLE_BIBLE); setVersion('sample'); }
    }
  })(); return ()=>{ cancelled=true; }; },[]);

  // Load prophecies once (non-blocking)
  useEffect(()=>{
    (async()=>{
      try {
        const base = import.meta?.env?.BASE_URL || '/';
        const res = await fetch(`${base}prophecies.json`, { cache:'no-cache' });
        if(!res.ok) throw new Error('prophecies fetch');
        const data = await res.json();
  if(Array.isArray(data)) setProphecies(data);
      } catch(e){ setProphecyError(String(e?.message||e)); }
    })();
  },[]);

  // Helpers: extract verses for a reference like "Isaiah 53:1-12" using canonical order mapping
  const CANONICAL_BOOKS = useMemo(()=>[
    'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'
  ],[]);
  function extractVersesFromRef(ref){
    try {
      if(!ref || !Array.isArray(bible) || !bible.length) return '';
      // Only handle single-range refs of form "Book Name C:V-V" or "Book Name C:V" for now.
      // For multiple refs separated by ';', take the first for brevity.
      const first = String(ref).split(/;|,/)[0].trim();
  // Remove trailing notes in parentheses or after semicolon-like commentary markers
  const noteIdx = first.search(/\s\(/);
  const coreRef = noteIdx>0 ? first.slice(0,noteIdx).trim() : first;
  let working = coreRef;
      const m = first.match(/^(.*?)(\d+):(\d+)(?:-(\d+))?$/); // book (may have space at end), chapter, vStart, vEnd?
      if(!m) return '';
      const rawBook = m[1].trim();
      const chap = parseInt(m[2],10)-1; // zero-based
      const vStart = parseInt(m[3],10);
      const vEnd = m[4]? parseInt(m[4],10): vStart;
      // Locate book index by canonical name order (assumes ordering matches JSON order)
      // Find canonical match by startsWith (case-insensitive), else exact
      const bookCanonIdx = CANONICAL_BOOKS.findIndex(cb=> cb.toLowerCase()===rawBook.toLowerCase() || cb.toLowerCase().startsWith(rawBook.toLowerCase()));
      if(bookCanonIdx<0 || bookCanonIdx>=bible.length) return '';
      const book = bible[bookCanonIdx];
      const chapterArr = book?.chapters?.[chap];
      if(!Array.isArray(chapterArr)) return '';
      const start = Math.max(1, vStart);
      const end = Math.max(start, vEnd);
      const picked = [];
      for(let v=start; v<=end && v<=chapterArr.length; v++){
        const text = chapterArr[v-1];
        if(!text) continue;
        picked.push(text.trim());
      }
      return picked.join(' ');
    } catch { return ''; }
  }
  // Enhanced: return array of {n,text} for numbering
  function extractVerseObjects(ref){
    try {
      if(!ref || !Array.isArray(bible) || !bible.length) return [];
      const first = String(ref).split(/;|,/)[0].trim();
      const core = first.replace(/\s*\(.*/, '').trim();
      // Unified pattern:
      // 1. Book C:V-V   -> groups: book, chap, vStart, vEnd
      // 2. Book C:V     -> book, chap, vStart
      // 3. Book C       -> book, chap (whole chapter)
      // 4. Book C-C2    -> book, chapStart, chapEnd (whole chapter range)
      const unified = core.match(/^([1-3]?\s?[A-Za-z.]+(?:\s+[A-Za-z.]+)*)\s+(\d+)(?:(?::(\d+)(?:-(\d+))?)|\s*[-–—]\s*(\d+))?$/);
      if(!unified) return [];
      let rawBook = unified[1];
      const chap1 = parseInt(unified[2],10);
      const verseStart = unified[3]? parseInt(unified[3],10): null;
      const verseEnd = unified[4]? parseInt(unified[4],10): null;
      const chap2 = (!unified[3] && unified[5])? parseInt(unified[5],10): null; // multi-chapter when no verses part
      // Normalize abbreviations
      const abbrevMap = {
        'ex':'exodus','exo':'exodus','exod':'exodus','gen':'genesis','lev':'leviticus','num':'numbers','deut':'deuteronomy','ps':'psalms','psa':'psalms','prov':'proverbs','pr':'proverbs','song':'song of solomon','cant':'song of solomon','eccl':'ecclesiastes'
      };
      let norm = rawBook.toLowerCase().replace(/\.$/, '');
      norm = abbrevMap[norm] || norm;
      const bookIdx = CANONICAL_BOOKS.findIndex(cb=> {
        const low = cb.toLowerCase();
        return low===norm || low.startsWith(norm) || norm.startsWith(low);
      });
      if(bookIdx<0 || bookIdx>=bible.length) return [];
      const book = bible[bookIdx];
      const out = [];
      if(chap2){
        for(let c=chap1; c<=chap2; c++){
          const arr = book?.chapters?.[c-1];
          if(!Array.isArray(arr)) continue;
          for(let v=1; v<=arr.length; v++){
            const t = arr[v-1]; if(!t) continue; out.push({ n: `${c}:${v}`, text: t.trim() });
          }
        }
        return out;
      }
      const chapterArr = book?.chapters?.[chap1-1];
      if(!Array.isArray(chapterArr)) return [];
      if(verseStart==null){
        // whole chapter
        for(let v=1; v<=chapterArr.length; v++){
          const t = chapterArr[v-1]; if(!t) continue; out.push({ n:v, text:t.trim() });
        }
        return out;
      }
      const start = Math.max(1, verseStart);
      const end = Math.max(start, verseEnd||verseStart);
      for(let v=start; v<=end && v<=chapterArr.length; v++){
        const t = chapterArr[v-1]; if(!t) continue; out.push({ n:v, text:t.trim() });
      }
      return out;
    } catch { return []; }
  }

  // Load and persist reader settings
  useEffect(()=>{
    // First, check for URL-encoded settings (?s=...)
    try {
      const params = new URLSearchParams(window.location.search);
      const sParam = params.get('s');
      if(sParam){
        const decodeForURL = (s)=>{
          let b64 = s.replace(/-/g,'+').replace(/_/g,'/');
          const pad = b64.length % 4; if(pad) b64 += '==='.slice(pad);
          const json = decodeURIComponent(escape(atob(b64)));
          return JSON.parse(json);
        };
        const payload = decodeForURL(sParam);
        if(payload && typeof payload==='object'){
          // theme/version
          if(payload.theme==='dark' || payload.theme==='light' || payload.theme==='system') setTheme(payload.theme);
          if(typeof payload.version==='string' && payload.version){
            // async load selected version; ignore failure
            loadBibleVersion(payload.version);
          }
          const s = payload.settings || payload; // allow plain object
          if(s){
            if(typeof s.readerFontSize==='number') setReaderFontSize(clamp(s.readerFontSize, 8, 28));
            if(s.readerFontFamily==='serif' || s.readerFontFamily==='sans') setReaderFontFamily(s.readerFontFamily);
            if(typeof s.lineHeightPx==='number') setLineHeightPx(clamp(s.lineHeightPx, 12, 64));
            if(typeof s.readerWidthPct==='number') setReaderWidthPct(clamp(s.readerWidthPct, 20, 100));
            if(['blocks','continuous'].includes(s.verseLayout)) setVerseLayout(s.verseLayout);
            if(typeof s.showNumbers==='boolean') setShowNumbers(s.showNumbers);
            if(['inline','superscript'].includes(s.numberStyle)) setNumberStyle(s.numberStyle);
            if(typeof s.justifyText==='boolean') setJustifyText(s.justifyText);
            if(typeof s.hoverHighlight==='boolean') setHoverHighlight(s.hoverHighlight);
            if(typeof s.autoHighlightInRead==='boolean') setAutoHighlightInRead(s.autoHighlightInRead);
          }
          // Clean URL
          try { const url = new URL(window.location.href); url.searchParams.delete('s'); window.history.replaceState({},'', url.toString()); } catch {}
        }
      }
    } catch { /* ignore */ }
    try {
      const raw = localStorage.getItem('br_reader_settings');
      if(raw){
        const s = JSON.parse(raw);
        if(typeof s.readerFontSize==='number') setReaderFontSize(clamp(s.readerFontSize, 8, 28));
        if(s.readerFontFamily==='serif' || s.readerFontFamily==='sans') setReaderFontFamily(s.readerFontFamily);
        // Migrate old string-based spacing to px, or use stored px value
        if(typeof s.lineHeightPx==='number') setLineHeightPx(clamp(s.lineHeightPx, 12, 64));
        else if(['normal','relaxed','loose'].includes(s.lineSpacing)){
          const map = { normal: 28, relaxed: 32, loose: 36 };
          setLineHeightPx(map[s.lineSpacing] ?? 28);
        }
        if(typeof s.readerWidthPct==='number') setReaderWidthPct(clamp(s.readerWidthPct, 20, 100));
        else if(['narrow','normal','wide','full'].includes(s.readerWidth)){
          // migrate old enum to percentage
          const map = { narrow: 50, normal: 75, wide: 90, full: 100 };
          setReaderWidthPct(map[s.readerWidth] ?? 80);
          setReaderWidth(s.readerWidth);
        }
        if(['blocks','continuous'].includes(s.verseLayout)) setVerseLayout(s.verseLayout);
        if(typeof s.showNumbers==='boolean') setShowNumbers(s.showNumbers);
        if(['inline','superscript'].includes(s.numberStyle)) setNumberStyle(s.numberStyle);
        if(typeof s.justifyText==='boolean') setJustifyText(s.justifyText);
        if(typeof s.hoverHighlight==='boolean') setHoverHighlight(s.hoverHighlight);
        if(typeof s.autoHighlightInRead==='boolean') setAutoHighlightInRead(s.autoHighlightInRead);
  // removed paraSpacing setting
      }
    } catch { /* ignore */ }
  },[]);
  useEffect(()=>{
    const s = { readerFontSize, readerFontFamily, lineHeightPx, readerWidthPct, verseLayout, showNumbers, numberStyle, justifyText, hoverHighlight, autoHighlightInRead };
    try { localStorage.setItem('br_reader_settings', JSON.stringify(s)); } catch {}
  },[readerFontSize, readerFontFamily, lineHeightPx, readerWidthPct, verseLayout, showNumbers, numberStyle, justifyText, hoverHighlight, autoHighlightInRead]);
  // Load and persist TTS rate/pitch
  useEffect(()=>{
    try {
      const raw = localStorage.getItem('br_tts_settings');
      if(raw){
        const s = JSON.parse(raw);
        if(typeof s.rate==='number') setTtsRate(clamp(s.rate, 0.50, 2.00));
        if(typeof s.pitch==='number') setTtsPitch(clamp(s.pitch, 0.25, 2.00));
        if(typeof s.allowBackgroundTTS==='boolean') setAllowBackgroundTTS(!!s.allowBackgroundTTS);
      }
    } catch { /* ignore */ }
  },[]);
  useEffect(()=>{
    try { localStorage.setItem('br_tts_settings', JSON.stringify({ rate: ttsRate, pitch: ttsPitch, allowBackgroundTTS })); } catch {}
  },[ttsRate, ttsPitch, allowBackgroundTTS]);
  // Auto-highlight search terms in Read mode if enabled
  useEffect(()=>{
    if(autoHighlightInRead && mode==='read'){
      setHighlightInRead(!!query);
    }
  },[autoHighlightInRead, mode, query]);

  // Apply theme to root (supports 'system')
  useEffect(()=>{
    const root=document.documentElement;
    const isDark = theme==='dark' || (theme==='system' && systemPrefersDark);
    if(isDark) root.classList.add('dark'); else root.classList.remove('dark');
    try { localStorage.setItem('br_theme', theme); } catch {}
  },[theme, systemPrefersDark]);
  // Capture beforeinstallprompt to show Install button
  useEffect(()=>{
    // Track install status (Chrome/Edge + iOS Safari)
    const updateInstalled = () => {
      try {
        const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                           window.matchMedia('(display-mode: window-controls-overlay)').matches;
        // iOS Safari
        // @ts-ignore
        const iosStandalone = !!window.navigator.standalone;
        setIsInstalled(!!(standalone || iosStandalone));
      } catch { setIsInstalled(false); }
    };
    updateInstalled();

    const onInstalled = () => { setIsInstalled(true); setDeferredPrompt(null); setCanInstall(false); };
    window.addEventListener('appinstalled', onInstalled);

    const mql = window.matchMedia('(display-mode: standalone)');
    const onChange = () => updateInstalled();
    if (mql.addEventListener) mql.addEventListener('change', onChange); else if (mql.addListener) mql.addListener(onChange);

    const onBIP = (e) => { e.preventDefault(); setDeferredPrompt(e); setCanInstall(true); };
    window.addEventListener('beforeinstallprompt', onBIP);

    return ()=>{
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
      if (mql.removeEventListener) mql.removeEventListener('change', onChange); else if (mql.removeListener) mql.removeListener(onChange);
    };
  },[]);
  useEffect(()=>{
    setCanInstall(!!deferredPrompt && !isInstalled);
  },[deferredPrompt, isInstalled]);
  async function proceedInstall(){
    try {
      if(!deferredPrompt) { setShowInstallConfirm(false); return; }
      setShowInstallConfirm(false);
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if(choice?.outcome === 'accepted'){
        setCanInstall(false);
        setDeferredPrompt(null);
      }
    } catch {
      setShowInstallConfirm(false);
    }
  }
  // Close About overlay on Escape
  useEffect(()=>{ if(!showAbout) return; const onKey=(e)=>{ if(e.key==='Escape') setShowAbout(false); }; window.addEventListener('keydown',onKey); return ()=> window.removeEventListener('keydown',onKey); },[showAbout]);
  const currentBook = bible?.[bookIdx]; const chapterCount=currentBook?.chapters.length || 0; const verseCount=currentBook?.chapters[chapterIdx]?.length || 0; const vEndEffective = vEnd===0? verseCount : clamp(vEnd,1,verseCount); const vStartEffective = clamp(vStart,1,vEndEffective); const searchObj = useMemo(()=> buildSearchRegex(query,searchMode,{caseSensitive}),[query,searchMode,caseSensitive]);
  // Cross-book navigation helpers for header arrows
  const hasPrevChapterOverall = !!bible && (bookIdx>0 || chapterIdx>0);
  const hasNextChapterOverall = !!bible && (bookIdx < ((bible?.length||0)-1) || chapterIdx < (chapterCount-1));
  const goPrevChapter = useCallback(()=>{
    if(!bible) return;
    if(chapterIdx>0){
      setChapterIdx(c=> Math.max(0, (c|0)-1));
    } else if(bookIdx>0){
      const prevB = (bookIdx|0)-1;
      const lastCh = Math.max(0, ((bible?.[prevB]?.chapters?.length||1)-1));
      setBookIdx(prevB);
      setChapterIdx(lastCh);
    } else {
      return; // already at first book/chapter
    }
    // Always show full chapter after jump
    setVStart(1); setVEnd(0);
    setTimeout(()=> readPaneRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  },[bible, bookIdx, chapterIdx]);
  const goNextChapter = useCallback(()=>{
    if(!bible) return;
    const thisBook = bible?.[bookIdx];
    const lastIdx = Math.max(0, (thisBook?.chapters?.length||1)-1);
    if(chapterIdx < lastIdx){
      setChapterIdx(c=> Math.min(lastIdx, (c|0)+1));
    } else if(bookIdx < ((bible?.length||0)-1)){
      setBookIdx(b=> (b|0)+1);
      setChapterIdx(0);
    } else {
      return; // already at last book/chapter
    }
    setVStart(1); setVEnd(0);
    setTimeout(()=> readPaneRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  },[bible, bookIdx, chapterIdx]);

  // Persist reading position per version whenever it changes
  useEffect(()=>{
    if(!version) return;
    try {
      const pos = { bookIdx, chapterIdx, vStart, vEnd };
      localStorage.setItem(`br_pos_${version}`, JSON.stringify(pos));
    } catch {}
  },[version,bookIdx,chapterIdx,vStart,vEnd]);
  useEffect(()=>{ const t=setTimeout(()=> setQuery(queryInput.trim()),500); return ()=> clearTimeout(t); },[queryInput]);
  const readVerses = useMemo(()=> !currentBook? []: (currentBook.chapters[chapterIdx]||[]).slice(vStartEffective-1,vEndEffective).map((t,i)=>({n:i+vStartEffective,text:t})),[currentBook,chapterIdx,vStartEffective,vEndEffective]);

  // TTS controls (declared after readVerses to avoid TDZ errors)
  const stopTTS = useCallback(()=>{
    if(!ttsSupported) return;
    // Mark stopped BEFORE cancel so onend handlers bail out
    ttsStoppedRef.current = true;
    // Invalidate any in-flight session so stale onend handlers do nothing
    ttsRunIdRef.current += 1;
    // Detach handlers from the current utterance, if any
    try { if(currentUtterRef.current){ currentUtterRef.current.onend = null; currentUtterRef.current.onerror = null; } } catch {}
    try { window.speechSynthesis.cancel(); } catch {}
    // Preserve the current index as the last remembered verse
    if((ttsIndexRef.current|0) >= 0){
      ttsLastIndexRef.current = ttsIndexRef.current|0;
      setTtsLastVisibleIndex(ttsLastIndexRef.current);
    }
    ttsIndexRef.current = -1;
    setTtsActiveIndex(-1);
    setTtsStatus('idle');
  },[ttsSupported]);

  // Option 1: Stop TTS when app is hidden or being closed (reliable user intent on mobile)
  useEffect(()=>{
    const releaseWakeLock = ()=>{ try { wakeLockRef.current?.release?.(); } catch {} wakeLockRef.current = null; };
    const onVis = ()=>{
      try {
        if(document.hidden){
          releaseWakeLock();
          // If background TTS is allowed, don't forcibly stop on hide
          if(!allowBackgroundTTS){
            stopTTS();
          }
        }
      } catch {}
    };
    const onHide = ()=>{ releaseWakeLock(); stopTTS(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('beforeunload', onHide);
    return ()=>{
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('beforeunload', onHide);
    };
  },[stopTTS, allowBackgroundTTS]);

  const speakIndex = useCallback((i)=>{
    if(!ttsSupported) return;
    if(i<0 || i>=readVerses.length){ stopTTS(); return; }
  ttsIndexRef.current = i; setTtsActiveIndex(i);
  ttsLastIndexRef.current = i; setTtsLastVisibleIndex(i);
  // Reset stop flag for a new utterance chain
  ttsStoppedRef.current = false;
  const myRun = ttsRunIdRef.current;
    // Auto-scroll active verse into view
    try {
      const v = readVerses[i];
      const el = versesContainerRef.current?.querySelector?.(`div[data-bookidx="${bookIdx}"][data-chapter="${chapterIdx+1}"][data-verseidx="${v.n}"]`);
      el?.scrollIntoView({ block:'center', behavior:'smooth' });
    } catch {}
  const v = readVerses[i];
  const utter = new SpeechSynthesisUtterance();
  // Speak only the verse text; do not read the verse number
  utter.text = `${v.text}`;
    utter.rate = ttsRate; utter.pitch = ttsPitch; utter.volume = 1;
    // Always set the desired language; only bind a voice if it matches that language
    const desiredLang = defaultLocaleFor(versionLangCode);
    utter.lang = desiredLang;
    // Prefer user-selected voice for this language; else auto-pick
    let preferred = null;
    try {
      const uri = voicePrefMap?.[versionLangCode];
      if(uri){ preferred = (voicesRef.current||[]).find(v=> v.voiceURI===uri) || null; }
    } catch { preferred = null; }
    // Fallback to automatic choice
    if(!preferred) preferred = pickVoiceFor(versionLangCode) || null;
    // Cache on ref
    ttsVoiceRef.current = preferred;
    // Bind voice only if it matches language heuristics (avoids wrong-language glitches)
    if(preferred && (((preferred.lang||'').toLowerCase().startsWith((versionLangCode||'').toLowerCase())) || (/zh/i.test(versionLangCode) && /(Chinese|Mandarin|Cantonese|zh|Han)/i.test(preferred.name||'')))){
      utter.voice = preferred;
    }
    function shouldStopByTimer(){ return sleepDeadlineRef.current>0 && Date.now() >= sleepDeadlineRef.current; }
    function shouldStopByTarget(){
      if(stopAtBookIdx==null || stopAtChapterIdx==null) return false;
      // Stop when current position reaches or passes the target end-of-chapter
      return (bookIdx > stopAtBookIdx) || (bookIdx===stopAtBookIdx && chapterIdx >= stopAtChapterIdx);
    }
    function tryAdvanceChapter(){
      if(!bible) return false;
      const b = bible[bookIdx]; if(!b) return false;
      const hasMoreCh = (chapterIdx+1) < (b.chapters?.length||0);
      if(hasMoreCh){ ttsAdvancingRef.current = true; setChapterIdx(chapterIdx+1); setVStart(1); setVEnd(0); return true; }
      // move to next book
      const hasMoreBooks = (bookIdx+1) < (bible?.length||0);
      if(hasMoreBooks){ ttsAdvancingRef.current = true; setBookIdx(bookIdx+1); setChapterIdx(0); setVStart(1); setVEnd(0); return true; }
      return false;
    }
    // At verse boundary, check timer immediately; then continue or stop/advance as needed
    utter.onend = ()=>{
      if(ttsRunIdRef.current !== myRun) return;
      if(ttsStoppedRef.current) return;
      const next = (ttsIndexRef.current|0)+1;
      // Stop by timer after each verse
      if(shouldStopByTimer()){
        stopTTS();
        return;
      }
      if(next < readVerses.length){
        // Continue within the same chapter (ignore stop/timer until chapter end)
        speakIndex(next);
      } else {
        // End of chapter: check stop conditions (timer or stop-at target)
        if(shouldStopByTarget() || shouldStopByTimer()){
          stopTTS();
          return;
        }
        // Otherwise, advance to the next chapter/book
        const advanced = tryAdvanceChapter();
        if(!advanced){ stopTTS(); }
      }
    };
    utter.onerror = ()=>{
      if(ttsRunIdRef.current !== myRun) return;
      if(ttsStoppedRef.current) return;
      const next = (ttsIndexRef.current|0)+1;
      // Stop by timer after each verse
      if(shouldStopByTimer()){
        stopTTS();
        return;
      }
      if(next < readVerses.length){
        speakIndex(next);
      } else {
        if(shouldStopByTarget() || shouldStopByTimer()){
          stopTTS();
          return;
        }
        const advanced = tryAdvanceChapter();
        if(!advanced){ stopTTS(); }
      }
    };
    currentUtterRef.current = utter;
    try {
      if(!ttsStoppedRef.current){
        window.speechSynthesis.cancel(); // clear any pending
        window.speechSynthesis.speak(utter);
      }
    } catch {}
  },[ttsSupported,readVerses,ttsRate,ttsPitch,versionLangCode,stopTTS,bookIdx,chapterIdx,voicePrefMap,bible,stopAtBookIdx,stopAtChapterIdx]);

  const startTTS = useCallback((from)=>{
    if(!ttsSupported || !readVerses.length) return;
    ttsStoppedRef.current = false;
  // Start a fresh session
  ttsRunIdRef.current += 1;
  currentUtterRef.current = null;
  // Fresh language => refresh voice selection; do not force voice if not matching
  ttsVoiceRef.current = pickVoiceFor(versionLangCode) || null;
  // Arm sleep timer deadline if configured
  {
  const mins = readForMinutesRef.current|0;
    if(mins>0){ sleepDeadlineRef.current = Date.now() + Math.max(1, Math.floor(mins*60*1000)); } else { sleepDeadlineRef.current = 0; }
  }
  setTtsStatus('playing');
    // Start at provided index, else remembered last verse, else 0
    let startIndex = (typeof from === 'number' ? from : ttsLastIndexRef.current|0);
    if(!(startIndex>=0 && startIndex<readVerses.length)) startIndex = 0;
    speakIndex(clamp(startIndex,0,readVerses.length-1));
  },[ttsSupported,readVerses,versionLangCode,speakIndex,readForMinutes]);

  // Option 2: Keep screen awake while TTS is playing (best-effort; no-op if unsupported)
  useEffect(()=>{
    let cancelled = false;
    async function acquireWakeLock(){
      try {
        if(cancelled) return;
        if(!('wakeLock' in navigator)) return;
        if(document.hidden) return;
        if(ttsStatus !== 'playing') return;
        // @ts-ignore - Wake Lock is experimental in some TS libs
        const sentinel = await navigator.wakeLock.request('screen');
        if(cancelled) { try { sentinel?.release?.(); } catch {} return; }
        wakeLockRef.current = sentinel;
        const onRelease = ()=>{
          wakeLockRef.current = null;
          // If still playing and visible, try to re-acquire (e.g., after orientation change)
          if(!document.hidden && ttsStatus === 'playing'){
            acquireWakeLock();
          }
        };
        try { sentinel.addEventListener?.('release', onRelease); } catch {}
      } catch {
        // Ignore failures (iOS/Safari or user denied)
      }
    }
    if(ttsStatus === 'playing'){
      acquireWakeLock();
    } else {
      try { wakeLockRef.current?.release?.(); } catch {} finally { wakeLockRef.current = null; }
    }
    return ()=>{ cancelled = true; try { wakeLockRef.current?.release?.(); } catch {} wakeLockRef.current = null; };
  },[ttsStatus]);

  // When version language changes, clear cached voice to force a re-pick next time
  useEffect(()=>{
    ttsVoiceRef.current = null;
  },[versionLangCode]);

  // Persist voice preferences
  useEffect(()=>{
    try { localStorage.setItem('br_tts_voice_prefs', JSON.stringify(voicePrefMap||{})); } catch {}
  },[voicePrefMap]);

  const pauseTTS = useCallback(()=>{ if(!ttsSupported) return; try { window.speechSynthesis.pause(); } catch {} setTtsStatus('paused'); },[ttsSupported]);
  const resumeTTS = useCallback(()=>{ if(!ttsSupported) return; try { window.speechSynthesis.resume?.(); } catch {} setTtsStatus('playing'); },[ttsSupported]);

  // Re-arm the sleep deadline if user changes minutes while playing
  useEffect(()=>{
    if(ttsStatus==='playing'){
    const mins = readForMinutesRef.current|0;
      sleepDeadlineRef.current = mins>0 ? (Date.now() + Math.max(1, Math.floor(mins*60*1000))) : 0;
    }
  },[readForMinutes, ttsStatus]);

  // Drive countdown UI while playing (does not change the deadline itself)
  useEffect(()=>{
    if(ttsStatus !== 'playing' || sleepDeadlineRef.current <= 0) return;
    setNowMs(Date.now());
    const id = setInterval(()=> setNowMs(Date.now()), 1000);
    return ()=> clearInterval(id);
  },[ttsStatus, readForMinutes]);

  // Stop TTS when leaving read mode
  useEffect(()=>{ if(mode!=='read'){ stopTTS(); } },[mode,stopTTS]);
  // Stop and reset remembered verse when position or verse range changes,
  // except when we are auto-advancing during continuous TTS.
  useEffect(()=>{
    if(ttsAdvancingRef.current){
      // Defer continuation to a separate effect when verses are ready
      return;
    }
    stopTTS();
    ttsLastIndexRef.current = 0;
    setTtsLastVisibleIndex(0);
  },[bookIdx,chapterIdx,vStart,vEnd,stopTTS]);

  // After auto-advance, when the new chapter/book is set and verses are computed,
  // continue reading from the first verse without resetting the runId/session.
  useEffect(()=>{
    if(!ttsAdvancingRef.current) return;
    if(!ttsSupported) { ttsAdvancingRef.current = false; return; }
    if(!readVerses.length) return; // wait until verses are ready
    const myRun = ttsRunIdRef.current;
    // Reset remembered index for the new chapter and continue
    ttsLastIndexRef.current = 0; setTtsLastVisibleIndex(0);
    ttsIndexRef.current = -1; setTtsActiveIndex(-1);
    ttsAdvancingRef.current = false;
    // Kick the next verse in the same run
    speakIndex(0);
  },[readVerses.length, ttsSupported, speakIndex]);
  const searchResults = useMemo(()=>{ if(!bible || !searchObj) return { rows:[], totalMatches:0, perBook:{}, perChap:{}, exceeded:false }; const targetBooks = searchScope==='book'? [bible[bookIdx]].filter(Boolean) : bible; if(!targetBooks.length) return { rows:[], totalMatches:0, perBook:{}, perChap:{}, exceeded:false }; const rows=[]; const perBook={}; const perChap={}; let total=0; let exceeded=false; outer: for(const b of targetBooks){ let cStart=0, cEnd=b.chapters.length-1; if(searchScope==='book'){ const totalCh=b.chapters.length; const startClamped=Math.max(1,Math.min(chapFrom,totalCh)); const endRaw= chapTo===0? totalCh : Math.max(1,Math.min(chapTo,totalCh)); const endClamped=Math.max(startClamped,endRaw); cStart=startClamped-1; cEnd=endClamped-1; } for(let cIdx=cStart;cIdx<=cEnd;cIdx++){ const ch=b.chapters[cIdx]; for(let vi=0;vi<ch.length;vi++){ const v=ch[vi]; const {count,matched}=countMatches(v,searchObj); if(matched && count>0){ rows.push({ book:b.name, chapter:cIdx+1, verse:vi+1, text:v, count }); total+=count; perBook[b.name]=(perBook[b.name]||0)+count; const key=`${b.name} ${cIdx+1}`; perChap[key]=(perChap[key]||0)+count; if(rows.length>MAX_SEARCH_RESULTS){ exceeded=true; break outer; } } } } } const orderMap=new Map(); bible.forEach((b,i)=>orderMap.set(b.name,i)); rows.sort((a,b)=>{ const ai=orderMap.get(a.book); const bi=orderMap.get(b.book); if(ai!==bi) return ai-bi; if(a.chapter!==b.chapter) return a.chapter-b.chapter; return a.verse-b.verse; }); if(exceeded){ return { rows:[], totalMatches: total, perBook:{}, perChap:{}, exceeded:true }; } return { rows, totalMatches:total, perBook, perChap, exceeded:false }; },[bible,searchObj,searchScope,bookIdx,chapFrom,chapTo]);
  // Canonical (Protestant 66) order list for stable statistics ordering
  const CANONICAL_ORDER = [
    'Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','1 Chronicles','2 Chronicles','Ezra','Nehemiah','Esther','Job','Psalms','Proverbs','Ecclesiastes','Song of Solomon','Isaiah','Jeremiah','Lamentations','Ezekiel','Daniel','Hosea','Joel','Amos','Obadiah','Jonah','Micah','Nahum','Habakkuk','Zephaniah','Haggai','Zechariah','Malachi','Matthew','Mark','Luke','John','Acts','Romans','1 Corinthians','2 Corinthians','Galatians','Ephesians','Philippians','Colossians','1 Thessalonians','2 Thessalonians','1 Timothy','2 Timothy','Titus','Philemon','Hebrews','James','1 Peter','2 Peter','1 John','2 John','3 John','Jude','Revelation'
  ];
  const topBooks = useMemo(()=>{
    if(!bible || !searchResults || searchResults.exceeded) return [];
    const counts = searchResults.perBook || {};
    return CANONICAL_ORDER
      .filter(name => Object.prototype.hasOwnProperty.call(counts,name))
      .map(name => ({ name, count: counts[name] }))
      ;
  },[searchResults,bible]);
  const [selectedBooks,setSelectedBooks]=useState([]); const [selectedChapters,setSelectedChapters]=useState([]);
  // Show/Hide Statistics & Filters (hidden by default, mobile-first)
  const [showStats,setShowStats] = useState(false);
  // Mobile behavior ----------------------------------------------------
  // Removed desktop layout; single mobile-style layout
  const [showControls,setShowControls]=useState(false); // bottom-sheet visibility on mobile
  const [showScrollTop,setShowScrollTop]=useState(false);
  const headerRef = useRef(null);
  const panelRef = useRef(null); // now only used for overlay scroll area
  const readStickyRef = useRef(null);
  const readPaneRef = useRef(null);
  const searchPaneRef = useRef(null);
  const versesContainerRef = useRef(null);
  // Long-press handling for verse share/copy
  const longPressTimerRef = useRef(null);
  const longPressFiredRef = useRef(false);
  const longPressStartRef = useRef({ x:0, y:0 });
  const LONG_PRESS_MS = 600; // good UX: fast but avoids accidental triggers
  // refs declared once above
  // Mobile-only staged controls state
  const [mVersion,setMVersion] = useState('');
  const [mBookIdx,setMBookIdx] = useState(0);
  const [mChapterIdx,setMChapterIdx] = useState(0);
  // Verse range controls removed; always show whole chapter in Read mode
  const [mQuery,setMQuery] = useState('');
  const [mSearchScope,setMSearchScope] = useState('all');
  const [mChapFrom,setMChapFrom] = useState(1);
  const [mChapTo,setMChapTo] = useState(0);
  const [mSearchMode,setMSearchMode] = useState('all');
  const [mCaseSensitive,setMCaseSensitive] = useState(false);
  const mobileChapterRef = useRef(null);
  const [showVersionPicker,setShowVersionPicker] = useState(false);
  const [tempVersion,setTempVersion] = useState('');
  const [versionPickerContext,setVersionPickerContext] = useState('controls'); // 'controls' | 'settings'
  const [showBookPicker,setShowBookPicker] = useState(false);
  const [showChapterPicker,setShowChapterPicker] = useState(false);
  // Picker contexts for version/book/chapter (controls vs settings)
  const [bookPickerContext,setBookPickerContext] = useState('controls'); // 'controls' | 'settings'
  const [chapterPickerContext,setChapterPickerContext] = useState('controls'); // 'controls' | 'settings'
  // Settings defaults (persisted per version)
  const [defaultBookIdx,setDefaultBookIdx] = useState(null);
  const [defaultChapterIdx,setDefaultChapterIdx] = useState(null);
  const [tempBookIdx,setTempBookIdx] = useState(0);
  const [tempChapterIdx,setTempChapterIdx] = useState(0);
  const bottomBarRef = useRef(null);
  const [headerHeight,setHeaderHeight]=useState(72); // may be used for future spacing
  const [bottomBarH,setBottomBarH]=useState(52);
  const caseSensitiveRef = useRef(null);
  // Language labels for Voice picker
  const LANG_LABELS = {
    en:'English', de:'German', zh:'Chinese', es:'Spanish', pt:'Portuguese', fr:'French', ru:'Russian', ro:'Romanian', vi:'Vietnamese', el:'Greek', ko:'Korean', fi:'Finnish', eo:'Esperanto', ar:'Arabic'
  };
  // Languages present across installed/known versions (used by Voice picker)
  const versionLangCodes = useMemo(()=>{
    const codes = new Set();
    // include current version's lang code immediately
    if(versionLangCode) codes.add(versionLangCode.toLowerCase());
    (versions||[]).forEach(v=>{
      // version objects may have different property names; fall back to string itself
      let abbr = '';
      if(typeof v === 'string') abbr = v;
      else abbr = v.abbr || v.abbrev || v.id || v.code || '';
      if(!abbr) return;
      const c = String(abbr).split('_')[0].slice(0,2).toLowerCase();
      if(c) codes.add(c);
    });
    return Array.from(codes).sort();
  },[versions, versionLangCode]);
  // Stats overlay scrollers (top mirror and main content)
  const statsTopScrollRef = useRef(null);
  const statsMainScrollRef = useRef(null);
  const [showVersePicker, setShowVersePicker] = useState(false);
  // Voice picker overlay
  const [showVoicePicker, setShowVoicePicker] = useState(false);

  // measure header + panel sizes for dynamic spacing on mobile
  // Simplified: only track header height (static) for potential future offset
  useEffect(()=>{
    if(headerRef.current){ setHeaderHeight(headerRef.current.offsetHeight || 72); }
  },[mode]);
  // Measure sticky read header height (title+buttons) for precise scroll alignment
  useEffect(()=>{
    const measure = ()=> setStickyReadHeight(readStickyRef.current?.offsetHeight || 0);
    measure();
    window.addEventListener('resize', measure);
    return ()=> window.removeEventListener('resize', measure);
  },[headerHeight, bookIdx, chapterIdx, mode]);
  // Preserve scroll position per mode
  const prevModeRef = useRef(mode);
  useEffect(()=>{
    const prev = prevModeRef.current;
    prevModeRef.current = mode;
        
    // Only restore position if we're switching modes via UI (not jumpTo)
    // jumpTo will handle its own scrolling via pendingScrollVerse
    if(!pendingScrollVerse) {
      const id = requestAnimationFrame(()=>{
        if(mode === 'read'){
          try { readPaneRef.current?.scrollTo({ top: readScrollY, behavior: 'auto' }); } catch {}
        } else {
          try { searchPaneRef.current?.scrollTo({ top: searchScrollY, behavior: 'auto' }); } catch {}
        }
      });
      return ()=> cancelAnimationFrame(id);
    }
  },[mode]);

  // Track scroll positions within panes
  useEffect(()=>{
    const r = readPaneRef.current; const s = searchPaneRef.current;
    let onR, onS;
    if(r){ onR = ()=> setReadScrollY(r.scrollTop); r.addEventListener('scroll', onR, { passive:true }); }
    if(s){ onS = ()=> setSearchScrollY(s.scrollTop); s.addEventListener('scroll', onS, { passive:true }); }
    return ()=>{
      if(r && onR) r.removeEventListener('scroll', onR);
      if(s && onS) s.removeEventListener('scroll', onS);
    };
  },[]);
  // Removed responsive resize listener (always mobile layout)
  // measure bottom bar height for sheet offset
  useEffect(()=>{
    function measureBar(){ if(bottomBarRef.current){ const h = bottomBarRef.current.offsetHeight || 52; setBottomBarH(h); } }
    measureBar();
    window.addEventListener('resize',measureBar);
    return ()=> window.removeEventListener('resize',measureBar);
  },[]);
  // Sync mobile staged state when opening controls
  useEffect(()=>{
    if(!showControls) return;
  if(mode==='read'){
      setMVersion(version);
      setMBookIdx(bookIdx);
      setMChapterIdx(chapterIdx);
    } else {
      setMVersion(version);
      setMQuery(queryInput);
      setMSearchMode(searchMode);
      setMSearchScope(searchScope);
      setMBookIdx(bookIdx);
      setMChapFrom(chapFrom);
      setMChapTo(chapTo);
      setMCaseSensitive(caseSensitive);
    }
  },[showControls,mode,version,bookIdx,chapterIdx,vStart,vEnd,queryInput,searchMode,searchScope,chapFrom,chapTo,caseSensitive]);
  useEffect(()=>{
    function onScroll(){ setShowScrollTop(window.scrollY > 400); }
    window.addEventListener('scroll',onScroll,{passive:true});
    onScroll();
    return ()=> window.removeEventListener('scroll',onScroll);
  },[]);
  // Lock background scroll when full-screen overlays open (controls/about/stats)
  useEffect(()=>{
    const body = document.body;
    const needLock = showControls || showAbout || showStats || showInstallConfirm;
    if(needLock){
      const prev = body.style.overflow;
      body.dataset._prevOverflow = prev;
      body.style.overflow='hidden';
    } else if(body.dataset._prevOverflow!==undefined){
      body.style.overflow=body.dataset._prevOverflow; delete body.dataset._prevOverflow;
    }
    return ()=>{ if(body.dataset._prevOverflow!==undefined){ body.style.overflow=body.dataset._prevOverflow; delete body.dataset._prevOverflow; } };
  },[showControls,showAbout,showStats,showInstallConfirm]);
  // Listen for service worker update availability (dispatched from main.jsx)
  useEffect(()=>{
    function onUpd(e){
      try { swRegRef.current = e.detail?.registration || null; } catch { swRegRef.current = null; }
      setUpdateReady(true);
    }
    window.addEventListener('br_update_available', onUpd);
    return ()=> window.removeEventListener('br_update_available', onUpd);
  },[]);
  function applyUpdateNow(){
    const reg = swRegRef.current;
    if(reg && reg.waiting){
      try { reg.waiting.postMessage('SKIP_WAITING'); } catch {}
      // Mark that reload is user-approved
      window.__br_userInitiatedUpdate = true;
    }
    // Hide toast (reload will happen when controllerchange fires)
    setUpdateReady(false);
  }
  function dismissUpdateToast(){ setUpdateReady(false); }
  // Close Install confirm on Escape
  useEffect(()=>{ if(!showInstallConfirm) return; const onKey=(e)=>{ if(e.key==='Escape') setShowInstallConfirm(false); }; window.addEventListener('keydown',onKey); return ()=> window.removeEventListener('keydown',onKey); },[showInstallConfirm]);
  // Sync the top fancy scrollbar with the hidden main horizontal scroller in Statistics overlay
  useEffect(()=>{
    if(!showStats) return;
    const top = statsTopScrollRef.current;
    const main = statsMainScrollRef.current;
    if(!top || !main) return;
    let syncing = false;
    const fromTop = ()=>{
      if(syncing) return; syncing = true; try { main.scrollLeft = top.scrollLeft; } finally { syncing = false; }
    };
    const fromMain = ()=>{
      if(syncing) return; syncing = true; try { top.scrollLeft = main.scrollLeft; } finally { syncing = false; }
    };
    // Initialize alignment after layout
    const id = requestAnimationFrame(()=>{ try { top.scrollLeft = main.scrollLeft; } catch {} });
    top.addEventListener('scroll', fromTop, { passive:true });
    main.addEventListener('scroll', fromMain, { passive:true });
    return ()=>{
      cancelAnimationFrame(id);
      top.removeEventListener('scroll', fromTop);
      main.removeEventListener('scroll', fromMain);
    };
  },[showStats]);
  // Selections cleared inline when version or search input changes; also defensively here if query/version changed elsewhere
  useEffect(()=>{ if(selectedBooks.length||selectedChapters.length){ setSelectedBooks([]); setSelectedChapters([]);} },[queryInput,version]);
  const chapterBreakdown = useMemo(()=>{ if(searchResults.exceeded) return []; if(selectedBooks.length!==1) return []; const b=selectedBooks[0]; return Object.entries(searchResults.perChap).filter(([k])=> k.startsWith(b+" ")).map(([k,c])=>({ name:k.substring(b.length+1), count:c })).sort((a,b)=> parseInt(a.name)-parseInt(b.name)); },[selectedBooks,searchResults]);
  const filteredRows = useMemo(()=>{ if(!searchResults || searchResults.exceeded) return []; if(selectedChapters.length){ const chapSet=new Set(selectedChapters); return searchResults.rows.filter(r=> chapSet.has(`${r.book} ${r.chapter}`)); } if(selectedBooks.length){ const bookSet=new Set(selectedBooks); return searchResults.rows.filter(r=> bookSet.has(r.book)); } return searchResults.rows; },[searchResults,selectedBooks,selectedChapters]);
  // Filtered total matches (respect selections); falls back to overall total when no selection
  const filteredMatchTotal = useMemo(()=>{
    if(!searchResults || searchResults.exceeded) return 0;
    if(selectedChapters.length){
      return selectedChapters.reduce((sum,key)=> sum + (searchResults.perChap[key]||0), 0);
    }
    if(selectedBooks.length){
      return selectedBooks.reduce((sum,name)=> sum + (searchResults.perBook[name]||0), 0);
    }
    return searchResults.totalMatches || 0;
  },[searchResults, selectedBooks, selectedChapters]);

  // Staged (controls overlay) estimate: approximate results before applying
  const stagedSearchObj = useMemo(
    () => buildSearchRegex(mQuery || '', mSearchMode, { caseSensitive: mCaseSensitive }),
    [mQuery, mSearchMode, mCaseSensitive]
  );
  const preflightEstimate = useMemo(() => {
    const q = (mQuery || '').trim();
    if (!bible || !q || !stagedSearchObj) return { total: 0, verses: 0, exceeded: false };
    let total = 0;
    let verses = 0;
    let exceeded = false;
    const scanBook = (b) => {
      let cStart = 0;
      let cEnd = b.chapters.length - 1;
      if (mSearchScope === 'book') {
        const totalCh = b.chapters.length;
        const startClamped = Math.max(1, Math.min(mChapFrom || 1, totalCh));
        const endRaw = (mChapTo === 0) ? totalCh : Math.max(1, Math.min(mChapTo, totalCh));
        const endClamped = Math.max(startClamped, endRaw);
        cStart = startClamped - 1;
        cEnd = endClamped - 1;
      }
      for (let cIdx = cStart; cIdx <= cEnd; cIdx++) {
        const ch = b.chapters[cIdx];
        for (let vi = 0; vi < ch.length; vi++) {
          const v = ch[vi];
          const { count, matched } = countMatches(v, stagedSearchObj);
          if (matched) {
            verses++;
            total += count;
            if (verses > MAX_SEARCH_RESULTS) { exceeded = true; return true; }
          }
        }
      }
      return false;
    };
    if (mSearchScope === 'book') {
      const b = bible[mBookIdx];
      if (b && scanBook(b)) return { total, verses, exceeded: true };
    } else {
      for (const b of bible) { if (scanBook(b)) return { total, verses, exceeded: true }; }
    }
    return { total, verses, exceeded };
  }, [bible, stagedSearchObj, mSearchScope, mBookIdx, mChapFrom, mChapTo, mQuery]);
  function toggleBook(name){ setSelectedChapters([]); setSelectedBooks(bs=> bs.includes(name)? bs.filter(b=>b!==name): [...bs,name]); }
  function toggleChapter(chName){ setSelectedChapters(cs=> cs.includes(chName)? cs.filter(c=>c!==chName): [...cs,chName]); }
  function resetSelections(){ setSelectedBooks([]); setSelectedChapters([]); }
  function onSelectBook(i){ setBookIdx(i); setChapterIdx(0); setVStart(1); setVEnd(0); }
  function jumpTo(book, chapter, verse){
    if(!bible) return;
    const idx = bible.findIndex(b=> b.name===book || b.abbrev===book);
    if(idx>=0){
      // Save current search scroll position before jumping to read mode
      if(mode === 'search') {
        const sTop = searchPaneRef.current?.scrollTop || 0;
        setSearchScrollY(sTop);
      }
      setBookIdx(idx);
      setChapterIdx(chapter-1);
      // Show full chapter immediately
      setVStart(1);
      setVEnd(0);
      // Enable highlighting and schedule scroll to verse
      setHighlightInRead(true);
      setPendingScrollVerse(verse||1);
      setMode('read');
    }
  }
  // Build shareable text for a verse (includes version and reference)
  function buildVerseShareText(verseText, bookName, chapterNumber, verseNumber){
    const ref = `${bookName} ${chapterNumber}:${verseNumber}`;
    const ver = activeVersionName || version || '';
    return `${verseText}\n— ${ref} (${ver})`;
  }
  async function shareOrCopyText(text){
    try {
      if(navigator.share){
        await navigator.share({ title: 'Bible Verse', text });
        setShareToast('Shared');
      } else if(navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(text);
        setShareToast('Copied');
      } else {
        const ta=document.createElement('textarea');
        ta.value=text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        setShareToast('Copied');
      }
    } catch {
      try { await navigator.clipboard?.writeText(text); setShareToast('Copied'); } catch {}
    } finally {
      setTimeout(()=> setShareToast(''), 1200);
    }
  }
  function handleVersePointerDown(e, verseN, verseText){
    longPressFiredRef.current = false;
    clearTimeout(longPressTimerRef.current);
    try { if(e?.pointerType==='touch') e.preventDefault(); } catch {}
    // record starting position to cancel if user scrolls/moves
    if(e && typeof e.clientX==='number' && typeof e.clientY==='number'){
      longPressStartRef.current = { x: e.clientX, y: e.clientY };
    } else { longPressStartRef.current = { x:0, y:0 }; }
    longPressTimerRef.current = setTimeout(()=>{
      longPressFiredRef.current = true;
      if(ttsSupported){
        setLpAction({ verseN, verseText });
      } else {
        const bookName = bible?.[bookIdx]?.name || '';
        const payload = buildVerseShareText(verseText, bookName, chapterIdx+1, verseN);
        shareOrCopyText(payload);
      }
    }, LONG_PRESS_MS);
  }
  function handleVersePointerMove(e){
    const sx = longPressStartRef.current.x; const sy = longPressStartRef.current.y;
    if(sx===0 && sy===0) return;
    const dx = Math.abs((e?.clientX||0) - sx);
    const dy = Math.abs((e?.clientY||0) - sy);
    if(dx>10 || dy>10){ clearTimeout(longPressTimerRef.current); }
  }
  function handleVersePointerUp(){ clearTimeout(longPressTimerRef.current); }
  function handleVersePointerCancel(){ clearTimeout(longPressTimerRef.current); }
  // After jumping from search, scroll to the target verse in read mode
  useEffect(()=>{
    if(pendingScrollVerse==null) return;
    const v = pendingScrollVerse;
    
    const timer = setTimeout(()=>{
      const cont = readPaneRef.current;
  const abbrSrc = (bible?.[bookIdx]?.abbrev || bible?.[bookIdx]?.name || '');
  const abbr = String(abbrSrc).split(' ').join('_');
      const targetId = `v-${abbr}.${chapterIdx+1}.${v}`;
  // Use getElementById to avoid needing CSS.escape and optional chaining call
  const el = document.getElementById ? document.getElementById(targetId) : null;
      if(cont && el){
        try {
          const doScroll = ()=>{
            const contRect = cont.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            const delta = elRect.top - contRect.top;
            const targetTop = Math.max(0, Math.round(cont.scrollTop + delta - stickyReadHeight));
            cont.scrollTo({ top: targetTop, behavior: 'auto' });
          };
          // Immediate correction
          doScroll();
          // Second pass after layout settles
          setTimeout(()=>{ try { doScroll(); } catch {} }, 60);
        } catch {}
      }
      setPendingScrollVerse(null);
    }, 200);
    return ()=> clearTimeout(timer);
  },[bookIdx,chapterIdx,pendingScrollVerse,stickyReadHeight]);
  // Derived counts for mobile staged selection
  const mChapterCount = bible?.[mBookIdx]?.chapters.length || 0;
  const mVerseCount = bible?.[mBookIdx]?.chapters?.[mChapterIdx]?.length || 0;
  // Group versions by language for mobile reading controls
  const versionsByLanguage = useMemo(()=>{
    const map = new Map();
    versions.forEach(v=>{
      if(!map.has(v.language)) map.set(v.language, []);
      map.get(v.language).push(v);
    });
    // Sort languages alphabetically; keep existing order of versions within each language
    return Array.from(map.entries()).sort((a,b)=> a[0].localeCompare(b[0]));
  },[versions]);
  const currentVersionObj = useMemo(()=> versions.find(v=> v.abbreviation === (mVersion||version)) || null,[versions,mVersion,version]);
  const activeVersionName = useMemo(()=>{
    const v = versions.find(v=> v.abbreviation===version);
    return v ? v.name : version;
  },[versions,version]);
  function saveCurrentPosition(){
    try {
      // Persist as the app-wide defaults used on load (same keys Settings uses)
      const defKey = `br_default_pos_${version}`;
      const pos = { bookIdx, chapterIdx };
      localStorage.setItem(defKey, JSON.stringify(pos));
      localStorage.setItem('br_version', version);
      // Also sync last-read position for completeness
      localStorage.setItem(`br_pos_${version}`, JSON.stringify({ bookIdx, chapterIdx, vStart: 1, vEnd: 0 }));
      // Update Settings state immediately so UI reflects new defaults
      setDefaultBookIdx(bookIdx);
      setDefaultChapterIdx(chapterIdx);
      setShowSaveToast(true);
      setTimeout(()=> setShowSaveToast(false), 1200);
    } catch {}
  }
  function openVersionPicker(ctx){
    const context = ctx || 'controls';
  // Ensure the shared overlay container is visible so the picker can render
  setShowControls(true);
    setVersionPickerContext(context);
    setTempVersion(mVersion||version);
    setShowVersionPicker(true);
  }
  function clearDefaultBook(){
    setDefaultBookIdx(null);
    setDefaultChapterIdx(null);
    try { if(version) localStorage.removeItem(`br_default_pos_${version}`); } catch {}
  }
  function clearDefaultChapter(){
    setDefaultChapterIdx(null);
    try {
      if(!version) return;
      if(defaultBookIdx==null){ localStorage.removeItem(`br_default_pos_${version}`); }
      else { localStorage.setItem(`br_default_pos_${version}`, JSON.stringify({ bookIdx: defaultBookIdx })); }
    } catch {}
  }
  function applyVersionPicker(){
    if(!tempVersion){ setShowVersionPicker(false); return; }
    if(versionPickerContext==='settings'){
      // Apply immediately and persist as the standard version
      loadBibleVersion(tempVersion);
      setShowVersionPicker(false);
      setVersionPickerContext('controls');
      setShowControls(false);
      return;
    }
    // In controls overlay, stage the selection for Apply button
    setMVersion(tempVersion);
    setShowVersionPicker(false);
  }
  function openBookPicker(ctx){
    const context = ctx || 'controls';
    setBookPickerContext(context);
    setShowControls(true);
    const seedBook = context==='settings' ? (defaultBookIdx ?? mBookIdx) : mBookIdx;
    setTempBookIdx(seedBook);
    // Reset chapter temp when switching books inside picker
    setTempChapterIdx(0);
    setShowBookPicker(true);
  }
  function openChapterPicker(ctx){
    const context = ctx || 'controls';
    setChapterPickerContext(context);
    setShowControls(true);
    if(context==='settings'){
      // In settings, seed from defaults
      setTempChapterIdx((defaultChapterIdx ?? 0));
    } else if(mode==='read'){
      setTempChapterIdx(mChapterIdx);
    } else {
      // derive from current search chapter range (use from as representative)
      setTempChapterIdx((mChapFrom||1)-1);
    }
    setShowChapterPicker(true);
  }
  function applyBookPicker(){
    if(bookPickerContext==='settings'){
      setDefaultBookIdx(tempBookIdx);
      // Reset default chapter to first of selected book
      setDefaultChapterIdx(0);
      try { if(version) localStorage.setItem(`br_default_pos_${version}`, JSON.stringify({ bookIdx: tempBookIdx, chapterIdx: 0 })); } catch {}
  setShowControls(false);
    } else {
      setMBookIdx(tempBookIdx); setMChapterIdx(0);
    }
    setShowBookPicker(false);
  }
  function applyChapterPicker(){
    if(chapterPickerContext==='settings'){
      setDefaultChapterIdx(tempChapterIdx);
      try { if(version) localStorage.setItem(`br_default_pos_${version}`, JSON.stringify({ bookIdx: defaultBookIdx ?? mBookIdx, chapterIdx: tempChapterIdx })); } catch {}
  setShowControls(false);
    } else if(mode==='read'){
      setMChapterIdx(tempChapterIdx);
    } else {
      // In search mode treat chapter picker as selecting a single chapter range
      const chap=tempChapterIdx+1; setMChapFrom(chap); setMChapTo(chap);
    }
    setShowChapterPicker(false);
  }
  // Apply handlers for mobile
  function applyRead(){
    const commit = ()=>{
      setBookIdx(mBookIdx);
      setChapterIdx(mChapterIdx);
  // Always show full chapter
  setVStart(1);
  setVEnd(0);
      // Reset read scroll position to top when applying reading changes
      try { setReadScrollY(0); } catch {}
      // After state updates commit, ensure the container scrolls to top
      requestAnimationFrame(()=>{
        try { readPaneRef.current?.scrollTo({ top: 0, behavior: 'auto' }); } catch {}
        // Second pass in case layout shifts after render
        setTimeout(()=>{ try { readPaneRef.current?.scrollTo({ top: 0, behavior: 'auto' }); } catch {} }, 60);
      });
      setShowControls(false);
    };
    if(mVersion && mVersion!==version){
      loadBibleVersion(mVersion, { persist: false }).then(()=> commit());
    } else {
      commit();
    }
  }
  function applySearch(){
    const commit = ()=>{
      setSearchMode(mSearchMode);
      setSearchScope(mSearchScope);
  // Always show full chapter
  setVStart(1);
  setVEnd(0);
      setChapTo(mChapTo);
      setCaseSensitive(mCaseSensitive);
      // Set both input and effective query immediately
      setQuery(mQuery?.trim()||'');
      setQueryInput(mQuery||'');
      setShowControls(false);
    };
    if(mVersion && mVersion!==version){
      loadBibleVersion(mVersion, { persist: false }).then(()=> commit());
    } else {
      commit();
    }
  }
  if(!bible){ return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-slate-100 p-6 text-slate-900"><div className="text-center space-y-4 max-w-md"><div><div className="text-2xl font-semibold">Loading Bible…</div><div className="mt-2 text-sm opacity-70">Attempting to load available versions</div></div>{versionError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{versionError}</div>}<div className="text-left text-[10px] leading-relaxed font-mono max-h-40 overflow-auto bg-slate-900/90 text-slate-200 rounded p-2"><div className="opacity-70">Debug</div><div>versions: {versions.map(v=>v.abbreviation).join(', ') || '—'}</div><div>last: {lastAttempt||'—'}</div>{attemptLog.slice(-10).map((l,i)=><div key={i}>{l}</div>)}</div>{loadingVersion && <div className="text-xs text-slate-500">Loading…</div>}<div className="text-xs text-slate-500">JSON files must reside under <code className="px-1 bg-slate-200 rounded">public/bibles</code>.</div><div><button onClick={()=> versions.length && attemptLoadAny(versions)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white text-sm font-medium px-5 py-2.5 shadow">Retry</button><button onClick={()=> setLazyMode(l=>!l)} className="inline-flex ml-2 items-center gap-2 rounded-xl bg-slate-100 border border-slate-300 text-xs px-3 py-2">LazyMode: {lazyMode? 'ON':'OFF'}</button></div></div></div>); }
  const currentYear = new Date().getFullYear();
  // Dynamic padding top: header + panel (if visible)
  // Mobile: no extra top padding needed; sticky header occupies layout space
  let dynamicPadTop = 0; // unified layout
  return (
  <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-white via-slate-50 to-zinc-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100 transition-colors">
  <header ref={headerRef} className={"sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm border-b border-slate-200 dark:border-slate-700"}>
  <div className="w-full px-4 py-3 flex items-center">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={()=> setShowAbout(true)}
              className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 text-white grid place-content-center font-black tracking-tight text-lg select-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="About this app"
              title="About this app"
            >
              ΑΩ
            </button>
            <nav className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        {['read','search','prophecy'].map(t => (
                <button
                  key={t}
                  aria-label={t==='read' ? 'Read' : t==='search' ? 'Search' : 'Prophecy'}
                  title={t==='read' ? 'Read' : t==='search' ? 'Search' : 'Prophecy'}
                  className={classNames('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    // @ts-ignore existing mode
                    mode===t? 'bg-white dark:bg-slate-900 shadow border border-slate-200 dark:border-slate-600':'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white')}
                  onClick={()=>{
                    // Save current scroll position before switching modes
                    if(mode === 'read') {
                      const rTop = readPaneRef.current?.scrollTop || 0;
                      setReadScrollY(rTop);
                    } else if(mode === 'search') {
                      const sTop = searchPaneRef.current?.scrollTop || 0;
                      setSearchScrollY(sTop);
                    }
                    // (prophecy mode currently has no dedicated scroll restore)
                    setMode(t);
                  }}
                >
                  {t==='read' ? <Icon.Read className="h-4 w-4"/> : t==='search' ? <Icon.Search className="h-4 w-4"/> : <Icon.Prophecy className="h-4 w-4"/>}
                </button>
              ))}
            </nav>
          </div>
          {/* Right-aligned action icons */}
          <div className="ml-auto flex items-center gap-2">
            {mode==='read' && (
              <button
                onClick={saveCurrentPosition}
                aria-label="Save current position"
                title="Save current position"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 text-sm transition-colors"
              >
                <Icon.Save className="h-4 w-4"/>
              </button>
            )}
            <button
              onClick={()=> setShowSettings(true)}
              aria-label="Settings"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 text-sm transition-colors"
            >
              <Icon.Settings className="h-4 w-4"/>
            </button>
            {canInstall && (
              <button
                onClick={()=> setShowInstallConfirm(true)}
                aria-label="Install app"
                title="Install on this device"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 text-sm transition-colors"
              >
                <Icon.Install className="h-4 w-4"/>
              </button>
            )}
          </div>
        </div>
      </header>
      {showInstallConfirm && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Install this app?</div>
            </div>
            <div className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 space-y-2">
              <p>Install Bible Reader to your device for a faster, full-screen experience. You’ll find it on your home screen and it works offline.</p>
              <ul className="list-disc list-inside text-[12px] text-slate-500 dark:text-slate-400 space-y-1">
                <li>No App Store required</li>
                <li>Lightweight and private</li>
                <li>Uninstall any time</li>
              </ul>
            </div>
            <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2">
              <button onClick={()=> setShowInstallConfirm(false)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">Not now</button>
              <button onClick={proceedInstall} className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-indigo-600 text-white border border-slate-900 dark:border-indigo-600">Install</button>
            </div>
          </div>
        </div>
      )}
    {mode==='read' && showSaveToast && (
        <div className="fixed top-14 right-3 z-50 text-xs px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-200 shadow">
      Saved as defaults
        </div>
      )}
    {updateReady && (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[95%] bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-xl rounded-xl px-4 py-3 flex flex-col gap-2 text-[13px] text-slate-700 dark:text-slate-200">
        <div className="font-medium text-slate-800 dark:text-slate-100">Update available</div>
        <div className="text-[12px] text-slate-500 dark:text-slate-400">A new version of the app is ready. Reload to get the latest improvements.</div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={dismissUpdateToast} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">Later</button>
          <button onClick={applyUpdateNow} className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600">Reload now</button>
        </div>
      </div>
    )}

  <main
  className={"flex-1 w-full px-0 pb-0 overflow-hidden transition-[padding] flex flex-col min-h-0"}
  style={{ paddingTop: 0 }}
      >
  {showAbout && (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col">
  <div className="sticky top-0 z-10 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 text-white grid place-content-center font-black tracking-tight text-lg select-none" aria-hidden>
              ΑΩ
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-semibold tracking-tight truncate">About this app</div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Bible reading and smart search.</p>
            </div>
          </div>
          <button onClick={()=> setShowAbout(false)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">Close</button>
        </div>
      </div>
  <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4 text-sm leading-6 text-slate-700 dark:text-slate-300 max-w-2xl">
          <h3 className="text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100">About me</h3>
          <p>
            Hi, I’m <span className="font-medium">David Schmid</span>, a data engineer who loves AI and data science. I built this app to make Bible study fast, focused, and enjoyable.
          </p>
          <p>
            As a conservative, Bible‑believing Christian, my aim is to pair deep respect for Scripture with modern technology—so it’s easier to read, search, and explore God’s Word.
          </p>
          <div className="pt-1 flex flex-wrap items-center gap-3 text-[13px]">
            <a href="https://github.com/dawei7" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
              <span className="font-medium">GitHub</span>
              <span className="text-slate-500">/dawei7</span>
            </a>
            <a href="https://www.linkedin.com/in/david-schmid-56194772/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
              <span className="font-medium">LinkedIn</span>
              <span className="text-slate-500">@david-schmid</span>
            </a>
          </div>

          <div className="my-4 border-t border-slate-200 dark:border-slate-700" />

          <h3 className="text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100">Quick guide</h3>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Modes</h4>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li><span className="font-medium">Read</span> — one chapter at a time with a simple, distraction‑free layout.</li>
              <li><span className="font-medium">Search</span> — find verses fast. Choose All, Any, or Phrase; limit to whole Bible or a single book; optionally narrow to chapter ranges. Tap a result to jump to Read at that verse.</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Reading & navigation</h4>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Use the top arrows to move to the next/previous chapter.</li>
              <li>Open the bottom controls to pick Version · Book · Chapter.</li>
              <li>Long‑press a verse to copy/share its text and reference.</li>
              <li>Save (💾) stores your current Version/Book/Chapter as the default on this device.</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Read aloud (voice)</h4>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Play/Pause to start or pause reading the current chapter; choose the starting verse from the small counter button.</li>
              <li><span className="font-medium">Read for</span> lets you set a timer (presets or custom minutes). A small countdown appears in the button while reading.</li>
              <li>Optionally set a <span className="font-medium">stop‑at</span> book/chapter. It’s inclusive: the app finishes that chapter and then stops.</li>
              <li>Reading stops at whichever comes first: the timer or the inclusive stop‑at. Clear both with the split Clear button next to Read for.</li>
              <li>You can pick a different voice (per language) from the Voice picker.</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Search results & filters</h4>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Results show matching verses. Tap any result to jump to Read at that exact place.</li>
              <li>Open Statistics to see matches by book and chapter, then tap to focus your list.</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Appearance</h4>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Change font size, serif/sans, line height, reader width, and verse number style.</li>
              <li>Theme: System, Light, or Dark.</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Install</h4>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Use the Install button (if offered) to add the app to your home screen for a full‑screen experience.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )}
  {showStats && (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col">
      {/* Solid header to avoid any transparency overlap */}
      <div className="sticky top-0 z-40 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200">Statistics & Filters</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Tap book to filter · tap chapters to refine
              <span className="ml-2 text-slate-400">·</span>
              <span className="ml-2">
                {searchResults?.exceeded
                  ? 'Too many matches'
                  : <>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{((selectedBooks.length || selectedChapters.length) ? filteredMatchTotal : (searchResults?.totalMatches || 0)).toLocaleString()}</span>
                      <span className="ml-1">matches</span>
                    </>}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {Boolean(selectedBooks.length || selectedChapters.length) && (
              <button className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800" onClick={resetSelections}>Clear</button>
            )}
            <button onClick={()=> setShowStats(false)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">Close</button>
          </div>
        </div>
      </div>
  {/* Remove side padding so content is flush left/right */}
  <div className="flex-1 overflow-y-auto px-0 sm:px-0 pt-0 pb-3">
        {searchResults?.exceeded ? (
          <div className="mx-4 sm:mx-0 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-sm text-slate-600 dark:text-slate-300">
            Too many matches to show statistics. Please refine your search.
          </div>
        ) : (
          <div className="-mx-0 sm:mx-0">
            {(()=>{
              const countsByChap = searchResults?.perChap || {};
              const countsByBook = searchResults?.perBook || {};
              const allBooks = (topBooks||[]).map(b=> b.name);
              // Compute width based on chapters that actually have results
              const maxChapters = Math.max(
                1,
                ...((bible||[]) 
                  .filter(b=> allBooks.includes(b.name))
                  .map(b=> {
                    const total = b?.chapters?.length || 0;
                    let withResults = 0;
                    for(let ch=1; ch<=total; ch++){
                      if(countsByChap[`${b.name} ${ch}`] > 0) withResults++;
                    }
                    return withResults;
                  }))
              );
              const maxCount = Math.max(1, ...Object.values(countsByChap));
              const cellSize = 26; // px
              const SCROLL_PAD = 8; // extra px to prevent last button from being clipped
              function colorFor(val){
                if(!val) return theme==='dark'? 'rgba(148,163,184,0.15)':'rgba(15,23,42,0.05)';
                const t = Math.min(1, val / maxCount);
                const light = `rgba(37, 99, 235, ${0.15 + t*0.75})`;
                const dark  = `rgba(14, 165, 233, ${0.25 + t*0.65})`;
                return theme==='dark'? dark : light;
              }
              // Use a fixed, generous label column width so every row aligns perfectly
              const labelAreaW = 164; // px – allow room for count badge
        return (
          <div className="w-full rounded-none bg-white dark:bg-slate-900">
                    {/* Fancy top scrollbar (synced with the hidden bottom scroller) sticky, flush and opaque; add divider line */}
                    <div className="sticky top-0 z-30 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                      <div ref={statsTopScrollRef} className="fancy-hscroll rounded-full" aria-label="Scroll chapters horizontally">
                        <div style={{ width: (maxChapters*(cellSize + 4)) + SCROLL_PAD, height: 1 }} />
                      </div>
                    </div>
                    <div className="overflow-hidden pb-1 -mb-1">
                    <div ref={statsMainScrollRef} className="overflow-x-auto stats-scroll">
                    <div className="px-0 py-3" style={{ minWidth: (maxChapters*(cellSize + 4)) + SCROLL_PAD }}>
                      {(topBooks||[]).map(({name:bookName})=>{
                        const book = (bible||[]).find(b=> b.name===bookName);
                        const chapters = book?.chapters?.length || 0;
                          return (
                            <div
                              key={bookName}
                              className="relative mb-2 last:mb-0"
                              style={{ display: 'grid', gridTemplateColumns: `${labelAreaW}px 1fr`, alignItems: 'center' }}
                            >
                              {/* Sticky left label area: solid bg, flush left, uniform width; grid col 1 */}
                              <div className="sticky left-0 z-20 bg-white dark:bg-slate-900 flex items-center justify-center" style={{ width: labelAreaW, height: cellSize }}>
                              <button
                                type="button"
                                onClick={()=> toggleBook(bookName)}
                                className={classNames(
            'w-full h-full inline-flex items-center justify-between rounded-md text-[12px] font-semibold transition-colors whitespace-nowrap overflow-hidden text-ellipsis px-2',
                                  selectedBooks.includes(bookName)
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 ring-1 ring-emerald-500'
                                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                                )}
                                title={`Toggle book: ${bookName} — ${ ((countsByBook[bookName]||0) > 5000 ? '5000+' : (countsByBook[bookName]||0).toLocaleString()) } matches`}
                              >
                                <span className="truncate">{bookName}</span>
                                <span className="ml-2 shrink-0 inline-flex items-center justify-center rounded px-1.5 py-[1px] text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700" style={{ width: '5ch', fontVariantNumeric: 'tabular-nums' }}>
                                  {((countsByBook[bookName]||0) > 5000 ? '5000+' : (countsByBook[bookName]||0).toLocaleString())}
                                </span>
                              </button>
                            </div>
                              {/* Heatmap buttons; grid col 2 always starts after fixed label col */}
                              <div className="flex -mx-[2px]" style={{ paddingRight: 4 }}>
                              {(()=>{
                                // Only render chapters that have results
                                const chapterList = Array.from({length: chapters}, (_,i)=> i+1)
                                  .filter(ch => (countsByChap[`${bookName} ${ch}`]||0) > 0);
                                return chapterList.map(ch=>{
                                  const key = `${bookName} ${ch}`;
                                  const val = countsByChap[key] || 0; // >0 by filter
                                  const selected = selectedChapters.includes(key);
                                  return (
                                    <button
                                      key={key}
                                      type="button"
                                      onClick={()=> toggleChapter(key)}
                                      className={classNames('relative inline-flex items-center justify-center m-[2px] rounded-md border',
                                        selected ? 'ring-2 ring-emerald-500 border-emerald-600' : 'border-slate-200 dark:border-slate-700'
                                      )}
                                      title={`${bookName} ${ch}: ${val}`}
                                      style={{ width: cellSize, height: cellSize, background: colorFor(val) }}
                                    >
                                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-slate-700/70 dark:text-slate-200/70 select-none">
                                        {ch}
                                      </span>
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                   </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  )}
  {showSettings && (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col">
      <div className="sticky top-0 z-10 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200">Settings</div>
          <button onClick={()=> setShowSettings(false)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">Apply</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Typography */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Typography</div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Font size: <span className="font-semibold text-slate-800 dark:text-slate-200">{readerFontSize}px</span></label>
            <input type="range" min="8" max="28" step="1" value={readerFontSize} onChange={e=> setReaderFontSize(parseInt(e.target.value)||18)} className="w-full" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-medium">
            <button onClick={()=> setReaderFontFamily('sans')} className={classNames('px-2.5 py-2 rounded-lg border transition-colors', readerFontFamily==='sans'? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>Sans</button>
            <button onClick={()=> setReaderFontFamily('serif')} className={classNames('px-2.5 py-2 rounded-lg border transition-colors', readerFontFamily==='serif'? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>Serif</button>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Line height: <span className="font-semibold">{lineHeightPx}px</span></label>
            <input type="range" min={Math.max(readerFontSize,12)} max={64} step={1} value={lineHeightPx} onChange={e=> setLineHeightPx(clamp(parseInt(e.target.value)||28, Math.max(readerFontSize,12), 64))} className="w-full" />
          </div>
          <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={justifyText} onChange={e=> setJustifyText(e.target.checked)} /> Justify text</label>
        </div>

        {/* Layout */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Layout</div>
          <div className="grid grid-cols-2 gap-2 text-xs font-medium">
            <button onClick={()=> setVerseLayout('blocks')} className={classNames('px-2.5 py-2 rounded-lg border transition-colors', verseLayout==='blocks'? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>Verses as blocks</button>
            <button onClick={()=> setVerseLayout('continuous')} className={classNames('px-2.5 py-2 rounded-lg border transition-colors', verseLayout==='continuous'? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>Continuous text</button>
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs font-medium">
            <div className="col-span-4 space-y-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Reader width: <span className="font-semibold">{readerWidthPct}%</span></label>
              <input type="range" min="20" max="100" step="1" value={readerWidthPct} onChange={e=> setReaderWidthPct(clamp(parseInt(e.target.value)||80,20,100))} className="w-full" />
            </div>
          </div>
        </div>

        {/* Bible */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Bible</div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Default version</label>
            <button onClick={()=> openVersionPicker('settings')} className="w-full text-left px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm flex items-center justify-between">
              <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{currentVersionObj? currentVersionObj.name : (version)}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Change ▸</span>
            </button>
            {versionError && <div className="mt-1 text-[11px] text-red-600">{versionError}</div>}
            <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Saved as your standard version on this device.</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Default book</label>
            <button onClick={()=>{ /* open a dedicated settings book overlay */ openBookPicker('settings'); }} className="w-full text-left px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm flex items-center justify-between">
              <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{(()=>{ if(defaultBookIdx==null) return 'None'; const b=(bible??[])[defaultBookIdx]; return b? b.name : 'None'; })()}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Change ▸</span>
            </button>
            <div className="mt-1 flex items-center gap-2">
              <button onClick={clearDefaultBook} className="text-[11px] underline decoration-dotted text-slate-500 dark:text-slate-400">Set to None</button>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Used when opening this Bible.</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Default chapter</label>
            <button onClick={()=>{ openChapterPicker('settings'); }} className="w-full text-left px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm flex items-center justify-between">
              <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{(()=>{ if(defaultChapterIdx==null) return 'None'; const bi = (defaultBookIdx ?? 0); const cc=(bible?.[bi]?.chapters.length)||0; const ch = defaultChapterIdx; return cc? `Chapter ${ch+1}`:'None'; })()}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Change ▸</span>
            </button>
            <div className="mt-1"><button onClick={clearDefaultChapter} className="text-[11px] underline decoration-dotted text-slate-500 dark:text-slate-400">Set to None</button></div>
          </div>
        </div>

        {/* Verse numbers */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Verse Numbers</div>
          <label className="inline-flex items-center gap-2 text-xs"><input type="checkbox" checked={showNumbers} onChange={e=> setShowNumbers(e.target.checked)} /> Show verse numbers</label>
          <div className="grid grid-cols-2 gap-2 text-xs font-medium">
            <button onClick={()=> setNumberStyle('inline')} disabled={!showNumbers} className={classNames('px-2.5 py-2 rounded-lg border transition-colors disabled:opacity-50', numberStyle==='inline' && showNumbers? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>Inline</button>
            <button onClick={()=> setNumberStyle('superscript')} disabled={!showNumbers} className={classNames('px-2.5 py-2 rounded-lg border transition-colors disabled:opacity-50', numberStyle==='superscript' && showNumbers? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>Superscript</button>
          </div>
        </div>

        {/* Behavior */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Behavior</div>
          <label className="block text-xs"><input type="checkbox" className="mr-2" checked={hoverHighlight} onChange={e=> setHoverHighlight(e.target.checked)} /> Highlight verse on hover (blocks)</label>
          <label className="block text-xs"><input type="checkbox" className="mr-2" checked={autoHighlightInRead} onChange={e=> setAutoHighlightInRead(e.target.checked)} /> Always highlight search terms in Read mode</label>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Theme:
            <button onClick={()=> setTheme('system')} className={classNames('ml-2 px-2 py-1 rounded border text-xs', theme==='system'? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>System</button>
            <button onClick={()=> setTheme('light')} className={classNames('ml-2 px-2 py-1 rounded border text-xs', theme==='light'? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>Light</button>
            <button onClick={()=> setTheme('dark')} className={classNames('ml-2 px-2 py-1 rounded border text-xs', theme==='dark'? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>Dark</button>
          </div>
        </div>

        {/* Voice (Text-to-Speech) */}
        {ttsSupported && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Text‑to‑Speech</div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <div className="mb-2">Manage voices for all languages used by your installed Bibles.</div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <button onClick={()=> setShowVoicePicker(true)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">Manage voices…</button>
              </div>
              <div className="mt-3">
                <label className="inline-flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={allowBackgroundTTS}
                    onChange={e=> setAllowBackgroundTTS(e.target.checked)}
                  />
                  Allow background TTS (experimental)
                </label>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  May not work on all browsers/devices; iOS Safari usually suspends audio when hidden.
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Rate: <span className="font-semibold">{ttsRate.toFixed(2)}</span></label>
                <input type="range" min="0.50" max="2.00" step="0.01" value={ttsRate} onChange={e=> setTtsRate(parseFloat(e.target.value)||1)} className="w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Pitch (lower = deeper): <span className="font-semibold">{ttsPitch.toFixed(2)}</span></label>
                <input type="range" min="0.25" max="2.00" step="0.01" value={ttsPitch} onChange={e=> setTtsPitch(parseFloat(e.target.value)||1)} className="w-full" />
              </div>
            </div>
          </div>
        )}

  {/* (No visible sharing UI) */}

        <div>
          <button
            onClick={()=>{
              setReaderFontSize(16);
              setReaderFontFamily('sans');
              setLineHeightPx(32);
              setReaderWidth('normal');
              setReaderWidthPct(100);
              setVerseLayout('blocks');
              setShowNumbers(true);
              setNumberStyle('superscript');
              setJustifyText(false);
              setHoverHighlight(true);
              setAutoHighlightInRead(false);
              setTheme('system');
            }}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
          >Reset to defaults</button>
        </div>
      </div>
    </div>
  )}
  {/* (Desktop sidebar code removed) */}

  <section className="space-y-0 mt-0 pt-[0px]">
        {/* Read Pane */}
  <div ref={readPaneRef} hidden={mode!=='read'} style={{ height: `calc(100vh - ${headerHeight}px)`, overflowY: 'auto', paddingBottom: bottomBarH }} className="bg-white dark:bg-slate-900">
          {/* Sticky chapter header stays fixed at the top of the scrollable pane */}
          <div ref={readStickyRef} className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-700">
            <div className="px-4 py-2 flex items-center justify-between gap-2">
              {/* Clickable label opens the Controls overlay in Read mode */}
              <button
                type="button"
                onClick={()=> setShowControls(true)}
                title="Open reading controls"
                aria-haspopup="dialog"
                className="text-left text-sm text-slate-600 dark:text-slate-400 min-w-0 rounded-lg px-2 py-1 transition-colors cursor-pointer ring-1 ring-indigo-400/30 bg-indigo-50/40 dark:bg-indigo-900/20 hover:bg-indigo-100/60 hover:dark:bg-indigo-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
              >
                <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">{activeVersionName}</span>
                <span className="mx-2 text-slate-400">·</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{currentBook? bookAbbrev(currentBook.name, currentBook.abbrev): ''}</span>
                {" "}Chapter {chapterIdx+1} ({vStartEffective}–{vEndEffective})
              </button>
              <div className="flex items-center gap-2 text-xs">
                {/* TTS controls moved to footer for mobile; keep header uncluttered */}
                <button
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                  disabled={!hasPrevChapterOverall}
                  onClick={goPrevChapter}
                >◀︎</button>
                <button
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                  disabled={!hasNextChapterOverall}
                  onClick={goNextChapter}
                >▶︎</button>
              </div>
            </div>
          </div>
          {/* Content container below header, rectangular edges */}
          <motion.div
            layout
            initial={{opacity:0,y:8}}
            animate={{opacity:1,y:0}}
            transition={{duration:.25}}
            className="bg-white dark:bg-slate-900 p-4 scroll-mt-[72px] transition-colors"
            style={{
              width: `${readerWidthPct}%`,
              // When 100%, allow full-bleed width (no centering, no max clamp)
              margin: readerWidthPct===100 ? '0' : '0 auto',
              maxWidth: readerWidthPct===100 ? 'none' : 'min(1100px, 100%)'
            }}
          >
              {!bible && (
                <div className="text-sm text-slate-500 dark:text-slate-400">Loading…</div>
              )}
              <div
                ref={versesContainerRef}
                className={classNames(
                  'no-callout select-none md:select-text',
                  readerFontFamily==='serif'? 'font-serif':'font-sans',
                  verseLayout==='continuous'? 'space-y-0':'',
                  justifyText? 'text-justify':''
                )}
                style={{ fontSize: readerFontSize? `${readerFontSize}px`: undefined, lineHeight: `${lineHeightPx}px` }}
              >
                {readVerses.map((v,i)=> {
                  const abbrSrc = (bible?.[bookIdx]?.abbrev || bible?.[bookIdx]?.name || '');
                  const abbr = String(abbrSrc).split(' ').join('_');
                  const osis = `${abbr}.${chapterIdx+1}.${v.n}`;
                  return (
                  // Unique id per verse (OSIS-like): v-<abbr>.<chapter>.<verse>
                  <div
                    id={`v-${osis}`}
                    data-osis={osis}
                    data-verse={v.n}
                    data-bookidx={bookIdx}
                    data-chapter={chapterIdx+1}
                    data-verseidx={v.n}
                    key={v.n}
                    className={classNames(
                      verseLayout==='continuous'? 'inline':'block',
                      verseLayout==='continuous' ? 'px-0' : 'px-3',
                      // Remove extra vertical padding so line-height fully controls spacing in both layouts
                      'py-0',
                      (ttsStatus==='playing' && ttsActiveIndex===i) ? 'ring-2 ring-indigo-500/40 bg-indigo-50/40 dark:ring-indigo-400/40 dark:bg-indigo-900/20' : '',
                      hoverHighlight && verseLayout==='blocks' ? 'hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors':''
                    )}
                    onPointerDown={(e)=> handleVersePointerDown(e, v.n, v.text)}
                    onPointerUp={handleVersePointerUp}
                    onPointerCancel={handleVersePointerCancel}
                    onPointerLeave={handleVersePointerCancel}
                    onPointerMove={handleVersePointerMove}
                    style={{ scrollMarginTop: stickyReadHeight + 8 }}
                  >
                    {showNumbers && (numberStyle==='superscript'
                      ? <sup className={classNames(justifyText? 'mr-0.5':'mr-1', 'text-slate-400 select-none')}>{v.n}</sup>
                      : <span className="mr-2 text-slate-400 select-none">{v.n}</span>
                    )}
                    <span>{(highlightInRead && searchObj)? highlightText(v.text, searchObj) : v.text}</span>
                    {verseLayout==='continuous' && ' '}
                  </div>
                  );
                })}
                {bible && readVerses.length===0 && (
                  <div className="text-sm text-slate-400">No verses to display in this range.</div>
                )}
              </div>
      </motion.div>
    </div>
    {mode==='read' && lpAction && (
      <div className="fixed inset-x-0 bottom-[56px] z-50 px-3">
        <div className="mx-auto max-w-md flex items-center gap-2 justify-between rounded-xl border border-slate-300 dark:border-slate-600 bg-white/95 dark:bg-slate-800/95 backdrop-blur px-3 py-2 shadow">
          <div className="text-xs text-slate-600 dark:text-slate-300 truncate">Verse {lpAction.verseN}</div>
          <div className="flex items-center gap-2">
            {ttsSupported && (
              <button className="px-2.5 py-1.5 rounded-lg border border-indigo-400 bg-indigo-600 text-white text-xs font-medium" onClick={()=>{ startTTS(Math.max(0, lpAction.verseN - vStartEffective)); setLpAction(null); }}>
                Read from here
              </button>
            )}
            <button className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs" onClick={()=>{ const bookName=bible?.[bookIdx]?.name||''; const payload=buildVerseShareText(lpAction.verseText, bookName, chapterIdx+1, lpAction.verseN); shareOrCopyText(payload); setLpAction(null); }}>
              Copy
            </button>
            <button className="px-2 py-1 rounded-md text-xs text-slate-500" onClick={()=> setLpAction(null)}>Close</button>
          </div>
        </div>
      </div>
    )}
    {/* Search Pane */}
  <div ref={searchPaneRef} hidden={mode!=='search'} style={{ height: `calc(100vh - ${headerHeight}px)`, overflowY: 'scroll', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', position: 'relative', marginTop: 0, paddingBottom: 0 }} className="pr-0 bg-white dark:bg-slate-900">
  {/* Statistics & Filters toggle (hidden by default) */}
  <div className="sticky top-0 left-0 right-0 z-20 mb-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur py-2 px-4 border-b border-slate-200 dark:border-slate-700" style={{ top: 0, left: 0, right: 0, transform: 'translateZ(0)', willChange: 'top' }}>
        <div className="w-full flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={()=> setShowControls(true)}
            title="Open search controls"
            aria-haspopup="dialog"
            className="min-w-0 text-left text-[13px] text-slate-600 dark:text-slate-400 truncate rounded-lg px-2 py-1 transition-colors cursor-pointer ring-1 ring-indigo-400/30 bg-indigo-50/40 dark:bg-indigo-900/20 hover:bg-indigo-100/60 hover:dark:bg-indigo-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
          >
            <span className="font-semibold text-slate-900 dark:text-slate-100">Search Results</span>{' '}
            {query ? (
              <>
                for “{query}” {searchScope==='book' && currentBook ? <>in <span className="font-semibold">{currentBook.name}</span> </> : null}
                — {(selectedBooks.length||selectedChapters.length) ? filteredMatchTotal : searchResults.totalMatches}
                {searchResults.exceeded && ' (too many, limit exceeded)'} matches
                {(selectedBooks.length||selectedChapters.length) ? <> · showing <span className="font-semibold">{filteredRows.length}</span></> : null}
              </>
            ) : (
              <span className="text-slate-400">(enter search term)</span>
            )}
          </button>
          <div className="flex items-center gap-2 shrink-0">
            {(query || queryInput) && (
              <button
                onClick={()=>{ setQuery(''); setQueryInput(''); resetSelections(); setShowStats(false); }}
                className={classNames('inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium', 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}
                aria-label="Clear search"
                title="Clear search"
              >
                Clear
              </button>
            )}
            <button
            onClick={()=>{
              const next = !showStats;
              setShowStats(next);
              if(next){
                try {
                  // Scroll the search pane to the very top so the panel is visible
                  searchPaneRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                } catch {}
              }
            }}
            className={classNames(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium',
              showStats
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
            )}
            aria-expanded={showStats}
          >
            {showStats? 'Hide' : 'Show'} Statistics & Filters
          </button>
          </div>
        </div>
        </div>
  {/* Statistics content moved to full-screen overlay above */}
              <motion.div
                layout
                initial={{opacity:0,y:8}}
                animate={{opacity:1,y:0}}
                transition={{duration:.25}}
                className="bg-white dark:bg-slate-900 p-5 scroll-mt-[72px] transition-colors"
                style={{
                  width: `${readerWidthPct}%`,
                  margin: readerWidthPct===100 ? '0' : '0 auto',
                  maxWidth: readerWidthPct===100 ? 'none' : 'min(1100px, 100%)'
                }}
              >
                {/* Summary moved to sticky header above */}
    <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-700">
                  {query && !searchResults.exceeded && searchResults.rows.length===0 && <p className="text-slate-500 dark:text-slate-400 text-sm py-6">No matches.</p>}
                  {searchResults.exceeded && (
                    <div className="py-6 text-sm space-y-3">
                      <p className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-4 leading-relaxed">More than {MAX_SEARCH_RESULTS.toLocaleString()} matching verses were detected. Please refine your search before results are shown.</p>
                      <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 text-xs space-y-1">
                        <li>Add another word or switch to Phrase mode.</li>
                        <li>Use Phrase mode to narrow multi-word searches.</li>
      <li>Use a more specific term (e.g. “Jerusalem temple” instead of “the”).</li>
      <li>Limit scope to a book or chapter using Statistics & Filters.</li>
                        <li>Turn on Case sensitive if you target proper names.</li>
                      </ul>
                    </div>
                  )}
                  {!searchResults.exceeded && filteredRows.map((r,i)=>
                    <div key={i} className="py-3">
                      <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <button className="underline decoration-dotted underline-offset-2" onClick={()=> jumpTo(r.book,r.chapter,r.verse)}>{r.book} {r.chapter}:{r.verse}</button>
                        <span className="ml-2 text-slate-400">· {r.count}×</span>
                      </div>
                      <div
                        className={classNames(
                          readerFontFamily==='serif'? 'font-serif':'font-sans',
                          justifyText ? 'text-justify' : ''
                        )}
                        style={{ fontSize: readerFontSize? `${readerFontSize}px`: undefined, lineHeight: `${lineHeightPx}px` }}
                      >
                        {highlightText(r.text,searchObj)}
                      </div>
                    </div>
                  )}
                </div>
      </motion.div>
    </div>
        </section>
        {mode==='prophecy' && (
          <section className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Prophecy Nav Bar */}
            <div className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-4 py-3 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg sm:text-xl font-semibold tracking-tight flex items-center gap-2"><Icon.Prophecy className="h-6 w-6"/> Prophecies & Fulfillments</h2>
                {prophecies.length>0 && (()=>{ const pending = prophecySearchDraft!==prophecySearch; return (
                  <span
                    className={classNames('text-xs px-2 py-0.5 rounded-full border select-none', pending? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300':'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300')}
                    title={pending? 'Preview (not applied yet). Press Apply to commit.' : 'Applied matches'}
                  >
                    {pending ? `${prophecyDraftCount}*` : filteredProphecies.length}/{prophecies.length}
                  </span>
                ); })()}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="inline-flex rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500">
                  <input value={prophecySearchDraft} onChange={e=> setProphecySearchDraft(e.target.value)} placeholder="Search text…" className="px-2 py-1 text-[12px] bg-transparent focus:outline-none min-w-[120px]"/>
                  {prophecySearchDraft && (
                    <button
                      onClick={()=> { setProphecySearchDraft(''); setProphecySearch(''); }}
                      className={classNames(
                        'px-2 text-[11px] font-semibold border-l border-slate-300 dark:border-slate-600 focus:outline-none focus-visible:ring-2',
                        'bg-rose-500 text-white hover:bg-rose-600 dark:bg-rose-600 dark:hover:bg-rose-500 focus-visible:ring-rose-400/60'
                      )}
                      title="Clear search"
                      aria-label="Clear search"
                    >×</button>
                  )}
                  <button
                    onClick={()=> setProphecySearch(prophecySearchDraft)}
                    disabled={prophecySearchDraft===prophecySearch}
                    className={classNames('px-3 text-[11px] font-medium border-l border-slate-300 dark:border-slate-600', prophecySearchDraft===prophecySearch? 'text-slate-400 dark:text-slate-500 cursor-default':'bg-indigo-600 text-white hover:bg-indigo-700')}
                    title="Apply search"
                    aria-label="Apply search"
                  >Apply</button>
                </div>
                <select value={prophecySearchMode} onChange={e=> setProphecySearchMode(e.target.value)} className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-[12px]">
                  <option value="all">All</option>
                  <option value="any">Any</option>
                  <option value="phrase">Phrase</option>
                </select>
                <label className="inline-flex items-center gap-1 cursor-pointer select-none text-[11px] ml-1">
                  <input type="checkbox" checked={prophecyCaseSensitive} onChange={e=> setProphecyCaseSensitive(e.target.checked)} className="h-3 w-3"/>
                  <span>Case</span>
                </label>
                <div className="flex items-center gap-1 ml-2">
                  <button onClick={()=> setProphecyLang('en')} className={classNames('px-2 py-1 rounded border text-[11px]', prophecyLang==='en'?'bg-indigo-600 border-indigo-600 text-white':'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600')}>EN</button>
                  <button onClick={()=> setProphecyLang('de')} className={classNames('px-2 py-1 rounded border text-[11px]', prophecyLang==='de'?'bg-indigo-600 border-indigo-600 text-white':'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600')}>DE</button>
                </div>
                {/* Reset button removed; Clear now integrated in split control */}
              </div>
              {/* Legend (shown once) */}
              <div className="flex items-center gap-4 pt-1 text-[10px] font-semibold tracking-wide">
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400" aria-hidden="true" />
                  <span>Prophecy</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" aria-hidden="true" />
                  <span>Fulfillment</span>
                </div>
              </div>
              {/* Disclaimer */}
              <div className="mt-2 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-2">
                {prophecyLang==='de' ? (
                  <p><span className="font-semibold">Haftungsausschluss:</span> Dieser Bereich „Prophezeiungen & Erfüllungen“ ist ein funktionaler Prototyp. Verweise, Zusammenfassungen und Vers‑Zuordnungen werden noch geprüft. Für Vollständigkeit oder sachliche / doktrinäre Richtigkeit kann keine Garantie übernommen werden. Bitte prüfe alles selbst an der Schrift. Korrekturhinweise sind willkommen, solange die Datensammlung noch in Arbeit ist.</p>
                ) : (
                  <p><span className="font-semibold">Disclaimer:</span> The “Prophecies & Fulfillments” section is a functional prototype. References, summaries, and verse links are still under review and no guarantee of completeness or doctrinal / historical accuracy is made. Please verify everything against Scripture yourself. Suggestions and corrections are welcome while this dataset remains a work in progress.</p>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-scroll overscroll-contain px-4 pb-32 rounded-t-none custom-scroll" style={{scrollbarGutter:'stable', minHeight:0}}>
              <div className={classNames(readerFontFamily==='serif'? 'font-serif':'font-sans')} style={{ fontSize: readerFontSize? `${readerFontSize}px`: undefined, lineHeight: `${lineHeightPx}px` }}>
              {prophecyError && <div className="text-sm text-red-600 mb-4 mt-4">{prophecyError}</div>}
              {!prophecyError && !prophecies.length && <div className="text-sm text-slate-500 mt-4">Loading…</div>}
              <ul className="space-y-4 mt-4">
                {filteredProphecies.map(p=> (
                  <ProphecyCard
                    key={p.id}
                    p={p}
                    versions={versions}
                    version={version}
                    extractVersesFromRef={extractVersesFromRef}
                    isGerman={prophecyLang==='de'}
                    openPassages={(pp)=>{ setActiveProphecy(pp); setShowPassages(true); }}
                    highlight={prophecySearch? prophecySearchObj : null}
                  />
                ))}
              </ul>
              <div className="mt-8 text-[10px] text-slate-500 dark:text-slate-400">Data loaded from <code>public/prophecies.json</code>. Update via CSV import script.</div>
              {filteredProphecies.length===0 && prophecies.length>0 && <div className="mt-8 text-sm text-slate-500">No matches. Adjust filters or search.</div>}
            </div>
            </div>
          </section>
        )}
      </main>

    {/* Unified bottom bar (was mobile only) */}
  {mode==='read' && (
  <div ref={bottomBarRef} className={classNames('fixed inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-700 pb-[max(12px,env(safe-area-inset-bottom))] pt-2', 'bottom-0')}>
  <div className="w-full px-3 py-2 grid grid-cols-1">
          <div className="flex justify-center items-center gap-2">
            {/* Split button: Play/Stop + Verse chooser (read mode only) */}
            {mode==='read' && (
            <div className="inline-flex rounded-xl overflow-hidden border border-indigo-500 dark:border-indigo-500 shadow-sm">
              <button
                className={classNames(
                  'px-4 py-2 text-sm font-medium focus:outline-none inline-flex items-center justify-center',
                  'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
                )}
                onClick={()=> (ttsStatus==='playing' ? stopTTS() : startTTS())}
                title={!ttsSupported ? 'TTS not supported' : (ttsStatus==='playing' ? 'Stop' : 'Play')}
                aria-label={ttsStatus==='playing' ? 'Stop' : 'Play'}
                disabled={!ttsSupported}
              >
                {ttsStatus==='playing' ? <Icon.Stop className="h-6 w-6"/> : <Icon.Play className="h-6 w-6"/>}
                <span className="sr-only">{ttsStatus==='playing' ? 'Stop' : 'Play'}</span>
              </button>
              <button
                className={classNames(
                  'px-3 py-2 text-sm font-medium border-l border-indigo-500 focus:outline-none',
                  'bg-indigo-50 text-indigo-800 hover:bg-indigo-100',
                  'dark:bg-indigo-900/40 dark:text-indigo-100 dark:hover:bg-indigo-800/50'
                )}
                onClick={()=> setShowVersePicker(true)}
                disabled={!ttsSupported || readVerses.length===0}
                title="Choose starting verse"
                aria-haspopup="dialog"
              >
                {readVerses.length>0 ? `${Math.min((ttsActiveIndex>=0? ttsActiveIndex : ttsLastVisibleIndex)+1, readVerses.length)}/${readVerses.length}` : '—/—'}
                <span className="ml-1">▾</span>
              </button>
            </div>
            )}
      {/* Read for (timer) button (read mode only) */}
            {mode==='read' && (
              <div className="inline-flex items-center gap-2">
                <div className="inline-flex rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
                <button
                  className={classNames('px-3 py-2 text-sm inline-flex items-center gap-2 focus:outline-none', 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80')}
                  onClick={()=> setShowSleepTimer(true)}
                  title="Read for (choose minutes) or set stop-at (inclusive) chapter"
                  aria-label="Open sleep timer and stop-at settings"
                  aria-haspopup="dialog"
                >
                  <Icon.Clock className="h-5 w-5"/>
                  <span className="tabular-nums">{formatMinutes(readForMinutes)}</span>
                  <span className="sr-only">Open sleep timer and stop-at settings</span>
                  {ttsStatus==='playing' && sleepDeadlineRef.current>0 && (
                    (()=>{
                      const remaining = Math.max(0, sleepDeadlineRef.current - nowMs);
                      const warn = remaining < 30000; // < 30s
                      return (
                        <span
                          className={classNames(
                            'ml-2 text-[11px] px-1.5 py-0.5 rounded tabular-nums',
                            warn
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'
                          )}
                          title="Time remaining"
                        >
                          {formatCountdown(remaining)}
                        </span>
                      );
                    })()
                  )}
                </button>
                <button
                  className={classNames('px-2.5 py-2 text-sm border-l focus:outline-none inline-flex items-center justify-center leading-none', 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80')}
                  onClick={()=> { setReadForMinutes(0); setStopAtBookIdx(null); setStopAtChapterIdx(null); sleepDeadlineRef.current = 0; }}
                  title="Clear timer and stop-at"
                  aria-label="Clear timer and stop-at"
                >
                  <Icon.Clear className="h-5 w-5 block" />
                </button>
                </div>
                {false && ttsStatus==='playing' && sleepDeadlineRef.current>0 && (
                  <span className="sr-only">{formatCountdown(Math.max(0, sleepDeadlineRef.current - nowMs))}</span>
                )}
              </div>
            )}
          </div>
        </div>
    </div>
  )}

  {/* Unified full-screen controls overlay */}
  {(true) && (
  <div
    className={classNames(
  'fixed inset-0 z-50 transition-transform duration-200 transform',
      showControls ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'
    )}
    aria-hidden={!showControls}
  >
          <div className="w-full h-full bg-white dark:bg-slate-900 pb-[calc(env(safe-area-inset-bottom,0px))] flex flex-col">
            <div className="flex flex-col h-full overflow-hidden">
              <div className="sticky top-0 z-10 px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200">{mode==='read'? 'Reading Controls':'Search Controls'}</div>
                  <button className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800" onClick={()=> setShowControls(false)}>Close</button>
                </div>
              </div>
              <div ref={panelRef} className="flex-1 overflow-y-auto px-4 py-4">
                {mode==='read' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Bible Version</label>
                      <button onClick={openVersionPicker} className="w-full text-left px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm flex items-center justify-between">
                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{currentVersionObj? currentVersionObj.name : (mVersion||version)}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Change ▸</span>
                      </button>
                      {versionError && <div className="mt-1 text-[11px] text-red-600">{versionError}</div>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Book</label>
                      <button onClick={openBookPicker} className="w-full text-left px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm flex items-center justify-between">
                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                          {(()=>{ const b=bible?.[mBookIdx]; if(!b) return '—'; return b.name; })()}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Change ▸</span>
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Chapter</label>
                      <button onClick={openChapterPicker} className="w-full text-left px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm flex items-center justify-between"><span className="font-medium text-slate-700 dark:text-slate-200 truncate">{mChapterCount? (mChapterIdx+1): '—'}</span><span className="text-xs text-slate-500 dark:text-slate-400">Change ▸</span></button>
                      <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">Verses in chapter: {mVerseCount||0}</div>
                    </div>
                    {/* Verse range controls removed */}
                    {/* No Search/Statistics buttons here; kept in top bar */}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Bible Version</label>
                      <button onClick={openVersionPicker} className="w-full text-left px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm flex items-center justify-between">
                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{currentVersionObj? currentVersionObj.name : (mVersion||version)}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Change ▸</span>
                      </button>
                      {versionError && <div className="mt-1 text-[11px] text-red-600">{versionError}</div>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Search term(s)</label>
                      <div className="flex items-center gap-2">
                        <input value={mQuery} onChange={e=>{ if(selectedBooks.length||selectedChapters.length){ setSelectedBooks([]); setSelectedChapters([]);} setMQuery(e.target.value); }} className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" placeholder="e.g. light" />
                        <button className="rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 transition-colors" onClick={applySearch}>Apply</button>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {mQuery.trim()
                          ? (
                            preflightEstimate.exceeded
                              ? <span className="text-amber-700 dark:text-amber-400">Too many matches (&gt;{MAX_SEARCH_RESULTS.toLocaleString()} verses)</span>
                              : <>
                                  ≈ <span className="font-semibold text-slate-700 dark:text-slate-200">{preflightEstimate.total.toLocaleString()}</span> matches
                                  {mSearchScope==='book' && bible?.[mBookIdx]
                                    ? <> in <span className="font-semibold">{bookAbbrev(bible[mBookIdx].name, bible[mBookIdx].abbrev)}</span></>
                                    : null}
                                </>
                            )
                          : <span className="opacity-70">Type to preview</span>
                        }
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs font-medium">
                      {[{key:'all',label:'All words'},{key:'any',label:'Any'},{key:'phrase',label:'Phrase'}].map(o=> (
                        <button key={o.key} onClick={()=>setMSearchMode(o.key)} className={classNames('px-2.5 py-2 rounded-lg border transition-colors', mSearchMode===o.key? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>{o.label}</button>
                      ))}
                    </div>
                    <div className="text-xs font-medium grid grid-cols-2 gap-2">
                      <button onClick={()=>setMSearchScope('all')} className={classNames('px-2.5 py-2 rounded-lg border transition-colors', mSearchScope==='all'? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>Whole Bible</button>
                      <button onClick={()=>setMSearchScope('book')} className={classNames('px-2.5 py-2 rounded-lg border transition-colors', mSearchScope==='book'? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>This Book</button>
                    </div>
                    {mSearchScope==='book' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Book</label>
              <button onClick={openBookPicker} className="w-full text-left px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm flex items-center justify-between">
                <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{(()=>{ const b=bible?.[mBookIdx]; if(!b) return '—'; return b.name; })()}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">Change ▸</span>
                          </button>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Chapter Range</label>
                          <div className="flex items-center gap-2">
                            <button onClick={openChapterPicker} className="flex-1 text-left px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm flex items-center justify-between">
                              <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{(mChapFrom===1 && (mChapTo===0 || mChapTo=== (bible?.[mBookIdx]?.chapters.length||1)))? 'All Chapters' : (mChapFrom===mChapTo || mChapTo===0 ? `Chapter ${mChapFrom}` : `Ch ${mChapFrom}–${mChapTo===0?'end':mChapTo}`)}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">Change ▸</span>
                            </button>
                            <button type="button" onClick={()=>{ setMChapFrom(1); setMChapTo(0); }} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-medium">All</button>
                          </div>
                          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Pick a chapter to limit results or choose All for whole book.</div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-4 text-xs">
                      <label className="inline-flex items-center gap-1"><input type="checkbox" checked={mCaseSensitive} onChange={e=>setMCaseSensitive(e.target.checked)} /> Case sensitive</label>
                      {Boolean(selectedBooks.length || selectedChapters.length) && (
                        <button className="text-blue-600 dark:text-blue-400 underline decoration-dotted underline-offset-2" onClick={resetSelections}>Clear selection</button>
                      )}
                    </div>
                    {/* No To Reading/To Statistics here; kept in top bar */}
                  </div>
                )}
              </div>
              {mode==='read' && (
                <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <button className="w-full rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-sm font-medium px-4 py-2.5" onClick={applyRead}>Apply</button>
                </div>
              )}
              {/* Version Picker Overlay */}
              {showVersionPicker && (
                <div className="absolute inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col">
                  <div className="sticky top-0 px-4 py-4 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur flex items-center justify-between">
                    <div className="text-sm font-semibold tracking-wide">Select Version</div>
                    <button onClick={()=> { setShowVersionPicker(false); if(versionPickerContext==='settings') setShowControls(false); }} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600">Close</button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                    {versionsByLanguage.map(([lang,list])=> (
                      <div key={lang} className="space-y-2">
                        <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400">{lang}</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {list.map(v=> {
                            const active = tempVersion===v.abbreviation;
                            return (
                              <button
                                key={v.abbreviation}
                                onClick={()=> setTempVersion(v.abbreviation)}
                                className={classNames('px-2 py-2 rounded-lg border text-[11px] font-medium text-left transition-colors', active? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80')}
                                aria-pressed={active}
                              >
                                <div className="truncate">{v.name}</div>
                                <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">{v.abbreviation}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex gap-2">
                    <button onClick={()=> { setShowVersionPicker(false); if(versionPickerContext==='settings') setShowControls(false); }} className="w-1/2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-medium px-4 py-2.5">Cancel</button>
                    <button onClick={applyVersionPicker} className="w-1/2 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-sm font-medium px-4 py-2.5">Apply</button>
                  </div>
                </div>
              )}
              {/* Book Picker Overlay (restored) */}
              {showBookPicker && (
                <div className="absolute inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col">
                  <div className="sticky top-0 px-4 py-4 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur flex items-center justify-between">
                    <div className="text-sm font-semibold tracking-wide">Select Book</div>
                    <button onClick={()=> { setShowBookPicker(false); if(bookPickerContext==='settings') setShowControls(false); }} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600">Close</button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[11px] font-medium">
                      {(bible||[]).map((b,idx)=>{
                        const active = tempBookIdx===idx;
                        const abbr = bookAbbrev(b.name, b.abbrev);
                        return (
                          <button
                            key={idx}
                            onClick={()=> setTempBookIdx(idx)}
                            title={b.name}
                            className={classNames('px-2 py-2 rounded-lg border text-center transition-colors', active? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80')}
                            aria-pressed={active}
                            aria-label={b.name}
                          >
                            <span className="font-medium tracking-wide">{abbr}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex gap-2">
                    <button onClick={()=> { setShowBookPicker(false); if(bookPickerContext==='settings') setShowControls(false); }} className="w-1/2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-medium px-4 py-2.5">Cancel</button>
                    <button onClick={applyBookPicker} className="w-1/2 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-sm font-medium px-4 py-2.5">Apply</button>
                  </div>
                </div>
              )}
              {/* Chapter Picker Overlay (restored) */}
              {showChapterPicker && (
                <div className="absolute inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col">
                  <div className="sticky top-0 px-4 py-4 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur flex items-center justify-between">
                    <div className="text-sm font-semibold tracking-wide">Select Chapter</div>
                    <button onClick={()=> { setShowChapterPicker(false); if(chapterPickerContext==='settings') setShowControls(false); }} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600">Close</button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 text-[11px] font-medium">
                      {Array.from({length: (bible?.[tempBookIdx]?.chapters.length)||0 }, (_,i)=> i).map(i=>{
                        const active = tempChapterIdx===i;
                        return (
                          <button key={i} onClick={()=> setTempChapterIdx(i)} className={classNames('h-9 rounded-lg border flex items-center justify-center transition-colors', active? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80')} aria-pressed={active}>{i+1}</button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex gap-2">
                    <button onClick={()=> { setShowChapterPicker(false); if(chapterPickerContext==='settings') setShowControls(false); }} className="w-1/2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-medium px-4 py-2.5">Cancel</button>
                    <button onClick={applyChapterPicker} className="w-1/2 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-sm font-medium px-4 py-2.5">Apply</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    {mode==='read' && shareToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow">
      {shareToast}
        </div>
      )}

    {/* Full-screen Verse Picker overlay */}
  {mode==='read' && showVersePicker && (
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col">
        <div className="sticky top-0 z-10 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur flex items-center justify-between">
          <div className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200">Choose Starting Verse</div>
          <button onClick={()=> setShowVersePicker(false)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">Close</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-6 gap-2">
            {Array.from({length: readVerses.length }, (_,i)=> i).map(i=> (
              <button
                key={i}
                onClick={()=>{ setShowVersePicker(false); startTTS(i); }}
                className={classNames('h-10 rounded-md text-[12px] font-semibold border', i===Math.max(ttsActiveIndex, ttsLastVisibleIndex) ? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}
              >{i+1}</button>
            ))}
          </div>
        </div>
      </div>
    )}
    {/* Full-screen Voice Picker overlay */}
  {showVoicePicker && (
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] bg-white dark:bg-slate-900 flex flex-col">
        <div className="sticky top-0 z-10 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200">Select Voices</div>
            <button onClick={()=> setShowVoicePicker(false)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">Close</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {versionLangCodes.map(code=>{
            const lc = code.toLowerCase();
            const label = LANG_LABELS[lc] || lc.toUpperCase();
            const list = (voicesRef.current||[]).filter(v=>{
              const lang = (v.lang||'').toLowerCase();
              const name = v.name||'';
              const zh = lc==='zh' && /(Chinese|Mandarin|Cantonese|zh|Han)/i.test(name);
              return lang.startsWith(lc) || zh;
            });
            const chosenURI = (voicePrefMap||{})[lc] || '';
            return (
              <div key={lc}>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">{label}</div>
                {list.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {list.map(v=> (
                      <label key={v.voiceURI} className={classNames('flex items-center gap-2 px-3 py-2 rounded-lg border text-xs',
                        chosenURI===v.voiceURI ? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                      )}>
                        <input type="radio" name={`tts-${lc}`} className="sr-only" checked={chosenURI===v.voiceURI} onChange={()=>{
                          setVoicePrefMap(prev=> ({ ...(prev||{}), [lc]: v.voiceURI }));
                          if(lc===versionLangCode.toLowerCase()) ttsVoiceRef.current = v;
                        }} />
                        <span className="font-medium truncate">{v.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">No voices available for this language on this device.</div>
                )}
                <div className="mt-2">
                  <button className="text-[11px] px-2 py-1 rounded border border-slate-300 dark:border-slate-600" onClick={()=>{
                    setVoicePrefMap(prev=>{ const n={...(prev||{})}; delete n[lc]; return n; });
                    if(lc===versionLangCode.toLowerCase()) ttsVoiceRef.current = null;
                  }}>Auto-select</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* Read for (Sleep Timer) overlay */}
  {mode==='read' && showSleepTimer && (
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-[60] bg-white dark:bg-slate-900 flex flex-col">
        <div className="sticky top-0 z-10 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200">Read for</div>
            <button onClick={()=> setShowSleepTimer(false)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">Close</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm text-slate-700 dark:text-slate-300">
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Pick a duration</div>
            <button
              type="button"
              onClick={()=> setShowDurationPicker(true)}
              aria-haspopup="dialog"
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80"
              title="Choose from presets"
            >
              <span className="font-medium">Duration</span>
              <span className="tabular-nums">{readForMinutes>0 ? formatMinutes(readForMinutes) : 'Off'}</span>
              <span aria-hidden>▾</span>
            </button>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Choose a preset, or enter a custom value below.</div>
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Custom minutes</label>
              <input
                type="number"
                min="0"
                max="600"
                step="1"
                value={readForMinutes}
                onChange={e=> {
                  const v = Math.max(0, Math.min(600, parseInt(e.target.value||'0',10)));
                  setReadForMinutes(Number.isFinite(v)? v: 0);
                }}
                className="w-28 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
              />
              <div className="text-xs text-slate-500 dark:text-slate-400">= <span className="tabular-nums">{formatMinutes(readForMinutes)}</span></div>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">0 disables the timer.</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-600 dark:text-slate-400">Optional stop at book/chapter <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">(inclusive)</span></div>
            <div className="flex items-center gap-2">
              <select value={stopAtBookIdx==null? '' : String(stopAtBookIdx)} onChange={e=>{
                const v = e.target.value; if(v===''){ setStopAtBookIdx(null); setStopAtChapterIdx(null); }
                else { setStopAtBookIdx(parseInt(v,10)); setStopAtChapterIdx(0); }
              }} className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                <option value="">None</option>
                {(bible||[]).map((b,idx)=> <option key={idx} value={idx}>{b.name}</option>)}
              </select>
              <select value={stopAtChapterIdx==null? '' : String(stopAtChapterIdx+1)} onChange={e=>{
                const v = e.target.value; if(v===''){ setStopAtChapterIdx(null); }
                else { setStopAtChapterIdx(Math.max(0, parseInt(v,10)-1)); }
              }} disabled={stopAtBookIdx==null}
                className="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                <option value="">—</option>
                {stopAtBookIdx!=null && (bible?.[stopAtBookIdx]?.chapters||[]).map((_,i)=> <option key={i} value={i+1}>{i+1}</option>)}
              </select>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Whichever comes first (time or stop-at) will stop reading. Stop-at is inclusive (finishes the selected chapter before stopping).</div>
          </div>
          <div className="pt-2">
            <button onClick={()=> setShowSleepTimer(false)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">Done</button>
          </div>
        </div>
      </div>
    )}

    {/* Duration Presets overlay */}
    {mode==='read' && showSleepTimer && showDurationPicker && (
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-[70] bg-white dark:bg-slate-900 flex flex-col">
        <div className="sticky top-0 z-10 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200">Choose duration</div>
            <button onClick={()=> setShowDurationPicker(false)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            <button
              onClick={()=>{ setReadForMinutes(0); setShowDurationPicker(false); }}
              className={classNames(
                'px-2 py-2 rounded-lg border text-xs text-center transition-colors',
                (readForMinutes|0)===0 ? 'bg-indigo-600 border-indigo-600 text-white shadow' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80'
              )}
            >
              <div className="font-semibold">Off</div>
            </button>
            {presetMinutes.map((m)=>{
              const selected = (readForMinutes|0) === m;
              return (
                <button
                  key={m}
                  onClick={()=>{ setReadForMinutes(m); setShowDurationPicker(false); }}
                  className={classNames(
                    'px-2 py-2 rounded-lg border text-xs text-center transition-colors',
                    selected
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow'
                      : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  )}
                  aria-pressed={selected}
                  aria-label={`Set ${formatMinutes(m)}`}
                >
                  <div className="font-semibold tabular-nums">{formatMinutes(m)}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    )}

    {/* Prophecy Passages Overlay */}
    {mode==='prophecy' && showPassages && activeProphecy && (
      <div role="dialog" aria-modal="true" className="fixed inset-0 z-[70] bg-white dark:bg-slate-900 flex flex-col isolate">
  <div className="sticky top-0 z-10 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <div className="text-sm font-semibold tracking-wide flex items-center gap-2"><Icon.Prophecy className="h-5 w-5"/> Passages</div>
          <button onClick={()=> { setShowPassages(false); setActiveProphecy(null); }} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600">Close</button>
        </div>
  <div className="flex-1 overflow-y-auto p-4 space-y-6 text-sm">
          {(()=>{
            const p = activeProphecy;
            function splitRefs(refStr){ if(!refStr) return []; const out=[]; let lastBook=''; refStr.split(/\s*;\s*/).forEach(raw=>{ let part=raw.trim(); if(!part) return; const m=part.match(/^([1-3]?\s*[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+\d/); if(m){ lastBook=m[1]; } else if(/^\d+:\d/.test(part) && lastBook){ part=lastBook+" "+part; } out.push(part); }); return out; }
            const prophecyRefs = splitRefs(p.prophecyRef);
            const fulfillRefs = splitRefs(p.fulfillment && p.fulfillment.biblicalRef);
            const allGroups = [
              { title: 'Prophecy', refs: prophecyRefs },
              { title: 'Fulfillment', refs: fulfillRefs }
            ].filter(g=> g.refs.length);
            const isGerman = (versions.find(v=> v.abbreviation===version)?.language||'').toLowerCase().startsWith('de');
            let overview='';
            let prophecyTxt=''; let fulfillmentTxt='';
            if(p.summary){
              const langBlock = isGerman ? p.summary.de || p.summary.en : p.summary.en || p.summary.de;
              prophecyTxt = (langBlock && langBlock.prophecy) || p.summary.prophecy || '';
              fulfillmentTxt = (langBlock && langBlock.fulfillment) || p.summary.fulfillment || '';
            }
            return (
              <>
                {/* Prophecy summary */}
                {prophecyTxt && (
                  <div className="mb-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2 mb-1 text-[10px] font-semibold tracking-wide text-amber-600 dark:text-amber-400">
                      <span className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400" aria-hidden="true" /> Prophecy Summary
                    </div>
                    <div className="pl-2 border-l-2 border-amber-500/60 dark:border-amber-400/60 text-slate-600 dark:text-slate-300">{prophecyTxt}</div>
                  </div>
                )}
                {/* Prophecy passages */}
                {prophecyRefs.length>0 && (
                  <div className="space-y-4 mb-8">
                    <h3 className="flex items-center gap-2 text-[11px] uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400">
                      <span className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400" aria-hidden="true" /> Prophecy Passages
                    </h3>
                    {prophecyRefs.map(ref=> (
                      <PassageBlock key={ref} refStr={ref} verseObjs={extractVerseObjects(ref)} isGerman={isGerman} />
                    ))}
                  </div>
                )}
                {/* Fulfillment summary */}
                {fulfillmentTxt && (
                  <div className="mb-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2 mb-1 text-[10px] font-semibold tracking-wide text-emerald-600 dark:text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" aria-hidden="true" /> Fulfillment Summary
                    </div>
                    <div className="pl-2 border-l-2 border-emerald-500/60 dark:border-emerald-400/60 text-slate-600 dark:text-slate-300">{fulfillmentTxt}</div>
                  </div>
                )}
                {/* Fulfillment passages */}
                {fulfillRefs.length>0 && (
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-[11px] uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" aria-hidden="true" /> Fulfillment Passages
                    </h3>
                    {fulfillRefs.map(ref=> (
                      <PassageBlock key={ref} refStr={ref} verseObjs={extractVerseObjects(ref)} isGerman={isGerman} />
                    ))}
                  </div>
                )}
                {(!prophecyRefs.length && !fulfillRefs.length) && <div className="text-xs text-slate-500 dark:text-slate-400">No references.</div>}
                {allGroups.length===0 && <div className="text-xs text-slate-500 dark:text-slate-400">No references.</div>}
              </>
            );
          })()}
        </div>
      </div>
    )}

  {/* Scroll to top now integrated with footer area */}

  {/* Footer removed for unified mobile-style layout across all screen sizes */}
    </div>
  );
}
