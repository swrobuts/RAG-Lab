import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import * as P from '../assets/pruefung.js'
import * as C from '../assets/chunking.js'
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const daten = (n) => JSON.parse(readFileSync(join(ROOT, 'data', n), 'utf8'))
const chunks = daten('chunks.json').chunks
const fragen = daten('fragen.json').fragen
const text = (id) => chunks.find(c => c.id === id).text

test('kosinus: identische Vektoren 1, orthogonale 0, Rechenbeispiel', () => {
  assert.equal(P.kosinus([1, 2, 2], [1, 2, 2]), 1)
  assert.equal(P.kosinus([1, 0], [0, 1]), 0)
  assert.ok(Math.abs(P.kosinus([1, 2, 2], [2, 0, 1]) - 4 / (3 * Math.sqrt(5))) < 1e-12)
})
test('topK gegen die Python-Trefferliste (mit Präfix)', () => {
  for (const id of ['fehler-e23', 'kindersicherung', 'wasser-laeuft']) {
    const f = fragen.find(x => x.id === id)
    const js = P.topK(f.vMit, chunks, 12).map(t => t.id)
    const py = f.vektor.map(t => t.chunk)
    assert.deepEqual(js.slice(0, 5), py.slice(0, 5), id)
  }
})
test('fehlercodes: Varianten und Nicht-Treffer', () => {
  assert.deepEqual([...P.fehlercodes('Was bedeutet E:18?')].sort(), ['E18', 'E:18'].sort())
  assert.deepEqual([...P.fehlercodes('Fehler 18 und fehlercode: 23')].sort(), ['E18', 'E23', 'E:18', 'E:23'].sort())
  assert.equal(P.fehlercodes('E:180').has('E:18'), false)
  assert.equal(P.fehlercodes('18 Grad').size, 0)
})
test('hybridKandidaten: exakte Codes zuerst mit Score 1, Rest dedupliziert', () => {
  const f = fragen.find(x => x.id === 'fehler-e18')
  const h = P.hybridKandidaten(f.vektor.map(t => ({ id: t.chunk, score: t.score })), chunks, f.frage)
  assert.deepEqual(h.map(k => k.id), f.hybrid.map(k => k.chunk))
  assert.ok(h[0].exakt && h[0].score === 1)
})
test('waehleKontext: relativer Boden 0,5 × bester Score, mindestens 0,15', () => {
  const k = [{ id: 'a', score: 0.98 }, { id: 'b', score: 0.6 }, { id: 'c', score: 0.4 }, { id: 'd', score: 0.2 }, { id: 'e', score: 0.1 }, { id: 'f', score: 0.99 }]
  assert.deepEqual(P.waehleKontext(k).map(x => x.id), ['a', 'b'])
  assert.deepEqual(P.waehleKontext([{ id: 'a', score: 0.2 }, { id: 'b', score: 0.12 }]).map(x => x.id), ['a'])
  assert.deepEqual(P.waehleKontext([{ id: 'a', score: 0.9, exakt: false }, { id: 'b', score: 1, exakt: true }], { reranked: false }).map(x => x.id), ['b'])
})
test('waehleKontext und istGedeckt reproduzieren fragen.json', () => {
  for (const f of fragen) {
    const kontext = P.waehleKontext(f.rerank.map(r => ({ id: r.chunk, score: r.score, exakt: r.exakt })))
    assert.deepEqual(kontext.map(k => k.id), f.kontext, f.id)
    assert.equal(P.istGedeckt(f.frage, kontext, text), f.gedeckt, f.id)
  }
})
test('istGedeckt: unbekannter Code E:180 wird abgelehnt, auch bei hohem Score', () => {
  const kontext = [{ id: chunks.find(c => c.text.includes('Anzeige: E:18;')).id, score: 0.9 }]
  assert.equal(P.istGedeckt('Was bedeutet E:180?', kontext, text), false)
  assert.equal(P.istGedeckt('Was bedeutet E:18?', kontext, text), true)
})
test('parseAntwort: Tags, wiederholte Schrittblöcke, Codezäune, Fehlerfall', () => {
  const r = P.parseAntwort('```xml\n<summary>Kurz</summary>\n<manual_intro>Einleitung</manual_intro>\n<manual_steps>- **A:** eins\n- **B:** zwei</manual_steps>\n<manual_steps>3. drei</manual_steps>\n```')
  assert.equal(r.ok, true); assert.equal(r.summary, 'Kurz'); assert.equal(r.intro, 'Einleitung')
  assert.deepEqual(r.schritte, ['**A:** eins', '**B:** zwei', 'drei'])
  assert.equal(P.parseAntwort('Nur Text ohne Tags').ok, false)
  assert.equal(P.parseAntwort('<manual_intro>x').summary, 'Hinweise aus dem Handbuch')
})
test('parseAntwort reproduziert die Python-Parsung der aufgezeichneten Antworten', () => {
  const an = daten('antworten.json')
  for (const e of an.eintraege.filter(x => x.modus === 'rag' && !x.abgelehnt)) {
    const r = P.parseAntwort(e.antwort)
    assert.equal(r.ok, true, e.id)
    assert.equal(r.summary, e.geparst.summary, e.id)
    const py = e.geparst.inhalt.split('\n').filter(l => l.startsWith('- [ ] ')).map(l => l.slice(6))
    assert.deepEqual(r.schritte, py, e.id)
  }
})
test('macheCheckboxen entfernt Aufzählungszeichen und Nummern', () => {
  assert.equal(P.macheCheckboxen('- eins\n2) zwei\n[ ] drei\n\n• vier'), '- [ ] eins\n- [ ] zwei\n- [ ] drei\n- [ ] vier')
})
test('bewerteTreffer und metriken reproduzieren die drei Protokolle', () => {
  for (const [name, stufe] of [['hybrid-rerank.json', 'rerank'], ['hybrid-no-rerank.json', 'hybrid'], ['vector.json', 'vektor']]) {
    const prot = daten('eval/' + name)
    const faelle = prot.results.map(r => { const f = fragen.find(x => x.id === r.id); const texte = f[stufe].slice(0, 5).map(k => text(k.chunk)); return P.bewerteTreffer(texte, f.erwartet) })
    const m = P.metriken(faelle)
    assert.ok(Math.abs(m.trefferquote - prot.keyword_hit_rate) < 1e-9, name + ' hit')
    assert.ok(Math.abs(m.hitAt1 - prot.keyword_hit_at_1) < 1e-9, name + ' hit1')
    assert.ok(Math.abs(m.mrr - prot.keyword_mrr) < 1e-9, name + ' mrr')
    assert.ok(Math.abs(m.abdeckung - prot.keyword_coverage) < 1e-9, name + ' coverage')
  }
})
test('metriken: Rechenbeispiel MRR', () => {
  const m = P.metriken([1, 2, 1, null, 3].map(r => ({ ersterRang: r, gefunden: 1, erwartet: 1 })))
  assert.ok(Math.abs(m.mrr - (1 + 0.5 + 1 + 0 + 1 / 3) / 5) < 1e-12)
  assert.equal(m.trefferquote, 0.8); assert.equal(m.hitAt1, 0.4)
})
test('projiziere: Chunk-Punkt aus projektion.json wird reproduziert', () => {
  const pr = daten('projektion.json'); const c = chunks[10]; const p = pr.punkte.find(x => x.id === c.id)
  const [x, y] = P.projiziere(c.v, pr)
  assert.ok(Math.abs(x - p.x) < 0.01 && Math.abs(y - p.y) < 0.01)
})
test('softmax: T→0 konzentriert, T groß flacht ab', () => {
  const l = [3, 1, 0]
  const kalt = P.softmax(l, 0.1), warm = P.softmax(l, 2)
  assert.ok(kalt[0] > 0.999 && warm[0] < 0.7)
  assert.ok(Math.abs(warm.reduce((a, b) => a + b) - 1) < 1e-12)
  assert.deepEqual(P.softmax(l, 0), [1, 0, 0])
})
test('schaetzeTokens nutzt die gemessene Zeichenzahl je Token', () => {
  const tk = daten('tokens.json')
  assert.equal(P.ZEICHEN_JE_TOKEN, tk.zaehlungen.zeichenJeToken)
  assert.equal(P.schaetzeTokens('a'.repeat(100)), Math.ceil(100 / tk.zaehlungen.zeichenJeToken))
})
test('Prüfer je Übungstyp', () => {
  assert.equal(P.pruefeQuiz([{ richtig: [1] }, { richtig: [0, 2], mehrfach: true }], [[1], [0, 2]]).ok, true)
  assert.equal(P.pruefeQuiz([{ richtig: [1] }], [[0]]).ok, false)
  assert.deepEqual(P.pruefeZuordnen([{ ziel: 'a' }, { ziel: 'b' }], { 0: 'a', 1: 'a' }), { ok: false, falsch: [1], fehlend: [] })
  assert.deepEqual(P.pruefeSortieren([2, 0, 1], [2, 1, 0]), { ok: false, falschPlatziert: [1, 2] })
  assert.equal(P.pruefeRechnen([{ loesung: 0.596, toleranz: 0.005 }], [0.5963]).ok, true)
  assert.equal(P.pruefeRechnen([{ loesung: 0.596, toleranz: 0.005 }], [NaN]).ok, false)
  assert.equal(P.pruefeLuecken([{ loesung: ['440'] }, { loesung: ['gemma-4-12b-it-mlx'] }], [' 440', 'GEMMA-4-12B-IT-MLX']).ok, true)
  assert.equal(P.pruefeLuecken([{ muster: '^query:\\s*$' }], ['query: ']).ok, true)
  assert.deepEqual(P.pruefeBelegen([{ belegt: true }, { belegt: false }, { belegt: true }], [true, true, null]), { ok: false, uebersehen: [1], zuUnrecht: [], offen: [2] })
})
test('chunking: Tabellenexplosion reproduziert den E:18-Chunk aus Python', () => {
  const md = readFileSync(join(ROOT, 'data/handbuch.md'), 'utf8')
  const abschnitte = C.chunkeMarkdown(md)
  const anzeige = abschnitte.find(a => a.ueberschrift === 'Hinweise im Anzeigefeld')
  const zeilen = C.explodiereTabellen([anzeige], 1600)
  const e18 = zeilen.find(z => z.text.includes('Anzeige: E:18;'))
  assert.equal(e18.text, text(chunks.find(c => c.text.includes('Anzeige: E:18;')).id))
  const stoer = abschnitte.filter(a => a.ueberschrift === 'Störungen, was tun?').sort((a, b) => b.text.length - a.text.length)[0]   // die Ueberschrift kommt auch im Inhaltsverzeichnis vor
  const z2 = C.explodiereTabellen([stoer], 1600).find(z => z.text.includes('Wasser läuft aus.'))
  assert.equal(z2.text, text(chunks.find(c => c.text.includes('Störungen: Wasser läuft aus.')).id))
})
test('chunking: feste Länge mit Überlappung, Sätze, Markdown', () => {
  const t = 'abcdefghij'.repeat(10)
  const f = C.chunkeFest(t, { groesse: 30, overlap: 5 })
  assert.equal(f[0].text.length, 30); assert.equal(f[1].start, 25)
  assert.ok(f.every(c => c.text.length <= 30))
  const s = C.chunkeSaetze('Eins. Zwei! Drei? Vier.', { groesse: 12, overlap: 0 })
  assert.deepEqual(s.map(c => c.text), ['Eins. Zwei!', 'Drei? Vier.'])
  const m = C.chunkeMarkdown('# A\ntext a\n## B\ntext b\n')
  assert.deepEqual(m.map(x => x.ueberschrift), ['A', 'B'])
  assert.equal(m[1].text, '## B\ntext b')
  const g = C.begrenzeLaenge([{ text: 'Satz eins. Satz zwei. Satz drei. Satz vier.' }], { groesse: 4, overlap: 2, zaehler: (x) => x.split(/\s+/).length })
  assert.ok(g.length >= 2 && g.every(c => c.text.split(/\s+/).length <= 4))
})

