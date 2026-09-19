/**
 * Bedientest im Browser: löst jede Übung einer Lab-Seite mit der Musterlösung
 * und meldet, ob „Richtig“ erscheint.
 *
 * In der Entwicklerkonsole einer geöffneten Lab-Seite:
 *   await (await fetch('tools/pruefung/durchlauf.js')).text().then(eval); await __durchlauf()
 *
 * Aus PROM/DABA abgeleitet; je Übungstyp die Musterlösung aus data/uebungen/<lab>.json:
 * quiz/experiment: richtig-Indizes · zuordnen: ziel · sortieren: ▲-Klicks bis zur Reihenfolge ·
 * rechnen: loesung · luecken: erste loesung · belegen: belegt · checkliste: richtig ·
 * terminal: die Zeilen aus loesung.<os> durch die Eingabezeile.
 */
window.__durchlauf = async function (opt = {}) {
  const warte = (ms) => new Promise(r => setTimeout(r, ms))
  const lab = document.querySelector('script[type=module]').textContent.match(/lab: '([^']+)'/)[1]
  const uebungen = await (await fetch(`data/uebungen/${lab}.json`, { cache: 'reload' })).json()
  const ergebnis = []
  const os = opt.os || 'mac'
  for (const u of uebungen) {
    const box = document.getElementById(u.id)
    if (!box) { ergebnis.push(`${u.id}: Box fehlt`); continue }
    const pruefen = [...box.querySelectorAll('.sqlbox-actions .btn-sm.primary')].pop()
    try {
      if (u.typ === 'quiz' || u.typ === 'experiment') {
        u.fragen.forEach((fr, i) => { box.querySelectorAll(`input[name="${u.id}-${i}"]`).forEach((inp, j) => { inp.checked = fr.richtig.includes(j) }) })
      }
      if (u.typ === 'zuordnen') {
        const sels = box.querySelectorAll('.zuordnen select'); u.elemente.forEach((e, i) => { sels[i].value = e.ziel })
      }
      if (u.typ === 'sortieren') {
        const liste = box.querySelector('ol.sortieren')
        for (let pass = 0; pass < u.elemente.length + 1; pass++) {
          let getauscht = false
          for (let pos = 0; pos < liste.children.length - 1; pos++) {
            const a = +liste.children[pos].dataset.idx, b = +liste.children[pos + 1].dataset.idx
            if (a > b) { liste.children[pos + 1].querySelector('button').click(); getauscht = true; await warte(5) }
          }
          if (!getauscht) break
        }
      }
      if (u.typ === 'rechnen') {
        box.querySelectorAll('.rechnen input').forEach((inp, i) => { inp.value = String(u.felder[i].loesung).replace('.', ',') })
      }
      if (u.typ === 'luecken') {
        box.querySelectorAll('pre.luecken input').forEach((inp) => { const l = u.luecken[+inp.dataset.nr - 1]; inp.value = l.loesung ? l.loesung[0] : (l.beispiel || ''); inp.dispatchEvent(new Event('input')) })
      }
      if (u.typ === 'belegen') {
        u.saetze.forEach((s, i) => { const inp = box.querySelector(`input[name="${u.id}-s${i}"][value="${s.belegt}"]`); inp.checked = true })
      }
      if (u.typ === 'checkliste') {
        u.schritte.forEach((s, i) => { const inp = box.querySelector(`input[name="${u.id}-s${i}"][value="${s.richtig}"]`); inp.checked = true })
      }
      if (u.typ === 'terminal') {
        const term = box.querySelector('.terminal'); const osKnopf = term.querySelector(`button.os[data-os="${os}"]`); if (osKnopf) osKnopf.click()
        const zurueck = [...term.querySelectorAll('.terminal-kopf button')].find(b => /Zurücksetzen|Reset/.test(b.textContent)); zurueck.click()
        const inp = term.querySelector('.terminal-eingabe input')
        for (const zeile of (u.loesung && u.loesung[os]) || []) { inp.value = zeile; inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await warte(20) }
      } else pruefen.click()
      await warte(250)
    } catch (e) { ergebnis.push(`${u.id} (${u.typ}): FEHL ${e.message}`); continue }
    const line = box.querySelector('.sqlbox-status .line')
    const ok = line && line.classList.contains('ok')
    ergebnis.push(`${u.id} (${u.typ}): ${ok ? 'ok' : 'FEHL ' + (line ? line.textContent.slice(0, 160) : 'keine Rückmeldung')}`)
  }
  console.log(ergebnis.join('\n'))
  return ergebnis
}
