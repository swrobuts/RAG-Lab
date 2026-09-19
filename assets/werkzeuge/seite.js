/** PDF-Seite 33 als Bild neben dem Markdown des Parsers; markierte Stellen erklaeren sich per Klick. */
import { el, txt, zwei, kopf } from './gemein.js'
const L = {
  titel: { de: 'PDF-Seite 33 neben dem Markdown', en: 'PDF page 33 next to the Markdown' },
  links: { de: 'Gedruckte Seite (Rendering mit 150 dpi)', en: 'Printed page (rendered at 150 dpi)' },
  rechts: { de: 'Markdown aus Docling mit Seitenmarker', en: 'Markdown from Docling with page marker' },
  klick: { de: 'Markierte Stellen anklicken.', en: 'Click the highlighted spots.' }
}
export function baue (wrap, p, ctx) {
  const k = kopf(wrap, L.titel, ctx); const grid = el('div', 'zwei-spalten seite')
  const li = el('figure'); const img = el('img'); img.src = ctx.basis + '/assets/seite-33.png'; img.loading = 'lazy'
  img.alt = 'Seite 33 der Gebrauchsanleitung: Tabellen „Hinweise im Anzeigefeld“ und „Störungen, was tun?“'; img.setAttribute('data-alt-en', 'Page 33 of the manual: tables “Hinweise im Anzeigefeld” and “Störungen, was tun?”')
  li.append(img, zwei(el('figcaption', 'line-hilfe'), L.links, ctx))
  const re = el('div'); re.append(zwei(el('h3'), L.rechts, ctx)); const pre = el('pre', 'code-block markdown'); re.append(pre); const erkl = el('div', 'tip-box'); erkl.hidden = true; re.append(erkl)
  grid.append(li, re); wrap.append(grid); k.status(L.klick, '')
  ctx.daten('seite-33.md').then(md => {
    // Treffer auf dem Rohtext suchen (nicht auf dem maskierten HTML), dann Segmente maskieren und Treffer umhuellen.
    const marks = (p.markierungen || []).map((m, i) => ({ re: new RegExp(m.muster, 'g'), hinweis: m.hinweis, i }))
    const treffer = []
    for (const m of marks) for (const t of md.matchAll(m.re)) if (t[0]) treffer.push({ start: t.index, ende: t.index + t[0].length, i: m.i })
    treffer.sort((a, b) => a.start - b.start)
    const esc = (t) => t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
    let html = ''; let pos = 0
    for (const t of treffer) { if (t.start < pos) continue; html += esc(md.slice(pos, t.start)) + `<mark data-i="${t.i}" tabindex="0">${esc(md.slice(t.start, t.ende))}</mark>`; pos = t.ende }
    html += esc(md.slice(pos))
    pre.innerHTML = html
    const zeige = (m) => { erkl.hidden = false; erkl.textContent = txt(marks[+m.dataset.i].hinweis, ctx.lang()) }
    pre.addEventListener('click', ev => { const m = ev.target.closest('mark'); if (m) zeige(m) })
    pre.addEventListener('keydown', ev => { const m = ev.target.closest('mark'); if (m && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); zeige(m) } })
  })
}
