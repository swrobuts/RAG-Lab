/** Schwellen-Regler: oberste Reranker-Scores der Katalogfragen auf einer logarithmischen Achse. */
import { el, txt, zwei, kopf, fmt } from './gemein.js'
const L = {
  titel: { de: 'Schwellen-Regler: 14 echte Fälle', en: 'Threshold slider: 14 real cases' }, schwelle: { de: 'Schwelle GUARDRAIL_MIN_SCORE', en: 'Threshold GUARDRAIL_MIN_SCORE' },
  ang: { de: 'Handbuchfragen angenommen', en: 'in-manual questions accepted' }, abg: { de: 'Handbuchfragen abgelehnt (falsche Ablehnung)', en: 'in-manual questions rejected (false rejection)' },
  negAbg: { de: 'Fremdfragen abgelehnt', en: 'off-topic questions rejected' }, negAng: { de: 'Fremdfragen angenommen (Halluzinationsrisiko)', en: 'off-topic questions accepted (hallucination risk)' },
  log: { de: 'Achse logarithmisch, damit die Fremdfragen (Scores um 0,0001) sichtbar bleiben. Obere Reihe: die zehn Evaluationsfragen; untere Reihe: die vier Fremdfragen. Grün = richtig behandelt, rot = falsch.', en: 'Logarithmic axis so the off-topic questions (scores around 0.0001) stay visible. Upper row: the ten evaluation questions; lower row: the four off-topic questions. Green = handled correctly, red = wrongly.' },
  beispiele: { de: 'Beispielfragen einblenden', en: 'Show example questions' }, status: { de: 'oberster Reranker-Score je Frage (vorberechnet, bge-reranker-v2-m3)', en: 'top reranker score per question (precomputed, bge-reranker-v2-m3)' }
}
const ns = (t) => document.createElementNS('http://www.w3.org/2000/svg', t)
export function baue (wrap, p, ctx) {
  const k = kopf(wrap, L.titel, ctx)
  const lab = el('label'); const r = el('input'); r.type = 'range'; r.min = -4; r.max = 0; r.step = 0.02; r.value = Math.log10(p.schwelle || 0.15); const out = el('output')
  lab.append(zwei(el('span'), L.schwelle, ctx), ' ', out, r)
  const cbl = el('label'); const cb = el('input'); cb.type = 'checkbox'; cbl.append(cb, ' ', zwei(el('span'), L.beispiele, ctx))
  const svg = ns('svg'); svg.setAttribute('viewBox', '0 0 720 280'); svg.setAttribute('class', 'karte'); svg.setAttribute('role', 'img')
  const zaehl = el('div', 'legende'); wrap.append(lab, cbl, svg, zaehl, zwei(el('p', 'line-hilfe'), L.log, ctx))
  const x = (s) => 40 + (Math.log10(Math.max(s, 1e-4)) + 4) / 4 * 650
  let F; let wert = p.schwelle ?? 0.15   // der Regler arbeitet logarithmisch; der Startwert bleibt exakt
  const zeige = () => {
    const lang = ctx.lang(); const t = wert; out.value = fmt(t, 3, lang); svg.replaceChildren()
    const achse = ns('line'); achse.setAttribute('x1', 40); achse.setAttribute('x2', 690); achse.setAttribute('y1', 140); achse.setAttribute('y2', 140); achse.setAttribute('stroke', '#5B4E3E'); svg.append(achse)
    for (const s of [0.0001, 0.001, 0.01, 0.1, 1]) { const tx = ns('text'); tx.setAttribute('x', x(s)); tx.setAttribute('y', 160); tx.setAttribute('font-size', '11'); tx.setAttribute('text-anchor', 'middle'); tx.setAttribute('fill', '#5B4E3E'); tx.textContent = String(s).replace('.', lang === 'de' ? ',' : '.'); svg.append(tx) }
    const sl = ns('line'); sl.setAttribute('x1', x(t)); sl.setAttribute('x2', x(t)); sl.setAttribute('y1', 30); sl.setAttribute('y2', 250); sl.setAttribute('stroke', '#C4602A'); sl.setAttribute('stroke-width', '2'); sl.setAttribute('stroke-dasharray', '4 3'); svg.append(sl)
    const st = ns('text'); st.setAttribute('x', x(t)); st.setAttribute('y', 22); st.setAttribute('font-size', '12'); st.setAttribute('text-anchor', 'middle'); st.setAttribute('fill', '#9E4A1C'); st.textContent = fmt(t, 3, lang); svg.append(st)
    let ang = 0, abg = 0, nAbg = 0, nAng = 0
    const faelle = F.filter(q => q.art !== 'beispiel' || cb.checked)
    for (const f of faelle) {
      const pos = f.art === 'eval'; const bsp = f.art === 'beispiel'; const s = f.obersterScore; const drin = s >= t
      if (pos) drin ? ang++ : abg++; else if (!bsp) drin ? nAng++ : nAbg++
      const c = ns('circle'); c.setAttribute('cx', x(s)); c.setAttribute('cy', pos ? 95 : bsp ? 215 : 185); c.setAttribute('r', bsp ? 5 : 7)
      c.setAttribute('fill', bsp ? '#8A8378' : pos ? (drin ? '#2F7D32' : '#B23B1E') : (drin ? '#B23B1E' : '#2F7D32'))
      const ti = ns('title'); ti.textContent = `${f.frage} · ${fmt(s, 4, lang)}${f.gedeckt ? '' : ' · ' + (lang === 'de' ? 'im Fallbeispiel abgelehnt' : 'rejected in the case study')}`; c.append(ti); svg.append(c)
      if ((pos && !drin) || (!pos && !bsp && drin)) { const l = ns('text'); l.setAttribute('x', x(s)); l.setAttribute('y', pos ? 78 : 205); l.setAttribute('font-size', '10'); l.setAttribute('text-anchor', 'middle'); l.setAttribute('fill', '#2E2418'); l.textContent = f.id; svg.append(l) }
    }
    zaehl.replaceChildren(el('span', null, `${ang} ${txt(L.ang, lang)}`), el('span', null, `${abg} ${txt(L.abg, lang)}`), el('span', null, `${nAbg} ${txt(L.negAbg, lang)}`), el('span', null, `${nAng} ${txt(L.negAng, lang)}`))
    wrap.dataset.schwelle = String(t)
  }
  ctx.daten('fragen.json').then(f => { F = f.fragen; k.status(L.status, 'vorberechnet'); zeige() })
  r.addEventListener('input', () => { wert = Math.pow(10, +r.value); zeige() }); cb.addEventListener('change', zeige); document.addEventListener('rag:sprache', () => F && zeige())
}
