/** Naechstes Token und Temperatur: Softmax ueber gespeicherte Logits, Stichprobe, aufgezeichnete Fortsetzungen. */
import { el, txt, zwei, kopf, fmt, ganz } from './gemein.js'
import { softmax } from '../pruefung.js'
const L = {
  titel: { de: 'Nächstes Token und Temperatur', en: 'Next token and temperature' }, temp: { de: 'Temperatur', en: 'Temperature' },
  prompt: { de: 'Prompt', en: 'Prompt' }, ziehen: { de: 'Stichprobe ziehen', en: 'Draw a sample' },
  rest: { de: 'Bei T = 1 liegen {p} der Wahrscheinlichkeit außerhalb dieser 20 Tokens (Softmax über alle {n} Tokens des Vokabulars).', en: 'At T = 1, {p} of the probability lies outside these 20 tokens (softmax over all {n} vocabulary tokens).' },
  fort: { de: 'Aufgezeichnete Fortsetzungen (24 Tokens)', en: 'Recorded continuations (24 tokens)' }, modell: { de: 'Modell', en: 'Model' },
  wahrsch: { de: 'Wahrscheinlichkeit innerhalb der Top 20', en: 'Probability within the top 20' }, gezogen: { de: 'gezogen', en: 'drawn' }
}
export function baue (wrap, p, ctx) {
  const k = kopf(wrap, L.titel, ctx)
  const sel = el('select'); zwei(sel, L.prompt, ctx, 'aria-label'); const promptBox = el('pre', 'code-block')
  const lab = el('label'); const r = el('input'); r.type = 'range'; r.min = 0; r.max = 2; r.step = 0.05; r.value = p.temperatur ?? 1
  const out = el('output'); lab.append(zwei(el('span'), L.temp, ctx), ' ', out, r)
  const btn = zwei(el('button', 'btn-sm'), L.ziehen, ctx); btn.type = 'button'
  const kopfz = zwei(el('h4'), L.wahrsch, ctx); const balken = el('div', 'verteilung'); const rest = el('p', 'line-hilfe'); const fort = el('div')
  wrap.append(sel, promptBox, lab, btn, kopfz, balken, rest, fort)
  let d, aktuell, gezogen = null
  const zeige = () => {
    const lang = ctx.lang(); const T = +r.value; out.value = fmt(T, 2, lang)
    const pr = softmax(aktuell.tokens.map(t => t.logit), T)
    balken.replaceChildren(...aktuell.tokens.map((t, i) => {
      const z = el('div', 'v-zeile' + (gezogen === i ? ' gezogen' : ''))
      const b = el('div', 'balken'); const f = el('i'); f.style.width = (pr[i] * 100) + '%'; b.append(f)
      z.append(el('code', null, JSON.stringify(t.token)), b, el('span', null, fmt(pr[i] * 100, 1, lang) + ' %' + (gezogen === i ? ' ← ' + txt(L.gezogen, lang) : '')))
      return z
    }))
    const m = Math.max(...aktuell.tokens.map(t => t.logit))
    const top = aktuell.tokens.reduce((s, t) => s + Math.exp(t.logit - m), 0); const alle = Math.exp(aktuell.restLogsumexp - m)
    rest.textContent = txt(L.rest, lang).replace('{p}', fmt((1 - top / alle) * 100, 1, lang) + ' %').replace('{n}', ganz(d.vokabular, lang))
    fort.replaceChildren(zwei(el('h4'), L.fort, ctx), ...Object.entries(aktuell.fortsetzungen).map(([t, s]) => {
      const q = el('p'); q.append(el('strong', null, `T = ${t.replace('.', lang === 'de' ? ',' : '.')}: `), el('span', 'line-hilfe', aktuell.prompt + ' '), el('em', null, s.trim())); return q
    }))
  }
  const wechsel = () => { aktuell = d.prompts.find(q => q.id === sel.value) || d.prompts[0]; promptBox.textContent = aktuell.prompt + ' ▁'; gezogen = null; zeige() }
  ctx.daten('logits.json').then(x => {
    d = x
    for (const q of d.prompts) { const o = el('option', null, q.prompt); o.value = q.id; sel.append(o) }
    if (p.prompt) sel.value = p.prompt
    k.status({ de: `${txt(L.modell, 'de')}: ${d.modell}, ${d.datum}`, en: `${txt(L.modell, 'en')}: ${d.modell}, ${d.datum}` }, 'vorberechnet'); wechsel()
  })
  sel.addEventListener('change', wechsel); r.addEventListener('input', () => { gezogen = null; zeige() }); document.addEventListener('rag:sprache', () => d && zeige())
  btn.addEventListener('click', () => {
    const pr = softmax(aktuell.tokens.map(t => t.logit), +r.value)
    let u = Math.random(), i = 0; while (i < pr.length - 1 && (u -= pr[i]) > 0) i++
    gezogen = i; zeige()
  })
}
