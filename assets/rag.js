/**
 * RAG-Lab · Laufzeit der Lernumgebung
 *
 * Zustaendig fuer:
 *   - Sprachumschaltung DE/EN (merkt sich die Wahl)
 *   - Aufbau der Uebungsboxen aus data/uebungen/<lab>.json (neun Uebungstypen)
 *   - Einbindung der lebenden Stuecke (assets/werkzeuge/) ueber data-werkzeug
 *   - Fortschrittsanzeige je Lab und auf der Startseite
 *
 * Ohne Framework, ohne Build-Schritt, ohne fremde Server: Die Seite laesst sich
 * unveraendert auf GitHub Pages legen. Geforkt aus der PROM-Lab-Laufzeit; die
 * BPMN-Teile sind entfallen, die RAG-Werkzeuge und -Uebungstypen kamen hinzu.
 */
import * as P from './pruefung.js'
import * as Modell from './modell.js'
import { baueWerkzeug } from './werkzeuge/index.js'

/* ------------------------------------------------------------------ Sprache */

const SPRACHSCHLUESSEL = 'rag:sprache'

export function aktuelleSprache () {
  return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'de'
}

function setzeSprache (lang) {
  document.documentElement.setAttribute('data-lang', lang)
  document.documentElement.setAttribute('lang', lang)
  try { localStorage.setItem(SPRACHSCHLUESSEL, lang) } catch { /* Privater Modus */ }
  document.querySelectorAll('[data-lang-btn]').forEach(b => {
    b.classList.toggle('active', b.dataset.langBtn === lang)
    b.setAttribute('aria-pressed', String(b.dataset.langBtn === lang))
  })
  document.querySelectorAll('a[data-lab-link]').forEach(a => {
    const ziel = a.getAttribute('href').split('?')[0]
    a.setAttribute('href', lang === 'en' ? ziel + '?lang=en' : ziel)
  })
  document.dispatchEvent(new CustomEvent('rag:sprache', { detail: { lang } }))
}

export function initSprache () {
  const ausUrl = new URLSearchParams(location.search).get('lang')
  let gespeichert = null
  try { gespeichert = localStorage.getItem(SPRACHSCHLUESSEL) } catch { /* egal */ }
  setzeSprache(ausUrl === 'en' || ausUrl === 'de' ? ausUrl : (gespeichert === 'en' ? 'en' : 'de'))
  document.querySelectorAll('[data-lang-btn]').forEach(b => {
    b.addEventListener('click', () => setzeSprache(b.dataset.langBtn))
  })
}

export const txt = (o) => (o == null ? '' : (typeof o === 'string' ? o : (o[aktuelleSprache()] ?? o.de ?? '')))
const menge = (n, formen) => `${n} ${txt(formen)[n === 1 ? 0 : 1]}`

const M = {
  uebung: { de: ['Übung', 'Übungen'], en: ['exercise', 'exercises'] }
}

export const T = {
  pruefen:     { de: 'Prüfen', en: 'Check' },
  hinweis:     { de: 'Hinweis', en: 'Hint' },
  richtig:     { de: 'Richtig.', en: 'Correct.' },
  nochNicht:   { de: 'Noch nicht.', en: 'Not yet.' },
  ok:          { de: 'Erledigt', en: 'Done' },
  fortschritt: { de: 'gelöst', en: 'solved' },
  fragenOffen: { de: 'Bitte beantworten Sie alle Fragen.', en: 'Please answer all questions.' },
  weiter:      { de: 'Weiter mit', en: 'Continue with' },
  aufgabe:     { de: 'Aufgabe', en: 'exercise' },
  allesGeloest:{ de: 'Alle Übungen gelöst.', en: 'All exercises solved.' },
  stand:       { de: 'Ihr Stand', en: 'Your progress' },
  loeschen:    { de: 'Lernfortschritt zurücksetzen', en: 'Reset learning progress' },
  loeschenFrage: { de: 'Den vermerkten Lernfortschritt aller Labs löschen? Der eingetragene Modell-Endpunkt und die Terminalzustände bleiben erhalten.', en: 'Delete the recorded progress of all labs? The model endpoint and the terminal states remain.' },
  waehlen:      { de: 'Zuordnen …', en: 'Assign …' },
  alleZuordnen: { de: 'Bitte ordnen Sie alle Elemente zu.', en: 'Please assign every element.' },
  hoch:         { de: 'Nach oben', en: 'Move up' },
  runter:       { de: 'Nach unten', en: 'Move down' },
  loesungsweg:  { de: 'Lösungsweg', en: 'Worked solution' },
  alleFelder:   { de: 'Bitte füllen Sie alle Felder.', en: 'Please fill every field.' },
  belegt:       { de: 'belegt', en: 'supported' },
  unbelegt:     { de: 'nicht belegt', en: 'not supported' },
  alleSaetze:   { de: 'Bitte bewerten Sie jeden Satz.', en: 'Please rate every sentence.' },
  uebersehen:   { de: 'als belegt markiert, aber ohne Beleg in den Quellen', en: 'marked as supported, but without evidence in the sources' },
  zuUnrecht:    { de: 'als unbelegt markiert, steht aber in der Quelle', en: 'marked as unsupported, but it is in the source' },
  quelle:       { de: 'Quellen', en: 'Sources' },
  schritt:      { de: 'Lücke', en: 'Gap' },
  pruefFrage:   { de: 'Prüffrage', en: 'Check question' },
  werkzeugFolgt:{ de: 'Werkzeug folgt.', en: 'Tool to follow.' },
  typ: {
    quiz:       { de: 'Verständnis', en: 'Understanding' },
    experiment: { de: 'Experiment', en: 'Experiment' },
    zuordnen:   { de: 'Zuordnen', en: 'Matching' },
    sortieren:  { de: 'Reihenfolge', en: 'Ordering' },
    rechnen:    { de: 'Rechnen', en: 'Calculate' },
    luecken:    { de: 'Lückentext', en: 'Fill the gaps' },
    belegen:    { de: 'Belege prüfen', en: 'Check the evidence' },
    terminal:   { de: 'Kommandozeile', en: 'Command line' },
    checkliste: { de: 'Checkliste', en: 'Checklist' }
  }
}

