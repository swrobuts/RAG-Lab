/**
 * RAG-Lab · Chunking-Strategien
 *
 * Die Stufen, die das Fallbeispiel in prepare_nodes() faehrt, dazu zwei
 * einfache Strategien zum Vergleich. explodiereTabellen ist ein Port von
 * _explode_markdown_tables aus rag_engine.py und liefert dieselben Texte wie
 * der Python-Index (tools/pruefung.test.mjs prueft das an der E:18-Zeile).
 */

/** Feste Laenge in Zeichen mit Ueberlappung. */
export function chunkeFest (text, { groesse = 500, overlap = 50 } = {}) {
  const out = []; const schritt = Math.max(1, groesse - overlap)
  for (let start = 0; start < text.length; start += schritt) {
    out.push({ text: text.slice(start, start + groesse), start, ende: Math.min(text.length, start + groesse) })
    if (start + groesse >= text.length) break
  }
  return out
}

/** Saetze greedy bis zur Groesse packen; Ueberlappung wiederholt Endsaetze bis `overlap` Zeichen. */
export function chunkeSaetze (text, { groesse = 500, overlap = 0 } = {}) {
  const saetze = text.split(/(?<=[.!?])\s+/).filter(Boolean)
  const out = []; let akt = []
  const laenge = (arr) => arr.join(' ').length
  for (const s of saetze) {
    if (akt.length && laenge([...akt, s]) > groesse) {
      out.push({ text: akt.join(' ') })
      const rest = []; let l = 0
      for (let i = akt.length - 1; i >= 0 && l + akt[i].length <= overlap; i--) { rest.unshift(akt[i]); l += akt[i].length }
      akt = rest
    }
    akt.push(s)
  }
  if (akt.length) out.push({ text: akt.join(' ') })
  return out
}

/** Abschnitte je Markdown-Ueberschrift (wie MarkdownNodeParser: die Ueberschriftzeile bleibt im Text). */
export function chunkeMarkdown (text) {
  const out = []; let zeilen = []; let ueberschrift = ''
  const schliesse = () => { const t = zeilen.join('\n').trim(); if (t) out.push({ ueberschrift, text: t }); zeilen = [] }
  for (const z of text.split('\n')) {
    const m = /^(#{1,6})\s+(.*)$/.exec(z)
    if (m) { schliesse(); ueberschrift = m[2].trim() }
    zeilen.push(z)
  }
  schliesse()
  return out
}

const zelle = (line) => line.trim().replace(/^\|+/, '').replace(/\|+$/, '').split(/(?<!\\)\|/)
  .map(c => c.replace(/\s+/g, ' ').replace(/\\\|/g, '|').trim())

/** Port von _explode_markdown_tables: grosse Tabellenabschnitte zeilenweise, Kopf und Vorzeile bleiben. */
export function explodiereTabellen (abschnitte, maxZeichen = 1600) {
  const out = []
  for (const a of abschnitte) {
    const text = a.text
    const tabellenZeilen = text.split('\n').filter(l => l.trim().startsWith('|'))
    if (text.length <= maxZeichen || tabellenZeilen.length < 3) { out.push({ ...a, art: 'abschnitt' }); continue }
    const zeilen = text.split('\n')
    const kopf = zeilen.filter(l => l.trim().startsWith('#')).map(l => l.trim()).join(' ')
    const prosa = zeilen.filter(l => l.trim() && !l.trim().startsWith('|') && !l.trim().startsWith('#')).join('\n').trim()
    if (prosa) out.push({ ...a, text: `${kopf}\n${prosa}`.trim(), art: 'prosa' })
    for (const block of text.match(/(?:^[ \t]*\|.*(?:\n|$))+/gm) || []) {
      const rows = block.trim().split('\n')
      if (rows.length < 3 || !/^[|\s:\-]+$/.test(rows[1])) { out.push({ ...a, text: `${kopf}\n${block}`.trim(), art: 'tabelle' }); continue }
      const labels = zelle(rows[0]); let vorher = ''
      for (const row of rows.slice(2)) {
        const cells = zelle(row); if (!cells.some(Boolean)) continue
        if (cells[0]) vorher = cells[0]; else if (vorher) cells[0] = vorher
        const paare = cells.map((val, i) => [labels[i] || '', val]).filter(([, val]) => val)
          .map(([lbl, val]) => (lbl ? `${lbl}: ${val}` : val)).join('; ')
        out.push({ ...a, text: `${kopf}\n${paare}`.trim(), art: 'zeile' })
      }
    }
  }
  return out
}

/**
 * Laengenbegrenzung in Tokens (vereinfachter SentenceSplitter): Saetze greedy
 * bis `groesse` Tokens, Ueberlappung in Tokens. `zaehler(text)` liefert die
 * Tokenzahl (exakt mit geladenem Tokenizer, sonst Schaetzung). LlamaIndex
 * teilt zusaetzlich an Absaetzen und notfalls in Woerter; fuer die Anschauung
 * genuegt die Satzgrenze.
 */
export function begrenzeLaenge (abschnitte, { groesse = 440, overlap = 40, zaehler }) {
  const out = []
  for (const a of abschnitte) {
    if (zaehler(a.text) <= groesse) { out.push(a); continue }
    const saetze = a.text.split(/(?<=[.!?])\s+|\n+/).filter(Boolean)
    let akt = []
    const flush = () => { if (akt.length) out.push({ ...a, text: akt.join(' '), art: 'geteilt' }) }
    for (const s of saetze) {
      if (akt.length && zaehler([...akt, s].join(' ')) > groesse) {
        flush()
        const rest = []
        for (let i = akt.length - 1; i >= 0 && zaehler([akt[i], ...rest].join(' ')) <= overlap; i--) rest.unshift(akt[i])
        akt = rest
      }
      akt.push(s)
    }
    flush()
  }
  return out
}
