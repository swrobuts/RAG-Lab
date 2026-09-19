/** Eigenes Modell anschliessen: OpenAI-kompatibler Endpunkt (LM Studio, Ollama), Stream, Parser. Kein Schluessel, keine Cloud. */
import { el, txt, zwei, kopf, ganz } from './gemein.js'
import { parseAntwort } from '../pruefung.js'
const L = {
  titel: { de: 'Eigenes Modell anschließen (LM Studio oder Ollama)', en: 'Connect your own model (LM Studio or Ollama)' },
  endpunkt: { de: 'Endpunkt (OpenAI-kompatibel, ohne /chat/completions)', en: 'Endpoint (OpenAI-compatible, without /chat/completions)' },
  verbinden: { de: 'Verbinden', en: 'Connect' }, modell: { de: 'Modell', en: 'Model' }, frage: { de: 'Frage', en: 'Question' },
  mitKontext: { de: 'Handbuchauszüge mitschicken (RAG); ohne Haken: nackte Frage', en: 'Send manual excerpts (RAG); unticked: bare question' }, senden: { de: 'Senden', en: 'Send' },
  verbunden: { de: 'Verbunden: {n} Chatmodell(e)', en: 'Connected: {n} chat model(s)' },
  keinServer: { de: 'Keine Verbindung. Läuft der Server? Ist CORS eingeschaltet (LM Studio: „Enable CORS“ in den Server-Einstellungen oder lms server start --cors; Ollama: OLLAMA_ORIGINS)? Chrome fragt bei der ersten Anfrage neben der Adresszeile nach der Erlaubnis für das lokale Netzwerk („Local Network Access“) – bis zum Klick auf „Zulassen“ wartet die Anfrage. Safari blockiert Aufrufe an http://localhost von einer HTTPS-Seite (und im Modus „Nur HTTPS“ jede HTTP-Adresse); nutzen Sie Chrome, Edge oder Firefox.', en: 'No connection. Is the server running? Is CORS enabled (LM Studio: “Enable CORS” in the server settings or lms server start --cors; Ollama: OLLAMA_ORIGINS)? Chrome asks next to the address bar for local network permission (“Local Network Access”) on the first request – the request waits until you click “Allow”. Safari blocks calls to http://localhost from an HTTPS page (and, in “HTTPS-only” mode, any HTTP address); use Chrome, Edge or Firefox.' },
  abgelehnt: { de: 'Die Suche findet keinen belegten Kontext: Das Fallbeispiel würde ablehnen und kein Modell aufrufen. Zum Vergleich können Sie den Haken entfernen und die nackte Frage senden.', en: 'Retrieval finds no grounded context: the case study would refuse and not call a model. For comparison, untick the box and send the bare question.' },
  laeuft: { de: 'Antwort läuft …', en: 'Answer streaming …' }, fertig: { de: 'fertig', en: 'done' }, geparst: { de: 'Geparst', en: 'Parsed' },
  keinFormat: { de: 'Das Modell hat das Antwortformat nicht eingehalten; server.py würde die Antwort verwerfen.', en: 'The model did not keep the answer format; server.py would discard the answer.' },
  aufgezeichnet: { de: 'Ohne eigenen Server zeigen die Werkzeuge „Vergleich“ und „Prompt-Baukasten“ aufgezeichnete Antworten.', en: 'Without your own server, the tools “comparison” and “prompt builder” show recorded answers.' },
  laenge: { de: 'Antwort am Tokenlimit abgeschnitten (finish_reason = length); server.py würde sie verwerfen.', en: 'Answer cut off at the token limit (finish_reason = length); server.py would discard it.' },
  tokens: { de: 'Tokens ein/aus', en: 'tokens in/out' }, dauer: { de: 's', en: 's' }, erstesToken: { de: 'erstes Token nach', en: 'first token after' }
}
export function baue (wrap, p, ctx) {
  const k = kopf(wrap, L.titel, ctx)
  let gespeichert = 'http://localhost:1234/v1'; try { gespeichert = localStorage.getItem('rag:llm') || gespeichert } catch { /* egal */ }
  const ep = el('input'); ep.type = 'text'; ep.value = gespeichert; zwei(ep, L.endpunkt, ctx, 'aria-label')
  const bv = zwei(el('button', 'btn-sm'), L.verbinden, ctx); bv.type = 'button'
  const z1 = el('div', 'zeile'); z1.append(zwei(el('label'), L.endpunkt, ctx), ep, bv)
  const modelle = el('select'); zwei(modelle, L.modell, ctx, 'aria-label'); const fragen = el('select'); zwei(fragen, L.frage, ctx, 'aria-label')
  const z2 = el('div', 'zeile'); z2.append(modelle, fragen)
  const cbl = el('label'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = true; cbl.append(cb, ' ', zwei(el('span'), L.mitKontext, ctx))
  const bs = zwei(el('button', 'btn-sm primary'), L.senden, ctx); bs.type = 'button'; bs.disabled = true
  const meld = el('p', 'line-hilfe'); const aus = el('pre', 'code-block'); const gep = el('div')
  wrap.append(z1, z2, cbl, bs, meld, aus, gep); zwei(meld, L.aufgezeichnet, ctx)
  let F, C, A
  Promise.all([ctx.daten('fragen.json'), ctx.daten('chunks.json'), ctx.daten('antworten.json')]).then(([f, c, a]) => {
    F = f.fragen; C = c.chunks; A = a
    for (const q of F) { const o = el('option', null, q.frage); o.value = q.id; fragen.append(o) }
    if (p.frage) fragen.value = p.frage
  })
  const basis = () => ep.value.trim().replace(/\/+$/, '')
  bv.addEventListener('click', async () => {
    try {
      const r = await fetch(basis() + '/models'); if (!r.ok) throw new Error(String(r.status))
      const d = await r.json(); modelle.replaceChildren()
      for (const m of d.data || []) if (!/embed/i.test(m.id)) modelle.append(el('option', null, m.id))
      try { localStorage.setItem('rag:llm', basis()) } catch { /* egal */ }
      bs.disabled = !modelle.options.length
      k.status({ de: txt(L.verbunden, 'de').replace('{n}', modelle.options.length), en: txt(L.verbunden, 'en').replace('{n}', modelle.options.length) }, 'live'); meld.textContent = ''
    } catch { k.status({ de: 'Nicht verbunden', en: 'Not connected' }, 'vorberechnet'); meld.textContent = txt(L.keinServer, ctx.lang()); bs.disabled = true }
  })
  bs.addEventListener('click', async () => {
    const lang = ctx.lang(); const f = F.find(q => q.id === fragen.value)
    const kontext = f.kontext.map(id => C.find(c => c.id === id).text).join('\n\n')
    let messages
    if (cb.checked) {
      if (!f.gedeckt) { meld.textContent = txt(L.abgelehnt, lang); return }
      messages = [{ role: 'system', content: A.systemprompt }, { role: 'user', content: JSON.stringify({ frage: f.frage, handbuch: kontext }) }]
    } else messages = [{ role: 'system', content: A.nacktSystem }, { role: 'user', content: f.frage }]
    aus.textContent = ''; gep.replaceChildren(); meld.textContent = txt(L.laeuft, lang); bs.disabled = true
    const t0 = performance.now(); let tErstes = null, usage = null
    try {
      const r = await fetch(basis() + '/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelle.value, messages, temperature: 0, max_tokens: 1024, stream: true, stream_options: { include_usage: true } }) })
      if (!r.ok || !r.body) throw new Error(String(r.status))
      const reader = r.body.getReader(); const dec = new TextDecoder(); let puffer = '', text = '', finish = null
      for (;;) {
        const { value, done } = await reader.read(); if (done) break
        puffer += dec.decode(value, { stream: true }); const zeilen = puffer.split('\n'); puffer = zeilen.pop()
        for (const z of zeilen) {
          if (!z.startsWith('data:')) continue; const d = z.slice(5).trim(); if (d === '[DONE]') continue
          try {
            const j = JSON.parse(d); if (j.usage) usage = j.usage
            const ch = j.choices && j.choices[0]
            if (ch) { finish = ch.finish_reason || finish; const delta = ch.delta && ch.delta.content; if (delta) { if (tErstes == null) tErstes = performance.now() - t0; text += delta; aus.textContent = text } }
          } catch { /* unvollstaendige Zeile */ }
        }
      }
      const dauer = ((performance.now() - t0) / 1000).toFixed(1)
      meld.textContent = `${txt(L.fertig, lang)} · ${dauer} ${txt(L.dauer, lang)}${tErstes != null ? ` · ${txt(L.erstesToken, lang)} ${(tErstes / 1000).toFixed(1)} s` : ''}${usage ? ` · ${txt(L.tokens, lang)} ${ganz(usage.prompt_tokens, lang)}/${ganz(usage.completion_tokens, lang)}` : ''}${finish === 'length' ? ' · ' + txt(L.laenge, lang) : ''}`
      if (cb.checked) {
        const pr = parseAntwort(text); gep.append(zwei(el('h3'), L.geparst, ctx))
        if (pr.ok) { gep.append(el('p', null, pr.summary)); if (pr.intro) gep.append(el('p', 'line-hilfe', pr.intro)); const ul = el('ul', 'checkliste'); for (const s of pr.schritte) { const li = el('li'); const lab = el('label'); const c = el('input'); c.type = 'checkbox'; lab.append(c, ' ', s.replace(/\*\*/g, '')); li.append(lab); ul.append(li) } gep.append(ul) }
        else gep.append(zwei(el('p', 'warn-box'), L.keinFormat, ctx))
      }
    } catch { meld.textContent = txt(L.keinServer, lang) } finally { bs.disabled = false }
  })
}