/* --------------------------------------------------------------------- Labs */

/**
 * Reihenfolge, Umfang, Voraussetzung, Kompetenzziel und Zeitrahmen an einer
 * einzigen Stelle. tools/verify.mjs vergleicht `anzahl` mit den Uebungsdateien.
 */
export const LABS = [
  { id: 'lab-01', nr: '01', datei: 'lab-01-sprachmodelle.html', anzahl: 5,
    titel: { de: 'Sprachmodelle', en: 'Language models' },
    voraussetzung: { de: 'Keine. Dies ist der Anfang.', en: 'None. This is the start.' },
    ziel: { de: 'Sie können erklären, was ein Token ist, wie ein Sprachmodell das nächste Token vorhersagt und was Kontextfenster, Temperatur, Halluzination und Wissensstand bedeuten.',
            en: 'You can explain what a token is, how a language model predicts the next token, and what context window, temperature, hallucination and knowledge cutoff mean.' },
    dauer: { de: 'ca. 35 Minuten', en: 'about 35 minutes' } },
  { id: 'lab-02', nr: '02', datei: 'lab-02-warum-rag.html', anzahl: 5,
    titel: { de: 'Warum RAG?', en: 'Why RAG?' },
    voraussetzung: { de: 'Lab 01.', en: 'Lab 01.' },
    ziel: { de: 'Sie können die Grenzen eines reinen Sprachmodells benennen, RAG gegen Fine-Tuning, Long Context und Prompting abgrenzen und Kosten- und Datenschutzgründe für lokale Modelle nennen.',
            en: 'You can name the limits of a bare language model, distinguish RAG from fine-tuning, long context and prompting, and give cost and privacy reasons for local models.' },
    dauer: { de: 'ca. 30 Minuten', en: 'about 30 minutes' } },
  { id: 'lab-03', nr: '03', datei: 'lab-03-aufbereiten.html', anzahl: 5,
    titel: { de: 'Dokumente aufbereiten', en: 'Preparing documents' },
    voraussetzung: { de: 'Lab 02.', en: 'Lab 02.' },
    ziel: { de: 'Sie können ein PDF in Markdown überführen, OCR-Artefakte erkennen und Seitenmarker und Tabellen als Provenienz nutzen.',
            en: 'You can convert a PDF to Markdown, spot OCR artefacts and use page markers and tables as provenance.' },
    dauer: { de: 'ca. 30 Minuten', en: 'about 30 minutes' } },
  { id: 'lab-04', nr: '04', datei: 'lab-04-chunking.html', anzahl: 6,
    titel: { de: 'Chunking', en: 'Chunking' },
    voraussetzung: { de: 'Lab 03.', en: 'Lab 03.' },
    ziel: { de: 'Sie können Chunking-Strategien vergleichen, Größe und Überlappung in Tokens begründen und Tabellenzeilen und Metadaten richtig behandeln.',
            en: 'You can compare chunking strategies, justify size and overlap in tokens and handle table rows and metadata correctly.' },
    dauer: { de: 'ca. 40 Minuten', en: 'about 40 minutes' } },
  { id: 'lab-05', nr: '05', datei: 'lab-05-embeddings.html', anzahl: 6,
    titel: { de: 'Embeddings', en: 'Embeddings' },
    voraussetzung: { de: 'Lab 04.', en: 'Lab 04.' },
    ziel: { de: 'Sie können Vektoren und Kosinusähnlichkeit erklären, das query:/passage:-Präfix begründen und Embedding-Modelle nach Sprache, Dimension und Länge auswählen.',
            en: 'You can explain vectors and cosine similarity, justify the query:/passage: prefix and choose embedding models by language, dimension and length.' },
    dauer: { de: 'ca. 45 Minuten', en: 'about 45 minutes' } },
  { id: 'lab-06', nr: '06', datei: 'lab-06-retrieval.html', anzahl: 6,
    titel: { de: 'Retrieval und Reranking', en: 'Retrieval and reranking' },
    voraussetzung: { de: 'Lab 05.', en: 'Lab 05.' },
    ziel: { de: 'Sie können Top-k-Suche, Hybrid mit Schlüsselwörtern, BM25 und RRF einordnen und Cross-Encoder-Reranking und Relevanzschwelle erklären.',
            en: 'You can place top-k search, hybrid search with keywords, BM25 and RRF, and explain cross-encoder reranking and the relevance threshold.' },
    dauer: { de: 'ca. 45 Minuten', en: 'about 45 minutes' } },
  { id: 'lab-07', nr: '07', datei: 'lab-07-generierung.html', anzahl: 6,
    titel: { de: 'Prompt und Generierung', en: 'Prompt and generation' },
    voraussetzung: { de: 'Lab 06.', en: 'Lab 06.' },
    ziel: { de: 'Sie können einen Systemprompt für belegte Antworten schreiben, Kontext als Daten übergeben, strukturierte Ausgabe erzwingen und Tokenbudget und Streaming einordnen.',
            en: 'You can write a system prompt for grounded answers, pass context as data, enforce structured output and place token budget and streaming.' },
    dauer: { de: 'ca. 45 Minuten', en: 'about 45 minutes' } },
  { id: 'lab-08', nr: '08', datei: 'lab-08-evaluation.html', anzahl: 6,
    titel: { de: 'Evaluation und Guardrails', en: 'Evaluation and guardrails' },
    voraussetzung: { de: 'Lab 06.', en: 'Lab 06.' },
    ziel: { de: 'Sie können Hit@k, MRR und Abdeckung berechnen, Negativtests und Ablationen lesen und die Grenzen von Stichwort-Proxys und Belegtreue erklären.',
            en: 'You can compute hit@k, MRR and coverage, read negative tests and ablations, and explain the limits of keyword proxies and faithfulness.' },
    dauer: { de: 'ca. 40 Minuten', en: 'about 40 minutes' } },
  { id: 'lab-09', nr: '09', datei: 'lab-09-architektur.html', anzahl: 5,
    titel: { de: 'Architektur, Betrieb, Sicherheit', en: 'Architecture, operations, security' },
    voraussetzung: { de: 'Lab 07.', en: 'Lab 07.' },
    ziel: { de: 'Sie können die Komponenten eines RAG-Systems und den API-Vertrag beschreiben, Cache-Invalidierung, Schlüsselschutz und Loopback-Betrieb begründen und Kosten lokal gegen Cloud schätzen.',
            en: 'You can describe the components of a RAG system and its API contract, justify cache invalidation, key protection and loopback operation, and estimate local versus cloud cost.' },
    dauer: { de: 'ca. 35 Minuten', en: 'about 35 minutes' } },
  { id: 'lab-10', nr: '10', datei: 'lab-10-nachbauen.html', anzahl: 5,
    titel: { de: 'Nachbauen', en: 'Rebuilding it' },
    voraussetzung: { de: 'Lab 09.', en: 'Lab 09.' },
    ziel: { de: 'Sie können das Fallbeispiel auf dem eigenen Rechner einrichten, die Phasen des Aufbaus nachvollziehen und die typischen Fehlerbilder beheben.',
            en: 'You can set up the case study on your own computer, retrace the phases of its construction and fix the typical failure modes.' },
    dauer: { de: 'ca. 45 Minuten', en: 'about 45 minutes' } }
]
export const UEBUNGEN_GESAMT = LABS.reduce((n, l) => n + l.anzahl, 0)

