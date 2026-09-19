/**
 * Seitenprüfung im Browser (aus DABA abgeleitet): Überschriftenfolge, Alternativtexte,
 * Beschriftungen, tote Links, Navigationsziele, horizontaler Überlauf, Sprachumschaltung
 * und deutsche Reste im EN-Modus, Diagramme in beiden Sprachen, Werkzeuge ohne Fehler.
 *
 * In der Konsole einer Seite:
 *   await (await fetch('tools/pruefung/audit.js')).text().then(eval); await __pruefe()
 */
window.__pruefe = async () => {
  const warte = (ms) => new Promise(r => setTimeout(r, ms))
  const befunde = []; const melde = (schwere, was) => befunde.push(schwere + ': ' + was)
  const istLab = !!document.querySelector('.lab-page, .lab-header')
  for (let i = 0; i < 40 && document.querySelector('[data-uebung]'); i++) await warte(100)

  // Überschriftenfolge
  const hs = [...document.querySelectorAll('h1,h2,h3,h4')].map(h => +h.tagName[1])
  if (hs.filter(h => h === 1).length !== 1) melde('WARNUNG', 'h1 kommt ' + hs.filter(h => h === 1).length + '-mal vor')
  for (let i = 1; i < hs.length; i++) if (hs[i] - hs[i - 1] > 1) { melde('WARNUNG', 'Überschriftensprung h' + hs[i - 1] + ' -> h' + hs[i]); break }

  // Bilder ohne Alternativtext, Diagramme in beiden Sprachen vorhanden
  for (const img of document.querySelectorAll('img')) if (!img.getAttribute('alt')) melde('FEHLER', 'img ohne alt: ' + img.getAttribute('src'))
  for (const img of document.querySelectorAll('figure.diagramm img')) { const r = await fetch(img.getAttribute('src'), { method: 'HEAD' }); if (r.status !== 200) melde('FEHLER', 'Diagramm fehlt: ' + img.getAttribute('src')) }

  // Bedienelemente ohne Beschriftung, Knöpfe ohne Namen
  for (const el of document.querySelectorAll('textarea, select, input')) {
    const hat = el.getAttribute('aria-label') || el.getAttribute('placeholder') || (el.id && document.querySelector('label[for="' + el.id + '"]')) || el.closest('label')
    if (!hat) melde('WARNUNG', el.tagName.toLowerCase() + '[' + (el.type || '') + '] ohne Beschriftung' + (el.className ? ' .' + el.className : ''))
  }
  for (const b of document.querySelectorAll('button')) if (!b.textContent.trim() && !b.getAttribute('aria-label')) melde('FEHLER', 'button ohne Namen')

  // interne Links und Navigationsziele
  const ziele = [...new Set([...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => h && !h.startsWith('#') && !h.startsWith('http') && !h.startsWith('data:') && !h.startsWith('mailto:')))]
  for (const z of ziele) { const r = await fetch(z.split('?')[0].split('#')[0], { method: 'HEAD' }); if (r.status !== 200) melde('FEHLER', 'toter Link ' + z + ' (' + r.status + ')') }
  for (const a of document.querySelectorAll('a[href^="#"]')) { const id = a.getAttribute('href').slice(1); if (id && !document.getElementById(id)) melde('FEHLER', 'Ankerziel #' + id + ' fehlt') }

  // horizontaler Überlauf (nur Verursacher ohne scrollenden Vorfahren)
  const w = document.documentElement.clientWidth
  const geclippt = (n) => { for (let p = n.parentElement; p && p !== document.documentElement; p = p.parentElement) if (['auto', 'hidden', 'scroll'].includes(getComputedStyle(p).overflowX)) return true; return false }
  if (document.documentElement.scrollWidth > w + 1) {
    const schuld = [...document.querySelectorAll('body *')].filter(n => n.getBoundingClientRect().right > w + 1 && !geclippt(n) && n.offsetParent !== null)
      .map(n => n.tagName.toLowerCase() + '.' + String(n.className).split(' ')[0] + ' «' + (n.textContent || '').trim().slice(0, 40) + '»').slice(0, 3)
    melde('FEHLER', 'horizontaler Überlauf bei ' + w + ' px, verursacht von: ' + schuld.join(' | '))
  }

  // Sprachumschaltung
  const sichtbar = (n) => getComputedStyle(n).display !== 'none'
  const zaehle = (lang) => [...document.querySelectorAll('[lang="' + lang + '"]')].filter(sichtbar).length
  const knopf = (lang) => document.querySelector('[data-lang-btn="' + lang + '"], button[data-lang="' + lang + '"], .lang-btn[data-lang="' + lang + '"]')
  if (!knopf('en')) melde('FEHLER', 'kein Sprachknopf gefunden')
  else {
    knopf('de').click(); await warte(200)
    if (zaehle('en') > 0) melde('FEHLER', 'im DE-Modus sind ' + zaehle('en') + ' EN-Blöcke sichtbar')
    knopf('en').click(); await warte(500)
    if (zaehle('de') > 0) melde('FEHLER', 'im EN-Modus sind ' + zaehle('de') + ' DE-Blöcke sichtbar')
    if (zaehle('en') === 0) melde('FEHLER', 'im EN-Modus ist kein EN-Block sichtbar')
    if (istLab && (!/·\s*RAG-Lab$/.test(document.title) || /Lab \d\d · [^·]*\b(und|für|der|die)\b/.test(document.title))) melde('WARNUNG', 'Titel im EN-Modus: ' + document.title)
    // deutsche Reste in erzeugtem Text (Werkzeuge, Übungsboxen, Navigation)
    const deutsch = /\b(Prüfen|Aufdecken|Zurücksetzen|Leeren|Hinweis|Richtig|Noch nicht|Erledigt|Übung|Übungen|Zuordnen|Reihenfolge|Rechnen|Lückentext|Kommandozeile|Checkliste|Verständnis|Laden|Modell laden|Tokenizer laden|Frage|Antwort|Quelle|Auftrag|Schwelle|Kontext|Kosten|Anfragen|Zeichen|Minuten|Weiter mit|Ihr Stand|Lernfortschritt|gelöst|vorberechnet|Beispielfragen|einblenden|Tabelle|Zeile|Stufe|Kandidaten|Treffer)\b/
    const verdaechtig = []
    for (const n of document.querySelectorAll('.werkzeug, .sqlbox, .sidebar, .nav-bottom, .lab-fortschritt, .fortschritt-panel, .header, .footer, .stats-bar')) {
      for (const t of n.querySelectorAll('button, summary, a, dt, dd, span, li, p, th, td, label, h4, option, small, strong')) {
        if (t.children.length) continue
        if (deutsch.test(t.textContent) && !t.closest('[lang="de"]') && !t.closest('pre, code, [data-quelle]')) verdaechtig.push(t.textContent.trim().slice(0, 40))
      }
    }
    if (verdaechtig.length) melde('FEHLER', 'deutsche Reste im EN-Modus: ' + [...new Set(verdaechtig)].slice(0, 8).join(' | '))
    knopf('de').click(); await warte(300)
  }

  // Werkzeuge: aufgebaut und ohne Fehlertext
  for (const w of document.querySelectorAll('.werkzeug')) if (/konnte nicht aufgebaut|folgt\.$/.test(w.textContent.trim())) melde('FEHLER', 'Werkzeug ' + w.dataset.name + ': ' + w.textContent.trim().slice(0, 60))
  // Übungen: jede Box hat einen Prüfen-Knopf (Terminal: einen Auftrag)
  for (const b of document.querySelectorAll('.sqlbox.uebung')) if (!b.querySelector('.sqlbox-actions .btn-sm.primary') && !b.querySelector('.terminal-auftrag')) melde('FEHLER', b.id + ': kein Prüfen-Knopf')
  if (istLab && !document.querySelector('.nav-bottom a')) melde('WARNUNG', 'keine Lab-Navigation unten')

  console.log(befunde.length ? befunde.join('\n') : 'keine Befunde')
  return befunde
}
