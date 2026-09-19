/** Embedding und Kosinusaehnlichkeit: Katalogvektoren ohne Modell, freie Texte mit Modell. */
import { el, txt, zwei, kopf, ladeKnopf, fmt } from './gemein.js'
import { kosinus, topK } from '../pruefung.js'
const L = {
  titel: { de: 'Embedding und Kosinusähnlichkeit', en: 'Embedding and cosine similarity' },
  a: { de: 'Text A', en: 'Text A' }, b: { de: 'Text B', en: 'Text B' },
  praefix: { de: 'Präfixe query:/passage: verwenden', en: 'Use query:/passage: prefixes' },
  vergleichen: { de: 'Vergleichen', en: 'Compare' },
  katalog: { de: 'Ohne Modell: zwei Katalogfragen vergleichen (Vektoren aus fragen.json)', en: 'Without the model: compare two catalogue questions (vectors from fragen.json)' },
  live: { de: 'Live im Browser', en: 'Live in the browser' }, vorberechnet: { de: 'Vorberechnete Vektoren', en: 'Precomputed vectors' },
  kos: { de: 'Kosinusähnlichkeit', en: 'Cosine similarity' }, dims: { de: 'erste 8 von 384 Dimensionen', en: 'first 8 of 384 dimensions' },
  naechste: { de: 'Nächste Handbuch-Chunks zu A', en: 'Closest manual chunks to A' }, rechnet: { de: 'Rechnet …', en: 'Computing …' }
}
export function baue (wrap, p, ctx) {
  const k = kopf(wrap, L.titel, ctx)
  const felder = el('div', 'zwei-spalten')
  const ta = el('textarea'); ta.rows = 2; ta.value = p.a || 'Laugenpumpe verstopft'; zwei(ta, L.a, ctx, 'aria-label'); ta.readOnly = true
  const tb = el('textarea'); tb.rows = 2; tb.value = p.b || 'Die Pumpe ist blockiert'; zwei(tb, L.b, ctx, 'aria-label'); tb.readOnly = true
  felder.append(ta, tb)
  const cbl = el('label'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = p.praefix !== false; cbl.append(cb, ' ', zwei(el('span'), L.praefix, ctx))
  const btn = zwei(el('button', 'btn-sm primary'), L.vergleichen, ctx); btn.type = 'button'
  const katalog = el('div'); const sa = el('select'), sb = el('select'); zwei(sa, L.a, ctx, 'aria-label'); zwei(sb, L.b, ctx, 'aria-label')
  const kz = el('div', 'zeile'); kz.append(sa, sb); katalog.append(zwei(el('div', 'line-hilfe'), L.katalog, ctx), kz)
  const erg = el('div', 'ergebnis'); wrap.append(katalog, felder, cbl, btn, erg)
  let fragen = [], chunks = [], live = false
  const zeigeVektor = (v) => el('code', null, '[' + Array.from(v).slice(0, 8).map(x => fmt(x, 3, ctx.lang())).join(', ') + ', …]')
  const zeige = (va, vb, mitChunks) => {
    erg.replaceChildren()
    const lang = ctx.lang()
    const z = el('p'); z.append(el('strong', null, `${txt(L.kos, lang)}: ${fmt(kosinus(va, vb), 4, lang)}`))
    const d = el('p', 'line-hilfe'); d.append(txt(L.dims, lang) + ' · A ', zeigeVektor(va), ' · B ', zeigeVektor(vb)); erg.append(z, d)
    if (mitChunks && chunks.length) {
      const ol = el('ol')
      for (const t of topK(Array.from(va), chunks, 3)) { const c = chunks.find(x => x.id === t.id); ol.append(el('li', null, `${fmt(t.score, 3, lang)} · ${c.abschnitt || c.id}: ${c.text.replace(/\n/g, ' ').slice(0, 90)} …`)) }
      erg.append(zwei(el('h3'), L.naechste, ctx), ol)
    }
  }
  const zeigeKatalog = () => {
    const a = fragen.find(q => q.id === sa.value) || fragen[0], b = fragen.find(q => q.id === sb.value) || fragen[1]
    if (!a || !b) return
    ta.value = a.frage; tb.value = b.frage
    zeige(cb.checked ? a.vMit : a.vOhne, cb.checked ? b.vMit : b.vOhne, false)
  }
  Promise.all([ctx.daten('fragen.json'), ctx.daten('chunks.json')]).then(([f, c]) => {
    fragen = f.fragen; chunks = c.chunks
    for (const s of [sa, sb]) for (const q of fragen) { const o = el('option', null, q.frage); o.value = q.id; s.append(o) }
    sa.value = p.katalogA || 'kein-abpumpen'; sb.value = p.katalogB || 'pumpe-blockiert'
    k.status(L.vorberechnet, 'vorberechnet'); zeigeKatalog()
  })
  sa.addEventListener('change', zeigeKatalog); sb.addEventListener('change', zeigeKatalog)
  cb.addEventListener('change', () => { if (!live) zeigeKatalog() })
  btn.addEventListener('click', async () => {
    if (!live) { zeigeKatalog(); return }
    erg.textContent = txt(L.rechnet, ctx.lang())
    const pa = cb.checked ? 'query: ' : '', pb = cb.checked ? 'passage: ' : ''
    const [va, vb] = await Promise.all([ctx.modell.embed(ta.value, { praefix: pa }), ctx.modell.embed(tb.value, { praefix: pb })])
    zeige(va, vb, cb.checked)
  })
  ladeKnopf(wrap, ctx, 'modell', () => { live = true; katalog.hidden = true; ta.readOnly = tb.readOnly = false; ta.value = p.a || 'Laugenpumpe verstopft'; tb.value = p.b || 'Die Pumpe ist blockiert'; k.status(L.live, 'live'); erg.replaceChildren() })
}
