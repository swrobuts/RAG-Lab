/** Dieselbe Frage ohne und mit Handbuch: aufgezeichnete Antworten aus antworten.json. */
import { el, txt, zwei, kopf, fmt } from './gemein.js'
import { parseAntwort } from '../pruefung.js'
const L = {
  titel: { de: 'Dieselbe Frage: ohne und mit Handbuch', en: 'The same question: without and with the manual' },
  nackt: { de: 'Ohne Handbuch (nur das Modell)', en: 'Without the manual (model only)' }, rag: { de: 'Mit Handbuch (RAG)', en: 'With the manual (RAG)' },
  quellen: { de: 'Übergebene Auszüge', en: 'Excerpts passed to the model' }, tokens: { de: 'Tokens ein/aus', en: 'tokens in/out' },
  abgelehnt: { de: 'Abgelehnt vor dem Modellaufruf: kein belegter Kontext.', en: 'Rejected before the model call: no grounded context.' },
  roh: { de: 'Rohantwort anzeigen', en: 'Show raw answer' }, frage: { de: 'Frage', en: 'Question' }, sekunden: { de: 's', en: 's' },
  aufgezeichnet: { de: 'aufgezeichnet am', en: 'recorded on' }
}
export function baue (wrap, p, ctx) {
  const k = kopf(wrap, L.titel, ctx); const sel = el('select'); zwei(sel, L.frage, ctx, 'aria-label'); const grid = el('div', 'zwei-spalten'); wrap.append(sel, grid)
  let d
  const karte = (titel, e) => {
    const box = el('div', 'concept-box'); box.append(zwei(el('h4'), titel, ctx)); if (!e) return box
    const lang = ctx.lang()
    if (e.abgelehnt) { box.append(el('p', 'warn-box', txt(L.abgelehnt, lang)), el('p', null, e.antwort)) }
    else if (e.modus === 'rag') {
      const r = parseAntwort(e.antwort)
      if (r.ok) {
        box.append(el('p', null, r.summary)); if (r.intro) box.append(el('p', 'line-hilfe', r.intro))
        const ul = el('ul', 'checkliste'); for (const s of r.schritte) { const li = el('li'); const cb = el('input'); cb.type = 'checkbox'; li.append(cb, ' ', el('span', null, s.replace(/\*\*/g, ''))); ul.append(li) } box.append(ul)
      } else box.append(el('p', 'warn-box', e.antwort))
      const det = el('details'); det.append(zwei(el('summary'), L.quellen, ctx))
      for (const q of e.quellen || []) det.append(el('pre', 'code-block', (q.abschnitt ? q.abschnitt + '\n' : '') + q.text)); box.append(det)
    } else box.append(el('p', null, e.antwort))
    if (!e.abgelehnt) { const det = el('details'); det.append(zwei(el('summary'), L.roh, ctx), el('pre', 'code-block', e.antwort)); box.append(det) }
    if (e.usage) box.append(el('p', 'line-hilfe', `${e.modell} · ${txt(L.tokens, lang)} ${e.usage.ein}/${e.usage.aus} · ${fmt(e.sekunden, 1, lang)} ${txt(L.sekunden, lang)}`))
    else box.append(el('p', 'line-hilfe', `${fmt(e.sekunden, 1, lang)} ${txt(L.sekunden, lang)}`))
    return box
  }
  const zeige = () => { const key = sel.value; grid.replaceChildren(karte(L.nackt, d.eintraege.find(e => e.id === key + '-nackt')), karte(L.rag, d.eintraege.find(e => e.id === key + '-rag'))) }
  ctx.daten('antworten.json').then(x => {
    d = x
    const keys = [...new Set(d.eintraege.map(e => e.id.replace(/-(nackt|rag)$/, '')))]
    for (const key of keys) { const o = el('option', null, d.eintraege.find(e => e.id === key + '-nackt').frage); o.value = key; sel.append(o) }
    if (p.frage) sel.value = p.frage
    k.status({ de: `${txt(L.aufgezeichnet, 'de')} ${d.datum} · LM Studio`, en: `${txt(L.aufgezeichnet, 'en')} ${d.datum} · LM Studio` }, 'vorberechnet'); zeige()
  })
  sel.addEventListener('change', zeige); document.addEventListener('rag:sprache', () => d && zeige())
}
