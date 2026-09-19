/** Gemeinsame Helfer der lebenden Stuecke. */
export const el = (tag, klasse, text) => { const n = document.createElement(tag); if (klasse) n.className = klasse; if (text != null) n.textContent = text; return n }
export const txt = (o, lang) => (o == null ? '' : typeof o === 'string' ? o : (o[lang] ?? o.de ?? ''))
/** Setzt Text (oder ein Attribut) zweisprachig und haelt ihn beim Sprachwechsel aktuell. */
export function zwei (node, o, ctx, attr) {
  const setze = () => { const t = txt(o, ctx.lang()); if (attr) node.setAttribute(attr, t); else node.textContent = t }
  setze(); document.addEventListener('rag:sprache', setze); return node
}
export const fmt = (n, stellen = 2, lang = 'de') => Number(n).toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB', { minimumFractionDigits: stellen, maximumFractionDigits: stellen })
export const ganz = (n, lang = 'de') => Number(n).toLocaleString(lang === 'de' ? 'de-DE' : 'en-GB')
export const prozent = (x, lang = 'de', stellen = 0) => fmt(x * 100, stellen, lang) + ' %'
/** Kopfzeile eines Werkzeugs mit Titel und Statuszeile; art: 'live' | 'vorberechnet' | '' */
export function kopf (wrap, titel, ctx) {
  const k = el('div', 'werkzeug-kopf'); const t = zwei(el('span', 'titel'), titel, ctx); const s = el('span', 'werkzeug-status'); k.append(t, s); wrap.append(k)
  let aktuell = null
  const setze = () => { if (aktuell) { s.className = 'werkzeug-status ' + aktuell.art; s.textContent = txt(aktuell.o, ctx.lang()) } }
  document.addEventListener('rag:sprache', setze)
  return { status: (o, art = '') => { aktuell = { o, art }; setze() } }
}
const L = {
  tokenizerLaden: { de: 'Tokenizer laden (17 MB)', en: 'Load tokenizer (17 MB)' },
  modellLaden: { de: 'Modell laden (118 MB, einmalig)', en: 'Load model (118 MB, once)' },
  fehler: { de: 'Laden fehlgeschlagen. Der Hugging-Face-Hub ist nicht erreichbar; das Werkzeug arbeitet mit den vorberechneten Daten weiter.', en: 'Loading failed. The Hugging Face Hub is unreachable; the tool continues with precomputed data.' },
  hinweis: { de: 'Die Dateien kommen vom Hugging-Face-Hub und bleiben danach im Cache Ihres Browsers.', en: 'The files come from the Hugging Face Hub and stay in your browser cache afterwards.' },
  laedt: { de: 'Lädt', en: 'Loading' }
}
/** Ladeknopf mit Fortschrittsbalken; was = 'tokenizer' | 'modell'. Ruft beiBereit() sofort, wenn schon geladen. */
export function ladeKnopf (wrap, ctx, was, beiBereit) {
  const M = ctx.modell; const zeile = el('div', 'lade-zeile')
  const b = zwei(el('button', 'btn-sm primary'), was === 'modell' ? L.modellLaden : L.tokenizerLaden, ctx); b.type = 'button'
  const balken = el('div', 'balken'); const i = el('i'); balken.append(i); balken.hidden = true
  const stand = el('span', 'line-hilfe'); stand.hidden = true
  const info = zwei(el('span', 'line-hilfe'), L.hinweis, ctx); zeile.append(b, balken, stand, info); wrap.append(zeile)
  let gemeldet = false
  const zeichne = (z) => {
    const st = z[was]
    b.hidden = st === 'bereit' || st === 'laedt'; balken.hidden = st !== 'laedt'; stand.hidden = st !== 'laedt'
    if (st === 'laedt' && z.fortschritt) { i.style.width = z.fortschritt.prozent + '%'; stand.textContent = `${txt(L.laedt, ctx.lang())} ${z.fortschritt.datei || ''} · ${z.fortschritt.prozent} %` }
    if (st === 'fehler') { info.className = 'line-hilfe warn'; info.textContent = txt(L.fehler, ctx.lang()) }
    if (st === 'bereit') { zeile.hidden = true; if (!gemeldet) { gemeldet = true; beiBereit() } }
  }
  zeichne(M.zustand()); M.beiAenderung(zeichne)
  b.addEventListener('click', () => (was === 'modell' ? M.ladeModell() : M.ladeTokenizer()).catch(() => {}))
}