/* -------------------------------------------------------------- Fortschritt */

const fortschrittSchluessel = (lab) => `rag:fortschritt:${lab}`

export function ladeFortschritt (lab) {
  try {
    const f = JSON.parse(localStorage.getItem(fortschrittSchluessel(lab)) || '{}')
    if (!f || typeof f !== 'object' || Array.isArray(f)) return {}
    const l = LABS.find(l => l.id === lab)
    return Object.fromEntries(Object.entries(f).filter(([id, fertig]) =>
      fertig === true && l && new RegExp(`^R${l.nr}-\\d{2}$`).test(id) && +id.slice(-2) >= 1 && +id.slice(-2) <= l.anzahl))
  } catch { return {} }
}
export function merkeFortschritt (lab, id) {
  const f = ladeFortschritt(lab)
  f[id] = true
  try { localStorage.setItem(fortschrittSchluessel(lab), JSON.stringify(f)) } catch { /* egal */ }
  document.dispatchEvent(new CustomEvent('rag:fortschritt', { detail: { lab, id } }))
}
function loescheFortschritt () {
  for (const l of LABS) {
    try { localStorage.removeItem(fortschrittSchluessel(l.id)) } catch { /* egal */ }
  }
}

/* ------------------------------------------------------------------ Helfer */

export const el = (tag, klasse, text) => {
  const n = document.createElement(tag)
  if (klasse) n.className = klasse
  if (text != null) n.textContent = text
  return n
}
export const html = (tag, klasse, inhalt) => { const n = el(tag, klasse); n.innerHTML = inhalt; return n }
const basisUrl = new URL('..', import.meta.url)          // Wurzel der Lernumgebung
const url = (pfad) => new URL(pfad, basisUrl).href

/** Setzt Text (oder ein Attribut) aus einem zweisprachigen Objekt und haelt ihn beim Sprachwechsel aktuell. */
const zwei = (node, o, attr) => {
  const setze = () => { if (attr) node.setAttribute(attr, txt(o)); else node.textContent = txt(o) }
  setze(); document.addEventListener('rag:sprache', setze); return node
}
/** Deterministische Permutation aus der Uebungs-ID (gleiche Mischung bei jedem Aufruf). */
const misch = (n, id) => {
  let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const idx = [...Array(n).keys()]
  for (let i = n - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; const j = h % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]] }
  return idx
}

