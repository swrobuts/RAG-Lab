/** Chunking-Spielplatz am echten Handbuch: drei Strategien, Regler, Tokenzahlen (exakt mit Tokenizer). */
import { el, txt, zwei, kopf, ganz } from './gemein.js'
import { chunkeFest, chunkeSaetze, chunkeMarkdown, explodiereTabellen, begrenzeLaenge } from '../chunking.js'
import { schaetzeTokens, ZEICHEN_JE_TOKEN } from '../pruefung.js'
const L = {
  titel: { de: 'Chunking-Spielplatz', en: 'Chunking playground' }, quelle: { de: 'Abschnitt des Handbuchs', en: 'Section of the manual' },
  ganz: { de: 'Ganzes Handbuch', en: 'Whole manual' }, strategie: { de: 'Strategie', en: 'Strategy' },
  fest: { de: 'Feste Länge in Zeichen', en: 'Fixed length in characters' }, saetze: { de: 'Ganze Sätze bis zur Länge', en: 'Whole sentences up to the length' },
  pipeline: { de: 'Fallbeispiel: Markdown → Tabellenzeilen → Tokens', en: 'Case study: Markdown → table rows → tokens' },
  groesse: { de: 'Größe (Zeichen)', en: 'Size (characters)' }, overlap: { de: 'Überlappung (Zeichen)', en: 'Overlap (characters)' },
  chunks: { de: 'Chunks', en: 'chunks' }, tokens: { de: 'Tokens', en: 'tokens' }, geschaetzt: { de: 'geschätzt', en: 'estimated' }, exakt: { de: 'exakt', en: 'exact' },
  e18: { de: 'E:18-Zeile allein in einem Chunk', en: 'E:18 row alone in a chunk' }, ja: { de: 'ja', en: 'yes' }, nein: { de: 'nein', en: 'no' },
  zeichen: { de: 'Zeichen', en: 'characters' }, mehr: { de: 'nur die ersten 60 Chunks angezeigt', en: 'only the first 60 chunks shown' },
  statusExakt: { de: 'Tokenzahlen exakt (Tokenizer geladen)', en: 'Exact token counts (tokenizer loaded)' },
  statusGeschaetzt: { de: 'Tokenzahlen geschätzt mit {z} Zeichen je Token; exakt nach dem Laden des Tokenizers im Werkzeug „Tokenizer“', en: 'Token counts estimated with {z} characters per token; exact once the tokenizer is loaded in the “Tokenizer” tool' },
  tokenGroesse: { de: 'Tokens je Chunk in Stufe 4', en: 'tokens per chunk in stage 4' }
}
export function baue (wrap, p, ctx) {
  const k = kopf(wrap, L.titel, ctx)
  const zeile = el('div', 'zeile'); const sel = el('select'); zwei(sel, L.quelle, ctx, 'aria-label'); const strat = el('select'); zwei(strat, L.strategie, ctx, 'aria-label')
  for (const [v, l] of [['fest', L.fest], ['saetze', L.saetze], ['pipeline', L.pipeline]]) { const o = el('option'); o.value = v; zwei(o, l, ctx); strat.append(o) }
  strat.value = p.strategie || 'fest'; zeile.append(sel, strat)
  const rg = el('input'); rg.type = 'range'; rg.min = 100; rg.max = 2000; rg.step = 20; rg.value = p.groesse || 500
  const ro = el('input'); ro.type = 'range'; ro.min = 0; ro.max = 200; ro.step = 10; ro.value = p.overlap ?? 50
  const lg = el('label'); const og = el('output'); lg.append(zwei(el('span'), L.groesse, ctx), ' ', og, rg)
  const lo = el('label'); const oo = el('output'); lo.append(zwei(el('span'), L.overlap, ctx), ' ', oo, ro)
  const regler = el('div', 'regler'); regler.append(lg, lo); const summe = el('p'); const liste = el('div', 'chunk-liste')
  wrap.append(zeile, regler, summe, liste)
  let md, abschnitte
  const exakt = () => ctx.modell.zustand().tokenizer === 'bereit'
  const zaehler = (t) => (exakt() ? ctx.modell.tokenisiere(t).tokens.length : schaetzeTokens(t))
  const zeige = () => {
    if (!md) return
    const lang = ctx.lang(); const g = +rg.value, o = +ro.value; og.value = ganz(g, lang); oo.value = ganz(o, lang)
    const pipeline = strat.value === 'pipeline'
    lg.querySelector('span').textContent = pipeline ? `${txt(L.groesse, lang).split(' ')[0]} (${txt(L.tokenGroesse, lang)})` : txt(L.groesse, lang)
    const quelle = sel.value === '*' ? md : (abschnitte.find(a => a.ueberschrift === sel.value && a.text.length > 60) || abschnitte.find(a => a.ueberschrift === sel.value)).text
    let chunks
    if (strat.value === 'fest') chunks = chunkeFest(quelle, { groesse: g, overlap: o })
    else if (strat.value === 'saetze') chunks = chunkeSaetze(quelle, { groesse: g, overlap: o })
    else chunks = begrenzeLaenge(explodiereTabellen(chunkeMarkdown(quelle), 1600), { groesse: Math.min(440, Math.round(g / ZEICHEN_JE_TOKEN)), overlap: Math.round(o / ZEICHEN_JE_TOKEN), zaehler })
    const allein = chunks.some(c => c.text.includes('E:18') && !c.text.includes('E:23') && c.text.length < 400)
    const laengen = chunks.map(c => c.text.length)
    summe.textContent = `${ganz(chunks.length, lang)} ${txt(L.chunks, lang)} · ${ganz(Math.min(...laengen), lang)}–${ganz(Math.max(...laengen), lang)} ${txt(L.zeichen, lang)} · ${txt(L.e18, lang)}: ${txt(allein ? L.ja : L.nein, lang)}${chunks.length > 60 ? ' · ' + txt(L.mehr, lang) : ''}`
    liste.replaceChildren(...chunks.slice(0, 60).map((c, i) => {
      const box = el('div', 'chunk' + (c.text.includes('E:18') ? ' e18' : ''))
      box.append(el('div', 'chunk-kopf', `#${i + 1} · ${ganz(c.text.length, lang)} ${txt(L.zeichen, lang)} · ${zaehler(c.text)} ${txt(L.tokens, lang)} (${txt(exakt() ? L.exakt : L.geschaetzt, lang)})${c.art ? ' · ' + c.art : ''}`), el('pre', null, c.text)); return box
    }))
    k.status(exakt() ? L.statusExakt : { de: txt(L.statusGeschaetzt, 'de').replace('{z}', String(ZEICHEN_JE_TOKEN).replace('.', ',')), en: txt(L.statusGeschaetzt, 'en').replace('{z}', String(ZEICHEN_JE_TOKEN)) }, exakt() ? 'live' : 'vorberechnet')
  }
  ctx.daten('handbuch.md').then(t => {
    md = t; abschnitte = chunkeMarkdown(md)
    const o0 = el('option'); o0.value = '*'; zwei(o0, L.ganz, ctx); sel.append(o0)
    const gesehen = new Set()
    for (const a of abschnitte) if (a.ueberschrift && a.text.length > 60 && !gesehen.has(a.ueberschrift)) { gesehen.add(a.ueberschrift); const o = el('option', null, a.ueberschrift.slice(0, 70)); o.value = a.ueberschrift; sel.append(o) }
    sel.value = p.abschnitt || 'Hinweise im Anzeigefeld'; zeige()
  })
  for (const e of [sel, strat, rg, ro]) e.addEventListener('input', zeige)
  ctx.modell.beiAenderung(() => zeige()); document.addEventListener('rag:sprache', zeige)
}
