/** Such-Stepper: Frage → Vektor Top-12 → Fehlercode-Zuschlag → Reranker (vorberechnet) → Schwelle → Kontext → gedeckt? */
import { el, txt, zwei, kopf, ladeKnopf, fmt } from './gemein.js'
import { topK, hybridKandidaten, waehleKontext, istGedeckt, fehlercodes } from '../pruefung.js'
const L = {
  titel: { de: 'Such-Stepper: von der Frage zum Kontext', en: 'Search stepper: from question to context' },
  frage: { de: 'Eigene Frage', en: 'Your own question' }, katalog: { de: 'Katalogfrage', en: 'Catalogue question' }, suchen: { de: 'Suchen', en: 'Search' },
  s1: { de: '1 · Vektorsuche, Top 12 (Kosinus)', en: '1 · Vector search, top 12 (cosine)' },
  s2: { de: '2 · Fehlercode-Zuschlag (Hybrid)', en: '2 · Error-code boost (hybrid)' },
  s3: { de: '3 · Reranker (Cross-Encoder), Top 5', en: '3 · Reranker (cross-encoder), top 5' },
  s4: { de: '4 · Schwelle und Verhältnis → Kontext', en: '4 · Threshold and ratio → context' },
  s5: { de: '5 · Gedeckt?', en: '5 · Grounded?' },
  schwelle: { de: 'Schwelle (GUARDRAIL_MIN_SCORE)', en: 'Threshold (GUARDRAIL_MIN_SCORE)' }, verhaeltnis: { de: 'Verhältnis (CONTEXT_SCORE_RATIO)', en: 'Ratio (CONTEXT_SCORE_RATIO)' },
  exakt: { de: 'exakter Code', en: 'exact code' },
  ja: { de: 'Ja: Der Kontext geht mit der Frage an das Sprachmodell.', en: 'Yes: the context goes to the language model together with the question.' },
  nein: { de: 'Nein: „Dazu finde ich in dieser Bedienungsanleitung leider keine Information.“ Kein Modellaufruf.', en: 'No: “I cannot find that in this manual.” No model call.' },
  neinCode: { de: 'Nein: Der gefragte Fehlercode kommt im Kontext nicht vor; ein ähnlicher Code darf seine Bedeutung nicht ausleihen.', en: 'No: the requested error code does not occur in the context; a similar code must not lend its meaning.' },
  keinRerank: { de: 'Für eigene Fragen liegt kein Reranker-Score vor (das Modell hat 279 MB und läuft nicht im Browser). Stufe 3 zeigt deshalb die Hybrid-Reihenfolge mit den Kosinuswerten; für Katalogfragen sind die Reranker-Scores vorberechnet.', en: 'No reranker score exists for your own questions (the model has 279 MB and does not run in the browser). Stage 3 therefore shows the hybrid order with cosine values; for catalogue questions the reranker scores are precomputed.' },
  live: { de: 'Live: Vektor- und Hybridstufe im Browser', en: 'Live: vector and hybrid stages in the browser' },
  vorberechnet: { de: 'Katalogfragen, alle Stufen vorberechnet (Reranker: bge-reranker-v2-m3)', en: 'Catalogue questions, all stages precomputed (reranker: bge-reranker-v2-m3)' },
  codes: { de: 'erkannte Fehlercodes', en: 'error codes found' }, keine: { de: 'keine', en: 'none' }, leer: { de: 'kein Kandidat über dem Boden', en: 'no candidate above the floor' },
  boden: { de: 'Boden', en: 'floor' }
}
/** Chunktext ohne die Ueberschriftzeile (steht schon als Abschnitt davor), einzeilig gekuerzt. */
const schnipsel = (t) => t.split('\n').filter(z => !z.trim().startsWith('#')).join(' ').replace(/\s+/g, ' ').trim().slice(0, 110)
export function baue (wrap, p, ctx) {
  const k = kopf(wrap, L.titel, ctx)
  const zeile = el('div', 'zeile'); const sel = el('select'); zwei(sel, L.katalog, ctx, 'aria-label')
  const inp = el('input'); inp.type = 'text'; inp.hidden = true; zwei(inp, L.frage, ctx, 'aria-label')
  const btn = zwei(el('button', 'btn-sm primary'), L.suchen, ctx); btn.type = 'button'; zeile.append(sel, inp, btn)
  const regler = el('div', 'regler')
  const rs = el('input'); rs.type = 'range'; rs.min = 0; rs.max = 1; rs.step = 0.005; rs.value = p.schwelle ?? 0.15
  const rv = el('input'); rv.type = 'range'; rv.min = 0; rv.max = 1; rv.step = 0.05; rv.value = p.verhaeltnis ?? 0.5
  const ls = el('label'); const os = el('output'); ls.append(zwei(el('span'), L.schwelle, ctx), os, rs)
  const lv = el('label'); const ov = el('output'); lv.append(zwei(el('span'), L.verhaeltnis, ctx), ov, rv); regler.append(ls, lv)
  const stufen = el('div', 'stufen'); wrap.append(zeile, regler, stufen)
  let fragen = [], chunks = [], aktuell = null, live = false
  const text = (id) => chunks.find(c => c.id === id).text
  const liste = (titel, eintraege, hervor = new Set(), leer = null) => {
    const box = el('div', 'stufe'); box.append(zwei(el('h4'), titel, ctx)); const ol = el('ol')
    for (const e of eintraege) {
      const c = chunks.find(x => x.id === e.id); const li = el('li'); if (hervor.has(e.id)) li.className = 'im-kontext'
      li.append(el('span', 'score', e.score == null ? '' : fmt(e.score, 4, ctx.lang())))
      li.append(e.exakt ? zwei(el('span', 'badge'), L.exakt, ctx) : el('span'))
      li.append(el('span', 'chunk-id', c.id), el('span', 'snippet', `${c.abschnitt ? c.abschnitt + ' · ' : ''}${schnipsel(c.text)}`))
      ol.append(li)
    }
    if (!eintraege.length && leer) ol.append(el('li', null, txt(leer, ctx.lang())))
    box.append(ol); return box
  }
  const zeige = () => {
    if (!aktuell) return
    const lang = ctx.lang(); const { frage, vektor, hybrid, rerank } = aktuell
    os.value = fmt(+rs.value, 3, lang); ov.value = fmt(+rv.value, 2, lang)
    const kontext = waehleKontext(rerank, { schwelle: +rs.value, verhaeltnis: +rv.value })
    const im = new Set(kontext.map(x => x.id)); const gedeckt = istGedeckt(frage, kontext, text, { schwelle: +rs.value })
    const codes = [...fehlercodes(frage)].filter(c => c.includes(':'))
    const best = rerank.length ? rerank[0].score : 0; const boden = Math.max(+rs.value, best * +rv.value)
    stufen.replaceChildren(liste(L.s1, vektor),
      el('p', 'line-hilfe', `${txt(L.codes, lang)}: ${codes.length ? codes.join(', ') : txt(L.keine, lang)}`),
      liste(L.s2, hybrid), liste(L.s3, rerank.slice(0, 5), im))
    if (aktuell.ohneRerank) stufen.append(zwei(el('p', 'warn-box'), L.keinRerank, ctx))
    const s4 = liste(L.s4, kontext, im, L.leer); s4.querySelector('h4').append(el('span', 'line-hilfe', ` · ${txt(L.boden, lang)} = max(${fmt(+rs.value, 3, lang)}; ${fmt(+rv.value, 2, lang)} × ${fmt(best, 4, lang)}) = ${fmt(boden, 4, lang)}`)); stufen.append(s4)
    const ohneCode = codes.length && kontext.length && kontext[0].score >= +rs.value && !gedeckt
    const g = el('div', gedeckt ? 'challenge-box' : 'warn-box'); g.append(zwei(el('h4'), L.s5, ctx), zwei(el('p'), gedeckt ? L.ja : (ohneCode ? L.neinCode : L.nein), ctx)); stufen.append(g)
  }
  rs.addEventListener('input', zeige); rv.addEventListener('input', zeige); document.addEventListener('rag:sprache', zeige)
  const katalog = () => {
    const f = fragen.find(q => q.id === sel.value); if (!f) return
    aktuell = { frage: f.frage, vektor: f.vektor.map(t => ({ id: t.chunk, score: t.score })),
      hybrid: f.hybrid.map(t => ({ id: t.chunk, score: t.score, exakt: t.exakt })),
      rerank: f.rerank.map(t => ({ id: t.chunk, score: t.score, exakt: t.exakt })), ohneRerank: false }
    inp.value = f.frage; zeige()
  }
  Promise.all([ctx.daten('fragen.json'), ctx.daten('chunks.json')]).then(([f, c]) => {
    fragen = f.fragen; chunks = c.chunks
    for (const q of fragen) { const o = el('option', null, q.frage); o.value = q.id; sel.append(o) }
    if (p.frage) sel.value = p.frage
    k.status(L.vorberechnet, 'vorberechnet'); katalog()
  })
  sel.addEventListener('change', katalog)
  btn.addEventListener('click', async () => {
    if (!live) { katalog(); return }
    const frage = inp.value.trim(); if (!frage) return
    const treffer = fragen.find(q => q.frage.trim().toLowerCase() === frage.toLowerCase())
    if (treffer) { sel.value = treffer.id; katalog(); return }
    btn.disabled = true
    try {
      const v = Array.from(await ctx.modell.embed(frage)); const vektor = topK(v, chunks, 12); const hybrid = hybridKandidaten(vektor, chunks, frage)
      aktuell = { frage, vektor, hybrid, rerank: hybrid, ohneRerank: true }; zeige()
    } finally { btn.disabled = false }
  })
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click() })
  ladeKnopf(wrap, ctx, 'modell', () => { live = true; inp.hidden = false; k.status(L.live, 'live') })
}
