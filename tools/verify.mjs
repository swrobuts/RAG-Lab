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
import { neueWelt, fuehreAus, schrittErfuellt, zustandTrifft } from '../assets/terminal.js'
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

/* --------------------------------------------------------- Zahlen im Text */
// Jede Zahl aus dem Fallbeispiel steht im HTML als <span data-wert="schluessel">…</span>.
// Hier steht, woher der Wert kommt; die Pruefung akzeptiert deutsche und englische Schreibweise.
const um = daten('umgebung.json'); const ev = (n) => daten('eval/' + n); const bt = daten('betrieb.json')
meld(!!bt && bt.fingerprint.gleich && bt.liveTokens.length === 4, 'betrieb.json: Fingerprint nachgerechnet, vier Live-Tokenzeilen')
const live = (frage) => (bt && bt.liveTokens.find(t => t.frage === frage)) || {}
const kosten = () => { const e = live('Fehler E:18'); const p = bt.preise; const a = bt.annahmen; const je = (e.ein * p.einUsdJeMio + e.aus * p.ausUsdJeMio) / 1e6; return { je, monat: a.anfragenJeTag * a.tage * je, lokal: a.rechnerUsd / a.monate + a.stromUsdJeMonat } }
meld(!!um && um.lmStudioModelle.some(m => m.id === 'gemma-4-12b-it-mlx' && m.maxKontext > 0), 'umgebung.json: LM-Studio-Modelle mit Kontextfenster')
const lmsModell = (id) => (um && um.lmStudioModelle.find(m => m.id === id)) || {}
const frage = (id) => fr && fr.fragen.find(f => f.id === id)
const rang = (f, stufe, chunkId) => { const i = f[stufe].findIndex(t => t.chunk === chunkId); return i < 0 ? '–' : i + 1 }
const e18Chunk = ch && ch.chunks.find(c => c.text.includes('Anzeige: E:18;'))
const WERTE = {
  'chunks.anzahl': () => ch.anzahl,
  'chunks.e18Text': () => e18Chunk.text,
  'chunks.e18Vektor': () => '[' + e18Chunk.v.slice(0, 8).join(', ') + ', …]',
  'chunks.zeilen': () => ch.chunks.filter(c => /^## .*\n[^\n|]+: [^\n]+; /.test(c.text)).length,
  'chunks.mitGruppe': () => ch.chunks.filter(c => c.text.startsWith('Dokumentkontext:')).length,
  'handbuch.anzeigeZeichen': () => { const md = readFileSync(join(ROOT, 'data/handbuch.md'), 'utf8'); const s = md.split(/(?=^## )/m).find(x => x.startsWith('## Hinweise im Anzeigefeld')); return s.length },
  'tokens.vokabular': () => tk.vokabular,
  'tokens.e18': () => tk.beispiele.e18.tokens.length,
  'tokens.satzDe': () => tk.beispiele['satz-de'].tokens.length,
  'tokens.satzEn': () => tk.beispiele['satz-en'].tokens.length,
  'tokens.zeichenJeToken': () => tk.zaehlungen.zeichenJeToken,
  'tokens.systemprompt': () => tk.zaehlungen.systemprompt,
  'tokens.handbuch': () => tk.zaehlungen.handbuch,
  'tokens.handbuchWoerter': () => tk.zaehlungen.handbuchWoerter,
  'tokens.handbuchAbschnitte': () => tk.zaehlungen.handbuchAbschnitte,
  'tokens.maxChunkTokens': () => tk.zaehlungen.maxChunkTokens,
  'tokens.mittelChunkTokens': () => tk.zaehlungen.mittelChunkTokens,
  'tokens.e18Chunk': () => tk.zaehlungen.e18Chunk,
  'tokens.budgetTokens': () => Math.round(14000 / tk.zaehlungen.zeichenJeToken),
  'logits.modell': () => lg.modell,
  'logits.vokabular': () => lg.vokabular,
  'logits.e18.pTop1': () => { const q = lg.prompts.find(x => x.id === 'e18'); return Math.round(Math.exp(q.tokens[0].logit - q.restLogsumexp) * 100) },
  'lms.kontext': () => lmsModell('gemma-4-12b-it-mlx').maxKontext,
  'lms.quant': () => lmsModell('gemma-4-12b-it-mlx').quantisierung,
  'eval.vector.hit5': () => ev('vector.json').keyword_hit_rate * 100,
  'eval.vector.hit1': () => ev('vector.json').keyword_hit_at_1 * 100,
  'eval.vector.mrr': () => ev('vector.json').keyword_mrr,
  'eval.vector.abdeckung': () => ev('vector.json').keyword_coverage * 100,
  'eval.hybrid.hit5': () => ev('hybrid-no-rerank.json').keyword_hit_rate * 100,
  'eval.hybrid.hit1': () => ev('hybrid-no-rerank.json').keyword_hit_at_1 * 100,
  'eval.hybrid.mrr': () => ev('hybrid-no-rerank.json').keyword_mrr,
  'eval.hybrid.abdeckung': () => ev('hybrid-no-rerank.json').keyword_coverage * 100,
  'eval.rerank.hit5': () => ev('hybrid-rerank.json').keyword_hit_rate * 100,
  'eval.rerank.hit1': () => ev('hybrid-rerank.json').keyword_hit_at_1 * 100,
  'eval.rerank.mrr': () => ev('hybrid-rerank.json').keyword_mrr,
  'eval.rerank.abdeckung': () => ev('hybrid-rerank.json').keyword_coverage * 100,
  'fragen.e18.rerankScore': () => frage('fehler-e18').obersterScore,
  'fragen.e18.rangVektor': () => rang(frage('fehler-e18'), 'vektor', e18Chunk.id),
  'fragen.e18.rangHybrid': () => rang(frage('fehler-e18'), 'hybrid', e18Chunk.id),
  'fragen.e18.rangRerank': () => rang(frage('fehler-e18'), 'rerank', e18Chunk.id),
  'fragen.keinWassereinlauf.score': () => frage('kein-wassereinlauf').obersterScore,
  'fragen.wasserSchiesst.score': () => frage('wasser-schiesst').obersterScore,
  'fragen.wasserLaeuft.score': () => frage('wasser-laeuft').obersterScore,
  'fragen.fehler18.score': () => frage('fehler-18-ohne-doppelpunkt').obersterScore,
  'fragen.negativ1.score': () => frage('negativ-1').obersterScore,
  'fragen.negativMax.score': () => Math.max(...fr.fragen.filter(f => f.art === 'negativ').map(f => f.obersterScore)),
  'fragen.anzahl': () => fr.fragen.length,
  'projektion.varianz': () => (pr.varianz[0] + pr.varianz[1]) * 100,
  'antworten.e18.tokens': () => { const e = an.eintraege.find(x => x.id === 'e18-rag'); return `${e.usage.ein}/${e.usage.aus}` },
  'antworten.e18nackt.tokens': () => { const e = an.eintraege.find(x => x.id === 'e18-nackt'); return `${e.usage.ein}/${e.usage.aus}` },
  'antworten.e18.sekunden': () => an.eintraege.find(x => x.id === 'e18-rag').sekunden,
  'antworten.modell': () => an.eintraege[0].modell,
  'betrieb.fingerprint': () => bt.fingerprint.gespeichert,
  'betrieb.fingerprintKurz': () => bt.fingerprint.gespeichert.slice(0, 12) + '…' + bt.fingerprint.gespeichert.slice(-6),
  'betrieb.anderesModellKurz': () => bt.fingerprint.anderesModell.slice(0, 12) + '…',
  'betrieb.leerzeichenKurz': () => bt.fingerprint.einLeerzeichenMehr.slice(0, 12) + '…',
  'betrieb.markdownBytes': () => bt.fingerprint.zutaten.markdownBytes,
  'betrieb.speicherMB': () => bt.speicher.gesamtBytes / 1e6,
  'betrieb.vektorMB': () => bt.speicher.dateien['default__vector_store.json'] / 1e6,
  'betrieb.docstoreKB': () => bt.speicher.dateien['docstore.json'] / 1e3,
  'betrieb.live.pumpe': () => `${live('Wie reinige ich die Laugenpumpe? Welche Sicherheitsmaßnahmen sind vorher nötig?').ein}/${live('Wie reinige ich die Laugenpumpe? Welche Sicherheitsmaßnahmen sind vorher nötig?').aus}`,
  'betrieb.live.e18': () => `${live('Fehler E:18').ein}/${live('Fehler E:18').aus}`,
  'betrieb.live.e23': () => `${live('Fehler E:23').ein}/${live('Fehler E:23').aus}`,
  'betrieb.live.pageindexE23': () => `${live('Was bedeutet der Fehler E:23?').ein}/${live('Was bedeutet der Fehler E:23?').aus}`,
  'betrieb.live.e18ein': () => live('Fehler E:18').ein,
  'betrieb.live.e18aus': () => live('Fehler E:18').aus,
  'betrieb.lms.e23s': () => bt.lmStudioSekunden.e23,
  'betrieb.lms.e999s': () => bt.lmStudioSekunden.e999Ablehnung,
  'betrieb.grenzen.frageZeichen': () => bt.grenzen.frageZeichen,
  'betrieb.grenzen.bodyKiB': () => bt.grenzen.bodyBytes / 1024,
  'betrieb.grenzen.kontextZeichen': () => bt.grenzen.kontextZeichen,
  'betrieb.grenzen.stunden': () => bt.grenzen.schluesselStunden,
  'betrieb.csp': () => bt.header['Content-Security-Policy'],
  'phasen.recallVor': () => bt.phasen.recallVor,
  'phasen.recallNach': () => bt.phasen.recallNach,
  'phasen.mrrVor': () => bt.phasen.mrrVor,
  'phasen.mrrNach': () => bt.phasen.mrrNach,
  'phasen.hit1Vor': () => bt.phasen.hit1Vor,
  'phasen.hit1Nach': () => bt.phasen.hit1Nach,
  'commits.anzahl': () => bt.commits.length,
  'commits.erster': () => bt.commits.at(-1).hash,
  'commits.letzter': () => bt.commits[0].hash,
  'kosten.preisEin': () => bt.preise.einUsdJeMio,
  'kosten.preisAus': () => bt.preise.ausUsdJeMio,
  'kosten.jeAnfrageCent': () => kosten().je * 100,
  'kosten.monat': () => kosten().monat,
  'kosten.lokal': () => kosten().lokal,
  'kosten.faktor': () => Math.round(kosten().lokal / kosten().monat),
  'kosten.gleichstand': () => Math.round(kosten().lokal / bt.annahmen.tage / kosten().je / 10) * 10
}
// Rechenübungen, deren Lösungen aus den Daten folgen: Übungs-ID -> WERTE-Schlüssel je Feld
const LOESUNGEN = { 'R09-04': ['kosten.jeAnfrageCent', 'kosten.monat', 'kosten.lokal'] }
const NBSP = /[\s   ]/g
const fmtZahl = (v) => {
  if (typeof v !== 'number') return [String(v)]
  const aus = []
  for (const st of [0, 1, 2, 3, 4]) {
    aus.push(v.toLocaleString('de-DE', { minimumFractionDigits: st, maximumFractionDigits: st }).replace(NBSP, ''))
    aus.push(v.toLocaleString('de-DE', { minimumFractionDigits: st, maximumFractionDigits: st, useGrouping: false }))
    aus.push(v.toLocaleString('en-GB', { minimumFractionDigits: st, maximumFractionDigits: st }).replace(NBSP, ''))
    aus.push(v.toLocaleString('en-GB', { minimumFractionDigits: st, maximumFractionDigits: st, useGrouping: false }))
  }
  return aus
}
function pruefeWerte (html, name) {
  for (const m of html.matchAll(/<pre[^>]*data-wert-text="([^"]+)"[^>]*>([\s\S]*?)<\/pre>/g)) {
    const soll = WERTE[m[1]] ? WERTE[m[1]]() : null
    const ist = m[2].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim()
    meld(soll != null && String(soll).trim() === ist, `${name}: Textmarker ${m[1]} zeichengleich`)
  }
  for (const m of html.matchAll(/<(span|code)(?: class="[^"]*")? data-wert="([^"]+)">([\s\S]*?)<\/\1>/g)) {
    const key = m[2]; const text = m[3].replace(/<[^>]+>/g, '').replace(/&#39;/g, "'").replace(NBSP, '').trim()
    if (!WERTE[key]) { meld(false, `${name}: unbekannter Marker ${key}`); continue }
    let soll; try { soll = WERTE[key]() } catch (e) { meld(false, `${name}: ${key} nicht berechenbar (${e.message})`); continue }
    const ok = fmtZahl(soll).some(k => k.replace(NBSP, '') === text.replace(/\.(?=\d{3}\b)/g, '').replace(/^(\d{1,3})(?:[.,](\d{3}))+$/, (x) => x.replace(/[.,]/g, '')) || k === text)
    meld(ok, `${name}: ${key} = „${text}“ (Daten: ${typeof soll === 'string' ? soll : fmtZahl(soll)[0]})`)
  }
}

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
    // Rechenlösungen, die aus den Daten folgen, müssen zu den Daten passen (Schlüssel wie bei data-wert).
    if (u.typ === 'rechnen' && LOESUNGEN[u.id]) LOESUNGEN[u.id].forEach((key, i) => { const f = u.felder[i]; const soll = WERTE[key](); meld(!!f && Math.abs(f.loesung - soll) <= (f.toleranz ?? 0), `${u.id}: Feld ${i + 1} ${f && f.loesung} ≈ ${key} ${fmtZahl(soll)[16]}`) })
    if (u.typ === 'luecken') {
      const n = (s) => new Set(String(s).match(/___\d+___/g) || []).size
      const folge = (s) => [...new Set(String(s).match(/___(\d+)___/g) || [])].map(x => +x.replace(/_/g, '')).sort((a, b) => a - b).every((x, i) => x === i + 1)
      meld(zwei(u.text) && n(u.text.de) === n(u.text.en) && n(u.text.de) === (u.luecken || []).length && folge(u.text.de), `${u.id}: Lücken 1..n in beiden Sprachen = luecken.length`)
      meld((u.luecken || []).every(l => (Array.isArray(l.loesung) && l.loesung.length) || l.muster), `${u.id}: jede Lücke hat Lösung oder Muster`)
    }
    if (u.typ === 'belegen') {
      meld(Array.isArray(u.saetze) && u.saetze.length >= 2 && u.saetze.every(s => zwei(s.text) && typeof s.belegt === 'boolean'), `${u.id}: Sätze mit belegt-Flag`)
      meld(Array.isArray(u.quellen) && u.quellen.length > 0 && u.quellen.every(q => q.chunk ? !!(ch && ch.chunks.some(c => c.id === q.chunk)) : (zwei(q.text) && zwei(q.titel))), `${u.id}: Quellen vorhanden`)
    }
    if (u.typ === 'checkliste') meld(Array.isArray(u.schritte) && u.schritte.every(s => zwei(s.text) && zwei(s.frage) && opt(s.optionen) && s.richtig >= 0 && s.richtig < s.optionen.length), `${u.id}: Schritte mit Prüffrage`)
    if (u.typ === 'terminal') {
      meld(Array.isArray(u.schritte) && u.schritte.every(s => zwei(s.text) && (s.muster || s.zustand)), `${u.id}: Terminalschritte`)
      // Die Musterlösung (loesung.mac / loesung.win) muss in der nachgebildeten Shell alle Schritte erfüllen.
      for (const os of ['mac', 'win']) {
        const zeilen = u.loesung && u.loesung[os]
        if (!Array.isArray(zeilen)) { meld(false, `${u.id}: Musterlösung für ${os} fehlt`); continue }
        const w = neueWelt(os, u.szenario || {}); const schritte = u.schritte.map(s => ({ ...s, fertig: false })); let fehler = null
        for (const zeile of zeilen) {
          const s = schritte.find(x => !x.fertig); const vorher = s ? zustandTrifft(w, s.zustand) : false
          const r = fuehreAus(w, zeile)
          if (r.zeilen.some(z => z.art === 'fehler') && !(s && s.erwarteterFehler)) fehler = zeile
          if (s && schrittErfuellt(w, s, zeile, vorher, r)) s.fertig = true
        }
        meld(!fehler && schritte.every(s => s.fertig), `${u.id}: Musterlösung ${os} erfüllt alle ${schritte.length} Schritte${fehler ? ' (Fehler bei: ' + fehler + ')' : ''}`)
      }
    }
  })
  for (const m of html.matchAll(/data-werkzeug="([^"]+)"(?:[^>]*data-parameter='([^']*)')?/g)) {
    meld(WERKZEUGE.includes(m[1]), `${lab.id}: Werkzeug ${m[1]} bekannt`)
    if (m[2]) { let ok = true; try { JSON.parse(m[2]) } catch { ok = false } meld(ok, `${lab.id}: data-parameter für ${m[1]} ist JSON`) }
  }
  meld(!/TODO|TBD|Lorem ipsum/.test(html), `${lab.id}: keine Platzhaltertexte`)
  pruefeWerte(html, lab.id)
}
// Die Commit-Hashes im Phasendiagramm muessen in der echten Historie des Fallbeispiels stehen.
{
  const mmd = readFileSync(join(ROOT, 'diagramme/quellen/nachbau-phasen.mmd'), 'utf8')
  const hashes = [...mmd.matchAll(/commit id: "([0-9a-f]{7})/g)].map(m => m[1])
  meld(hashes.length >= 8 && hashes.every(h => bt.commits.some(c => c.hash === h)), `nachbau-phasen.mmd: ${hashes.length} Commit-Hashes in der Historie des Fallbeispiels`)
}
const index = readFileSync(join(ROOT, 'index.html'), 'utf8')
for (const m of index.matchAll(/data-werkzeug="([^"]+)"/g)) meld(WERKZEUGE.includes(m[1]), `index: Werkzeug ${m[1]} bekannt`)
pruefeWerte(index, 'index')

console.log(fehler ? `\n${fehler} Befund(e).` : '\nAlles in Ordnung.')
process.exit(fehler ? 1 : 0)
