/**
 * RAG-Lab · Bewertungslogik
 *
 * Reine Funktionen ohne DOM: dieselbe Datei laeuft im Browser (Werkzeuge,
 * Uebungsboxen) und in tools/pruefung.test.mjs. Die Retrieval-Funktionen sind
 * Ports aus rag_engine.py und server.py des Fallbeispiels; wo das Original
 * abweicht, steht es im Kommentar.
 */

/* ------------------------------------------------------------- Vektoren */

export function kosinus (a, b) {
  let s = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { s += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  return na && nb ? s / Math.sqrt(na * nb) : 0
}
export function normalisiere (v) {
  let n = 0; for (const x of v) n += x * x; n = Math.sqrt(n) || 1
  return Array.from(v, x => x / n)
}
/** Top-k Chunks nach Kosinus; chunks: [{ id, v }]. Rueckgabe [{ id, score }] absteigend. */
export function topK (q, chunks, k = 12) {
  return chunks.map(c => ({ id: c.id, score: kosinus(q, c.v) })).sort((a, b) => b.score - a.score).slice(0, k)
}
/** PCA-Projektion mit Mittelwert und Komponenten aus data/projektion.json. */
export function projiziere (v, p) {
  const d = Array.from(v, (x, i) => x - p.mittel[i])
  return p.komponenten.map(k => k.reduce((s, x, i) => s + x * d[i], 0))
}

/* ---------------------------------------------------------- Fehlercodes */

// Port von _CODE_RE: E:18, E18, "Fehler 18", "Fehlercode: 18" -> {E:18, E18}; E:180 ist nicht E:18.
const CODE_RE = /(?:\bE\s*:?\s*|\bfehler(?:code)?\s*:?\s*)(\d{1,3})\b/gi
export function fehlercodes (text) {
  const s = new Set()
  for (const m of String(text || '').matchAll(CODE_RE)) { s.add('E:' + m[1]); s.add('E' + m[1]) }
  return s
}
const schneidet = (a, b) => { for (const x of a) if (b.has(x)) return true; return false }

/** Port von _HybridRetriever: exakte Codetreffer (Score 1) vor den Vektortreffern, ohne Dubletten. */
export function hybridKandidaten (vektorTreffer, chunks, frage) {
  const codes = fehlercodes(frage)
  if (!codes.size) return vektorTreffer.map(t => ({ ...t, exakt: false }))
  const exakt = [], ids = new Set()
  for (const c of chunks) if (schneidet(codes, fehlercodes(c.text))) { exakt.push({ id: c.id, score: 1, exakt: true }); ids.add(c.id) }
  return exakt.concat(vektorTreffer.filter(t => !ids.has(t.id)).map(t => ({ ...t, exakt: false })))
}

/** Port von select_context_nodes auf nodes[:FINAL_K]: relativer Boden, mindestens die Schwelle. */
export function waehleKontext (kandidaten, o = {}) {
  const { schwelle = 0.15, verhaeltnis = 0.5, finalK = 5, reranked = true } = o
  const top = kandidaten.slice(0, finalK)
  if (!reranked) return top.filter(k => k.exakt)
  const best = top.length && Number.isFinite(top[0].score) ? top[0].score : 0
  const boden = Math.max(schwelle, best * verhaeltnis)
  return top.filter(k => Number.isFinite(k.score) && k.score >= boden)
}

/** Port von is_grounded plus der Regel aus server.py: gefragte Codes muessen im Kontext vorkommen. */
export function istGedeckt (frage, kontext, chunkText, o = {}) {
  const { schwelle = 0.15, reranked = true } = o
  let ok = reranked
    ? kontext.length > 0 && Number.isFinite(kontext[0].score) && kontext[0].score >= schwelle
    : kontext.some(k => k.exakt)
  const gefragt = fehlercodes(frage)
  if (gefragt.size) {
    const bekannt = new Set()
    for (const k of kontext) for (const c of fehlercodes(chunkText(k.id))) bekannt.add(c)
    for (const c of gefragt) if (!bekannt.has(c)) ok = false
  }
  return ok
}

/* ------------------------------------------------------- Antwortformat */

const tag = (text, name) => [...text.matchAll(new RegExp(`<${name}>([\\s\\S]*?)(?:</${name}>|$)`, 'gi'))].map(m => m[1].trim()).join('\n')
export function macheCheckboxen (text) {
  return text.split('\n').filter(l => l.trim()).map(l => '- [ ] ' + l.trim().replace(/^(?:[-*•]\s+|\d+[.)]\s+|\[ \]\s*)+/, '')).join('\n')
}
/** Port von parse_ai_response: drei Tags, wiederholte Bloecke werden gesammelt, Codezaeune entfernt. */
export function parseAntwort (roh) {
  const text = String(roh || '').replace(/```[a-zA-Z]*\n?/g, '').replace(/```/g, '').trim()
  const summary = tag(text, 'summary'), intro = tag(text, 'manual_intro'), steps = tag(text, 'manual_steps')
  if (!summary && !intro && !steps) return { ok: false, fehler: 'kein-format' }
  const schritte = macheCheckboxen(steps).split('\n').filter(Boolean).map(l => l.replace(/^- \[ \] /, ''))
  return { ok: true, summary: summary || 'Hinweise aus dem Handbuch', intro, schritte }
}