const datenCache = new Map()
/** Laedt data/<name> einmal (JSON oder Markdown) und haelt das Ergebnis im Speicher. */
export function ladeDaten (name) {
  if (!datenCache.has(name)) {
    datenCache.set(name, fetch(url('data/' + name)).then(r => {
      if (!r.ok) throw new Error(`data/${name} fehlt`)
      return name.endsWith('.md') ? r.text() : r.json()
    }))
  }
  return datenCache.get(name)
}
function erzeugeCtx (lab, basis) {
  Modell.konfiguriere(basis)
  return { lab, basis, lang: aktuelleSprache, txt, daten: ladeDaten, modell: Modell }
}
function baueWerkzeuge (root, ctx) {
  for (const z of root.querySelectorAll('[data-werkzeug]')) {
    let p = {}
    try { p = JSON.parse(z.dataset.parameter || '{}') } catch { console.warn('data-parameter ungültig', z) }
    baueWerkzeug(z, z.dataset.werkzeug, p, ctx)
  }
}

/* ------------------------------------------------------------------ Fragen */

function baueFragen (fragen, ziel, uebungId) {
  const bloecke = fragen.map((fr, i) => {
    const block = el('div', 'frage')
    block.append(el('div', 'frage-text', txt(fr.frage)))
    const ul = el('ul', 'optionen')
    const mehrfach = !!fr.mehrfach
    fr.optionen.forEach((o, j) => {
      const li = el('li'); const label = el('label')
      const inp = el('input'); inp.type = mehrfach ? 'checkbox' : 'radio'; inp.name = `${uebungId}-${i}`; inp.value = String(j)
      label.append(inp, el('span', null, txt(o)))
      li.append(label); ul.append(li)
    })
    block.append(ul)
    const erkl = el('div', 'line-hilfe'); erkl.hidden = true
    block.append(erkl)
    ziel.append(block)
    return { fr, block, ul, erkl, mehrfach }
  })
  const aktualisiere = () => {
    bloecke.forEach(({ fr, block, ul }) => {
      block.querySelector('.frage-text').textContent = txt(fr.frage)
      ;[...ul.querySelectorAll('label > span')].forEach((s, j) => { s.textContent = txt(fr.optionen[j]) })
    })
  }
  document.addEventListener('rag:sprache', aktualisiere)
  return {
    pruefe () {
      const antworten = bloecke.map(({ ul }) => [...ul.querySelectorAll('input:checked')].map(i => +i.value))
      const r = P.pruefeQuiz(bloecke.map(b => b.fr), antworten)
      bloecke.forEach(({ fr, ul, erkl }, i) => {
        const gewaehlt = antworten[i]
        if (!gewaehlt.length) return
        const richtig = new Set(fr.richtig)
        const ok = r.je[i].ok
        ;[...ul.querySelectorAll('label')].forEach((l, j) => {
          l.classList.toggle('richtig', richtig.has(j) && (ok || gewaehlt.includes(j)))
          l.classList.toggle('falsch', !richtig.has(j) && gewaehlt.includes(j))
        })
        erkl.hidden = !fr.erklaerung
        erkl.textContent = txt(fr.erklaerung)
        erkl.classList.toggle('falsch-erkl', !ok)
      })
      return { alleBeantwortet: r.alleBeantwortet, alleRichtig: r.ok }
    }
  }
}

export function status (ziel, art, titel, text) {
  ziel.replaceChildren()
  const line = el('div', 'line ' + art)
  line.append(el('strong', null, titel))
  if (text) line.append(el('span', 'line-hilfe', text))
  ziel.append(line)
  return line
}

/* -------------------------------------------------------------- Uebungsbox */

