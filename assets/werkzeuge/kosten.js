/** Kostenrechner: Cloud je Token gegen lokale Anschaffung und Strom; alle Werte editierbar. */
import { el, txt, zwei, kopf, fmt } from './gemein.js'
const L = {
  titel: { de: 'Kostenrechner: Cloud gegen lokal', en: 'Cost calculator: cloud versus local' },
  ein: { de: 'Tokens Eingabe je Anfrage', en: 'Input tokens per request' }, aus: { de: 'Tokens Ausgabe je Anfrage', en: 'Output tokens per request' }, tag: { de: 'Anfragen je Tag', en: 'Requests per day' },
  pEin: { de: 'Preis Eingabe (USD je 1 Mio. Tokens)', en: 'Input price (USD per 1M tokens)' }, pAus: { de: 'Preis Ausgabe (USD je 1 Mio. Tokens)', en: 'Output price (USD per 1M tokens)' },
  hw: { de: 'Lokaler Rechner (USD, Anschaffung)', en: 'Local machine (USD, purchase)' }, monate: { de: 'Nutzungsdauer (Monate)', en: 'Useful life (months)' }, strom: { de: 'Strom je Monat (USD)', en: 'Electricity per month (USD)' },
  cloud: { de: 'Cloud je Monat (30 Tage)', en: 'Cloud per month (30 days)' }, lokal: { de: 'Lokal je Monat (Abschreibung + Strom)', en: 'Local per month (depreciation + electricity)' }, jeFrage: { de: 'je Anfrage', en: 'per request' },
  stand: { de: 'Voreinstellung: gpt-4.1-mini, Standardpreise laut OpenAI-Preisliste, abgerufen am 19.09.2026; Tokenzahlen der E:18-Frage aus dem Live-Protokoll des Fallbeispiels. Alle Felder sind editierbar.', en: 'Defaults: gpt-4.1-mini, standard prices per the OpenAI price list, retrieved 19 Sept 2026; token counts of the E:18 question from the case study’s live log. Every field is editable.' },
  status: { de: 'Rechnung im Browser', en: 'Computed in the browser' }
}
export function baue (wrap, p, ctx) {
  const k = kopf(wrap, L.titel, ctx); const form = el('div', 'rechnen'); const f = {}
  for (const [key, def] of [['ein', p.ein ?? 355], ['aus', p.aus ?? 121], ['tag', p.tag ?? 200], ['pEin', p.pEin ?? 0.40], ['pAus', p.pAus ?? 1.60], ['hw', p.hw ?? 2500], ['monate', p.monate ?? 48], ['strom', p.strom ?? 5]]) {
    const l = el('label', 'rechen-feld'); l.append(zwei(el('span'), L[key], ctx)); const i = el('input'); i.type = 'number'; i.step = 'any'; i.min = 0; i.value = def; l.append(i, el('span', 'einheit', '')); form.append(l); f[key] = i
  }
  const erg = el('div', 'challenge-box'); wrap.append(form, erg, zwei(el('p', 'line-hilfe'), L.stand, ctx))
  const zeige = () => {
    const lang = ctx.lang(); const v = Object.fromEntries(Object.entries(f).map(([k2, i]) => [k2, +i.value || 0]))
    const jeFrage = (v.ein * v.pEin + v.aus * v.pAus) / 1e6; const cloud = 30 * v.tag * jeFrage; const lokal = v.hw / Math.max(1, v.monate) + v.strom
    erg.replaceChildren(el('p', null, `${txt(L.cloud, lang)}: ${fmt(cloud, 2, lang)} USD (${fmt(jeFrage * 100, 3, lang)} Cent ${txt(L.jeFrage, lang)})`), el('p', null, `${txt(L.lokal, lang)}: ${fmt(lokal, 2, lang)} USD`))
    wrap.dataset.cloud = cloud.toFixed(2); wrap.dataset.lokal = lokal.toFixed(2)
  }
  for (const i of Object.values(f)) i.addEventListener('input', zeige); document.addEventListener('rag:sprache', zeige); zeige(); k.status(L.status, '')
  // Voreinstellungen aus data/betrieb.json (Live-Protokoll E:18, recherchierte Preise, Annahmen), sofern die Seite keine Parameter setzt
  ctx.daten('betrieb.json').then((b) => {
    const e18 = b.liveTokens.find(t => t.frage === 'Fehler E:18'); const soll = { ein: e18.ein, aus: e18.aus, tag: b.annahmen.anfragenJeTag, pEin: b.preise.einUsdJeMio, pAus: b.preise.ausUsdJeMio, hw: b.annahmen.rechnerUsd, monate: b.annahmen.monate, strom: b.annahmen.stromUsdJeMonat }
    for (const [key, v] of Object.entries(soll)) if (p[key] == null) f[key].value = v
    zeige(); k.status(L.status, 'vorberechnet')
  }).catch(() => {})
}
