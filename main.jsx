import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// --- Types ---------------------------------------------------------------
// (Types removed for plain JS build)
// Verse = string
// Chapter = Verse[]
// Book: { abbrev: string; chapters: Chapter[] }
// Bible = Book[]

// --- Minimal sample fallback (Genesis 1:1–13 excerpt, German) ------------
const SAMPLE_BIBLE = [
  {
    abbrev: "gn",
    chapters: [
      [
        "Im Anfang schuf Gott den Himmel und die Erde.",
        "Und die Erde war wüst und leer, und es lag Finsternis auf der Tiefe, und der Geist Gottes schwebte über den Wassern.",
        "Und Gott sprach: Es werde Licht! Und es ward Licht.",
        "Und Gott sah, daß das Licht gut war; da schied Gott das Licht von der Finsternis;",
        "und Gott nannte das Licht Tag, und die Finsternis Nacht. Und es ward Abend, und es ward Morgen: der erste Tag.",
        "Und Gott sprach: Es soll eine Feste entstehen inmitten der Wasser, die bilde eine Scheidewand zwischen den Gewässern!",
        "Und Gott machte die Feste und schied das Wasser unter der Feste von dem Wasser über der Feste, daß es so ward.",
        "Und Gott nannte die Feste Himmel. Und es ward Abend, und es ward Morgen: der zweite Tag.",
        "Und Gott sprach: Es sammle sich das Wasser unter dem Himmel an einen Ort, daß man das Trockene sehe! Und es geschah also.",
        "Und Gott nannte das Trockene Land; aber die Sammlung der Wasser nannte er Meer. Und Gott sah, daß es gut war.",
        "Und Gott sprach: Es lasse die Erde grünes Gras sprossen und Gewächs, das Samen trägt, fruchtbare Bäume, deren jeder seine besondere Art Früchte bringt, in welcher ihr Same sei auf Erden! Und es geschah also.",
        "Und die Erde brachte hervor Gras und Gewächs, das Samen trägt nach seiner Art, und Bäume, welche Früchte bringen, in welchen ihr Same ist nach ihrer Art. Und Gott sah, daß es gut war.",
        "Und es ward Abend, und es ward Morgen: der dritte Tag.",
      ],
    ],
  },
];

// --- Utility helpers -----------------------------------------------------
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

// Count matches and generate a combined regex for highlighting.
function buildSearchRegex(
  query,
  mode,
  { wholeWords, caseSensitive }
) {
  const flags = caseSensitive ? "g" : "gi";
  if (!query.trim()) return null;

  if (mode === "phrase") {
    const body = escapeRegExp(query.trim());
    const pattern = wholeWords ? `\\b${body}\\b` : body;
    return new RegExp(pattern, flags);
  }

  const words = query
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean)
    .map((w) => escapeRegExp(w));

  if (words.length === 0) return null;

  // For highlighting, we always use an OR of all tokens.
  const orBody = words.map((w) => (wholeWords ? `\\b${w}\\b` : w)).join("|");
  const highlight = new RegExp(orBody, flags);

  // For filtering, we use different logic but we'll pass the list of words.
  return { highlight, words, mode, wholeWords, caseSensitive };
}

function countMatches(
  text,
  search
) {
  if (!search) return { count: 0, matched: false };
  if (search instanceof RegExp) {
    // phrase mode
    const regex = new RegExp(search.source, search.flags.includes("g") ? search.flags : search.flags + "g");
    const matches = text.match(regex);
    const count = matches ? matches.length : 0;
    return { count, matched: count > 0 };
  }
  // tokenized mode: all/any
  const { words, wholeWords, caseSensitive, mode } = search;

  const flags = caseSensitive ? "g" : "gi";
  let total = 0;
  const presence = [];
  for (const w of words) {
    const pattern = wholeWords ? `\\b${w}\\b` : w;
    const regex = new RegExp(pattern, flags);
    const m = text.match(regex);
    presence.push(!!m);
    total += m ? m.length : 0;
  }
  const matched = mode === "all" ? presence.every(Boolean) : presence.some(Boolean);
  return { count: matched ? total : 0, matched };
}

