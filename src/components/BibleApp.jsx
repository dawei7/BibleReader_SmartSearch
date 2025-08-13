import React, { useEffect, useMemo, useRef, useState } from 'react';
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

// Simple dual-handle slider (horizontal) for verse range selection
function DualRange({ min=1, max=1, start, end, onChange }){
  const trackRef = useRef(null);
  const s = Math.min(Math.max(start,min), max);
  const e = Math.min(Math.max(end,min), max);
  const leftPct = ((s-min)/(max-min))*100;
  const rightPct = ((e-min)/(max-min))*100;
  function clampVal(v){ return Math.min(Math.max(v,min),max); }
  function posToVal(clientX){
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return clampVal(Math.round(min + ratio*(max-min))||min);
  }
  function startDrag(which, evt){
    evt.preventDefault();
    const move = (e)=>{
      const val = posToVal(e.clientX || (e.touches && e.touches[0]?.clientX));
      if(which==='start'){
        const newStart = Math.min(val, eValRef.current-1>=min? eValRef.current-1: eValRef.current);
        onChange({ start:newStart, end:eValRef.current });
      } else {
        const newEnd = Math.max(val, sValRef.current+1<=max? sValRef.current+1: sValRef.current);
        onChange({ start:sValRef.current, end:newEnd });
      }
    };
    const up = ()=>{ window.removeEventListener('mousemove',move); window.removeEventListener('touchmove',move); window.removeEventListener('mouseup',up); window.removeEventListener('touchend',up); };
    window.addEventListener('mousemove',move);
    window.addEventListener('touchmove',move,{passive:false});
    window.addEventListener('mouseup',up); window.addEventListener('touchend',up);
  }
  const sValRef = useRef(s); sValRef.current=s;
  const eValRef = useRef(e); eValRef.current=e;
  return (
    <div className="w-full select-none py-1">
      <div ref={trackRef} className="relative h-2 rounded-full bg-slate-200 dark:bg-slate-700">
        <div className="absolute h-2 rounded-full bg-indigo-500 dark:bg-indigo-400" style={{left:`${leftPct}%`, width:`${rightPct-leftPct}%`}} />
        <button type="button" aria-label="Start" onMouseDown={e=>startDrag('start',e)} onTouchStart={e=>startDrag('start',e)} className="absolute -top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-500 shadow" style={{left:`calc(${leftPct}% - 8px)`}} />
        <button type="button" aria-label="End" onMouseDown={e=>startDrag('end',e)} onTouchStart={e=>startDrag('end',e)} className="absolute -top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-500 shadow" style={{left:`calc(${rightPct}% - 8px)`}} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500 dark:text-slate-400"><span>{s}</span><span>{e===max? `${e} (end)`: e}</span></div>
    </div>
  );
}

