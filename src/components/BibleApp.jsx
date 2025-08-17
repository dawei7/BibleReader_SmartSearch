import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
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

// (Inline VersePicker removed; replaced by full-screen overlay)

// (Verse range slider removed)

// Main component
export default function BibleApp(){
  // Core state (some variables referenced further below were originally defined earlier in file)
  const [bible,setBible]=useState(null);
  const [version,setVersion]=useState('de_schlachter');
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
    utter.onend = ()=>{
      if(ttsRunIdRef.current !== myRun) return;
      if(ttsStoppedRef.current) return;
      const next = (ttsIndexRef.current|0)+1;
      if(next<readVerses.length){ speakIndex(next); }
      else { stopTTS(); }
    };
    utter.onerror = ()=>{ if(ttsRunIdRef.current !== myRun) return; if(ttsStoppedRef.current) return; const next=(ttsIndexRef.current|0)+1; if(next<readVerses.length){ speakIndex(next); } else { stopTTS(); } };
    currentUtterRef.current = utter;
    try {
      if(!ttsStoppedRef.current){
        window.speechSynthesis.cancel(); // clear any pending
        window.speechSynthesis.speak(utter);
      }
    } catch {}
  },[ttsSupported,readVerses,ttsRate,ttsPitch,versionLangCode,stopTTS,bookIdx,chapterIdx,voicePrefMap]);

  const startTTS = useCallback((from)=>{
    if(!ttsSupported || !readVerses.length) return;
    ttsStoppedRef.current = false;
  // Start a fresh session
  ttsRunIdRef.current += 1;
  currentUtterRef.current = null;
  // Fresh language => refresh voice selection; do not force voice if not matching
  ttsVoiceRef.current = pickVoiceFor(versionLangCode) || null;
    setTtsStatus('playing');
    // Start at provided index, else remembered last verse, else 0
    let startIndex = (typeof from === 'number' ? from : ttsLastIndexRef.current|0);
    if(!(startIndex>=0 && startIndex<readVerses.length)) startIndex = 0;
    speakIndex(clamp(startIndex,0,readVerses.length-1));
  },[ttsSupported,readVerses,versionLangCode,speakIndex]);

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

  // Stop TTS when leaving read mode
  useEffect(()=>{ if(mode!=='read'){ stopTTS(); } },[mode,stopTTS]);
  // Stop and reset remembered verse when position or verse range changes
  useEffect(()=>{
    stopTTS();
    ttsLastIndexRef.current = 0;
    setTtsLastVisibleIndex(0);
  },[bookIdx,chapterIdx,vStart,vEnd,stopTTS]);
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
  // Stats overlay scrollers (top mirror and main content)
  const statsTopScrollRef = useRef(null);
  const statsMainScrollRef = useRef(null);
  // Verse picker overlay
  const [showVersePicker, setShowVersePicker] = useState(false);
  // Voice picker overlay
  const [showVoicePicker, setShowVoicePicker] = useState(false);

  // Map language codes to readable labels (basic set based on bundled versions)
  const LANG_LABELS = useMemo(()=>({
    en:'English', de:'German', zh:'Chinese', es:'Spanish', pt:'Portuguese', fr:'French', ru:'Russian', ro:'Romanian', vi:'Vietnamese', el:'Greek', ko:'Korean', fi:'Finnish', eo:'Esperanto', ar:'Arabic'
  }),[]);
  const versionLangCodes = useMemo(()=>{
    try {
      const s = new Set();
      (versions||[]).forEach(v=>{ const code=((v.abbreviation||'').split('_')[0]||'').toLowerCase(); if(code) s.add(code); });
      // If empty (not loaded yet), infer from available voices
      if(!s.size && (voicesRef.current||[]).length){
        (voicesRef.current||[]).forEach(vc=>{ const code = (vc.lang||'').slice(0,2).toLowerCase(); if(code) s.add(code); });
      }
      return Array.from(s).sort();
    } catch { return []; }
  },[versions, voicesTick]);

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
  const modeRef = useRef(mode);
  const prevModeRef = useRef(mode);
  useEffect(()=>{
    prevModeRef.current = modeRef.current;
    modeRef.current = mode;
        
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
  <header ref={headerRef} className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm border-b border-slate-200 dark:border-slate-700">
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
                  aria-label={t==='read' ? 'Read' : 'Search'}
                  title={t==='read' ? 'Read' : 'Search'}
                  className={classNames('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    // @ts-ignore existing mode
                    mode===t? 'bg-white dark:bg-slate-900 shadow border border-slate-200 dark:border-slate-600':'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white')}
                  onClick={()=>{
                    // Save current scroll position before switching modes
                    if(mode === 'read') {
                      const rTop = readPaneRef.current?.scrollTop || 0;
                      setReadScrollY(rTop);
                    } else {
                      const sTop = searchPaneRef.current?.scrollTop || 0;
                      setSearchScrollY(sTop);
                    }
                    setMode(t);
                  }}
                >
                  {t==='read' ? <Icon.Read className="h-4 w-4"/> : <Icon.Search className="h-4 w-4"/>}
                </button>
              ))}
            </nav>
            {/* Install icon will be placed after Settings */}
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
            {/* Mobile controls toggle now in bottom tab bar */}
            {/* Theme selection removed from navbar; adjust theme in Settings */}
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

  <main
  className="flex-1 w-full px-0 pb-0 overflow-hidden transition-[padding]"
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

          {/* Divider (the “read line”) */}
          <div className="my-4 border-t border-slate-200 dark:border-slate-700" />

          {/* README / User Guide */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold tracking-tight text-slate-800 dark:text-slate-100">README · User Guide</h3>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">What this app is</h4>
              <p className="mt-1">
                Bible Reader & Smart Search is a focused, mobile‑style web app for reading the Bible and running fast, precise searches across versions. It supports full‑chapter reading, sticky headers, inline highlighting, and statistics‑driven filtering.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Quick start</h4>
              <ol className="mt-1 list-decimal list-inside space-y-1">
                <li>Pick a Bible version (defaults to Schlachter on first load).</li>
                <li>Use Read to navigate by book/chapter. Use the ▶︎/◀︎ buttons in the header to move between chapters.</li>
                <li>Use Search to enter a term and optionally filter to a single book or chapter.</li>
                <li>Tap a search result to jump back to Read view at that exact verse (highlighted).</li>
                <li>Adjust typography, layout, theme, and defaults in Settings. Your choices persist on this device.</li>
              </ol>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Modes</h4>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li><span className="font-medium">Read</span> — shows one chapter at a time with a sticky header: Version · Book Abbrev · Chapter. Verse numbers can be inline or superscript.</li>
                <li><span className="font-medium">Search</span> — results list with a sticky summary bar and optional Statistics & Filters (book heatmap, per‑chapter counts). Click a result to jump to Read.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Top bar actions</h4>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li><span className="font-medium">Mode toggle</span> — switch between Read and Search.</li>
                <li><span className="font-medium">Save (💾)</span> — visible only in Read. Saves your current Version, Book, and Chapter as the app’s defaults on this device. On reload, the app opens exactly there.</li>
                <li><span className="font-medium">Settings</span> — opens the settings page (typography, layout, theme, Bible defaults).</li>
                <li><span className="font-medium">Theme cycle</span> — System → Light → Dark.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Controls overlay</h4>
              <p className="mt-1">A unified full‑screen sheet (mobile style) for quick reading/search controls.</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li><span className="font-medium">Read controls</span>: Version, Book, Chapter. Apply commits changes and scrolls to top of the chapter. Reading always shows the full chapter.</li>
                <li><span className="font-medium">Search controls</span>: Version, Query, Mode (All/Any/Phrase), Scope (Whole Bible/This Book), optional Chapter Range, Case sensitivity. The header shows a live estimate before you apply.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Settings</h4>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li><span className="font-medium">Typography</span>: font size, serif/sans, line height (a single slider that applies to both block and continuous layouts), optional text justification.</li>
                <li><span className="font-medium">Layout</span>: reader width 20–100%. At 100% the page is full‑bleed; the container is not centered or clamped.</li>
                <li><span className="font-medium">Verse numbers</span>: show/hide; inline or superscript.</li>
                <li><span className="font-medium">Behavior</span>: hover highlight for verse blocks; auto‑highlight search terms in Read.</li>
                <li><span className="font-medium">Theme</span>: System (default), Light, Dark.</li>
                <li><span className="font-medium">Bible defaults</span>:
                  <ul className="list-disc list-inside ml-5 mt-1 space-y-1">
                    <li><span className="font-medium">Default version</span> — sets the standard version on this device.</li>
                    <li><span className="font-medium">Default book</span> — optional; when set, app opens to this book.</li>
                    <li><span className="font-medium">Default chapter</span> — optional; when omitted, chapter 1 of the default book is used.</li>
                    <li><span className="font-medium">None options</span> — you can clear Book or Chapter defaults. Precedence rules below.</li>
                  </ul>
                </li>
                <li><span className="font-medium">Reset to defaults</span>: 100% width, 16px font, superscript verse numbers, System theme, blocks layout.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Saving vs. Settings (unified)</h4>
              <p className="mt-1">The Save button and Settings now write the same persistent defaults:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li><code className="px-1 rounded bg-slate-800/10 dark:bg-slate-200/10">br_version</code> — your chosen version.</li>
                <li><code className="px-1 rounded bg-slate-800/10 dark:bg-slate-200/10">br_default_pos_&lt;version&gt;</code> — default bookIdx and chapterIdx.</li>
                <li><code className="px-1 rounded bg-slate-800/10 dark:bg-slate-200/10">br_pos_&lt;version&gt;</code> — last reading position (kept in sync).</li>
              </ul>
              <p className="mt-2">On load, the app opens using this precedence:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Default position (from Settings or Save)</li>
                <li>Last reading position</li>
                <li>Genesis 1</li>
              </ol>
              <p className="mt-2">If Default book is set but Default chapter is None, chapter 1 is used.</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Version loading strategy</h4>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Versions index: <code className="px-1 rounded bg-slate-800/10 dark:bg-slate-200/10">public/bibles/index.json</code>.</li>
                <li>Startup order: stored version → priority (Schlachter, then KJV) → others.</li>
                <li>Prevents background prefetch from overriding a successfully loaded selection.</li>
                <li>Whole‑Bible JSON is preferred; a sample fallback is bundled if no file loads.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Search logic</h4>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Modes: <span className="font-medium">All</span> (every word must appear), <span className="font-medium">Any</span> (at least one), <span className="font-medium">Phrase</span> (exact, punctuation‑insensitive).</li>
                <li>Case sensitive option.</li>
                <li>Punctuation stripping for queries; word‑boundary‑aware matching across Latin, Greek, Hebrew, Cyrillic and more.</li>
                <li>Result cap: 5,000 matching verses. When exceeded, refine your query/scope.</li>
                <li>Statistics heatmap: tap a book to select; tap chapters to refine; the summary bar updates counts accordingly.</li>
                <li>Preflight estimate shows approximate match totals before you apply your search.</li>
                <li>Inline highlighting shows each match; clicking a result jumps to Read and scrolls to that verse.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Reading experience</h4>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Layouts: <span className="font-medium">Verses as blocks</span> or <span className="font-medium">Continuous text</span>. Continuous uses single‑space separators between verses and removes vertical gaps; line height controls spacing.</li>
                <li>Sticky header shows Version name, book abbreviation, and chapter with the current visible verse range.</li>
                <li>Arrows in the header quickly navigate chapters; Apply in controls scrolls to top.</li>
                <li>From Search, jumping to Read highlights the target verse and auto‑scrolls it under the header.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Persistence keys</h4>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li><code className="px-1 rounded bg-slate-800/10 dark:bg-slate-200/10">br_theme</code> — “system” | “light” | “dark”.</li>
                <li><code className="px-1 rounded bg-slate-800/10 dark:bg-slate-200/10">br_reader_settings</code> — font, line height, width, layout, numbers, behavior.</li>
                <li><code className="px-1 rounded bg-slate-800/10 dark:bg-slate-200/10">br_version</code> — selected version.</li>
                <li><code className="px-1 rounded bg-slate-800/10 dark:bg-slate-200/10">br_default_pos_&lt;version&gt;</code> — default bookIdx and optional chapterIdx.</li>
                <li><code className="px-1 rounded bg-slate-800/10 dark:bg-slate-200/10">br_pos_&lt;version&gt;</code> — last reading position (bookIdx, chapterIdx, verse range).</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Troubleshooting</h4>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>If a version doesn’t load, ensure its JSON is under <code className="px-1 rounded bg-slate-800/10 dark:bg-slate-200/10">public/bibles/&lt;abbr&gt;.json</code> and that it uses the <code>books[].chapters[][]</code> structure.</li>
                <li>If defaults don’t seem to apply, check localStorage keys listed above and reload the page.</li>
                <li>If the result count is “Too many,” narrow your terms or limit scope to a book/chapter.</li>
              </ul>
            </div>
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
  <div ref={readPaneRef} hidden={mode!=='read'} style={{ height: `calc(100vh - ${headerHeight}px)`, overflowY: 'auto', paddingBottom: bottomBarH }} className="">
          {/* Sticky chapter header stays fixed at the top of the scrollable pane */}
          <div ref={readStickyRef} className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-700">
            <div className="px-4 py-2 flex items-center justify-between gap-2">
              <div className="text-sm text-slate-600 dark:text-slate-400 min-w-0">
                <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">{activeVersionName}</span>
                <span className="mx-2 text-slate-400">·</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{currentBook? bookAbbrev(currentBook.name, currentBook.abbrev): ''}</span>
                {" "}Chapter {chapterIdx+1} ({vStartEffective}–{vEndEffective})
              </div>
              <div className="flex items-center gap-2 text-xs">
                {/* TTS controls moved to footer for mobile; keep header uncluttered */}
                <button className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800" disabled={chapterIdx<=0} onClick={()=> { setChapterIdx(c=> clamp(c-1,0,chapterCount-1)); setTimeout(()=> readPaneRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50); }}>◀︎</button>
                <button className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800" disabled={chapterIdx>=chapterCount-1} onClick={()=> { setChapterIdx(c=> clamp(c+1,0,chapterCount-1)); setTimeout(()=> readPaneRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50); }}>▶︎</button>
              </div>
            </div>
          </div>
          {/* Content container below header, rectangular edges */}
          <motion.div
            layout
            initial={{opacity:0,y:8}}
            animate={{opacity:1,y:0}}
            transition={{duration:.25}}
            className="bg-white dark:bg-slate-900 p-4 shadow-sm scroll-mt-[72px] transition-colors"
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
  <div ref={searchPaneRef} hidden={mode!=='search'} style={{ height: `calc(100vh - ${headerHeight}px)`, overflowY: 'scroll', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', position: 'relative', marginTop: 0, paddingBottom: bottomBarH }} className="pr-0 bg-white dark:bg-slate-900">
  {/* Statistics & Filters toggle (hidden by default) */}
  <div className="sticky top-0 left-0 right-0 z-20 mb-0 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur py-2 px-4 border-b border-slate-200 dark:border-slate-700" style={{ top: 0, left: 0, right: 0, transform: 'translateZ(0)', willChange: 'top' }}>
        <div className="w-full flex items-center justify-between gap-3">
          <div className="min-w-0 text-[13px] text-slate-600 dark:text-slate-400 truncate">
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
          </div>
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
      </main>

    {/* Unified bottom bar (was mobile only) */}
  <div ref={bottomBarRef} className={classNames('fixed inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-700 pb-[max(12px,env(safe-area-inset-bottom))] pt-2', 'bottom-0')}>
  <div className="w-full px-3 py-2 grid grid-cols-1">
          <div className="flex justify-center items-center gap-2">
            <button aria-expanded={showControls} onClick={()=> setShowControls(v=>!v)} className={classNames('rounded-lg px-4 py-2 border text-sm', 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600', showControls && 'ring-1 ring-slate-400/50 dark:ring-slate-500/50')}>Controls</button>
            {/* Split button: Play/Stop + Verse chooser (unified TTS feature) */}
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
                {readVerses.length>0 ? `Verse ${Math.min((ttsActiveIndex>=0? ttsActiveIndex : ttsLastVisibleIndex)+1, readVerses.length)}/${readVerses.length}` : 'Verse —/—'}
                <span className="ml-1">▾</span>
              </button>
            </div>
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
        <div className="text-sm font-semibold tracking-wide">{bookPickerContext==='settings' ? 'Default Book' : 'Select Book'}</div>
                    <button onClick={()=> { setShowBookPicker(false); if(bookPickerContext==='settings') setShowControls(false); }} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600">Close</button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="grid grid-cols-6 gap-2">
                      {(bible ?? []).map((b,i)=>{ const active=i===tempBookIdx; return (
                        <button key={b.name+i} onClick={()=>{ setTempBookIdx(i); setTempChapterIdx(0); }} className={classNames('h-10 rounded-md text-[11px] font-semibold border tracking-wide', active? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-600 dark:border-indigo-600':'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600')}>{bookAbbrev(b.name, b.abbrev)}</button>
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
        <div className="text-sm font-semibold tracking-wide">{chapterPickerContext==='settings' ? 'Default Chapter' : 'Select Chapter'}</div>
                    <button onClick={()=> { setShowChapterPicker(false); if(chapterPickerContext==='settings') setShowControls(false); }} className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600">Close</button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="grid grid-cols-6 gap-2">
          {Array.from({length: (chapterPickerContext==='settings' ? ((bible?.[(defaultBookIdx ?? mBookIdx)]?.chapters.length)||0) : (mChapterCount||0))}, (_,n)=> n+1).map(n=> { const active = n===tempChapterIdx+1; return (
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
    {mode==='read' && shareToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow">
      {shareToast}
        </div>
      )}

    {/* Full-screen Verse Picker overlay */}
    {showVersePicker && (
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

  {/* Scroll to top now integrated with footer area */}

  {/* Footer removed for unified mobile-style layout across all screen sizes */}
    </div>
  );
}