/* ---------------------------------------------------------------- Terminal */
import { neueWelt, fuehreAus, zustandTrifft, schrittErfuellt } from '../assets/terminal.js'
const lauf = (w, ...zeilen) => zeilen.map(z => fuehreAus(w, z)).at(-1)
test('terminal mac: klonen, venv, aktivieren, installieren, starten', () => {
  const w = neueWelt('mac', { lmStudioLaeuft: true, modelle: ['gemma-4-12b-it-mlx'] })
  assert.match(lauf(w, 'git clone https://github.com/swrobuts/SiemensWashingMachineTroubleShooting_LocalLLM.git').zeilen[0].text, /Cloning into/)
  assert.equal(zustandTrifft(w, { datei: 'SiemensWashingMachineTroubleShooting_LocalLLM/requirements.txt' }), true)
  lauf(w, 'cd SiemensWashingMachineTroubleShooting_LocalLLM')
  assert.equal(zustandTrifft(w, { pfad: '~/Projekte/SiemensWashingMachineTroubleShooting_LocalLLM' }), true)
  assert.equal(lauf(w, 'python server.py').hinweis, 'kein-modul')
  lauf(w, 'python3.12 -m venv .venv'); assert.equal(zustandTrifft(w, { venvVorhanden: true, venvPython: '3.12' }), true)
  assert.equal(zustandTrifft(w, { venvAktiv: true }), false)
  lauf(w, 'source .venv/bin/activate'); assert.equal(zustandTrifft(w, { venvAktiv: true }), true)
  assert.match(lauf(w, 'python -m pip install -r requirements.txt').zeilen.at(-1).text, /Successfully installed/)
  assert.equal(zustandTrifft(w, { pakete: true }), true)
  lauf(w, 'cp profiles/local/.env.example profiles/local/.env')
  assert.equal(zustandTrifft(w, { datei: 'SiemensWashingMachineTroubleShooting_LocalLLM/profiles/local/.env' }), true)
  assert.equal(lauf(w, 'python lokale_ki.py "Was bedeutet E:18?"').hinweis, undefined)   // genau ein Chatmodell: Autoauswahl
  assert.equal(zustandTrifft(w, { antwortErhalten: true }), true)
  const r = lauf(w, 'python server.py'); assert.match(r.zeilen[1].text, /Running on http:\/\/127\.0\.0\.1:3001/)
  assert.equal(zustandTrifft(w, { serverLaeuft: true }), true)
  assert.match(lauf(w, 'curl http://127.0.0.1:3001/api/health').zeilen[0].text, /"status":"ok"/)
})
test('terminal: Fehlerbilder', () => {
  const w = neueWelt('mac', { lmStudioLaeuft: false, modelle: ['a', 'b'], geklont: true })
  lauf(w, 'cd SiemensWashingMachineTroubleShooting_LocalLLM', 'python3 -m venv .venv', 'source .venv/bin/activate')
  assert.equal(lauf(w, 'python -m pip install -r requirements.txt').hinweis, 'python-version')
  lauf(w, 'deactivate', 'rm -rf .venv', 'python3.12 -m venv .venv', 'source .venv/bin/activate', 'python -m pip install -r requirements.txt', 'cp profiles/local/.env.example profiles/local/.env')
  assert.equal(lauf(w, 'curl http://127.0.0.1:1234/v1/models').hinweis, 'lms-aus')
  assert.equal(lauf(w, 'python lokale_ki.py "Was bedeutet E:18?"').hinweis, 'lms-aus')
  w.lmStudio.laeuft = true
  assert.equal(lauf(w, 'python lokale_ki.py "Was bedeutet E:18?"').hinweis, 'modell-id')
  lauf(w, 'echo "LOCAL_LLM_MODEL=a" >> profiles/local/.env')
  assert.equal(zustandTrifft(w, { profil: 'LOCAL_LLM_MODEL=a' }), true)
  assert.equal(lauf(w, 'python lokale_ki.py "Was bedeutet E:18?"').hinweis, undefined)
  assert.equal(lauf(w, 'python -m pytest -q').hinweis, 'kein-pytest')
  lauf(w, 'python -m pip install -r requirements-dev.txt'); assert.match(lauf(w, 'python -m pytest -q').zeilen.at(-1).text, /86 passed/)
  const w2 = neueWelt('win', { lmStudioLaeuft: true, modelle: ['a'], geklont: true, portBelegt: true })
  lauf(w2, 'cd SiemensWashingMachineTroubleShooting_LocalLLM', 'py -3.12 -m venv .venv', '.venv\\Scripts\\activate', 'python -m pip install -r requirements.txt', 'copy profiles\\local\\.env.example profiles\\local\\.env')
  assert.equal(zustandTrifft(w2, { venvAktiv: true, pakete: true }), true)
  assert.equal(lauf(w2, 'python server.py').hinweis, 'port-belegt')
  assert.match(lauf(w2, 'cd nix').zeilen[0].text, /Set-Location/)
  assert.match(lauf(w2, 'dir').zeilen[0].text, /requirements.txt/)
})
test('schrittErfuellt: Muster und Zustand, erwarteter Fehler', () => {
  const w = neueWelt('mac', { geklont: true }); lauf(w, 'cd SiemensWashingMachineTroubleShooting_LocalLLM')
  const r = fuehreAus(w, 'python3.12 -m venv .venv')
  assert.equal(schrittErfuellt(w, { muster: '-m venv', zustand: { venvVorhanden: true } }, 'python3.12 -m venv .venv', false, r), true)
  const f = fuehreAus(w, 'python server.py')
  assert.equal(schrittErfuellt(w, { erwarteterFehler: 'kein-modul' }, 'python server.py', false, f), true)
  assert.equal(schrittErfuellt(w, { zustand: { venvVorhanden: true } }, 'ls', true, fuehreAus(w, 'ls')), false)   // galt schon vorher
})