function baueBox (uebung, ctx) {
  const box = el('section', 'sqlbox uebung')
  box.id = uebung.id
  box.dataset.typ = uebung.typ
  const head = el('div', 'sqlbox-head')
  head.append(el('span', 'sqlbox-id', uebung.id))
  const titel = el('span', 'sqlbox-title', txt(uebung.titel))
  head.append(titel)
  const typ = el('span', 'uebung-typ', txt(T.typ[uebung.typ]))
  head.append(typ)
  const okMarke = el('span', 'sqlbox-ok'); okMarke.hidden = true
  head.append(okMarke)
  box.append(head)
  const body = el('div', 'sqlbox-body')
  const aufgabe = html('div', 'sqlbox-task', txt(uebung.aufgabe))
  body.append(aufgabe)
  box.append(body)

  const geloestMarkieren = () => {
    okMarke.hidden = false
    okMarke.textContent = '✓ ' + txt(T.ok)
    okMarke.className = 'sqlbox-ok sichtbar'
    merkeFortschritt(ctx.lab, uebung.id)
  }
  if (ladeFortschritt(ctx.lab)[uebung.id]) { okMarke.hidden = false; okMarke.textContent = '✓ ' + txt(T.ok); okMarke.className = 'sqlbox-ok sichtbar' }

  const aktionen = el('div', 'sqlbox-actions')
  const statusZiel = el('div', 'sqlbox-status')
  const bPruefen = el('button', 'btn-sm primary', txt(T.pruefen)); bPruefen.type = 'button'
  const fertig = (r) => { if (r) { status(statusZiel, 'ok', txt(T.richtig), txt(uebung.rueckmeldung)); geloestMarkieren() } else status(statusZiel, 'fail', txt(T.nochNicht), txt(uebung.hilfe)) }
  const hinweis = () => {
    if (!uebung.hinweis) return null
    const d = el('details'); const s = el('summary', null, txt(T.hinweis))
    const p = html('div', 'line-hilfe', txt(uebung.hinweis))
    d.append(s, p)
    document.addEventListener('rag:sprache', () => { s.textContent = txt(T.hinweis); p.innerHTML = txt(uebung.hinweis) })
    return d
  }
  const abschluss = () => { aktionen.append(bPruefen); body.append(aktionen, statusZiel); const h = hinweis(); if (h) body.append(h) }

  /* ---- quiz und experiment ---- */
  if (uebung.typ === 'quiz' || uebung.typ === 'experiment') {
    if (uebung.typ === 'experiment') { const wz = el('div'); body.append(wz); baueWerkzeug(wz, uebung.werkzeug, uebung.parameter || {}, ctx) }
    const fragenZiel = el('div'); body.append(fragenZiel)
    const fragen = baueFragen(uebung.fragen || [], fragenZiel, uebung.id)
    abschluss()
    bPruefen.addEventListener('click', () => {
      const r = fragen.pruefe()
      if (!r.alleBeantwortet) { status(statusZiel, 'note', txt(T.fragenOffen)); return }
      fertig(r.alleRichtig)
    })
  }

  /* ---- zuordnen ---- */
  if (uebung.typ === 'zuordnen') {
    const gitter = el('div', 'zuordnen'); const felder = []
    uebung.elemente.forEach((e) => {
      const zeile = el('div', 'paar'); zeile.append(zwei(el('span', 'begriff'), e.text))
      const sel = el('select'); const leer = el('option'); leer.value = ''; zwei(leer, T.waehlen); sel.append(leer)
      for (const k of uebung.kategorien) { const o = el('option'); o.value = k.id; zwei(o, k.name); sel.append(o) }
      zwei(sel, e.text, 'aria-label'); zeile.append(sel); gitter.append(zeile); felder.push({ sel, zeile })
    })
    body.append(gitter); abschluss()
    bPruefen.addEventListener('click', () => {
      const r = P.pruefeZuordnen(uebung.elemente, Object.fromEntries(felder.map((f, i) => [i, f.sel.value])))
      if (r.fehlend.length) { status(statusZiel, 'note', txt(T.alleZuordnen)); return }
      felder.forEach((f, i) => { f.zeile.classList.toggle('falsch', r.falsch.includes(i)); f.zeile.classList.toggle('richtig', !r.falsch.includes(i)) })
      fertig(r.ok)
    })
  }

  /* ---- sortieren ---- */
  if (uebung.typ === 'sortieren') {
    const liste = el('ol', 'sortieren'); const ordnung = misch(uebung.elemente.length, uebung.id)   // ordnung[pos] = Elementindex
    const zeichne = () => {
      liste.replaceChildren()
      ordnung.forEach((idx, pos) => {
        const li = el('li'); li.dataset.idx = String(idx)
        li.append(zwei(el('span', 'sort-text'), uebung.elemente[idx].text))
        const bh = el('button', 'btn-mini', '▲'); bh.type = 'button'; zwei(bh, T.hoch, 'aria-label'); bh.disabled = pos === 0
        const br = el('button', 'btn-mini', '▼'); br.type = 'button'; zwei(br, T.runter, 'aria-label'); br.disabled = pos === ordnung.length - 1
        bh.addEventListener('click', () => { [ordnung[pos - 1], ordnung[pos]] = [ordnung[pos], ordnung[pos - 1]]; zeichne() })
        br.addEventListener('click', () => { [ordnung[pos + 1], ordnung[pos]] = [ordnung[pos], ordnung[pos + 1]]; zeichne() })
        li.append(bh, br); liste.append(li)
      })
    }
    zeichne(); body.append(liste); abschluss()
    bPruefen.addEventListener('click', () => {
      const r = P.pruefeSortieren(uebung.elemente.map((_, i) => i), ordnung)
      ;[...liste.children].forEach((li, pos) => { li.classList.toggle('falsch', r.falschPlatziert.includes(pos)); li.classList.toggle('richtig', !r.falschPlatziert.includes(pos)) })
      fertig(r.ok)
    })
  }

  /* ---- rechnen ---- */
  if (uebung.typ === 'rechnen') {
    const form = el('div', 'rechnen'); const eingaben = []
    uebung.felder.forEach((f) => {
      const zeile = el('label', 'rechen-feld'); zeile.append(zwei(el('span'), f.name))
      const inp = el('input'); inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off'
      zeile.append(inp); zeile.append(el('span', 'einheit', f.einheit || '')); form.append(zeile); eingaben.push(inp)
    })
    body.append(form); abschluss()
    const zahl = (s) => parseFloat(String(s).replace(',', '.').replace('%', '').trim())
    bPruefen.addEventListener('click', () => {
      if (eingaben.some(e => !e.value.trim())) { status(statusZiel, 'note', txt(T.alleFelder)); return }
      const r = P.pruefeRechnen(uebung.felder, eingaben.map(e => zahl(e.value)))
      eingaben.forEach((e, i) => { e.classList.toggle('falsch', !r.je[i]); e.classList.toggle('richtig', r.je[i]) })
      fertig(r.ok)
      if (r.ok && uebung.loesungsweg) statusZiel.append(html('div', 'line-hilfe loesungsweg', txt(uebung.loesungsweg)))
    })
  }

  /* ---- luecken ---- */
  if (uebung.typ === 'luecken') {
    const pre = el('pre', 'luecken code-block'); const felder = []
    const zeichne = () => {
      const alt = felder.map(f => f.value)
      pre.replaceChildren(); felder.length = 0
      const teile = txt(uebung.text).split(/___(\d+)___/)
      teile.forEach((t, i) => {
        if (i % 2 === 0) pre.append(document.createTextNode(t))
        else if (felder[+t - 1]) {
          // Dieselbe Luecke ein zweites Mal (z. B. schliessendes Tag): spiegelt die Eingabe, statt ein zweites Feld zu oeffnen.
          const sp = el('span', 'luecke-spiegel', felder[+t - 1].value || '…'); const inp = felder[+t - 1]
          inp.addEventListener('input', () => { sp.textContent = inp.value || '…' }); pre.append(sp)
        } else {
          const inp = el('input'); inp.type = 'text'; inp.autocomplete = 'off'; inp.spellcheck = false; inp.dataset.nr = t
          inp.setAttribute('aria-label', `${txt(T.schritt)} ${t}`); inp.value = alt[+t - 1] || ''
          pre.append(inp); felder[+t - 1] = inp
        }
      })
    }
    zeichne(); document.addEventListener('rag:sprache', zeichne)
    body.append(pre); abschluss()
    bPruefen.addEventListener('click', () => {
      if (felder.some(f => !f.value.trim())) { status(statusZiel, 'note', txt(T.alleFelder)); return }
      const r = P.pruefeLuecken(uebung.luecken, felder.map(f => f.value))
      felder.forEach((f, i) => { f.classList.toggle('falsch', !r.je[i]); f.classList.toggle('richtig', r.je[i]) })
      fertig(r.ok)
    })
  }

  /* ---- belegen ---- */
  if (uebung.typ === 'belegen') {
    const wrap = el('div', 'belegen'); const q = el('div', 'belegen-quellen'); q.append(zwei(el('h3'), T.quelle))
    const quellen = () => {
      q.replaceChildren(zwei(el('h3'), T.quelle))
      for (const s of uebung.quellen) {
        const box = el('div', 'quelle')
        if (s.chunk) {
          ctx.daten('chunks.json').then(d => {
            const c = d.chunks.find(x => x.id === s.chunk)
            if (c) box.append(el('div', 'quelle-titel', c.abschnitt || c.id), el('pre', null, c.text))
          })
        } else box.append(el('div', 'quelle-titel', txt(s.titel)), el('pre', null, txt(s.text)))
        q.append(box)
      }
    }
    quellen(); document.addEventListener('rag:sprache', quellen)
    const liste = el('ol', 'belegen-saetze'); const wahl = []
    uebung.saetze.forEach((s, i) => {
      const li = el('li'); li.append(zwei(el('span', 'satz'), s.text))
      const grp = el('span', 'wahl')
      for (const [wert, label] of [[true, T.belegt], [false, T.unbelegt]]) {
        const lab = el('label'); const inp = el('input'); inp.type = 'radio'; inp.name = `${uebung.id}-s${i}`; inp.value = String(wert)
        lab.append(inp, zwei(el('span'), label)); grp.append(lab)
      }
      li.append(grp); liste.append(li); wahl.push({ li, grp })
    })
    wrap.append(liste, q); body.append(wrap); abschluss()
    bPruefen.addEventListener('click', () => {
      const m = wahl.map(w => { const c = w.grp.querySelector('input:checked'); return c ? c.value === 'true' : null })
      const r = P.pruefeBelegen(uebung.saetze, m)
      if (r.offen.length) { status(statusZiel, 'note', txt(T.alleSaetze)); return }
      wahl.forEach((w, i) => { const falsch = r.uebersehen.includes(i) || r.zuUnrecht.includes(i); w.li.classList.toggle('falsch', falsch); w.li.classList.toggle('richtig', !falsch) })
      if (r.ok) fertig(true)
      else {
        const teile = []
        if (r.uebersehen.length) teile.push(`${r.uebersehen.map(i => i + 1).join(', ')}: ${txt(T.uebersehen)}`)
        if (r.zuUnrecht.length) teile.push(`${r.zuUnrecht.map(i => i + 1).join(', ')}: ${txt(T.zuUnrecht)}`)
        status(statusZiel, 'fail', txt(T.nochNicht), teile.join(' · '))
      }
    })
  }

  /* ---- checkliste ---- */
  if (uebung.typ === 'checkliste') {
    const liste = el('ol', 'checkliste'); const eintraege = []
    uebung.schritte.forEach((s, i) => {
      const li = el('li')
      const st = html('div', 'schritt-text', txt(s.text)); li.append(st)
      document.addEventListener('rag:sprache', () => { st.innerHTML = txt(s.text) })
      const fr = el('div', 'schritt-frage'); fr.append(zwei(el('div', 'frage-text'), s.frage))
      const ul = el('ul', 'optionen')
      s.optionen.forEach((o, j) => {
        const l = el('li'); const lab = el('label'); const inp = el('input'); inp.type = 'radio'; inp.name = `${uebung.id}-s${i}`; inp.value = String(j)
        lab.append(inp, zwei(el('span'), o)); l.append(lab); ul.append(l)
      })
      fr.append(ul); li.append(fr); liste.append(li); eintraege.push({ li, ul, richtig: s.richtig })
    })
    body.append(liste); abschluss()
    bPruefen.addEventListener('click', () => {
      const gew = eintraege.map(e => { const c = e.ul.querySelector('input:checked'); return c ? [+c.value] : [] })
      const r = P.pruefeQuiz(eintraege.map(e => ({ richtig: [e.richtig] })), gew)
      if (!r.alleBeantwortet) { status(statusZiel, 'note', txt(T.fragenOffen)); return }
      eintraege.forEach((e, i) => { e.li.classList.toggle('falsch', !r.je[i].ok); e.li.classList.toggle('richtig', r.je[i].ok) })
      fertig(r.ok)
    })
  }

  /* ---- terminal (Aufgabe 7 fuellt den Zweig) ---- */
  if (uebung.typ === 'terminal') {
    const h = el('div'); body.append(h, statusZiel)
    baueWerkzeug(h, 'terminal', { os: uebung.os || 'alle', szenario: uebung.szenario || {}, schritte: uebung.schritte, id: uebung.id, beiFertig: () => fertig(true) }, ctx)
    const hw = hinweis(); if (hw) body.append(hw)
  }

  document.addEventListener('rag:sprache', () => {
    titel.textContent = txt(uebung.titel); typ.textContent = txt(T.typ[uebung.typ])
    aufgabe.innerHTML = txt(uebung.aufgabe); bPruefen.textContent = txt(T.pruefen)
    if (!okMarke.hidden) okMarke.textContent = '✓ ' + txt(T.ok)
  })
  return box
}

