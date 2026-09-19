/** Prompt-Baukasten: die exakten messages des Fallbeispiels, Budget, Rohantwort und Parsung. */
import { el, txt, zwei, kopf, ganz } from './gemein.js'
import { parseAntwort, schaetzeTokens } from '../pruefung.js'
const L = {
  titel: { de: 'Prompt-Baukasten: was das Modell wirklich sieht', en: 'Prompt builder: what the model really sees' },
  frage: { de: 'Frage', en: 'Question' }, system: { de: 'Systemrolle (SYSTEM_PROMPT aus server.py)', en: 'System role (SYSTEM_PROMPT from server.py)' },
  nutzer: { de: 'Nutzerrolle: Frage und Auszüge als JSON-Daten', en: 'User role: question and excerpts as JSON data' },
  budget: { de: 'Kontextbudget CONTEXT_MAX_CHARS = 14 000 Zeichen', en: 'Context budget CONTEXT_MAX_CHARS = 14,000 characters' },
  antwort: { de: 'Rohantwort des Modells', en: 'Raw model answer' }, geparst: { de: 'Geparst (Port von parse_ai_response)', en: 'Parsed (port of parse_ai_response)' },
  zeichen: { de: 'Zeichen Handbuchauszüge', en: 'characters of manual excerpts' }, tokensCa: { de: 'Tokens der Nachricht, geschätzt', en: 'tokens of the message, estimated' },
  gemeldet: { de: 'vom Modell gemeldet', en: 'reported by the model' }, keinFormat: { de: 'Kein gültiges Antwortformat: server.py würde die Antwort verwerfen.', en: 'No valid answer format: server.py would discard the answer.' },
  aufgezeichnet: { de: 'aufgezeichnet am', en: 'recorded on' }
}
export function baue (wrap, p, ctx) {
  const k = kopf(wrap, L.titel, ctx); const sel = el('select'); zwei(sel, L.frage, ctx, 'aria-label')
  const sys = el('pre', 'code-block'); const usr = el('pre', 'code-block'); const balken = el('div', 'balken'); const bi = el('i'); balken.append(bi)
  const bm = el('p', 'line-hilfe'); const roh = el('pre', 'code-block'); const gep = el('div')
  wrap.append(sel, zwei(el('h3'), L.system, ctx), sys, zwei(el('h3'), L.nutzer, ctx), usr, zwei(el('h3'), L.budget, ctx), balken, bm, zwei(el('h3'), L.antwort, ctx), roh, zwei(el('h3'), L.geparst, ctx), gep)
  let d
  const zeige = () => {
    const e = d.eintraege.find(x => x.id === sel.value); if (!e || !e.messages) return
    const lang = ctx.lang()
    sys.textContent = e.messages[0].content
    const u = JSON.parse(e.messages[1].content); usr.textContent = JSON.stringify(u, null, 2)
    const n = u.handbuch.length; bi.style.width = Math.min(100, n / 14000 * 100) + '%'
    bm.textContent = `${ganz(n, lang)} / 14 000 ${txt(L.zeichen, lang)} · ≈ ${ganz(schaetzeTokens(e.messages[0].content + e.messages[1].content), lang)} ${txt(L.tokensCa, lang)} · ${txt(L.gemeldet, lang)}: ${e.usage ? ganz(e.usage.ein, lang) : '–'}`
    roh.textContent = e.antwort
    const r = parseAntwort(e.antwort); gep.replaceChildren()
    if (r.ok) {
      gep.append(el('p', null, r.summary)); if (r.intro) gep.append(el('p', 'line-hilfe', r.intro))
      const ul = el('ul', 'checkliste'); for (const s of r.schritte) { const li = el('li'); const lab = el('label'); const cb = el('input'); cb.type = 'checkbox'; lab.append(cb, ' ', s.replace(/\*\*/g, '')); li.append(lab); ul.append(li) } gep.append(ul)
    } else gep.append(el('p', 'warn-box', txt(L.keinFormat, lang)))
  }
  ctx.daten('antworten.json').then(x => {
    d = x
    for (const e of d.eintraege.filter(e => e.modus === 'rag' && e.messages)) { const o = el('option', null, e.frage); o.value = e.id; sel.append(o) }
    if (p.frage) sel.value = p.frage + '-rag'
    k.status({ de: `${txt(L.aufgezeichnet, 'de')} ${d.datum}`, en: `${txt(L.aufgezeichnet, 'en')} ${d.datum}` }, 'vorberechnet'); zeige()
  })
  sel.addEventListener('change', zeige); document.addEventListener('rag:sprache', () => d && zeige())
}
