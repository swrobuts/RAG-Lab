/** Kontextfenster-Fuellstand aus Systemprompt, Frage, k Chunks und Antwortbudget. */
import { el, txt, zwei, kopf, ganz } from './gemein.js'
const L = {
  titel: { de: 'Kontextfenster-Füllstand', en: 'Context window fill level' }, fenster: { de: 'Kontextfenster (Tokens)', en: 'Context window (tokens)' },
  k: { de: 'Chunks im Kontext (FINAL_K)', en: 'Chunks in context (FINAL_K)' }, antwort: { de: 'Antwortbudget (ANSWER_MAX_TOKENS)', en: 'Answer budget (ANSWER_MAX_TOKENS)' },
  teile: { system: { de: 'Systemprompt', en: 'System prompt' }, frage: { de: 'Frage', en: 'Question' }, chunks: { de: 'Handbuchauszüge', en: 'Manual excerpts' }, antwort: { de: 'Antwort', en: 'Answer' }, frei: { de: 'frei', en: 'free' } },
  ueber: { de: 'Das passt nicht: {n} Tokens zu viel. Das Modell bricht ab oder verwirft den Anfang.', en: 'This does not fit: {n} tokens too many. The model stops or drops the beginning.' },
  hinweis: { de: 'Tokenzahlen mit dem e5-Tokenizer gemessen (tokens.json): Systemprompt {s} Tokens, Chunk im Mittel {m} Tokens. Chatmodelle zählen etwas anders; die Größenordnung bleibt.', en: 'Token counts measured with the e5 tokenizer (tokens.json): system prompt {s} tokens, chunk on average {m} tokens. Chat models count slightly differently; the order of magnitude stays.' }
}
const FENSTER = [2048, 4096, 8192, 32768, 131072]
export function baue (wrap, p, ctx) {
  const k = kopf(wrap, L.titel, ctx)
  const f = el('select'); for (const n of FENSTER) { const o = el('option', null, n.toLocaleString('de-DE')); o.value = n; f.append(o) } f.value = p.fenster || 8192
  const rk = el('input'); rk.type = 'range'; rk.min = 1; rk.max = 12; rk.value = p.k || 5
  const ra = el('input'); ra.type = 'range'; ra.min = 128; ra.max = 4096; ra.step = 128; ra.value = p.antwort || 1024
  const lf = el('label'); lf.append(zwei(el('span'), L.fenster, ctx), f)
  const lk = el('label'); const ok = el('output'); lk.append(zwei(el('span'), L.k, ctx), ' ', ok, rk)
  const la = el('label'); const oa = el('output'); la.append(zwei(el('span'), L.antwort, ctx), ' ', oa, ra)
  const regler = el('div', 'regler'); regler.append(lf, lk, la)
  const balken = el('div', 'fuellstand'); const legende = el('div', 'legende'); const meld = el('p', 'line-hilfe')
  wrap.append(regler, balken, legende, meld)
  let z
  const zeige = () => {
    const lang = ctx.lang(); const fenster = +f.value, kk = +rk.value, ant = +ra.value; ok.value = kk; oa.value = ganz(ant, lang)
    const mittel = z.mittelChunkTokens
    const teile = [['system', z.systemprompt, '#2E2418'], ['frage', 14, '#9E4A1C'], ['chunks', Math.round(kk * mittel), '#C4602A'], ['antwort', ant, '#6B6A1C']]
    const summe = teile.reduce((s, t) => s + t[1], 0); balken.replaceChildren(); legende.replaceChildren()
    for (const [name, n, farbe] of teile) {
      const seg = el('i'); seg.style.width = Math.min(100, n / fenster * 100) + '%'; seg.style.background = farbe; seg.title = `${txt(L.teile[name], lang)} ${ganz(n, lang)}`; balken.append(seg)
      const l = el('span'); l.style.color = farbe; l.textContent = `■ ${txt(L.teile[name], lang)} ${ganz(n, lang)}`; legende.append(l)
    }
    const frei = fenster - summe; const l = el('span'); l.textContent = `□ ${txt(L.teile.frei, lang)} ${ganz(Math.max(0, frei), lang)}`; legende.append(l)
    if (frei < 0) { meld.textContent = txt(L.ueber, lang).replace('{n}', ganz(-frei, lang)); meld.className = 'warn-box' } else { meld.textContent = txt(L.hinweis, lang).replace('{s}', ganz(z.systemprompt, lang)).replace('{m}', String(mittel).replace('.', lang === 'de' ? ',' : '.')); meld.className = 'line-hilfe' }
  }
  ctx.daten('tokens.json').then(d => { z = d.zaehlungen; k.status({ de: 'Zählungen aus tokens.json', en: 'Counts from tokens.json' }, 'vorberechnet'); zeige() })
  for (const e of [f, rk, ra]) e.addEventListener('input', zeige); document.addEventListener('rag:sprache', () => z && zeige())
}