function highlightText(
  text,
  regexOrObj
) {
  if (!regexOrObj) return text;

  // Normalize to a highlight regex.
  let highlight;
  if (regexOrObj instanceof RegExp) {
    // Ensure global flag for iterative exec
    const flags = regexOrObj.flags.includes("g") ? regexOrObj.flags : regexOrObj.flags + "g";
    highlight = new RegExp(regexOrObj.source, flags);
  } else {
  const ro = regexOrObj;
    const flags = ro.highlight.flags.includes("g") ? ro.highlight.flags : ro.highlight.flags + "g";
    highlight = new RegExp(ro.highlight.source, flags);
  }

  const parts = [];
  let lastIndex = 0;
  let m;
  while ((m = highlight.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    parts.push(
      <mark
        key={`${start}-${end}`}
        className="rounded px-0.5 bg-transparent text-red-600 font-semibold"
      >
        {text.slice(start, end)}
      </mark>
    );
    lastIndex = end;
    if (m.index === highlight.lastIndex) highlight.lastIndex++; // avoid zero-length loops
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

// --- Main Component ------------------------------------------------------
export default function BibleApp() {
  const [bible, setBible] = useState(null);
  const [mode, setMode] = useState("read");

  // Reader state
  const [bookIdx, setBookIdx] = useState(0);
  const [chapterIdx, setChapterIdx] = useState(0);
  const [vStart, setVStart] = useState(1);
  const [vEnd, setVEnd] = useState(0); // 0 = auto to chapter end

  // Search state
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState("all");
  const [wholeWords, setWholeWords] = useState(true);
  const [caseSensitive, setCaseSensitive] = useState(false);

  // Load Bible JSON: try fetch('/bible.json'), else SAMPLE_BIBLE
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/bible.json");
        if (!res.ok) throw new Error("no external bible.json found");
  const data = await res.json();
        if (!cancelled) setBible(data);
      } catch (e) {
        if (!cancelled) setBible(SAMPLE_BIBLE);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentBook = bible?.[bookIdx];
  const chapterCount = currentBook?.chapters.length ?? 0;
  const verseCount = currentBook ? currentBook.chapters[chapterIdx]?.length ?? 0 : 0;
  const vEndEffective = vEnd === 0 ? verseCount : clamp(vEnd, 1, verseCount);
  const vStartEffective = clamp(vStart, 1, vEndEffective);

  // Build search object
  const searchObj = useMemo(
    () => buildSearchRegex(query, searchMode, { wholeWords, caseSensitive }),
    [query, searchMode, wholeWords, caseSensitive]
  );

  // Compute verses to display in read mode
  const readVerses = useMemo(() => {
  if (!currentBook) return [];
    const verses = currentBook.chapters[chapterIdx] || [];
    return verses
      .slice(vStartEffective - 1, vEndEffective)
      .map((t, i) => ({ n: i + vStartEffective, text: t }));
  }, [currentBook, chapterIdx, vStartEffective, vEndEffective]);

  // Search across the whole Bible
  const searchResults = useMemo(() => {
  if (!bible || !searchObj) return { rows: [], totalMatches: 0, perBook: {}, perChap: {} };

  const rows = [];
  const perBook = {};
  const perChap = {};
    let totalMatches = 0;

    bible.forEach((b) => {
      b.chapters.forEach((ch, cIdx) => {
        ch.forEach((v, vIdx) => {
          const { count, matched } = countMatches(v, searchObj);
          if (matched && count > 0) {
            rows.push({ book: b.abbrev, chapter: cIdx + 1, verse: vIdx + 1, text: v, count });
            totalMatches += count;
            perBook[b.abbrev] = (perBook[b.abbrev] || 0) + count;
            const key = `${b.abbrev} ${cIdx + 1}`;
            perChap[key] = (perChap[key] || 0) + count;
          }
        });
      });
    });

    // Sort results by (book, chapter, verse)
    rows.sort((a, b) =>
      a.book === b.book ? (a.chapter === b.chapter ? a.verse - b.verse : a.chapter - b.chapter) : a.book.localeCompare(b.book)
    );

    return { rows, totalMatches, perBook, perChap };
  }, [bible, searchObj]);

  const topBooks = useMemo(() => {
    return Object.entries(searchResults.perBook)
      .map(([book, count]) => ({ name: book, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [searchResults.perBook]);

  const topChapters = useMemo(() => {
    return Object.entries(searchResults.perChap)
      .map(([chap, count]) => ({ name: chap, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [searchResults.perChap]);

  // Handlers
  const onSelectBook = (idx) => {
    setBookIdx(idx);
    setChapterIdx(0);
    setVStart(1);
    setVEnd(0);
  };

  const jumpTo = (book, chapter, verse) => {
    if (!bible) return;
    const idx = bible.findIndex((b) => b.abbrev === book);
    if (idx >= 0) {
      setBookIdx(idx);
      setChapterIdx(chapter - 1);
      setVStart(verse);
      setVEnd(0);
      setMode("read");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // --- UI ---------------------------------------------------------------
  if (!bible) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-slate-100 text-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="text-2xl font-semibold">Lade Bibel …</div>
          <div className="mt-2 text-sm opacity-70">(Falle ggf. auf Demo-Daten zurück)</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-zinc-100 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur border-b border-slate-200/70 bg-white/70">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 text-white grid place-content-center font-black tracking-tight text-lg select-none" aria-label="Alpha Omega">ΑΩ</div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Bible Reader · Smart Search</h1>
              <p className="text-xs font-medium bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Alpha · Omega</p>
            </div>
          </div>
          <nav className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200">
            {[
              { key: "read", label: "Read" },
              { key: "search", label: "Search" },
            ].map((tab) => (
              <button
                key={tab.key}
                className={classNames(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition",
                  mode === tab.key ? "bg-white shadow border border-slate-200" : "text-slate-600 hover:text-slate-900"
                )}
                onClick={() => setMode(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <aside className="lg:col-span-4 xl:col-span-3">
          <motion.div
            layout
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {mode === "read" ? (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold tracking-wide text-slate-700">Lesemodus</h2>

                {/* Book select */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Buch</label>
                  <select
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    value={bookIdx}
                    onChange={(e) => onSelectBook(parseInt(e.target.value))}
                  >
                    {bible.map((b, i) => (
                      <option key={b.abbrev + i} value={i}>
                        {b.abbrev.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chapter select */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Kapitel</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      min={1}
                      max={chapterCount || 1}
                      value={chapterIdx + 1}
                      onChange={(e) => setChapterIdx(clamp(parseInt(e.target.value) - 1 || 0, 0, (chapterCount || 1) - 1))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Verse im Kapitel</label>
                    <div className="text-sm px-3 py-2 rounded-xl border border-slate-200 bg-slate-50">{verseCount || 0}</div>
                  </div>
                </div>

                {/* Verse range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Vers von</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      min={1}
                      max={verseCount || 1}
                      value={vStart}
                      onChange={(e) => setVStart(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Vers bis</label>
                    <input
                      type="number"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                      min={0}
                      max={verseCount || 1}
                      value={vEnd}
                      onChange={(e) => setVEnd(parseInt(e.target.value) || 0)}
                    />
                    <p className="mt-1 text-[11px] text-slate-500">0 = bis Kapitelende</p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    className="w-full rounded-xl bg-slate-900 text-white text-sm font-medium px-4 py-2.5 shadow hover:shadow-md active:scale-[.99] transition"
                    onClick={() => setMode("search")}
                  >
                    Zur Suche wechseln
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold tracking-wide text-slate-700">Suchmodus</h2>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Suchbegriff(e)</label>
                  <input
                    type="text"
                    placeholder="z.B. Licht, Geist Gottes, ..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-medium">
                  {[
                    { key: "all", label: "Alle Wörter" },
                    { key: "any", label: "Eines der Wörter" },
                    { key: "phrase", label: "Exakte Phrase" },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      className={classNames(
                        "px-2.5 py-2 rounded-lg border transition",
                        searchMode === opt.key
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                      )}
                      onClick={() => setSearchMode(opt.key)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={wholeWords} onChange={(e) => setWholeWords(e.target.checked)} />
                    Ganze Wörter
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} />
                    Groß-/Kleinschreibung
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    className="rounded-xl bg-slate-900 text-white text-sm font-medium px-4 py-2.5 shadow hover:shadow-md active:scale-[.99] transition"
                    onClick={() => setMode("read")}
                  >
                    Zum Lesen
                  </button>
                  <button
                    className="rounded-xl bg-slate-100 border border-slate-300 text-slate-900 text-sm font-medium px-4 py-2.5 hover:bg-slate-200 transition"
                    onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
                  >
                    Zu Statistiken
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </aside>

        {/* Reader / Results */}
        <section className="lg:col-span-8 xl:col-span-9 space-y-6">
          {mode === "read" ? (
            <motion.div
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{currentBook?.abbrev.toUpperCase()}</span>{" "}
                  Kapitel {chapterIdx + 1} ({vStartEffective}–{vEndEffective})
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
                    disabled={chapterIdx <= 0}
                    onClick={() => setChapterIdx((c) => clamp(c - 1, 0, chapterCount - 1))}
                  >
                    ◀︎ Vorheriges Kapitel
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50"
                    disabled={chapterIdx >= chapterCount - 1}
                    onClick={() => setChapterIdx((c) => clamp(c + 1, 0, chapterCount - 1))}
                  >
                    Nächstes Kapitel ▶︎
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-3 leading-8">
                {readVerses.length === 0 ? (
                  <p className="text-slate-500 text-sm">Keine Verse im Bereich.</p>
                ) : (
                  readVerses.map((v) => (
                    <div key={v.n} className="group relative rounded-xl px-3 py-2 hover:bg-slate-50/80">
                      <span className="absolute left-0 -translate-x-full mr-2 text-[11px] text-slate-400 opacity-0 group-hover:opacity-100 transition">{v.n}</span>
                      <span className="mr-2 select-none text-slate-400">{v.n}</span>
                      <span>{v.text}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          ) : (
            <>
              <motion.div
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">Suchergebnisse</span>{" "}
                    {query ? (
                      <>
                        für <span className="italic">“{query}”</span> — {searchResults.totalMatches} Treffer in {searchResults.rows.length} Versen
                      </>
                    ) : (
                      <span className="text-slate-400">(Bitte Suchbegriff eingeben)</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 divide-y divide-slate-100">
                  {query && searchResults.rows.length === 0 && (
                    <p className="text-slate-500 text-sm py-6">Keine Treffer gefunden.</p>
                  )}
                  {searchResults.rows.map((r, i) => (
                    <div key={`${r.book}-${r.chapter}-${r.verse}-${i}`} className="py-3">
                      <div className="text-xs text-slate-500 mb-1">
                        <button
                          className="underline decoration-dotted underline-offset-2 hover:text-slate-900"
                          onClick={() => jumpTo(r.book, r.chapter, r.verse)}
                          title="Im Leser öffnen"
                        >
                          {r.book.toUpperCase()} {r.chapter}:{r.verse}
                        </button>
                        <span className="ml-2 text-slate-400">· {r.count}×</span>
                      </div>
                      <div className="leading-7">
                        {highlightText(r.text, searchObj)}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Stats */}
              <motion.div
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-sm text-slate-900 font-semibold">Statistiken</div>
                  <div className="text-xs text-slate-500">
                    Gesamt: {searchResults.totalMatches} Vorkommen in {searchResults.rows.length} Versen
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="rounded-xl border border-slate-100 p-3">
                    <div className="text-xs text-slate-500 mb-2">Top Bücher</div>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topBooks}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={12} angle={-15} height={50} dy={10} />
                          <YAxis fontSize={12} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 p-3">
                    <div className="text-xs text-slate-500 mb-2">Top Kapitel</div>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topChapters}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" fontSize={12} angle={-15} height={50} dy={10} />
                          <YAxis fontSize={12} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-7xl px-4 pb-10">
        <div className="text-center text-xs text-slate-500">
          {/* Removed placeholder tip */}
        </div>
      </footer>
    </div>
  );
}
