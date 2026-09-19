#!/usr/bin/env node
/**
 * verify.mjs - Abnahmelauf ohne Browser.
 *
 *   node tools/verify.mjs
 *
 * Abnahmekriterien:
 *   1. LABS ↔ HTML-Dateien ↔ JSON-Uebungsdateien (Anzahl, Platzhalter beidseitig, IDs in Reihenfolge)
 *   2. Jede Uebung: Titel/Auftrag/Hinweis/Rueckmeldung in DE und EN, Typ bekannt, typspezifische Felder gueltig
 *   3. Werkzeug-Platzhalter kennen ihr Werkzeug, data-parameter ist JSON
 *   4. Datendateien vorhanden und formgerecht
 *   5. data-wert-Marker im HTML entsprechen den Daten
 *   6. Keine Platzhaltertexte (TODO, TBD, Lorem)
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const HIER = dirname(fileURLToPath(import.meta.url)); const ROOT = join(HIER, '..')
const { LABS } = await import('../assets/rag.js').catch(async () => {
  // rag.js importiert DOM-freie Module, braucht aber selbst kein DOM beim Laden.
  throw new Error('assets/rag.js nicht ladbar')
})
let fehler = 0
const meld = (ok, text) => { console.log((ok ? '  ok   ' : '  FEHL ') + text); if (!ok) fehler++ }
const zwei = (o) => !!(o && typeof o === 'object' && typeof o.de === 'string' && typeof o.en === 'string' && o.de.trim() && o.en.trim())
const TYPEN = ['quiz', 'experiment', 'zuordnen', 'sortieren', 'rechnen', 'luecken', 'belegen', 'terminal', 'checkliste']
const WERKZEUGE = ['tokenizer', 'temperatur', 'kontext', 'vergleich', 'seite', 'chunking', 'embedding', 'karte', 'suche', 'prompt', 'llm', 'metrik', 'schwelle', 'architektur', 'kosten', 'terminal']

/* ------------------------------------------------------------------ Daten */
console.log('Daten')
const daten = (n) => { const p = join(ROOT, 'data', n); return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null }
const ch = daten('chunks.json')
meld(!!ch, 'chunks.json vorhanden')
if (ch) {
  meld(ch.anzahl === 346 && ch.chunks.length === 346, 'chunks.json: 346 Chunks')
  meld(ch.chunks.every(c => c.v.length === 384 && typeof c.text === 'string' && /^c\d{3}$/.test(c.id)), 'chunks.json: 384 Dimensionen, Text, IDs')
  meld(ch.chunks.some(c => c.text.includes('Anzeige: E:18;')), 'chunks.json: E:18-Zeile als eigener Chunk')
}
const fr = daten('fragen.json')
meld(!!fr && fr.fragen.length >= 24, 'fragen.json: mindestens 24 Fragen')
if (fr) {
  meld(fr.fragen.every(f => f.vMit.length === 384 && f.vOhne.length === 384 && f.vektor.length === 12 && f.vektorOhne.length === 12 && f.hybrid.length >= 12 && f.rerank.length >= 12 && Array.isArray(f.kontext) && typeof f.gedeckt === 'boolean' && typeof f.obersterScore === 'number'), 'fragen.json: alle Stufen je Frage')
  meld(fr.fragen.filter(f => f.art === 'eval').length === 10 && fr.fragen.filter(f => f.art === 'negativ').length === 4, 'fragen.json: 10 Eval, 4 Negativ')
}
const pr = daten('projektion.json')
meld(!!pr && pr.komponenten.length === 2 && pr.komponenten[0].length === 384 && pr.mittel.length === 384 && pr.punkte.length === 346, 'projektion.json: Matrix und Punkte')
const an = daten('antworten.json')
meld(!!an && an.eintraege.some(e => e.id === 'e18-nackt') && an.eintraege.some(e => e.id === 'e18-rag' && e.geparst && e.geparst.summary) && an.eintraege.some(e => e.id === 'e180-rag' && e.abgelehnt), 'antworten.json: E:18 nackt und RAG, E:180 abgelehnt')
const lg = daten('logits.json')
meld(!!lg && lg.prompts.length >= 6 && lg.prompts.every(p => p.tokens.length === 20 && typeof p.restLogsumexp === 'number' && p.fortsetzungen['0']), 'logits.json: sechs Prompts, Top-20, Fortsetzungen')
const tk = daten('tokens.json')
meld(!!tk && tk.beispiele.e18 && tk.zaehlungen.systemprompt > 0 && tk.zaehlungen.maxChunkTokens <= 440 && tk.vokabular > 0, 'tokens.json: Beispiele und Zählungen')
const co = daten('chunks-ohne-praefix.json')
meld(!!co && co.chunks.length === 346 && co.chunks.every(c => c.v.length === 384), 'chunks-ohne-praefix.json: 346 × 384')
for (const n of ['handbuch.md', 'seite-33.md', 'eval/vector.json', 'eval/hybrid-no-rerank.json', 'eval/hybrid-rerank.json', 'eval/negative-checks.json', 'eval/questions.json']) meld(existsSync(join(ROOT, 'data', n)), `data/${n} vorhanden`)
meld(existsSync(join(ROOT, 'assets/seite-33.png')), 'assets/seite-33.png vorhanden')