// Main component
export default function BibleApp(){
  // Core state (some variables referenced further below were originally defined earlier in file)
  const [bible,setBible]=useState(null);
  const [version,setVersion]=useState('en_kjv');
  const [mode,setMode]=useState('read');
  const [bookIdx,setBookIdx]=useState(0);
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
  const [theme,setTheme]=useState('light');
  const [metaMap,setMetaMap]=useState({});
  const [showAbout,setShowAbout]=useState(false);
    const [highlightInRead,setHighlightInRead]=useState(false);
    const [pendingScrollVerse,setPendingScrollVerse]=useState(null);
  const [stickyReadHeight,setStickyReadHeight]=useState(0);
  // Persistence refs
  const storedVersionRef = useRef(null);
  // Initialize persisted theme & version preference
  useEffect(()=>{
    try {
      const t = localStorage.getItem('br_theme');
      if(t==='dark' || t==='light') setTheme(t);
      const v = localStorage.getItem('br_version');
      if(v) storedVersionRef.current = v;
    } catch { /* ignore */ }
  },[]);
  const loadTokenRef=useRef(0); const bibleCacheRef=useRef({}); const bookCache=useRef({});
  const BASE=import.meta?.env?.BASE_URL || '/';
  const FETCH_TIMEOUT_MS=8000;
  const MAX_SEARCH_RESULTS=5000;
  // Derived counts & groupings declared later to avoid duplication after refactor
  function normalizeBible(data){ data.forEach(b=>{ if(!b.name) b.name = b.abbrev? String(b.abbrev).toUpperCase():'Unknown'; }); }
  function validateBibleStructure(raw){ return Array.isArray(raw) && raw.every(b=> b && typeof b==='object' && Array.isArray(b.chapters)); }
  function coerceBible(raw){ if(validateBibleStructure(raw)) return raw; if(raw && typeof raw==='object'){ const cand = raw.books || raw.bible || raw.data; if(validateBibleStructure(cand)) return cand; } throw new Error('Invalid JSON format'); }
  async function loadBibleVersion(abbr){
    if(!abbr) return false;
    // Cache hit
    if(bibleCacheRef.current[abbr]){
      setBible(bibleCacheRef.current[abbr]);
      setVersion(abbr);
  try { localStorage.setItem('br_version', abbr); } catch {}
      setBookIdx(0); setChapterIdx(0); setVStart(1); setVEnd(0);
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
  try { localStorage.setItem('br_version', abbr); } catch {}
      if(data.length>=3) bibleCacheRef.current[abbr]=data;
      setAttemptLog(l=>[...l,`success:${abbr}`].slice(-60));
      setBookIdx(0); setChapterIdx(0); setVStart(1); setVEnd(0);
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
        const stored = storedVersionRef.current && ordered.find(v=> v.abbreviation===storedVersionRef.current);
        if(stored){
          const ok = await loadBibleVersion(stored.abbreviation);
          if(!ok){
            // fall back to first priority
            const preferred=ordered[0];
            if(preferred) await loadBibleVersion(preferred.abbreviation);
          }
        } else {
          const preferred=ordered[0];
          if(preferred) await loadBibleVersion(preferred.abbreviation);
        }
        if(!bible){ const others=ordered.slice(1); if(others.length) attemptLoadAny(others); }
      }
    } catch {
      if(!cancelled){ setBible(SAMPLE_BIBLE); setVersion('sample'); }
    }
  })(); return ()=>{ cancelled=true; }; },[]);

  // Apply theme to root
  useEffect(()=>{ const root=document.documentElement; if(theme==='dark') root.classList.add('dark'); else root.classList.remove('dark'); try { localStorage.setItem('br_theme', theme); } catch {} },[theme]);
  // Close About overlay on Escape
  useEffect(()=>{ if(!showAbout) return; const onKey=(e)=>{ if(e.key==='Escape') setShowAbout(false); }; window.addEventListener('keydown',onKey); return ()=> window.removeEventListener('keydown',onKey); },[showAbout]);
  const currentBook = bible?.[bookIdx]; const chapterCount=currentBook?.chapters.length || 0; const verseCount=currentBook?.chapters[chapterIdx]?.length || 0; const vEndEffective = vEnd===0? verseCount : clamp(vEnd,1,verseCount); const vStartEffective = clamp(vStart,1,vEndEffective); const searchObj = useMemo(()=> buildSearchRegex(query,searchMode,{caseSensitive}),[query,searchMode,caseSensitive]);
  useEffect(()=>{ const t=setTimeout(()=> setQuery(queryInput.trim()),500); return ()=> clearTimeout(t); },[queryInput]);
  const readVerses = useMemo(()=> !currentBook? []: (currentBook.chapters[chapterIdx]||[]).slice(vStartEffective-1,vEndEffective).map((t,i)=>({n:i+vStartEffective,text:t})),[currentBook,chapterIdx,vStartEffective,vEndEffective]);
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
  // Mobile behavior ----------------------------------------------------
  // Removed desktop layout; single mobile-style layout
  const [showControls,setShowControls]=useState(false); // bottom-sheet visibility on mobile
  const [showScrollTop,setShowScrollTop]=useState(false);
  const headerRef = useRef(null);
  const panelRef = useRef(null); // now only used for overlay scroll area
  const readStickyRef = useRef(null);
  // Mobile-only staged controls state
  const [mVersion,setMVersion] = useState('');
  const [mBookIdx,setMBookIdx] = useState(0);
  const [mChapterIdx,setMChapterIdx] = useState(0);
  const [mVStart,setMVStart] = useState(1);
  const [mVEnd,setMVEnd] = useState(0);
  const [mQuery,setMQuery] = useState('');
  const [mSearchScope,setMSearchScope] = useState('all');
  const [mChapFrom,setMChapFrom] = useState(1);
  const [mChapTo,setMChapTo] = useState(0);
  const [mSearchMode,setMSearchMode] = useState('all');
  const [mCaseSensitive,setMCaseSensitive] = useState(false);
  const mobileChapterRef = useRef(null);
  const [showVersionPicker,setShowVersionPicker] = useState(false);
  const [tempVersion,setTempVersion] = useState('');
  const [showBookPicker,setShowBookPicker] = useState(false);
  const [showChapterPicker,setShowChapterPicker] = useState(false);
  const [tempBookIdx,setTempBookIdx] = useState(0);
  const [tempChapterIdx,setTempChapterIdx] = useState(0);
  const bottomBarRef = useRef(null);
  const [headerHeight,setHeaderHeight]=useState(72); // may be used for future spacing
  const [bottomBarH,setBottomBarH]=useState(52);
  const caseSensitiveRef = useRef(null);

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
      setMVStart(vStart);
      setMVEnd(vEnd);
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
  // Lock background scroll when full-screen overlays open (controls/about)
  useEffect(()=>{
    const body = document.body;
    const needLock = showControls || showAbout;
    if(needLock){
      const prev = body.style.overflow;
      body.dataset._prevOverflow = prev;
      body.style.overflow='hidden';
    } else if(body.dataset._prevOverflow!==undefined){
      body.style.overflow=body.dataset._prevOverflow; delete body.dataset._prevOverflow;
    }
    return ()=>{ if(body.dataset._prevOverflow!==undefined){ body.style.overflow=body.dataset._prevOverflow; delete body.dataset._prevOverflow; } };
  },[showControls,showAbout]);
  // Selections cleared inline when version or search input changes; also defensively here if query/version changed elsewhere
  useEffect(()=>{ if(selectedBooks.length||selectedChapters.length){ setSelectedBooks([]); setSelectedChapters([]);} },[queryInput,version]);
  const chapterBreakdown = useMemo(()=>{ if(searchResults.exceeded) return []; if(selectedBooks.length!==1) return []; const b=selectedBooks[0]; return Object.entries(searchResults.perChap).filter(([k])=> k.startsWith(b+" ")).map(([k,c])=>({ name:k.substring(b.length+1), count:c })).sort((a,b)=> parseInt(a.name)-parseInt(b.name)); },[selectedBooks,searchResults]);
  const filteredRows = useMemo(()=>{ if(!searchResults || searchResults.exceeded) return []; if(selectedChapters.length){ const chapSet=new Set(selectedChapters); return searchResults.rows.filter(r=> chapSet.has(`${r.book} ${r.chapter}`)); } if(selectedBooks.length){ const bookSet=new Set(selectedBooks); return searchResults.rows.filter(r=> bookSet.has(r.book)); } return searchResults.rows; },[searchResults,selectedBooks,selectedChapters]);
  function toggleBook(name){ setSelectedChapters([]); setSelectedBooks(bs=> bs.includes(name)? bs.filter(b=>b!==name): [...bs,name]); }
  function toggleChapter(chName){ setSelectedChapters(cs=> cs.includes(chName)? cs.filter(c=>c!==chName): [...cs,chName]); }
  function resetSelections(){ setSelectedBooks([]); setSelectedChapters([]); }
  function onSelectBook(i){ setBookIdx(i); setChapterIdx(0); setVStart(1); setVEnd(0); }
  function jumpTo(book, chapter, verse){
    if(!bible) return;
    const idx = bible.findIndex(b=> b.name===book || b.abbrev===book);
    if(idx>=0){
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
  // After jumping from search, scroll to the target verse in read mode
  useEffect(()=>{
    if(pendingScrollVerse==null) return;
    const v = pendingScrollVerse;
    
    // Use a longer delay to ensure the full chapter renders first
    const timer = setTimeout(()=>{
      const el = document.querySelector(`[data-verse="${v}"]`);
      if(el){
        try { 
          // Use scrollIntoView which respects the CSS scroll-margin-top
          el.scrollIntoView({ behavior:'smooth', block:'start' }); 
        } catch {}
      }
      setPendingScrollVerse(null);
    }, 300);
    return ()=> clearTimeout(timer);
  },[bookIdx,chapterIdx,pendingScrollVerse]);
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
  function openVersionPicker(){ setTempVersion(mVersion||version); setShowVersionPicker(true); }
  function applyVersionPicker(){ if(tempVersion) setMVersion(tempVersion); setShowVersionPicker(false); }
  function openBookPicker(){
    setTempBookIdx(mBookIdx);
    // Reset chapter temp when switching books inside picker
    setTempChapterIdx(0);
    setShowBookPicker(true);
  }
  function openChapterPicker(){
    if(mode==='read'){
      setTempChapterIdx(mChapterIdx);
    } else {
      // derive from current search chapter range (use from as representative)
      setTempChapterIdx((mChapFrom||1)-1);
    }
    setShowChapterPicker(true);
  }
  function applyBookPicker(){ setMBookIdx(tempBookIdx); setMChapterIdx(0); setMVStart(1); setMVEnd(0); setShowBookPicker(false); }
  function applyChapterPicker(){
    if(mode==='read'){
      setMChapterIdx(tempChapterIdx); setMVStart(1); setMVEnd(0);
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
      setVStart(mVStart);
      setVEnd(mVEnd);
      setShowControls(false);
    };
    if(mVersion && mVersion!==version){
      loadBibleVersion(mVersion).then(()=> commit());
    } else {
      commit();
    }
  }
  function applySearch(){
    const commit = ()=>{
      setSearchMode(mSearchMode);
      setSearchScope(mSearchScope);
      setBookIdx(mBookIdx);
      setChapFrom(mChapFrom);
      setChapTo(mChapTo);
      setCaseSensitive(mCaseSensitive);
      // Set both input and effective query immediately
      setQuery(mQuery?.trim()||'');
      setQueryInput(mQuery||'');
      setShowControls(false);
    };
    if(mVersion && mVersion!==version){
      loadBibleVersion(mVersion).then(()=> commit());
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-slate-50 to-zinc-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100 transition-colors">
  <header ref={headerRef} className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm">
  <div className="w-full px-4 py-3 flex items-center justify-between">
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
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {['read','search'].map(t => (
                <button
                  key={t}
                  className={classNames('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    // @ts-ignore existing mode
                    mode===t? 'bg-white dark:bg-slate-900 shadow border border-slate-200 dark:border-slate-600':'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white')}
                  onClick={()=>setMode(t)}
                >{t==='read'? 'Read':'Search'}</button>
              ))}
            </nav>
            {/* Mobile controls toggle now in bottom tab bar */}
            <button
              onClick={()=> setTheme(th=> th==='dark'?'light':'dark')}
              aria-label="Toggle dark mode"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 text-sm transition-colors"
            >
              <span className="hidden sm:inline">{theme==='dark'? 'Light':'Dark'} mode</span>
              <span>{theme==='dark'? '☀️':'🌙'}</span>
            </button>
          </div>
        </div>
      </header>

  <main
  className="flex-1 w-full px-4 pb-40 transition-[padding]"
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
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Bible reading and smart search, thoughtfully crafted.</p>
            </div>
          </div>
          <button onClick={()=> setShowAbout(false)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800">Close</button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300 max-w-2xl">
          <p>
            Hi, I’m <span className="font-medium">David Schmid</span> (born 12 December 1986), a data engineer who loves AI and data science. With the help of GPT‑5 Agent Mode, I built this app to make Bible study fast, focused, and enjoyable.
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
        </div>
      </div>
    </div>
  )}
  {/* (Desktop sidebar code removed) */}

  <section className="space-y-6 mt-0 pt-[0px]">
          {mode==='read' ? (
            <motion.div layout initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.25}} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm scroll-mt-[72px] transition-colors">
              <div ref={readStickyRef} className="sticky z-10 -mx-5" style={{ top: Math.max(0, headerHeight - 1) }}>
                <div className="px-5 py-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-sm text-slate-600 dark:text-slate-400"><span className="font-semibold text-slate-900 dark:text-slate-100">{currentBook?.name}</span> Chapter {chapterIdx+1} ({vStartEffective}–{vEndEffective})</div>
                  <div className="flex items-center gap-2 text-xs">
                    <button className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800" disabled={chapterIdx<=0} onClick={()=> setChapterIdx(c=> clamp(c-1,0,chapterCount-1))}>◀︎</button>
                    <button className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800" disabled={chapterIdx>=chapterCount-1} onClick={()=> setChapterIdx(c=> clamp(c+1,0,chapterCount-1))}>▶︎</button>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-3 leading-8">
                {readVerses.map(v=> (
                  <div key={v.n} data-verse={v.n} className="rounded-xl px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" style={{ scrollMarginTop: Math.max(0, headerHeight - 1) + stickyReadHeight }}>
                    <span className="mr-2 select-none text-slate-400">{v.n}</span>
                    <span>{(highlightInRead && searchObj)? highlightText(v.text, searchObj) : v.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              {!searchResults.exceeded && (
                <motion.div id="statistics-panel" layout initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.25}} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Statistics & Filters</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 space-x-3">
                      <span>Total matches: {searchResults.totalMatches}</span>
                      {(selectedBooks.length||selectedChapters.length) && <button className="text-blue-600 dark:text-blue-400 hover:underline" onClick={resetSelections}>Clear selection</button>}
                    </div>
                  </div>
                  <div className="space-y-10">
                    <div>
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-2"><span>Books</span><span className="text-[10px] text-slate-400">{selectedBooks.length? `${selectedBooks.length} selected`:'click to select'}</span></div>
                      <div className="w-full h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topBooks} margin={{left:12, right:24, top:10, bottom:70}}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme==='dark'? '#334155':'#e2e8f0'} />
                            <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={70} tick={{fontSize:11, fill: theme==='dark'? '#cbd5e1':'#1e293b'}} stroke={theme==='dark'? '#475569':'#94a3b8'} />
                            <YAxis allowDecimals={false} width={40} tick={{fontSize:11, fill: theme==='dark'? '#cbd5e1':'#1e293b'}} stroke={theme==='dark'? '#475569':'#94a3b8'} />
                            <Tooltip cursor={{fill: theme==='dark'? '#1e293b':'#f1f5f9'}} contentStyle={{background: theme==='dark'? '#0f172a':'white', border: '1px solid', borderColor: theme==='dark'? '#334155':'#e2e8f0', color: theme==='dark'? '#f1f5f9':'#0f172a'}} />
                            <Bar dataKey="count" barSize={24} radius={[4,4,0,0]} onClick={(d)=> toggleBook(d.name)} className="cursor-pointer" isAnimationActive={false}>
                              <LabelList dataKey="count" position="top" style={{fontSize:11, fill: theme==='dark'? '#e2e8f0':'#0f172a', fontWeight:500}} />
                              {topBooks.map((entry,index)=>(<Cell key={`book-v-${index}`} fill={selectedBooks.includes(entry.name)? (theme==='dark'? '#0d9488':'#0f766e'):(theme==='dark'? '#64748b':'#94a3b8')} />))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      {selectedBooks.length!==1 && <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Select one book to drill into chapters.</div>}
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-2"><span>Chapters {selectedBooks.length===1 && <span className="text-slate-400">in {selectedBooks[0]}</span>}</span><span className="text-[10px] text-slate-400">{selectedChapters.length? `${selectedChapters.length} selected` : (selectedBooks.length===1? 'click to select':'—')}</span></div>
                      <div className="w-full h-[320px] rounded-xl border border-slate-100 dark:border-slate-700 p-3 bg-slate-50/50 dark:bg-slate-800/40">
                        {selectedBooks.length===1 ? (
                          chapterBreakdown.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chapterBreakdown} margin={{left:12,right:24,top:10,bottom:70}}>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme==='dark'? '#334155':'#e2e8f0'} />
                                <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={70} tick={{fontSize:11, fill: theme==='dark'? '#cbd5e1':'#1e293b'}} stroke={theme==='dark'? '#475569':'#94a3b8'} />
                                <YAxis allowDecimals={false} width={40} tick={{fontSize:11, fill: theme==='dark'? '#cbd5e1':'#1e293b'}} stroke={theme==='dark'? '#475569':'#94a3b8'} />
                                <Tooltip cursor={{fill: theme==='dark'? '#1e293b':'#f1f5f9'}} contentStyle={{background: theme==='dark'? '#0f172a':'white', border: '1px solid', borderColor: theme==='dark'? '#334155':'#e2e8f0', color: theme==='dark'? '#f1f5f9':'#0f172a'}} />
                                <Bar dataKey="count" barSize={24} radius={[4,4,0,0]} onClick={(d)=> toggleChapter(`${selectedBooks[0]} ${d.name}`)} className="cursor-pointer" isAnimationActive={false}>
                                  <LabelList dataKey="count" position="top" style={{fontSize:11, fill: theme==='dark'? '#e2e8f0':'#0f172a', fontWeight:500}} />
                                  {chapterBreakdown.map((entry,index)=>(<Cell key={`chap-v-${index}`} fill={selectedChapters.includes(`${selectedBooks[0]} ${entry.name}`)? (theme==='dark'? '#0284c7':'#0891b2'):(theme==='dark'? '#475569':'#cbd5e1')} />))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          ) : <div className="h-full flex items-center justify-center text-xs text-slate-400">No chapters</div>
                        ) : <div className="h-full flex items-center justify-center text-xs text-slate-400">Select exactly one book to view chapters</div>}
                      </div>
                      <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Verses list is filtered by selected chapters (if any) else by selected books.</div>
                    </div>
                  </div>
                </motion.div>
              )}
              <motion.div layout initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.25}} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm scroll-mt-[72px] transition-colors">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">Search Results</span>{' '}
                  {query ? <>
                    for “{query}” {searchScope==='book' && currentBook ? <>in <span className="font-semibold">{currentBook.name}</span> </>: null}— {searchResults.totalMatches}{searchResults.exceeded && ' (too many, limit exceeded)'} matches
                    {(selectedBooks.length||selectedChapters.length) ? <> · showing <span className="font-semibold">{filteredRows.length}</span></>:null}
                  </> : <span className="text-slate-400">(enter search term)</span>}
                </div>
                <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-700">
                  {query && !searchResults.exceeded && searchResults.rows.length===0 && <p className="text-slate-500 dark:text-slate-400 text-sm py-6">No matches.</p>}
                  {searchResults.exceeded && (
                    <div className="py-6 text-sm space-y-3">
                      <p className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-4 leading-relaxed">More than {MAX_SEARCH_RESULTS.toLocaleString()} matching verses were detected. Please refine your search before results are shown.</p>
                      <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 text-xs space-y-1">
                        <li>Add another word or switch to Phrase mode.</li>
                        <li>Use Phrase mode to narrow multi-word searches.</li>
                        <li>Use a more specific term (e.g. “Jerusalem temple” instead of “the”).</li>
                        <li>Narrow the verse range (adjust Verse from / to) or jump to a single book.</li>
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
                      <div className="leading-7">{highlightText(r.text,searchObj)}</div>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </section>
      </main>

    {/* Unified bottom bar (was mobile only) */}
  <div ref={bottomBarRef} className={classNames('fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur pb-[env(safe-area-inset-bottom)] transition-opacity duration-150', showControls && 'opacity-0 pointer-events-none')}>
  <div className="w-full px-3 py-2 grid grid-cols-1">
          <div className="flex justify-center">
            <button aria-expanded={showControls} onClick={()=> setShowControls(v=>!v)} className={classNames('rounded-lg px-4 py-2 border text-sm', 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600', showControls && 'ring-1 ring-slate-400/50 dark:ring-slate-500/50')}>Controls</button>
          </div>
        </div>
      </div>

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
              <div className="sticky top-0 z-10 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur">
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
                          {(()=>{ const b=bible?.[mBookIdx]; if(!b) return '—'; const ab=bookAbbrev(b.name,b.abbrev); return ab? `${ab} · ${b.name}`: b.name; })()}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Change ▸</span>
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Chapter</label>
                      <button onClick={openChapterPicker} className="w-full text-left px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm flex items-center justify-between"><span className="font-medium text-slate-700 dark:text-slate-200 truncate">{mChapterCount? (mChapterIdx+1): '—'}</span><span className="text-xs text-slate-500 dark:text-slate-400">Change ▸</span></button>
                      <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-400">Verses in chapter: {mVerseCount||0}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Verse Range (drag handles)</label>
                        {/* Inputs removed; slider below */}
                      </div>
                    </div>
                    {mVerseCount > 1 && (
                      <div className="pt-2 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Range: <span className="font-medium text-slate-700 dark:text-slate-200">{mVStart}</span></span>
                          <span>to <span className="font-medium text-slate-700 dark:text-slate-200">{mVEnd===0? mVerseCount || 1 : mVEnd}</span>{mVEnd===0 && ' (end)'} </span>
                        </div>
                        <DualRange
                          min={1}
                          max={mVerseCount||1}
                          start={mVStart}
                          end={mVEnd===0? (mVerseCount||1): mVEnd}
                          onChange={({start,end})=>{
                            setMVStart(start);
                            if(end === (mVerseCount||1)) setMVEnd(0); else setMVEnd(end);
                          }}
                        />
                      </div>
                    )}
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
                            <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{(()=>{ const b=bible?.[mBookIdx]; if(!b) return '—'; const ab=bookAbbrev(b.name,b.abbrev); return ab? `${ab} · ${b.name}`: b.name; })()}</span>
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
                      {(selectedBooks.length||selectedChapters.length) && (
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
                    <button onClick={()=> setShowVersionPicker(false)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600">Close</button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                    {versionsByLanguage.map(([lang,list])=> (
                      <div key={lang} className="space-y-2">
                        <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400">{lang}</div>
                        <div className="grid grid-cols-3 gap-2">
                          {list.map(v=> {
                            const active = tempVersion===v.abbreviation;
                            return (
                              <button key={v.abbreviation} onClick={()=> setTempVersion(v.abbreviation)} className={classNames('px-2 py-2 rounded-md border text-[11px] font-medium leading-tight', active? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>{v.name}</button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {version==='sample' && (
                      <div className="space-y-2">
                        <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-500 dark:text-slate-400">Sample</div>
                        <div className="grid grid-cols-3 gap-2">
                          <button onClick={()=> setTempVersion('sample')} className={classNames('px-2 py-2 rounded-md border text-[11px] font-medium leading-tight', tempVersion==='sample'? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>Sample</button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex">
                    <button onClick={applyVersionPicker} disabled={!tempVersion} className="w-full rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 disabled:opacity-50">Apply</button>
                  </div>
                </div>
              )}
              {/* Book Picker Overlay */}
              {showBookPicker && (
                <div className="absolute inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col">
                  <div className="sticky top-0 px-4 py-4 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur flex items-center justify-between">
                    <div className="text-sm font-semibold tracking-wide">Select Book</div>
                    <button onClick={()=> setShowBookPicker(false)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600">Close</button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="grid grid-cols-6 gap-2">
                      {(bible ?? []).map((b,i)=>{ const ab=bookAbbrev(b.name,b.abbrev); const active=i===tempBookIdx; return (
                        <button key={b.name+i} onClick={()=>{ setTempBookIdx(i); setTempChapterIdx(0); }} className={classNames('h-10 rounded-md text-[11px] font-semibold border tracking-wide', active? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>{ab}</button>
                      ); })}
                    </div>
                  </div>
                  <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex">
                    <button onClick={applyBookPicker} className="w-full rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-sm font-medium px-4 py-2.5">Apply</button>
                  </div>
                </div>
              )}
              {/* Chapter Picker Overlay */}
              {showChapterPicker && (
                <div className="absolute inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col">
                  <div className="sticky top-0 px-4 py-4 border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur flex items-center justify-between">
                    <div className="text-sm font-semibold tracking-wide">Select Chapter</div>
                    <button onClick={()=> setShowChapterPicker(false)} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600">Close</button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="grid grid-cols-6 gap-2">
                      {Array.from({length: mChapterCount||0}, (_,n)=> n+1).map(n=> { const active = n===tempChapterIdx+1; return (
                        <button key={n} onClick={()=>{ setTempChapterIdx(n-1); }} className={classNames('h-10 rounded-md text-[11px] font-semibold border', active? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>{n}</button>
                      ); })}
                    </div>
                  </div>
                  <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex">
                    <button onClick={applyChapterPicker} className="w-full rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-sm font-medium px-4 py-2.5">Apply</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

  {/* Scroll to top now integrated with footer area */}

  {/* Footer removed for unified mobile-style layout across all screen sizes */}
    </div>
  );
}
