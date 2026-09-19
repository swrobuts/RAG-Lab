/** Metrik-Rechner: zehn Evaluationsfragen, Raenge je Variante, vier Werte selbst berechnen. */
import { el, txt, zwei, kopf, fmt } from './gemein.js'
import { bewerteTreffer, metriken } from '../pruefung.js'
const L = {
  titel: { de: 'Metrik-Rechner: zehn Fragen, fünf Kandidaten', en: 'Metric calculator: ten questions, five candidates' }, variante: { de: 'Variante', en: 'Variant' },
  vektor: { de: 'Vektor allein', en: 'Vector only' }, hybrid: { de: 'Hybrid ohne Reranker', en: 'Hybrid without reranker' }, rerank: { de: 'Hybrid mit Reranker', en: 'Hybrid with reranker' },
  frage: { de: 'Frage', en: 'Question' }, rang: { de: 'Rang des 1. Treffers', en: 'Rank of 1st hit' }, gef: { de: 'gefunden / erwartet', en: 'found / expected' }, worte: { de: 'gefundene Stichwörter', en: 'keywords found' },
  hit5: { de: 'Trefferquote Hit@5', en: 'Hit rate hit@5' }, hit1: { de: 'Hit@1', en: 'Hit@1' }, mrr: { de: 'MRR', en: 'MRR' }, abd: { de: 'Abdeckung', en: 'Coverage' },
  pruefen: { de: 'Prüfen', en: 'Check' }, aufdecken: { de: 'Aufdecken', en: 'Reveal' },
  richtig: { de: 'Alle vier Werte stimmen.', en: 'All four values are correct.' }, falsch: { de: 'Noch nicht: {n} Wert(e) weichen ab (Toleranz ±0,01).', en: 'Not yet: {n} value(s) differ (tolerance ±0.01).' },
  kein: { de: '–', en: '–' }, hinweis: { de: 'Werte als Dezimalzahl (0,8) oder Prozent (80 %) eingeben.', en: 'Enter values as decimals (0.8) or percent (80 %).' },
  status: { de: 'aus fragen.json: die fünf Kandidaten vor Kontextfilter, wie im Protokoll des Fallbeispiels', en: 'from fragen.json: the five candidates before the context filter, as in the case study protocol' }
}
export function baue (wrap, p, ctx) {
  const k = kopf(wrap, L.titel, ctx)
  const sel = el('select'); zwei(sel, L.variante, ctx, 'aria-label')
  for (const v of ['vektor', 'hybrid', 'rerank']) { const o = el('option'); o.value = v; zwei(o, L[v], ctx); sel.append(o) } sel.value = p.variante || 'vektor'
  const tab = el('div', 'table-scroll'); const form = el('div', 'rechnen'); const eing = {}
  for (const key of ['hit5', 'hit1', 'mrr', 'abd']) { const l = el('label', 'rechen-feld'); l.append(zwei(el('span'), L[key], ctx)); const i = el('input'); i.type = 'text'; i.inputMode = 'decimal'; i.autocomplete = 'off'; l.append(i, el('span', 'einheit', '')); form.append(l); eing[key] = i }
  const bp = zwei(el('button', 'btn-sm primary'), L.pruefen, ctx); const ba = zwei(el('button', 'btn-sm'), L.aufdecken, ctx); bp.type = ba.type = 'button'
  const akt = el('div', 'zeile'); akt.append(bp, ba); const meld = el('p'); wrap.append(sel, tab, zwei(el('p', 'line-hilfe'), L.hinweis, ctx), form, akt, meld)
  let F, C, ist
  const zeige = () => {
    const lang = ctx.lang()
    const faelle = F.filter(q => q.art === 'eval').map(q => { const l = q[sel.value].slice(0, 5); return { q, b: bewerteTreffer(l.map(t => C.find(c => c.id === t.chunk).text), q.erwartet) } })
    ist = metriken(faelle.map(f => f.b))
    const t = el('table'); const th = el('thead'); const tr0 = el('tr'); for (const key of ['frage', 'rang', 'gef', 'worte']) tr0.append(el('th', null, txt(L[key], lang))); th.append(tr0); t.append(th)
    const tb = el('tbody')
    for (const f of faelle) { const tr = el('tr'); tr.append(el('td', null, f.q.frage), el('td', null, f.b.ersterRang == null ? txt(L.kein, lang) : String(f.b.ersterRang)), el('td', null, `${f.b.gefunden} / ${f.b.erwartet}`), el('td', null, f.b.stichworte.join(', '))); tb.append(tr) }
    t.append(tb); tab.replaceChildren(t); meld.textContent = ''; meld.className = ''
    for (const i of Object.values(eing)) { i.value = ''; i.className = '' }
  }
  Promise.all([ctx.daten('fragen.json'), ctx.daten('chunks.json')]).then(([f, c]) => { F = f.fragen; C = c.chunks; k.status(L.status, 'vorberechnet'); zeige() })
  sel.addEventListener('change', zeige); document.addEventListener('rag:sprache', () => F && zeige())
  const soll = () => ({ hit5: ist.trefferquote, hit1: ist.hitAt1, mrr: ist.mrr, abd: ist.abdeckung })
  const zahl = (s) => { const roh = String(s).trim(); const v = parseFloat(roh.replace(',', '.').replace('%', '')); return roh.includes('%') || v > 1.0001 ? v / 100 : v }
  bp.addEventListener('click', () => {
    const s = soll(); let n = 0
    for (const [key, i] of Object.entries(eing)) { const ok = Math.abs(zahl(i.value) - s[key]) <= 0.01; i.className = ok ? 'richtig' : 'falsch'; if (!ok) n++ }
    meld.textContent = n ? txt(L.falsch, ctx.lang()).replace('{n}', n) : txt(L.richtig, ctx.lang()); meld.className = n ? 'warn-box' : 'challenge-box'
    wrap.dispatchEvent(new CustomEvent('rag:werkzeug', { bubbles: true, detail: { werkzeug: 'metrik', variante: sel.value, ok: !n } }))
  })
  ba.addEventListener('click', () => { const s = soll(); for (const [key, i] of Object.entries(eing)) { i.value = fmt(s[key], 3, ctx.lang()); i.className = '' } })
}