/* ---------------------------------------------------------- Seitenbausteine */

function initTitelUndAlt () {
  const titelDe = document.title
  const meta = document.querySelector('meta[name="rag:titel-en"]')
  const titelEn = meta ? meta.getAttribute('content') : null
  const bilder = [...document.querySelectorAll('img[data-alt-en]')].map(img => ({ img, de: img.getAttribute('alt'), en: img.getAttribute('data-alt-en') }))
  const setzen = () => {
    const en = aktuelleSprache() === 'en'
    if (titelEn) document.title = en ? titelEn : titelDe
    for (const b of bilder) b.img.setAttribute('alt', en ? b.en : b.de)
  }
  document.addEventListener('rag:sprache', setzen)
  setzen()
}

function baueEinordnung (labId) {
  const lab = LABS.find(l => l.id === labId)
  const kopf = document.querySelector('.lab-header')
  if (!lab || !kopf) return
  const dl = el('dl', 'lab-einordnung')
  const felder = () => [
    [{ de: 'Voraussetzung', en: 'Prerequisite' }, txt(lab.voraussetzung)],
    [{ de: 'Sie können danach', en: 'Afterwards you can' }, txt(lab.ziel)],
    [{ de: 'Umfang', en: 'Scope' }, `${menge(lab.anzahl, M.uebung)} · ${txt(lab.dauer)}`]
  ]
  const fuellen = () => {
    dl.replaceChildren()
    for (const [t, w] of felder()) { const z = el('div'); z.append(el('dt', null, txt(t)), el('dd', null, w)); dl.append(z) }
  }
  fuellen()
  document.addEventListener('rag:sprache', fuellen)
  kopf.append(dl)
}

