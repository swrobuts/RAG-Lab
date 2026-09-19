/** Tokenizer: Beispiele aus tokens.json, nach dem Laden live mit dem e5-Tokenizer. */
import { el, txt, zwei, kopf, ladeKnopf, fmt } from './gemein.js'
const L = {
  titel: { de: 'Tokenizer', en: 'Tokenizer' },
  vorberechnet: { de: 'Vorberechnete Beispiele', en: 'Precomputed examples' }, live: { de: 'Live im Browser', en: 'Live in the browser' },
  anzahl: { de: 'Tokens', en: 'tokens' }, zeichen: { de: 'Zeichen', en: 'characters' }, ids: { de: 'IDs anzeigen', en: 'Show IDs' },
  eingabe: { de: 'Eigener Text (nach dem Laden des Tokenizers)', en: 'Your own text (after loading the tokenizer)' },
  beispiel: { de: 'Beispieltext', en: 'Example text' }, jeToken: { de: 'Zeichen je Token', en: 'characters per token' }
}
export function baue (wrap, p, ctx) {
  const k = kopf(wrap, L.titel, ctx)
  const zeile = el('div', 'zeile'); const auswahl = el('select'); zwei(auswahl, L.beispiel, ctx, 'aria-label')
  const ta = el('textarea'); ta.rows = 2; ta.value = p.text || 'Was bedeutet E:18?'; zwei(ta, L.eingabe, ctx, 'aria-label'); ta.readOnly = true
  zeile.append(auswahl, ta)
  const idsBox = el('label'); const idsCb = el('input'); idsCb.type = 'checkbox'; idsBox.append(idsCb, ' ', zwei(el('span'), L.ids, ctx))
  const ausgabe = el('div', 'tokens'); const zaehl = el('div', 'line-hilfe')
  wrap.append(zeile, idsBox, ausgabe, zaehl)
  let beispiele = {}; let live = false
  const zeige = (tokens, ids, text) => {
    ausgabe.replaceChildren(...tokens.map((t, i) => el('span', null, (idsCb.checked ? ids[i] + ' ' : '') + String(t).replace(/^▁/, '␣'))))
    const lang = ctx.lang()
    zaehl.textContent = `${tokens.length} ${txt(L.anzahl, lang)} · ${text.length} ${txt(L.zeichen, lang)} · ${fmt(text.length / Math.max(1, tokens.length), 1, lang)} ${txt(L.jeToken, lang)}`
  }
  const aktualisiere = () => {
    if (live) { const t = ta.value; if (!t.trim()) { ausgabe.replaceChildren(); zaehl.textContent = ''; return } const r = ctx.modell.tokenisiere(t); zeige(r.tokens, r.ids, t); return }
    const b = beispiele[auswahl.value]; if (b) { ta.value = b.text; zeige(b.tokens, b.ids, b.text) }
  }
  ctx.daten('tokens.json').then(d => {
    beispiele = d.beispiele
    for (const [key, b] of Object.entries(beispiele)) { const o = el('option', null, b.text); o.value = key; auswahl.append(o) }
    if (p.beispiel && beispiele[p.beispiel]) auswahl.value = p.beispiel
    k.status(L.vorberechnet, 'vorberechnet'); aktualisiere()
  })
  auswahl.addEventListener('change', aktualisiere); idsCb.addEventListener('change', aktualisiere)
  document.addEventListener('rag:sprache', aktualisiere)
  ta.addEventListener('input', () => { if (live) aktualisiere() })
  ladeKnopf(wrap, ctx, 'tokenizer', () => { live = true; ta.readOnly = false; auswahl.hidden = true; k.status(L.live, 'live'); aktualisiere() })
}
