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
  if (!regexOrObj) return text;
  let highlight;
  if (regexOrObj instanceof RegExp) { let flags = regexOrObj.flags.includes('g')? regexOrObj.flags: regexOrObj.flags+'g'; if(!flags.includes('u')) flags+='u'; highlight = new RegExp(regexOrObj.source, flags); }
  else { const r=regexOrObj.highlight; let flags = r.flags.includes('g')? r.flags: r.flags+'g'; if(!flags.includes('u')) flags+='u'; highlight=new RegExp(r.source, flags); }
  const parts=[]; let last=0; let m; while((m=highlight.exec(text))!==null){ const start=m.index; const end=start+m[0].length; if(start>last) parts.push(text.slice(last,start)); parts.push(<mark key={start} className="rounded px-0.5 bg-transparent text-red-600 font-semibold">{text.slice(start,end)}</mark>); last=end; if(m.index===highlight.lastIndex) highlight.lastIndex++; } if(last<text.length) parts.push(text.slice(last)); return parts;
}

export default function BibleApp(){
  const [bible,setBible]=useState(null);
  const [versions,setVersions]=useState([]);
  const [version,setVersion]=useState('');
  const [loadingVersion,setLoadingVersion]=useState(false);
  const [versionError,setVersionError]=useState(null);
  // Theme (light/dark) --------------------------------------------------
  const [theme,setTheme]=useState(()=>{
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') return stored;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark':'light';
    }
    return 'light';
  });
  useEffect(()=>{
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
      try { localStorage.setItem('theme', theme); } catch {}
    }
  },[theme]);
  // Optional: react to system theme changes when user hasn't explicitly chosen
  useEffect(()=>{
    if (!window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e)=>{
      const stored = localStorage.getItem('theme');
      if (!stored) setTheme(e.matches? 'dark':'light');
    };
    mql.addEventListener?.('change', listener);
    return ()=> mql.removeEventListener?.('change', listener);
  },[]);
  const [mode,setMode]=useState('read');
  const [bookIdx,setBookIdx]=useState(0); const [chapterIdx,setChapterIdx]=useState(0); const [vStart,setVStart]=useState(1); const [vEnd,setVEnd]=useState(0);
  const [queryInput,setQueryInput]=useState(''); const [query,setQuery]=useState('');
  const [searchScope,setSearchScope]=useState('all');
  const [chapFrom,setChapFrom]=useState(1); const [chapTo,setChapTo]=useState(0);
  const [searchMode,setSearchMode]=useState('all'); const [caseSensitive,setCaseSensitive]=useState(false);
  const [lazyMode,setLazyMode]=useState(true);
  const [lastAttempt,setLastAttempt]=useState('');
  const [attemptLog,setAttemptLog]=useState([]);
  const [metaMap,setMetaMap]=useState({});
  const bookCache=useRef({});
  const bibleCacheRef=useRef({});
  const loadTokenRef=useRef(0);
  const FETCH_TIMEOUT_MS=7000;
  const MAX_SEARCH_RESULTS = 5000;

  async function attemptLoadAny(list){ for(const v of list){ const ok=await loadBibleVersion(v.abbreviation); if(ok) return true; } if(!bible){ setBible(SAMPLE_BIBLE); setVersion('sample'); } return false; }

  useEffect(()=>{ let cancelled=false; (async()=>{ try { const res=await fetch('/bibles/index.json',{cache:'no-cache'}); if(!res.ok) throw new Error('index fetch'); const idx= await res.json(); if(cancelled) return; const flat = idx.flatMap(g=> g.versions.map(v=>({language:g.language,name:v.name,abbreviation:v.abbreviation}))); 
        // Custom ordering: 1) Schlachter  2) King James  3) remaining alphabetical by name
        const priority = ['de_schlachter','en_kjv'];
        const picked = priority.map(abbr => flat.find(v=> v.abbreviation===abbr)).filter(Boolean);
        const rest = flat.filter(v=> !priority.includes(v.abbreviation)).sort((a,b)=> a.name.localeCompare(b.name));
        const ordered = [...picked, ...rest];
        setVersions(ordered);
        if(ordered.length){
          // Prefer first (Schlachter if present, else KJV, else first alphabetical)
          const preferred = ordered[0];
          if(preferred){ await loadBibleVersion(preferred.abbreviation); }
          // Fallback: try others only if preferred failed
          if(!bible){ const others = ordered.slice(1); if(others.length) attemptLoadAny(others); }
        }
      } catch { if(!cancelled){ setBible(SAMPLE_BIBLE); setVersion('sample'); } } })(); return ()=>{cancelled=true}; },[]);
  function normalizeBible(data){ data.forEach(b=>{ if(!b.name) b.name = b.abbrev? String(b.abbrev).toUpperCase():'Unknown'; }); }
  function validateBibleStructure(raw){ return Array.isArray(raw) && raw.every(b=> b && typeof b==='object' && Array.isArray(b.chapters)); }
  function coerceBible(raw){ if(validateBibleStructure(raw)) return raw; if(raw && typeof raw==='object'){ const cand = raw.books || raw.bible || raw.data; if(validateBibleStructure(cand)) return cand; } throw new Error('Invalid JSON format'); }
  async function loadBibleVersion(abbr){ if(!abbr) return false; if(bibleCacheRef.current[abbr]){ setBible(bibleCacheRef.current[abbr]); setVersion(abbr); setBookIdx(0); setChapterIdx(0); setVStart(1); setVEnd(0); setAttemptLog(l=>[...l,`cacheHit:${abbr}`].slice(-60)); return true; } setLastAttempt(abbr); setAttemptLog(l=>[...l,`try:${abbr}`].slice(-60)); setLoadingVersion(true); setVersionError(null); const myToken=++loadTokenRef.current; let data=null; try { try { const controller=new AbortController(); const to=setTimeout(()=>controller.abort(),FETCH_TIMEOUT_MS); let res; try { res=await fetch(`/bibles/${abbr}.json`,{cache:'no-cache',signal:controller.signal}); } finally { clearTimeout(to); } if(res?.ok){ setAttemptLog(l=>[...l,`status:${abbr}:200`].slice(-60)); const buf=await res.arrayBuffer(); const dec=new TextDecoder('utf-8'); let text=dec.decode(buf); if(text.charCodeAt(0)===0xFEFF) text=text.slice(1); let raw; try { raw=JSON.parse(text); } catch { setAttemptLog(l=>[...l,`parseErr:${abbr}`].slice(-60)); throw new Error('JSON parse error'); } try { data=coerceBible(raw); } catch { setAttemptLog(l=>[...l,`structureErr:${abbr}`].slice(-60)); throw new Error('Structure error'); } } else if(res){ setAttemptLog(l=>[...l,`status:${abbr}:${res.status}`].slice(-60)); } } catch(fetchErr){ setAttemptLog(l=>[...l,`fetchErr:${abbr}`].slice(-60)); if(!versionError) setVersionError(String(fetchErr?.message||fetchErr)); } if(!data && lazyMode){ try { const metaRes=await fetch(`/bibles/${abbr}/meta.json`,{cache:'no-cache'}); if(metaRes.ok){ const meta=await metaRes.json(); setMetaMap(m=>({...m,[abbr]:meta})); setAttemptLog(l=>[...l,`meta:${abbr}`].slice(-60)); const first=meta.books?.[0]; if(first){ const bRes=await fetch(`/bibles/${abbr}/${first.file}`,{cache:'no-cache'}); if(bRes.ok){ const bRaw=await bRes.json(); const book={name:bRaw.name,abbrev:bRaw.abbrev,chapters:bRaw.chapters}; data=[book]; bookCache.current[`${abbr}:0`]=book; setAttemptLog(l=>[...l,`lazyFirstBook:${abbr}`].slice(-60)); } } } } catch {} } if(!data){ try { const mod=await import(`../../bibles/${abbr}.json`); data=coerceBible(mod.default); } catch {} } if(!data) throw new Error('No data loaded'); normalizeBible(data); if(loadTokenRef.current!==myToken){ setAttemptLog(l=>[...l,`staleDrop:${abbr}`].slice(-60)); return false; } setBible(data); setVersion(abbr); if(data.length>=3) bibleCacheRef.current[abbr]=data; setAttemptLog(l=>[...l,`success:${abbr}`].slice(-60)); setBookIdx(0); setChapterIdx(0); setVStart(1); setVEnd(0); return true; } catch(e){ setVersionError(`Error loading "${abbr}": ${e.message||e}`); setAttemptLog(l=>[...l,`fail:${abbr}`].slice(-60)); return false; } finally { setLoadingVersion(false); } }
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
  const [isMobile,setIsMobile]=useState(false);
  const [showControls,setShowControls]=useState(true); // whether panel is rendered (mobile)
  const [autoVisible,setAutoVisible]=useState(true); // true if visibility due to being at top
  const [showScrollTop,setShowScrollTop]=useState(false);
  const headerRef = useRef(null);
  const panelRef = useRef(null);
  const [headerHeight,setHeaderHeight]=useState(72); // fallback
  const [panelHeight,setPanelHeight]=useState(0);
  const caseSensitiveRef = useRef(null);

  // measure header + panel sizes for dynamic spacing on mobile
  useEffect(()=>{
    function measure(){
      if(headerRef.current){ setHeaderHeight(headerRef.current.offsetHeight || 72); }
      if(panelRef.current){ setPanelHeight(panelRef.current.offsetHeight || 0); }
    }
    measure();
    window.addEventListener('resize',measure);
    const ro = typeof ResizeObserver!=='undefined'? new ResizeObserver(measure):null;
    if(ro && headerRef.current) ro.observe(headerRef.current);
    if(ro && panelRef.current) ro.observe(panelRef.current);
    return ()=>{ window.removeEventListener('resize',measure); ro?.disconnect(); };
  },[mode,isMobile]);
  // Measure whenever controls become visible
  useEffect(()=>{
    if(!isMobile) return;
    if(showControls && panelRef.current){
      const h = panelRef.current.offsetHeight || panelRef.current.scrollHeight || 0;
      if(h>0) setPanelHeight(h);
      const id = requestAnimationFrame(()=>{
        if(panelRef.current){
          const hh = panelRef.current.offsetHeight || panelRef.current.scrollHeight || 0;
          if(hh>0) setPanelHeight(hh);
        }
      });
      return ()=> cancelAnimationFrame(id);
    }
  },[isMobile, showControls, mode]);
  useEffect(()=>{
    function handleResize(){ setIsMobile(window.innerWidth < 768); }
    handleResize();
    window.addEventListener('resize',handleResize);
    return ()=> window.removeEventListener('resize',handleResize);
  },[]);
  useEffect(()=>{
    if(!isMobile){ setShowControls(true); setAutoVisible(true); setShowScrollTop(false); return; }
    let lastTop = true;
    function onScroll(){
      const y = window.scrollY;
      const atTop = y <= 4;
      setShowScrollTop(y>400);
      if(atTop){
        if(!showControls){ setShowControls(true); }
        if(!autoVisible){ setAutoVisible(true); }
      } else {
        if(autoVisible && showControls){
          // was only visible because at top; hide now
            setShowControls(false);
            setAutoVisible(false);
        }
      }
      lastTop = atTop;
    }
    window.addEventListener('scroll',onScroll,{passive:true});
    onScroll();
    return ()=> window.removeEventListener('scroll',onScroll);
  },[isMobile, autoVisible, showControls]);
  // Selections cleared inline when version or search input changes; also defensively here if query/version changed elsewhere
  useEffect(()=>{ if(selectedBooks.length||selectedChapters.length){ setSelectedBooks([]); setSelectedChapters([]);} },[queryInput,version]);
  const chapterBreakdown = useMemo(()=>{ if(searchResults.exceeded) return []; if(selectedBooks.length!==1) return []; const b=selectedBooks[0]; return Object.entries(searchResults.perChap).filter(([k])=> k.startsWith(b+" ")).map(([k,c])=>({ name:k.substring(b.length+1), count:c })).sort((a,b)=> parseInt(a.name)-parseInt(b.name)); },[selectedBooks,searchResults]);
  const filteredRows = useMemo(()=>{ if(!searchResults || searchResults.exceeded) return []; if(selectedChapters.length){ const chapSet=new Set(selectedChapters); return searchResults.rows.filter(r=> chapSet.has(`${r.book} ${r.chapter}`)); } if(selectedBooks.length){ const bookSet=new Set(selectedBooks); return searchResults.rows.filter(r=> bookSet.has(r.book)); } return searchResults.rows; },[searchResults,selectedBooks,selectedChapters]);
  function toggleBook(name){ setSelectedChapters([]); setSelectedBooks(bs=> bs.includes(name)? bs.filter(b=>b!==name): [...bs,name]); }
  function toggleChapter(chName){ setSelectedChapters(cs=> cs.includes(chName)? cs.filter(c=>c!==chName): [...cs,chName]); }
  function resetSelections(){ setSelectedBooks([]); setSelectedChapters([]); }
  function onSelectBook(i){ setBookIdx(i); setChapterIdx(0); setVStart(1); setVEnd(0); }
  function jumpTo(book, chapter, verse){ if(!bible) return; const idx=bible.findIndex(b=>b.name===book || b.abbrev===book); if(idx>=0){ setBookIdx(idx); setChapterIdx(chapter-1); setVStart(verse); setVEnd(0); setMode('read'); window.scrollTo({top:0,behavior:'smooth'}); } }
  if(!bible){ return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-slate-100 p-6 text-slate-900"><div className="text-center space-y-4 max-w-md"><div><div className="text-2xl font-semibold">Loading Bible…</div><div className="mt-2 text-sm opacity-70">Attempting to load available versions</div></div>{versionError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{versionError}</div>}<div className="text-left text-[10px] leading-relaxed font-mono max-h-40 overflow-auto bg-slate-900/90 text-slate-200 rounded p-2"><div className="opacity-70">Debug</div><div>versions: {versions.map(v=>v.abbreviation).join(', ') || '—'}</div><div>last: {lastAttempt||'—'}</div>{attemptLog.slice(-10).map((l,i)=><div key={i}>{l}</div>)}</div>{loadingVersion && <div className="text-xs text-slate-500">Loading…</div>}<div className="text-xs text-slate-500">JSON files must reside under <code className="px-1 bg-slate-200 rounded">public/bibles</code>.</div><div><button onClick={()=> versions.length && attemptLoadAny(versions)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white text-sm font-medium px-5 py-2.5 shadow">Retry</button><button onClick={()=> setLazyMode(l=>!l)} className="inline-flex ml-2 items-center gap-2 rounded-xl bg-slate-100 border border-slate-300 text-xs px-3 py-2">LazyMode: {lazyMode? 'ON':'OFF'}</button></div></div></div>); }
  const currentYear = new Date().getFullYear();
  // Dynamic padding top: header + panel (if visible)
  let dynamicPadTop = isMobile ? headerHeight + (showControls && panelHeight ? panelHeight + 16 : 12) : 12;
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-slate-50 to-zinc-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 text-slate-900 dark:text-slate-100 transition-colors">
  <header ref={headerRef} className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 text-white grid place-content-center font-black tracking-tight text-lg select-none" aria-label="Alpha Omega">ΑΩ</div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Bible Reader · Smart Search</h1>
              <p className="text-xs font-medium bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Alpha · Omega</p>
            </div>
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
            {isMobile && (
              <button
                onClick={()=>{ setShowControls(v=>{ if(v){ setAutoVisible(false); } return !v; }); if(!showControls){ setPanelHeight(0); }}}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 text-sm"
              >{showControls? 'Hide Controls':'Show Controls'}</button>
            )}
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
        className="flex-1 mx-auto max-w-7xl px-4 pb-36 grid grid-cols-1 lg:grid-cols-12 gap-6 transition-[padding]"
        style={isMobile? { paddingTop: dynamicPadTop } : { paddingTop: 12 }}
      >
        {(!isMobile || showControls) && (
        <aside
          className={classNames(
            'lg:col-span-4 xl:col-span-3 z-40',
            isMobile ? 'fixed left-0 right-0 px-4' : 'sticky top-[72px] self-start h-fit'
          )}
          style={isMobile? { top: headerHeight }: undefined}
        >
          <motion.div
            ref={panelRef}
            layout
            className={classNames(
              'rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/100 dark:bg-slate-900/90 px-4 pt-6 pb-4 shadow-lg backdrop-blur-sm transition-colors',
              isMobile ? 'max-h-[70vh] overflow-y-auto overflow-x-hidden' : 'max-h-[calc(100vh-7rem)] overflow-y-auto'
            )}
            initial={{opacity:0,y:10}}
            animate={{opacity:1,y:0}}
            transition={{duration:.25}}
          >
            {mode==='read' ? (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200">Reading Mode</h2>
                {/* Bible selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Bible</label>
                  <select
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600"
                    value={version}
                    onChange={e=>loadBibleVersion(e.target.value)}
                    disabled={loadingVersion}
                  >
                    {versions.map(v=> <option key={v.abbreviation} value={v.abbreviation}>{v.name} ({v.language})</option>)}
                    {version==='sample' && <option value="sample">Sample</option>}
                  </select>
                  {loadingVersion && <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">Loading…</div>}
                  {versionError && <div className="mt-1 text-[11px] text-red-600">{versionError}</div>}
                </div>
                {/* Book */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Book</label>
                  <select
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    value={bookIdx}
                    onChange={e=>onSelectBook(parseInt(e.target.value))}
                  >
                    {(bible ?? []).map((b,i)=><option key={b.name+i} value={i}>{b.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Chapter</label>
                    <input type="number" className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" min={1} max={chapterCount||1} value={chapterIdx+1} onChange={e=> setChapterIdx(clamp((parseInt(e.target.value)||1)-1,0,(chapterCount||1)-1))} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Verses</label>
                    <div className="text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{verseCount||0}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Verse from</label>
                    <input type="number" className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" min={1} max={verseCount||1} value={vStart} onChange={e=> setVStart(parseInt(e.target.value)||1)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Verse to (0=end)</label>
                    <input type="number" className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" min={0} max={verseCount||1} value={vEnd} onChange={e=> setVEnd(parseInt(e.target.value)||0)} />
                  </div>
                </div>
                <button className="w-full rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 transition-colors" onClick={()=> setMode('search')}>Switch to Search</button>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200">Search Mode</h2>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Bible / Version</label>
                  <select className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={version} onChange={e=>{ if(selectedBooks.length||selectedChapters.length){ setSelectedBooks([]); setSelectedChapters([]);} loadBibleVersion(e.target.value); }} disabled={loadingVersion}>
                    {versions.map(v=> <option key={v.abbreviation} value={v.abbreviation}>{v.name} ({v.language})</option>)}
                    {version==='sample' && <option value="sample">Sample</option>}
                  </select>
                  {loadingVersion && <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">Loading…</div>}
                  {versionError && <div className="mt-1 text-[11px] text-red-600">{versionError}</div>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Search term(s)</label>
                  <input value={queryInput} onChange={e=>{ if(selectedBooks.length||selectedChapters.length){ setSelectedBooks([]); setSelectedChapters([]);} setQueryInput(e.target.value); }} className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" placeholder="e.g. light" />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs font-medium">
                  {[{key:'all',label:'All words'},{key:'any',label:'Any'},{key:'phrase',label:'Phrase'}].map(o=> (
                    <button key={o.key} onClick={()=>setSearchMode(o.key)} className={classNames('px-2.5 py-2 rounded-lg border transition-colors', searchMode===o.key? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>{o.label}</button>
                  ))}
                </div>
                <div className="text-xs font-medium grid grid-cols-2 gap-2">
                  <button onClick={()=>setSearchScope('all')} className={classNames('px-2.5 py-2 rounded-lg border transition-colors', searchScope==='all'? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>Whole Bible</button>
                  <button onClick={()=>setSearchScope('book')} className={classNames('px-2.5 py-2 rounded-lg border transition-colors', searchScope==='book'? 'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>This Book</button>
                </div>
                {searchScope==='book' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Book</label>
                      <select className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" value={bookIdx} onChange={e=>onSelectBook(parseInt(e.target.value))}>
                        {(bible ?? []).map((b,i)=><option key={b.name+i} value={i}>{b.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Chapter from</label>
                        <input type="number" className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" min={1} max={(bible?.[bookIdx]?.chapters.length)||1} value={chapFrom} onChange={e=> setChapFrom(parseInt(e.target.value)||1)} />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">Chapter to (0=end)</label>
                        <input type="number" className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm" min={0} max={(bible?.[bookIdx]?.chapters.length)||1} value={chapTo} onChange={e=> setChapTo(parseInt(e.target.value)||0)} />
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs">
                  <label ref={caseSensitiveRef} className="inline-flex items-center gap-1"><input type="checkbox" checked={caseSensitive} onChange={e=>setCaseSensitive(e.target.checked)} /> Case sensitive</label>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button className="rounded-xl bg-slate-900 dark:bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 transition-colors" onClick={()=> setMode('read')}>To Reading</button>
                  <button className="rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-sm font-medium px-4 py-2.5 transition-colors" onClick={()=> { const el=document.getElementById('statistics-panel'); if(el){ const y=el.getBoundingClientRect().top + window.scrollY - 80; window.scrollTo({top:y,behavior:'smooth'}); } }}>To Statistics</button>
                </div>
              </div>
            )}
      {/* mobile pin/auto-hide removed in favor of header toggle */}
          </motion.div>
        </aside>
    )}

        <section className="lg:col-span-8 xl:col-span-9 space-y-6 mt-0 lg:mt-0 pt-[0px]">
          {mode==='read' ? (
            <motion.div layout initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.25}} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm scroll-mt-[72px] transition-colors">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm text-slate-600 dark:text-slate-400"><span className="font-semibold text-slate-900 dark:text-slate-100">{currentBook?.name}</span> Chapter {chapterIdx+1} ({vStartEffective}–{vEndEffective})</div>
                <div className="flex items-center gap-2 text-xs">
                  <button className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800" disabled={chapterIdx<=0} onClick={()=> setChapterIdx(c=> clamp(c-1,0,chapterCount-1))}>◀︎</button>
                  <button className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800" disabled={chapterIdx>=chapterCount-1} onClick={()=> setChapterIdx(c=> clamp(c+1,0,chapterCount-1))}>▶︎</button>
                </div>
              </div>
              <div className="mt-4 space-y-3 leading-8">
                {readVerses.map(v=> (
                  <div key={v.n} className="rounded-xl px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <span className="mr-2 select-none text-slate-400">{v.n}</span>
                    <span>{v.text}</span>
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

  {/* Scroll to top now integrated with footer area */}

      <footer className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 dark:border-slate-700 bg-white/85 dark:bg-slate-900/85 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="relative max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between text-sm">
          <div className="space-y-1">
            <p className="font-medium text-slate-700 dark:text-slate-300">Bible Reader · Smart Search</p>
            <p className="text-slate-500 dark:text-slate-400">© {currentYear} David Schmid. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
            <a href="#top" className="hover:text-slate-900 dark:hover:text-slate-200">Back to top</a>
            <span className="select-none opacity-40">|</span>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-900 dark:hover:text-slate-200">GitHub</a>
            <span className="select-none opacity-40">|</span>
            <button onClick={()=> setTheme(t=> t==='dark'?'light':'dark')} className="underline decoration-dotted underline-offset-2 hover:text-slate-900 dark:hover:text-slate-200">{theme==='dark'? 'Light theme':'Dark theme'}</button>
          </div>
          {showScrollTop && (
            <button
              onClick={()=> window.scrollTo({top:0,behavior:'smooth'})}
              aria-label="Scroll to top"
              className="absolute right-2 sm:right-4 -top-6 sm:-top-8 w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:active:bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-900/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 15l6-6 6 6" />
              </svg>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