function initSeitennavigation () {
  const links = [...document.querySelectorAll('.sidebar-link[href^="#"]')]
  const abschnitte = links.map(a => ({ link: a, ziel: document.getElementById(a.getAttribute('href').slice(1)) })).filter(e => e.ziel)
  if (!abschnitte.length) return
  const LESEKANTE = 120
  const aktualisieren = () => {
    const amEnde = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
    let treffer = amEnde ? abschnitte[abschnitte.length - 1] : abschnitte[0]
    if (!amEnde) for (const e of abschnitte) if (e.ziel.getBoundingClientRect().top <= LESEKANTE) treffer = e
    for (const e of abschnitte) e.link.classList.toggle('active', e === treffer)
  }
  let geplant = false
  addEventListener('scroll', () => { if (geplant) return; geplant = true; requestAnimationFrame(() => { geplant = false; aktualisieren() }) }, { passive: true })
  addEventListener('resize', aktualisieren, { passive: true })
  aktualisieren()
}

function baueLabNavigation (labId) {
  const i = LABS.findIndex(l => l.id === labId)
  const nav = document.querySelector('.nav-bottom')
  if (i < 0 || !nav) return
  const fuellen = () => {
    nav.replaceChildren()
    const zurueck = i > 0 ? LABS[i - 1] : null; const weiter = i < LABS.length - 1 ? LABS[i + 1] : null
    const a1 = el('a', 'btn', zurueck ? `← Lab ${zurueck.nr} · ${txt(zurueck.titel)}` : (aktuelleSprache() === 'en' ? '← Overview' : '← Zur Übersicht'))
    a1.href = zurueck ? zurueck.datei : 'index.html'; a1.setAttribute('data-lab-link', '')
    const a2 = el('a', 'btn solid', weiter ? `Lab ${weiter.nr} · ${txt(weiter.titel)} →` : (aktuelleSprache() === 'en' ? 'Overview →' : 'Zur Übersicht →'))
    a2.href = weiter ? weiter.datei : 'index.html'; a2.setAttribute('data-lab-link', '')
    if (aktuelleSprache() === 'en') { a1.href += '?lang=en'; a2.href += '?lang=en' }
    nav.append(a1, a2)
  }
  fuellen()
  document.addEventListener('rag:sprache', fuellen)
}