/* ------------------------------------------------------------ Metriken */

/** Stichworttreffer wie in eval/run_eval.py: erster Rang mit irgendeinem Stichwort, Abdeckung ueber alle. */
export function bewerteTreffer (texte, erwartet) {
  const erw = erwartet.map(k => k.toLowerCase())
  const gefunden = new Set(); let erster = null
  texte.forEach((t, i) => {
    const c = t.toLowerCase(); const hits = erw.filter(k => c.includes(k))
    if (hits.length && erster == null) erster = i + 1
    hits.forEach(k => gefunden.add(k))
  })
  return { ersterRang: erster, gefunden: gefunden.size, erwartet: erw.length, stichworte: [...gefunden].sort() }
}
export function metriken (faelle) {
  const n = faelle.length || 1
  const hit = faelle.filter(f => f.ersterRang != null).length
  const hit1 = faelle.filter(f => f.ersterRang === 1).length
  const mrr = faelle.reduce((s, f) => s + (f.ersterRang ? 1 / f.ersterRang : 0), 0)
  const abd = faelle.reduce((s, f) => s + (f.erwartet ? f.gefunden / f.erwartet : 0), 0)
  return { trefferquote: hit / n, hitAt1: hit1 / n, mrr: mrr / n, abdeckung: abd / n }
}

/* ------------------------------------------------------------- Tokens */

export const ZEICHEN_JE_TOKEN = 4.72  // gemessener Wert aus data/tokens.json (tools/tokens.py)
export function schaetzeTokens (text) { return Math.ceil(String(text || '').length / ZEICHEN_JE_TOKEN) }
export function softmax (logits, temperatur) {
  if (temperatur <= 0) { const i = logits.indexOf(Math.max(...logits)); return logits.map((_, j) => (j === i ? 1 : 0)) }
  const m = Math.max(...logits); const e = logits.map(l => Math.exp((l - m) / temperatur)); const s = e.reduce((a, b) => a + b, 0)
  return e.map(x => x / s)
}

/* ------------------------------------------------ Pruefer je Uebungstyp */

export function pruefeQuiz (fragen, antworten) {
  const je = fragen.map((fr, i) => {
    const gew = antworten[i] || []; const richtig = new Set(fr.richtig)
    return { ok: gew.length === richtig.size && gew.every(g => richtig.has(g)), beantwortet: gew.length > 0 }
  })
  return { ok: je.every(j => j.ok), alleBeantwortet: je.every(j => j.beantwortet), je }
}
export function pruefeZuordnen (elemente, zuordnung) {
  const falsch = [], fehlend = []
  elemente.forEach((e, i) => { const z = zuordnung[i]; if (!z) fehlend.push(i); else if (z !== e.ziel) falsch.push(i) })
  return { ok: !falsch.length && !fehlend.length, falsch, fehlend }
}
export function pruefeSortieren (reihenfolge, eingabe) {
  const falschPlatziert = reihenfolge.map((r, i) => (eingabe[i] === r ? null : i)).filter(i => i != null)
  return { ok: !falschPlatziert.length, falschPlatziert }
}
export function pruefeRechnen (felder, werte) {
  const je = felder.map((f, i) => Number.isFinite(werte[i]) && Math.abs(werte[i] - f.loesung) <= (f.toleranz ?? 0))
  return { ok: je.every(Boolean), je }
}
const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
export function pruefeLuecken (luecken, eingaben) {
  const je = luecken.map((l, i) => {
    if (l.muster) return new RegExp(l.muster, 'i').test(String(eingaben[i] ?? '').trim())
    return (l.loesung || []).map(norm).includes(norm(eingaben[i]))
  })
  return { ok: je.every(Boolean), je }
}
export function pruefeBelegen (saetze, markierung) {
  const uebersehen = [], zuUnrecht = [], offen = []
  saetze.forEach((s, i) => {
    const m = markierung[i]
    if (m == null) offen.push(i)
    else if (m && !s.belegt) uebersehen.push(i)
    else if (!m && s.belegt) zuUnrecht.push(i)
  })
  return { ok: !uebersehen.length && !zuUnrecht.length && !offen.length, uebersehen, zuUnrecht, offen }
}
