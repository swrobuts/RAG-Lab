#!/usr/bin/env node
/**
 * texte.mjs - Textdurchsicht nach dem Verfahren „Folientext prüfen“, auf Webseiten übertragen.
 *
 *   node tools/pruefung/texte.mjs            Mustersuche über alle Texte + doppelte Einleitungen
 *   node tools/pruefung/texte.mjs --liste    zusätzlich alle Einleitungstexte zum Lesen ausgeben
 *
 * Statt PowerPoint-Shapes: .lab-intro, der erste <p> je section-block, concept-/tip-/warn-/
 * challenge-box, figcaption, Begriffskarten, und aus data/uebungen/*.json aufgabe, hinweis,
 * rueckmeldung, erklaerung, loesungsweg; dazu die Textwörterbücher der Werkzeuge. DE und EN.
 * Ein Satz bleibt, wenn er eine Zahl, einen benannten Mechanismus, einen handelnden Akteur oder
 * eine überprüfbare Behauptung enthält; Rahmensätze, Bildbeschreibungen, Wichtigkeits-
 * behauptungen und Metaphern fliegen raus.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const HIER = dirname(fileURLToPath(import.meta.url)); const ROOT = join(HIER, '..', '..')
const liste = process.argv.includes('--liste')

const floskeln = [
  /spielt eine (wichtige|zentrale|entscheidende|große) Rolle/i, /plays? an? (important|central|key|crucial|major) role/i,
  /gewinn\w* (zunehmend )?an Bedeutung/i, /gain\w* (in )?importance/i, /nicht mehr wegzudenken/i,
  /in der heutigen Zeit|heutzutage|mehr denn je/i, /nowadays|more than ever|in today's/i, /immer wichtiger/i, /increasingly important/i,
  /Dreh- und Angelpunkt|das A und O|Gamechanger|Quantensprung/i, /game.?changer|quantum leap|linchpin/i,
  /Es ist wichtig|Grundsätzlich ist|Es gilt,/i, /It is important|Fundamentally,|Basically,/i,
  /ganzheitlich|nachhaltig\w*|vielfältig\w*/i, /holistic|sustainab\w+|manifold|a variety of/i, /revolutionier\w+|rasant/i, /revolutioni[sz]\w+|rapid(ly)?\b/i,
  /Die (Grafik|Abbildung|Tabelle|Folie|Karte) zeigt/i, /The (figure|diagram|table|chart|graphic|map) shows/i, /Mehrwert\w*/i, /added value/i, /Erfolgsfaktor\w*/i, /success factor/i,
  /Herausforderung\w*/i, /challenge\w*/i, /spannend|faszinierend/i, /exciting|fascinating/i
]
const meta = [
  /dieses Kapitels?|vorige[nr]? Kapitel/i, /this chapter|previous chapter/i, /die (bisherigen|gezeigten|obigen) /i, /the (above|aforementioned) /i,
  /wie (bereits|eingangs|oben) (erwähnt|gesehen|gesagt)/i, /as (already|previously) (mentioned|seen|said)/i,
  /Im Folgenden|Abschließend|Zusammenfassend lässt sich/i, /In the following|In conclusion|To summari[sz]e/i,
  /wirkt wie ein|gleicht einem|ist wie ein/i, /acts like an?|is like an?|resembles an?/i,
  /Der Stoff|in diesem Kurs|diese Folie|diese Seite|dieses Lab zeigt/i, /this slide|this page shows|this lab shows/i, /setzen den Maßstab/i,
  /nicht \w+, sondern/i, /not \w+,? but (rather )?\w+/i
]
const ausnahmenKontext = [/rel="noopener"/, /Quellen/, /<a href/]

const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim()
const texte = [] // { ort, art, lang, text }
const merke = (ort, art, html) => {
  for (const lang of ['de', 'en']) {
    // Alle <span lang="xx"> auf oberster Ebene innerhalb des Blocks einsammeln; verschachtelte Marker-Spans bleiben Text.
    const re = new RegExp(`<span lang="${lang}">([\\s\\S]*?)<\\/span>(?=\\s*(?:<span lang=|<\\/|$))`, 'g')
    let m; let n = 0
    while ((m = re.exec(html))) { const t = strip(m[1]); if (t.length >= 40) { texte.push({ ort, art, lang, text: t }); n++ } }
    if (!n && lang === 'de') { const t = strip(html); if (t.length >= 40 && !/lang="en"/.test(html)) texte.push({ ort, art, lang: 'de', text: t }) }
  }
}