function karteFortschritt () {
  const karten = LABS.map(l => ({ l, karte: document.querySelector(`.lab-card[href^="${l.datei}"]`) })).filter(e => e.karte)
  const fuellen = () => {
    for (const { l, karte } of karten) {
      const geloest = Object.keys(ladeFortschritt(l.id)).length
      let block = karte.querySelector('.lab-fortschritt')
      if (!block) {
        block = el('div', 'lab-fortschritt')
        const balken = el('div', 'balken'); balken.append(el('i'))
        block.append(el('span'), balken)
        const meta = karte.querySelector('.meta')
        if (meta) meta.before(block); else karte.append(block)
      }
      block.querySelector('span').textContent = `${geloest} / ${menge(l.anzahl, M.uebung)} ${txt(T.fortschritt)}`
      const balken = block.querySelector('.balken')
      balken.classList.toggle('voll', geloest === l.anzahl)
      balken.querySelector('i').style.width = Math.round(geloest / l.anzahl * 100) + '%'
      const nummer = karte.querySelector('.lab-num')
      let haken = nummer && nummer.querySelector('.lab-haken')
      if (geloest === l.anzahl && nummer && !haken) { haken = el('span', 'lab-haken', '✓'); haken.setAttribute('aria-hidden', 'true'); nummer.append(haken) } else if (geloest < l.anzahl && haken) haken.remove()
    }
  }
  fuellen()
  document.addEventListener('rag:sprache', fuellen)
  document.addEventListener('rag:fortschritt', fuellen)
}

async function baueGesamtfortschritt (ziel, basis) {
  const panel = el('div', 'fortschritt-panel')
  let stand = 0
  const fuellen = async () => {
    const lauf = ++stand
    panel.replaceChildren()
    const gesamt = LABS.reduce((n, l) => n + Object.keys(ladeFortschritt(l.id)).length, 0)
    const kopf = el('div', 'fortschritt-kopf')
    kopf.append(el('span', 'fortschritt-titel', txt(T.stand)))
    const zahl = el('span', 'fortschritt-zahl', `${gesamt} / ${UEBUNGEN_GESAMT} `)
    zahl.append(el('small', null, txt(T.fortschritt)))
    kopf.append(zahl)
    panel.append(kopf)
    const balken = el('div', 'balken'); balken.append(el('i')); balken.querySelector('i').style.width = Math.round(gesamt / UEBUNGEN_GESAMT * 100) + '%'
    balken.classList.toggle('voll', gesamt === UEBUNGEN_GESAMT)
    panel.append(balken)
    const aktionen = el('div', 'fortschritt-aktionen')
    const naechstes = LABS.find(l => Object.keys(ladeFortschritt(l.id)).length < l.anzahl)
    if (naechstes) {
      let anker = ''
      try {
        const r = await fetch(`${basis}/data/uebungen/${naechstes.id}.json`)
        if (r.ok) { const ue = await r.json(); const f = ladeFortschritt(naechstes.id); const offen = ue.find(u => !f[u.id]); if (offen) anker = '#' + offen.id }
      } catch { /* egal */ }
      if (lauf !== stand) return
      const a = el('a', 'btn solid', `${txt(T.weiter)} Lab ${naechstes.nr}${anker ? ' · ' + txt(T.aufgabe) + ' ' + anker.slice(1) : ''}`)
      a.href = naechstes.datei + (aktuelleSprache() === 'en' ? '?lang=en' : '') + anker
      aktionen.append(a)
    } else aktionen.append(el('span', null, txt(T.allesGeloest)))
    aktionen.append(el('span', 'spacer'))
    const reset = el('button', 'btn-sm', txt(T.loeschen)); reset.type = 'button'
    reset.addEventListener('click', () => {
      if (!confirm(txt(T.loeschenFrage))) return
      loescheFortschritt(); document.dispatchEvent(new CustomEvent('rag:fortschritt'))
    })
    aktionen.append(reset)
    panel.append(aktionen)
  }
  await fuellen()
  document.addEventListener('rag:sprache', fuellen)
  document.addEventListener('rag:fortschritt', fuellen)
  ziel.replaceWith(panel)
}

/* ----------------------------------------------------------------- Einstieg */

export async function starteUebersicht ({ basis = '.' } = {}) {
  initSprache()
  initTitelUndAlt()
  karteFortschritt()
  const platz = document.querySelector('[data-fortschritt]')
  if (platz) await baueGesamtfortschritt(platz, basis)
  baueWerkzeuge(document, erzeugeCtx(null, basis))
}

export async function starteLab ({ lab, basis = '.' }) {
  initSprache()
  initTitelUndAlt()
  baueEinordnung(lab)
  initSeitennavigation()
  baueLabNavigation(lab)
  const ctx = erzeugeCtx(lab, basis)
  baueWerkzeuge(document, ctx)
  const platzhalter = [...document.querySelectorAll('[data-uebung]')]
  if (!platzhalter.length) return
  let uebungen = []
  try {
    const r = await fetch(`${basis}/data/uebungen/${lab}.json`)
    if (!r.ok) throw new Error(`data/uebungen/${lab}.json fehlt`)
    uebungen = await r.json()
  } catch (e) { console.error(e); return }
  for (const p of platzhalter) {
    const u = uebungen.find(x => x.id === p.dataset.uebung)
    if (!u) { console.warn('Übung nicht definiert:', p.dataset.uebung); continue }
    p.replaceWith(baueBox(u, ctx))
  }
  // Anker auf eine Uebung erst nach dem Aufbau anspringen
  if (location.hash) { const z = document.querySelector(location.hash); if (z) setTimeout(() => z.scrollIntoView({ block: 'start' }), 80) }
}
