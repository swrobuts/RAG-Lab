/** Vektorraum-Karte: PCA-Projektion der 346 Chunks, Katalogfragen und (mit Modell) eigene Fragen. */
import { el, txt, zwei, kopf, ladeKnopf, fmt } from './gemein.js'
import { projiziere, topK } from '../pruefung.js'
const L = {
  titel: { de: 'Vektorraum-Karte der 346 Chunks (PCA)', en: 'Vector-space map of the 346 chunks (PCA)' },
  frage: { de: 'Eigene Frage', en: 'Your own question' }, projizieren: { de: 'Projizieren', en: 'Project' },
  andere: { de: 'übrige Abschnitte', en: 'other sections' }, varianz: { de: 'erklärte Varianz', en: 'explained variance' },
  live: { de: 'Live: eigene Frage', en: 'Live: your own question' }, vorberechnet: { de: 'Katalogfragen', en: 'Catalogue questions' },
  stern: { de: '★ Frage, Linien zu den fünf nächsten Chunks', en: '★ question, lines to the five closest chunks' },
  katalog: { de: 'Katalogfrage', en: 'Catalogue question' }
}
const FARBEN = ['#C4602A', '#2E2418', '#6B6A1C', '#4A6B8A', '#7A4E7A']
const ns = (t) => document.createElementNS('http://www.w3.org/2000/svg', t)
export function baue (wrap, p, ctx) {
  const k = kopf(wrap, L.titel, ctx)
  const zeile = el('div', 'zeile'); const sel = el('select'); zwei(sel, L.katalog, ctx, 'aria-label')
  const ta = el('input'); ta.type = 'text'; zwei(ta, L.frage, ctx, 'aria-label'); ta.hidden = true
  const btn = zwei(el('button', 'btn-sm primary'), L.projizieren, ctx); btn.type = 'button'; zeile.append(sel, ta, btn)
  const svg = ns('svg'); svg.setAttribute('viewBox', '0 0 720 460'); svg.setAttribute('class', 'karte'); svg.setAttribute('role', 'img')
  const legende = el('div', 'legende'); const tip = el('div', 'tip-box'); tip.hidden = true
  wrap.append(zeile, svg, legende, tip)
  let pr, chunks, fragen, skala, stern = null, linien = []
  const zeichnePunkt = (v, label) => {
    for (const l of linien) l.remove(); linien = []; if (stern) stern.remove()
    const vv = Array.from(v); const [x, y] = skala(projiziere(vv, pr))
    for (const t of topK(vv, chunks, 5)) {
      const q = pr.punkte.find(z => z.id === t.id); const [tx, ty] = skala([q.x, q.y])
      const l = ns('line'); l.setAttribute('x1', x); l.setAttribute('y1', y); l.setAttribute('x2', tx); l.setAttribute('y2', ty)
      l.setAttribute('stroke', '#C4602A'); l.setAttribute('stroke-width', '1.5'); svg.append(l); linien.push(l)
    }
    stern = ns('text'); stern.setAttribute('x', x); stern.setAttribute('y', y + 7); stern.setAttribute('font-size', '24'); stern.setAttribute('text-anchor', 'middle'); stern.setAttribute('fill', '#2E2418'); stern.textContent = '★'
    const t = ns('title'); t.textContent = label; stern.append(t); svg.append(stern)
    tip.hidden = false; tip.textContent = `${txt(L.stern, ctx.lang())}: ${label}`
  }
  const zeichneFrage = () => { const f = fragen.find(q => q.id === sel.value); if (f) zeichnePunkt(f.vMit, f.frage) }
  Promise.all([ctx.daten('projektion.json'), ctx.daten('chunks.json'), ctx.daten('fragen.json')]).then(([a, b, c]) => {
    pr = a; chunks = b.chunks; fragen = c.fragen
    const xs = pr.punkte.map(q => q.x), ys = pr.punkte.map(q => q.y)
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
    skala = ([x, y]) => [30 + (x - x0) / (x1 - x0) * 660, 430 - (y - y0) / (y1 - y0) * 400]
    const zaehl = new Map(); for (const ch of chunks) zaehl.set(ch.abschnitt, (zaehl.get(ch.abschnitt) || 0) + 1)
    const top = [...zaehl.entries()].filter(e => e[0]).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0])
    const farbe = (ch) => (top.includes(ch.abschnitt) ? FARBEN[top.indexOf(ch.abschnitt)] : '#C9C3B4')
    for (const q of pr.punkte) {
      const ch = chunks.find(x => x.id === q.id); const [x, y] = skala([q.x, q.y])
      const dot = ns('circle'); dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('r', 4.5); dot.setAttribute('fill', farbe(ch)); dot.setAttribute('opacity', '0.85')
      const t = ns('title'); t.textContent = `${ch.id} · ${ch.abschnitt || '—'}`; dot.append(t)
      dot.addEventListener('mouseenter', () => { tip.hidden = false; tip.textContent = `${ch.id} · ${ch.abschnitt || '—'}: ${ch.text.replace(/\n/g, ' ').slice(0, 180)}` })
      svg.append(dot)
    }
    const zeichneLegende = () => {
      legende.replaceChildren(...top.map((t, i) => { const s = el('span'); s.style.color = FARBEN[i]; s.textContent = '● ' + t; return s }))
      const o = el('span'); o.style.color = '#8A8378'; o.textContent = '● ' + txt(L.andere, ctx.lang()); legende.append(o)
      legende.append(el('span', 'line-hilfe', `${txt(L.varianz, ctx.lang())}: ${fmt(pr.varianz[0] * 100, 1, ctx.lang())} % + ${fmt(pr.varianz[1] * 100, 1, ctx.lang())} %`))
    }
    zeichneLegende(); document.addEventListener('rag:sprache', zeichneLegende)
    for (const f of fragen) { const o = el('option', null, f.frage); o.value = f.id; sel.append(o) }
    if (p.frage) sel.value = p.frage
    k.status(L.vorberechnet, 'vorberechnet'); zeichneFrage()
  })
  sel.addEventListener('change', zeichneFrage)
  let live = false
  btn.addEventListener('click', async () => { if (!live) { zeichneFrage(); return } if (ta.value.trim()) zeichnePunkt(await ctx.modell.embed(ta.value.trim()), ta.value.trim()) })
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click() })
  ladeKnopf(wrap, ctx, 'modell', () => { live = true; sel.hidden = true; ta.hidden = false; ta.value = ta.value || 'Wasser läuft aus'; k.status(L.live, 'live') })
}