/* Seiten */
const seiten = readdirSync(ROOT).filter(f => /^(index|lab-\d\d-[\w-]+)\.html$/.test(f)).sort()
for (const datei of seiten) {
  const html = readFileSync(join(ROOT, datei), 'utf8'); const kurz = datei.startsWith('lab-') ? datei.slice(0, 6) : 'index'
  const intro = /<p class="lab-intro">([\s\S]*?)<\/p>/.exec(html); if (intro) merke(kurz + ' intro', 'einleitung', intro[1])
  const hero = /<p class="hero-desc">([\s\S]*?)<\/p>/.exec(html); if (hero) merke(kurz + ' hero', 'einleitung', hero[1])
  for (const s of html.matchAll(/<section class="section-block" id="([^"]+)">([\s\S]*?)<\/section>/g)) {
    const id = s[1]; const p = /<p>([\s\S]*?)<\/p>/.exec(s[2]); if (p && id !== 'quellen') merke(`${kurz}#${id} p1`, 'einleitung', p[1])
    for (const b of s[2].matchAll(/<div class="(concept-box|tip-box|warn-box|challenge-box)">([\s\S]*?)<\/div>/g)) merke(`${kurz}#${id} ${b[1]}`, 'kasten', b[2])
    for (const f of s[2].matchAll(/<figcaption>([\s\S]*?)<\/figcaption>/g)) merke(`${kurz}#${id} figcaption`, 'bild', f[1])
    for (const k of s[2].matchAll(/<div class="befehl-falle">([\s\S]*?)<\/div>/g)) merke(`${kurz}#${id} falle`, 'karte', k[1])
    for (const li of s[2].matchAll(/<li>([\s\S]*?)<\/li>/g)) if (id === 'zusammenfassung') merke(`${kurz}#${id} li`, 'zusammenfassung', li[1])
  }
  for (const s of html.matchAll(/<section class="section(?: soft)?" id="([^"]+)">([\s\S]*?)<\/section>/g)) {
    for (const p of s[2].matchAll(/<p>([\s\S]*?)<\/p>/g)) merke(`${kurz}#${s[1]} p`, 'einleitung', p[1])
    for (const b of s[2].matchAll(/<div class="(concept-box|tip-box)">([\s\S]*?)<\/div>/g)) merke(`${kurz}#${s[1]} ${b[1]}`, 'kasten', b[2])
  }
}
/* Übungen */
for (const datei of readdirSync(join(ROOT, 'data', 'uebungen')).filter(f => f.endsWith('.json')).sort()) {
  const u = JSON.parse(readFileSync(join(ROOT, 'data', 'uebungen', datei), 'utf8'))
  const nimm = (ort, o) => { if (!o) return; for (const lang of ['de', 'en']) { const t = strip(String(o[lang] || '')); if (t.length >= 40) texte.push({ ort, art: 'uebung', lang, text: t }) } }
  for (const x of u) {
    nimm(`${x.id} aufgabe`, x.aufgabe); nimm(`${x.id} hinweis`, x.hinweis); nimm(`${x.id} rueckmeldung`, x.rueckmeldung); nimm(`${x.id} loesungsweg`, x.loesungsweg)
    for (const [i, f] of (x.fragen || []).entries()) { nimm(`${x.id} frage${i + 1}`, f.frage); nimm(`${x.id} erklaerung${i + 1}`, f.erklaerung); for (const [j, o] of (f.optionen || []).entries()) nimm(`${x.id} f${i + 1} option${j + 1}`, o) }
    for (const [i, s] of (x.schritte || []).entries()) { nimm(`${x.id} schritt${i + 1}`, s.text); nimm(`${x.id} schritt${i + 1} frage`, s.frage); for (const [j, o] of (s.optionen || []).entries()) nimm(`${x.id} s${i + 1} option${j + 1}`, o) }
    for (const [i, e] of (x.elemente || []).entries()) nimm(`${x.id} element${i + 1}`, e.text)
    for (const [i, b] of (x.behauptungen || []).entries()) nimm(`${x.id} behauptung${i + 1}`, b.text)
  }
}
/* Werkzeuge und Laufzeit: Wörterbücher { de: '…', en: '…' } */
for (const datei of ['assets/rag.js', 'assets/terminal.js', ...readdirSync(join(ROOT, 'assets', 'werkzeuge')).map(f => 'assets/werkzeuge/' + f)]) {
  const js = readFileSync(join(ROOT, datei), 'utf8')
  for (const m of js.matchAll(/de: '((?:[^'\\]|\\.)*)', en: '((?:[^'\\]|\\.)*)'/g)) { if (m[1].length >= 40) texte.push({ ort: datei, art: 'werkzeug', lang: 'de', text: m[1] }); if (m[2].length >= 40) texte.push({ ort: datei, art: 'werkzeug', lang: 'en', text: m[2] }) }
}

/* 2. Mustersuche */
let treffer = 0
const zeige = (t, re, m) => { const i = m.index; console.log(`  ${t.ort} [${t.lang}] /${re.source}/\n     …${t.text.slice(Math.max(0, i - 70), i)}[${m[0]}]${t.text.slice(i + m[0].length, i + m[0].length + 90)}…`); treffer++ }
console.log(`Texte: ${texte.length} (${texte.filter(t => t.lang === 'de').length} DE, ${texte.filter(t => t.lang === 'en').length} EN)\n\nFloskeln`)
for (const t of texte) for (const re of floskeln) { const m = re.exec(t.text); if (m) zeige(t, re, m) }
console.log('\nMeta und Metaphern')
for (const t of texte) for (const re of meta) { const m = re.exec(t.text); if (m) zeige(t, re, m) }

/* 3. Identische Einleitungen */
console.log('\nDoppelte Einleitungen')
const gesehen = new Map(); let doppel = 0
for (const t of texte.filter(x => x.art === 'einleitung')) { const k = t.lang + '|' + t.text; if (gesehen.has(k)) { console.log(`  ${gesehen.get(k)} = ${t.ort}: ${t.text.slice(0, 80)}…`); doppel++ } else gesehen.set(k, t.ort) }
// Auch gleiche Satzanfänge (erste 60 Zeichen) über Einleitungen hinweg
const anfaenge = new Map()
for (const t of texte.filter(x => x.art === 'einleitung' && x.lang === 'de')) { const a = t.text.slice(0, 60); if (anfaenge.has(a)) { console.log(`  gleicher Anfang: ${anfaenge.get(a)} ~ ${t.ort}: ${a}…`); doppel++ } else anfaenge.set(a, t.ort) }
console.log(`\n${treffer} Mustertreffer, ${doppel} Dopplungen.`)

if (liste) {
  console.log('\nEinleitungstexte zum Lesen (DE)')
  for (const t of texte.filter(x => x.art === 'einleitung' && x.lang === 'de')) console.log(`\n[${t.ort}]\n${t.text}`)
}