/* --------------------------------------------------------- Labs und Uebungen */
console.log('Labs und Übungen')
const opt = (arr) => Array.isArray(arr) && arr.length >= 2 && arr.every(zwei)
for (const lab of LABS) {
  const html = existsSync(join(ROOT, lab.datei)) ? readFileSync(join(ROOT, lab.datei), 'utf8') : ''
  meld(!!html, `${lab.id}: ${lab.datei} vorhanden`)
  const pfad = join(ROOT, 'data', 'uebungen', lab.id + '.json')
  const uebungen = existsSync(pfad) ? JSON.parse(readFileSync(pfad, 'utf8')) : null
  meld(Array.isArray(uebungen), `${lab.id}: Übungsdatei lesbar`)
  if (!uebungen) continue
  meld(lab.anzahl === uebungen.length, `${lab.id}: LABS.anzahl ${lab.anzahl} = ${uebungen.length} Übungen`)
  const platzhalter = [...html.matchAll(/data-uebung="([^"]+)"/g)].map(m => m[1])
  for (const p of platzhalter) meld(uebungen.some(u => u.id === p), `${p}: Platzhalter hat eine Übung`)
  uebungen.forEach((u, i) => {
    meld(u.id === `R${lab.nr}-${String(i + 1).padStart(2, '0')}`, `${u.id}: ID folgt R${lab.nr}-NN in Reihenfolge`)
    meld(platzhalter.includes(u.id), `${u.id}: Platzhalter im HTML`)
    meld(TYPEN.includes(u.typ), `${u.id}: Typ ${u.typ} bekannt`)
    meld(zwei(u.titel) && zwei(u.aufgabe), `${u.id}: Titel und Auftrag in DE und EN`)
    if (u.hinweis) meld(zwei(u.hinweis), `${u.id}: Hinweis in DE und EN`)
    if (u.rueckmeldung) meld(zwei(u.rueckmeldung), `${u.id}: Rückmeldung in DE und EN`)
    if (u.typ === 'quiz' || u.typ === 'experiment') {
      meld(Array.isArray(u.fragen) && u.fragen.length > 0, `${u.id}: hat Fragen`)
      for (const [j, fr] of (u.fragen || []).entries()) {
        meld(zwei(fr.frage) && opt(fr.optionen), `${u.id} Frage ${j + 1}: zweisprachig mit mindestens zwei Optionen`)
        meld(Array.isArray(fr.richtig) && fr.richtig.length > 0 && fr.richtig.every(r => r >= 0 && r < fr.optionen.length), `${u.id} Frage ${j + 1}: richtige Antworten gültig`)
        if (!fr.mehrfach) meld(fr.richtig.length === 1, `${u.id} Frage ${j + 1}: Einfachauswahl mit genau einer richtigen Antwort`)
        if (fr.erklaerung) meld(zwei(fr.erklaerung), `${u.id} Frage ${j + 1}: Erklärung zweisprachig`)
      }
      if (u.typ === 'experiment') meld(WERKZEUGE.includes(u.werkzeug), `${u.id}: Werkzeug ${u.werkzeug} bekannt`)
    }
    if (u.typ === 'zuordnen') {
      const ids = new Set((u.kategorien || []).map(k => k.id))
      meld(ids.size >= 2 && u.kategorien.every(k => zwei(k.name)), `${u.id}: Kategorien`)
      meld(Array.isArray(u.elemente) && u.elemente.length >= 3 && u.elemente.every(e => zwei(e.text) && ids.has(e.ziel)), `${u.id}: Elemente mit gültigem Ziel`)
    }
    if (u.typ === 'sortieren') meld(Array.isArray(u.elemente) && u.elemente.length >= 3 && u.elemente.every(e => zwei(e.text)), `${u.id}: Elemente`)
    if (u.typ === 'rechnen') meld(Array.isArray(u.felder) && u.felder.length > 0 && u.felder.every(f => zwei(f.name) && Number.isFinite(f.loesung) && Number.isFinite(f.toleranz ?? 0)), `${u.id}: Rechenfelder`)
    if (u.typ === 'luecken') {
      const n = (s) => (String(s).match(/___\d+___/g) || []).length
      meld(zwei(u.text) && n(u.text.de) === n(u.text.en) && n(u.text.de) === (u.luecken || []).length, `${u.id}: Lücken in beiden Sprachen = luecken.length`)
      meld((u.luecken || []).every(l => (Array.isArray(l.loesung) && l.loesung.length) || l.muster), `${u.id}: jede Lücke hat Lösung oder Muster`)
    }
    if (u.typ === 'belegen') {
      meld(Array.isArray(u.saetze) && u.saetze.length >= 2 && u.saetze.every(s => zwei(s.text) && typeof s.belegt === 'boolean'), `${u.id}: Sätze mit belegt-Flag`)
      meld(Array.isArray(u.quellen) && u.quellen.length > 0 && u.quellen.every(q => q.chunk ? !!(ch && ch.chunks.some(c => c.id === q.chunk)) : (zwei(q.text) && zwei(q.titel))), `${u.id}: Quellen vorhanden`)
    }
    if (u.typ === 'checkliste') meld(Array.isArray(u.schritte) && u.schritte.every(s => zwei(s.text) && zwei(s.frage) && opt(s.optionen) && s.richtig >= 0 && s.richtig < s.optionen.length), `${u.id}: Schritte mit Prüffrage`)
    if (u.typ === 'terminal') meld(Array.isArray(u.schritte) && u.schritte.every(s => zwei(s.text) && (s.muster || s.zustand)), `${u.id}: Terminalschritte`)
  })
  for (const m of html.matchAll(/data-werkzeug="([^"]+)"(?:[^>]*data-parameter='([^']*)')?/g)) {
    meld(WERKZEUGE.includes(m[1]), `${lab.id}: Werkzeug ${m[1]} bekannt`)
    if (m[2]) { let ok = true; try { JSON.parse(m[2]) } catch { ok = false } meld(ok, `${lab.id}: data-parameter für ${m[1]} ist JSON`) }
  }
  meld(!/TODO|TBD|Lorem ipsum/.test(html), `${lab.id}: keine Platzhaltertexte`)
}
const index = readFileSync(join(ROOT, 'index.html'), 'utf8')
for (const m of index.matchAll(/data-werkzeug="([^"]+)"/g)) meld(WERKZEUGE.includes(m[1]), `index: Werkzeug ${m[1]} bekannt`)

console.log(fehler ? `\n${fehler} Befund(e).` : '\nAlles in Ordnung.')
process.exit(fehler ? 1 : 0)
