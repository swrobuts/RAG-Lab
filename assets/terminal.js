/**
 * RAG-Lab · Nachgebildete Kommandozeile fuer Lab 10
 *
 * Aus PITM-Lab uebernommen und auf das Fallbeispiel umgebaut: ein Dateibaum im
 * Speicher, zwei Shells (zsh auf dem Mac, PowerShell auf Windows) und die
 * Werkzeuge, die der Nachbau braucht - git, python/py, pip, curl, lms. Die
 * Ausgaben sind den echten nachempfunden, einschliesslich der Fehlerbilder aus
 * dem Pruefbericht des Fallbeispiels (venv ohne 3.12, mehrdeutige Modell-ID,
 * Port belegt, LM Studio aus). Hinweise der Umgebung sind uebersetzt und mit
 * → markiert; die Werkzeugausgaben bleiben englisch wie im Original.
 *
 * Der reine Teil (Welt, Befehle, Pruefung) hat keinen DOM-Bezug und laeuft in
 * tools/pruefung.test.mjs; baueTerminal() haengt die Oberflaeche daran.
 */
const ordner = (kinder = {}) => ({ typ: 'ordner', kinder })
const datei = (inhalt = '') => ({ typ: 'datei', inhalt })
export const REPO = 'SiemensWashingMachineTroubleShooting_LocalLLM'
export const REPO_URL = `https://github.com/swrobuts/${REPO}.git`
const PAKETE = ['flask==3.1.3', 'llama-index-core==0.14.24', 'llama-index-embeddings-huggingface==0.8.0', 'sentence-transformers==6.1.0', 'transformers==5.17.0', 'torch==2.14.0', 'openai==2.54.0', 'python-dotenv==1.2.3', 'filelock==4.0.1']
const ANTWORT_E18 = [
  'Der Fehlercode E:18 weist auf eine Verstopfung im Bereich der Laugenpumpe oder des Abflusssystems hin.', '',
  'Hier sind die Ursachen und Abhilfen für den Fehlercode E:18 gemäß dem Handbuch:', '',
  '- [ ] **Ursache:** Laugenpumpe verstopft.', '- [ ] **Abhilfe:** Laugenpumpe reinigen (siehe Seite 30).',
  '- [ ] **Ursache:** Ablaufschlauch/Abflussrohr verstopft.', '- [ ] **Abhilfe:** Ablaufschlauch am Siphon reinigen (siehe Seite 31).', '',
  'Quelle: Handbuch: Hinweise im Anzeigefeld · Querverweise auf Seite 30/31']
const MODELLE_STANDARD = ['gemma-4-12b-it-mlx', 'qwen3.5-27b-claude-4.6-opus-distilled-mlx', 'gemma-4-31b-it-mlx', 'text-embedding-nomic-embed-text-v1.5']

const projekt = () => ordner({
  'README.md': datei('# Waschmaschinen-RAG: LM Studio und OpenAI in einer Anwendung\n'),
  'requirements.txt': datei('# Tested together on Python 3.12 (2026-09-19).\n' + PAKETE.join('\n') + '\n'),
  'requirements-dev.txt': datei('-r requirements.txt\npytest==9.1.1\n'),
  'server.py': datei('"""Local web app. Model/index loading is lazy; imports and health checks are cheap."""\n'),
  'rag_engine.py': datei('"""RAG-Infrastruktur: lokale Embeddings + persistenter Vektorindex."""\n'),
  'llm_client.py': datei('"""One OpenAI-compatible client for the local model, CLI and PageIndex."""\n'),
  'lokale_ki.py': datei('"""Terminal client using exactly the same retrieval and prompt as the web app."""\n'),
  'parser.py': datei('"""Export structured Markdown with actual physical PDF page provenance."""\n'),
  '.env.example': datei('HOST=127.0.0.1\nPORT=3001\nLLM_PROVIDER=local\nRETRIEVAL_MODE=hybrid\nANSWER_MAX_TOKENS=1024\nCONTEXT_MAX_CHARS=14000\n'),
  'siemens-handbuch.pdf': datei('%PDF-1.6 (48 Seiten)'), 'siemens_wissen.md': datei('## Ihre neue Waschmaschine\n…\n'),
  profiles: ordner({
    local: ordner({ '.env.example': datei('LOCAL_LLM_ENDPOINT=http://127.0.0.1:1234/v1\n# Exact LM Studio model identifier. Leave blank only with exactly one chat model.\nLOCAL_LLM_MODEL=\n') }),
    openai: ordner({ '.env.example': datei('# Model configuration only. Enter the API key in the local web interface.\nOPENAI_MODEL=gpt-4.1-mini\n') })
  }),
  eval: ordner({ 'questions.json': datei('{ "questions": [ … 10 Fragen … ] }'), 'run_eval.py': datei('') }),
  tests: ordner({}), docs: ordner({}), storage: ordner({})
})

export function neueWelt (os = 'mac', szenario = {}) {
  const w = {
    os, benutzer: 'studi', rechner: os === 'mac' ? 'macbook' : 'PC-BA', pfad: ['~', 'Projekte'],
    wurzel: ordner({ Projekte: ordner({}) }), venv: null, aktiv: false, pakete: new Set(), devPakete: false,
    lmStudio: { laeuft: szenario.lmStudioLaeuft ?? true, cors: false, modelle: szenario.modelle || MODELLE_STANDARD },
    portBelegt: !!szenario.portBelegt, server: false, modelleGeprueft: false, antwortErhalten: false, testsGelaufen: false, indexGebaut: false, historie: []
  }
  if (szenario.geklont) w.wurzel.kinder.Projekte.kinder[REPO] = projekt()
  return w
}

/* ------------------------------------------------------------------ Pfade */
const knoten = (w, teile) => { let k = w.wurzel; for (const t of teile.slice(1)) { if (!k || k.typ !== 'ordner' || !k.kinder[t]) return null; k = k.kinder[t] } return k }
const aufloesen = (w, p) => {
  const sep = /[\\/]+/
  let teile = p.startsWith('~') || p.startsWith('/') || /^[A-Za-z]:/.test(p) ? ['~'] : [...w.pfad]
  for (const t of p.replace(/^~[\\/]?|^[A-Za-z]:[\\/](Users[\\/]studi[\\/]?)?|^\//, '').split(sep).filter(Boolean)) {
    if (t === '..') { if (teile.length > 1) teile.pop() } else if (t !== '.') teile.push(t)
  }
  return teile
}
const pfadText = (w) => (w.os === 'mac' ? w.pfad.join('/') : 'C:\\Users\\studi' + w.pfad.slice(1).map(t => '\\' + t).join(''))
export const prompt = (w) => (w.aktiv ? '(.venv) ' : '') + (w.os === 'mac' ? `${w.benutzer}@${w.rechner} ${w.pfad.at(-1)} %` : `PS ${pfadText(w)}>`)
const chatModelle = (w) => w.lmStudio.modelle.filter(m => !/embed/i.test(m))
const profil = (w) => { const k = knoten(w, ['~', 'Projekte', REPO, 'profiles', 'local', '.env']); return k && k.typ === 'datei' ? k.inhalt : null }
const imProjekt = (w) => w.pfad.length >= 3 && w.pfad[1] === 'Projekte' && w.pfad[2] === REPO

/* ---------------------------------------------------------------- Befehle */
const A = (text) => ({ art: 'aus', text }), F = (text) => ({ art: 'fehler', text }), H = (text) => ({ art: 'hinweis', text })
const unbekannt = (w, cmd) => ({ zeilen: [F(w.os === 'mac' ? `zsh: command not found: ${cmd}` : `${cmd} : The term '${cmd}' is not recognized as the name of a cmdlet, function, script file, or operable program.`)], hinweis: 'unbekannt' })
const keinPfad = (w, p, cmd = 'cd') => ({ zeilen: [F(w.os === 'mac' ? `${cmd}: no such file or directory: ${p}` : `${cmd === 'cd' ? 'Set-Location' : 'Get-Item'}: Cannot find path '${p}' because it does not exist.`)], hinweis: 'kein-pfad' })

function python (w, argv) {
  let exe = argv[0]
  if (exe === 'py' && argv[1] === '-3.12') { argv = ['python3.12', ...argv.slice(2)]; exe = 'python3.12' }
  else if (exe === 'py') { argv = ['python', ...argv.slice(1)]; exe = 'python' }
  if (argv[1] === '--version' || argv[1] === '-V') {
    if (w.aktiv) return { zeilen: [A(`Python ${w.venv.python === '3.12' ? '3.12.12' : (w.venv.python === '3.9' ? '3.9.6' : '3.13.2')}`)] }
    if (exe === 'python3.12') return { zeilen: [A('Python 3.12.12')] }
    return { zeilen: [A(w.os === 'mac' ? 'Python 3.9.6' : 'Python 3.13.2')] }
  }
  if (argv[1] === '-m' && argv[2] === 'venv') {
    const ziel = argv[3] || '.venv'
    if (!imProjekt(w)) return { zeilen: [H(`→ Zuerst in den Projektordner wechseln: cd ${REPO}`)], hinweis: 'nicht-im-projekt' }
    const version = exe === 'python3.12' ? '3.12' : (w.os === 'mac' ? '3.9' : '3.13')
    const proj = knoten(w, w.pfad)
    proj.kinder[ziel] = ordner({ bin: ordner({ activate: datei(''), python: datei('') }), Scripts: ordner({ activate: datei(''), 'Activate.ps1': datei('') }), 'pyvenv.cfg': datei(`version = ${version}`) })
    w.venv = { python: version, name: ziel }; w.aktiv = false; w.pakete.clear(); w.devPakete = false
    return { zeilen: [H(`→ Virtuelle Umgebung ${ziel} mit Python ${version === '3.12' ? '3.12.12' : version} angelegt.`)] }
  }
  if (!w.aktiv || !w.venv) {
    if (argv[1] === '-m' && argv[2] === 'pip') return { zeilen: [F(w.os === 'mac' ? 'error: externally-managed-environment' : 'ERROR: Could not install packages due to an OSError: [WinError 5] Access is denied'), H('→ Ohne aktive venv landen Pakete in der System-Installation. Erst aktivieren: source .venv/bin/activate (Mac) bzw. .venv\\Scripts\\activate (Windows).')], hinweis: 'venv-inaktiv' }
    if (/\.py$/.test(argv[1] || '')) return { zeilen: [A('Traceback (most recent call last):'), A(`  File "${argv[1]}", line 1, in <module>`), F("ModuleNotFoundError: No module named 'flask'"), H('→ Die Pakete sind nicht in der aktiven Umgebung. venv aktivieren und installieren.')], hinweis: 'kein-modul' }
  }
  if (argv[1] === '-m' && argv[2] === 'pip' && argv[3] === 'install') {
    if (w.venv.python !== '3.12') return { zeilen: [A('Collecting flask==3.1.3'), F('ERROR: Ignored the following versions that require a different python version: 2.14.0 Requires-Python >=3.12'), F('ERROR: Could not find a version that satisfies the requirement torch==2.14.0 (from -r requirements.txt)'), H(`→ Diese venv nutzt Python ${w.venv.python}; das Projekt braucht 3.12. venv löschen und mit python3.12 (Mac) bzw. py -3.12 (Windows) neu anlegen.`)], hinweis: 'python-version' }
    const dev = argv.some(a => a.includes('dev'))
    const zeilen = PAKETE.map(p => A(`Collecting ${p}`))
    zeilen.push(A('Downloading torch-2.14.0 (…)'), A('Installing collected packages: ' + PAKETE.map(p => p.split('==')[0]).join(', ') + (dev ? ', pytest' : '')), A('Successfully installed ' + PAKETE.map(p => p.replace('==', '-')).join(' ') + (dev ? ' pytest-9.1.1' : '')))
    PAKETE.forEach(p => w.pakete.add(p.split('==')[0])); if (dev) w.devPakete = true
    return { zeilen }
  }
  if (argv[1] === '-m' && argv[2] === 'pytest') {
    if (!w.devPakete) return { zeilen: [F('No module named pytest'), H('→ python -m pip install -r requirements-dev.txt')], hinweis: 'kein-pytest' }
    if (!imProjekt(w)) return { zeilen: [F('ERROR: file or directory not found: tests')], hinweis: 'falscher-ordner' }
    w.testsGelaufen = true; return { zeilen: [A('......................................................................................'), A('86 passed in 12.31s')] }
  }
  if (/\.py$/.test(argv[1] || '')) {
    if (!w.pakete.has('flask')) return { zeilen: [A('Traceback (most recent call last):'), F("ModuleNotFoundError: No module named 'flask'"), H('→ python -m pip install -r requirements.txt')], hinweis: 'kein-modul' }
    if (!imProjekt(w)) return { zeilen: [F(`python: can't open file '${argv[1]}': [Errno 2] No such file or directory`), H(`→ Die Skripte liegen im Projektordner: cd ~/Projekte/${REPO}`)], hinweis: 'falscher-ordner' }
    const lade = w.indexGebaut
      ? [A('INFO:rag_engine:Lade persistenten Index aus storage (Cache-Treffer).')]
      : [A('INFO:rag_engine:Baue Index neu (Quelle/Konfiguration geaendert): storage'), A('INFO:rag_engine:Index gebaut und persistiert (346 Abschnitte).')]
    if (argv[1] === 'server.py') {
      if (w.portBelegt) return { zeilen: [F('OSError: [Errno 48] Address already in use'), H('→ Port 3001 ist belegt: alten Server beenden oder in .env PORT=3002 setzen.')], hinweis: 'port-belegt' }
      w.server = true; w.indexGebaut = true
      return { zeilen: [A(" * Serving Flask app 'server'"), A(' * Running on http://127.0.0.1:3001'), H('→ Jetzt http://127.0.0.1:3001 im Browser öffnen. Der erste Suchlauf lädt die Modelle und baut den Index; nicht die HTML-Datei direkt öffnen.')] }
    }
    if (argv[1] === 'lokale_ki.py') {
      if (!w.lmStudio.laeuft) return { zeilen: [...lade, F('openai.APIConnectionError: Connection error.'), H('→ LM Studio läuft nicht oder der Server ist aus. In LM Studio den lokalen Server starten (Port 1234).')], hinweis: 'lms-aus' }
      const p = profil(w); const id = p && (p.match(/^LOCAL_LLM_MODEL=(.+)$/m) || [])[1]
      if (!id && chatModelle(w).length !== 1) return { zeilen: [...lade, F('RuntimeError: LOCAL_LLM_MODEL auf die genaue ID des geladenen Chatmodells setzen.'), H(`→ LM Studio bietet ${chatModelle(w).length} Chatmodelle an; die Autoauswahl ist nicht eindeutig. Die ID in profiles/local/.env eintragen (curl …/v1/models zeigt sie).`)], hinweis: 'modell-id' }
      if (id && !w.lmStudio.modelle.includes(id.trim())) return { zeilen: [...lade, F(`openai.NotFoundError: Error code: 404 - model "${id.trim()}" not found`), H('→ Die ID muss genau der in LM Studio angezeigten entsprechen (curl http://127.0.0.1:1234/v1/models).')], hinweis: 'modell-falsch' }
      w.indexGebaut = true; w.antwortErhalten = true
      return { zeilen: [...lade, ...ANTWORT_E18.map(A)] }
    }
    if (argv[1] === 'eval/run_eval.py' || argv[1] === 'eval\\run_eval.py') {
      w.indexGebaut = true
      return { zeilen: [A('🔎 Eval — Embedding: intfloat/multilingual-e5-small | top_k=12 → Rerank(BAAI/bge-reranker-v2-m3) → 5'), A('✅ [wasser-austritt] Recall 60% | 1. Treffer Rang 1 | [\'ablaufschlauch\', \'verschraubung\', \'zulaufschlauch\']'), A('✅ [fehler-e18] Recall 100% | 1. Treffer Rang 1 | [\'abflussrohr\', \'ablaufschlauch\', \'laugenpumpe\', \'verstopft\']'), A('… (acht weitere Fragen)'), A('=================================================='), A('Trefferquote (≥1 Stichwort in Top-5): 10/10 = 100%'), A('hit@1 (Top-Knoten relevant):               10/10 = 100%'), A('MRR (mittlerer reziproker Rang):            1.00'), A('Ø Recall über alle Stichwörter:            93%')] }
    }
    if (argv[1] === 'parser.py') return { zeilen: [A('48 PDF-Seiten exportiert: siemens_wissen_neu.md')] }
    return { zeilen: [A(`→ ${argv[1]} ausgeführt.`)] }
  }
  return { zeilen: [A(w.os === 'mac' ? 'Python 3.9.6 (default, …)\n>>> (interaktive Sitzung; mit exit() beenden)' : 'Python 3.13.2\n>>> (interaktive Sitzung; mit exit() beenden)')] }
}

const CMDS = {
  pwd: (w) => ({ zeilen: [A(pfadText(w))] }),
  ls: (w, a) => {
    const arg = a.slice(1).find(x => !x.startsWith('-')); const k = knoten(w, arg ? aufloesen(w, arg) : w.pfad)
    if (!k || k.typ !== 'ordner') return keinPfad(w, arg, 'ls')
    const alle = a.some(x => /^-.*a/.test(x)); const namen = Object.keys(k.kinder).filter(n => alle || !n.startsWith('.')).sort()
    return { zeilen: [A(namen.join(w.os === 'mac' ? '  ' : '\n') || '')] }
  },
  cd: (w, a) => { const t = a[1] ? aufloesen(w, a[1]) : ['~']; const k = knoten(w, t); if (!k || k.typ !== 'ordner') return keinPfad(w, a[1] || ''); w.pfad = t; return { zeilen: [] } },
  cat: (w, a) => { const k = knoten(w, aufloesen(w, a[1] || '')); if (!k || k.typ !== 'datei') return keinPfad(w, a[1] || '', 'cat'); return { zeilen: k.inhalt.replace(/\n$/, '').split('\n').map(A) } },
  cp: (w, a) => {
    const q = knoten(w, aufloesen(w, a[1] || '')); const zt = aufloesen(w, a[2] || ''); const zo = knoten(w, zt.slice(0, -1))
    if (!q || q.typ !== 'datei' || !zo) return keinPfad(w, a[1] || '', 'cp')
    zo.kinder[zt.at(-1)] = datei(q.inhalt); return { zeilen: [] }
  },
  rm: (w, a) => {
    const ziel = a.slice(1).find(x => !x.startsWith('-')); if (!ziel) return { zeilen: [F('usage: rm [-f | -i] [-dIPRrvWx] file ...')], hinweis: 'fehler' }
    const t = aufloesen(w, ziel); const o = knoten(w, t.slice(0, -1)); const name = t.at(-1)
    if (!o || !o.kinder[name]) return keinPfad(w, ziel, 'rm')
    if (o.kinder[name].typ === 'ordner' && !a.some(x => /^-.*r/i.test(x))) return { zeilen: [F(`rm: ${name}: is a directory`)], hinweis: 'ordner' }
    delete o.kinder[name]
    if (w.venv && name === w.venv.name) { w.venv = null; w.aktiv = false; w.pakete.clear(); w.devPakete = false }
    return { zeilen: [] }
  },
  mkdir: (w, a) => { const t = aufloesen(w, a[1] || ''); const o = knoten(w, t.slice(0, -1)); if (!o) return keinPfad(w, a[1] || '', 'mkdir'); o.kinder[t.at(-1)] = ordner(); return { zeilen: [] } },
  echo: (w, a, roh) => {
    const m = /^echo\s+(.+?)\s*(>>|>)\s*(\S+)$/.exec(roh)
    if (!m) return { zeilen: [A(a.slice(1).join(' '))] }
    const inhalt = m[1].replace(/^["']|["']$/g, ''); const t = aufloesen(w, m[3]); const o = knoten(w, t.slice(0, -1))
    if (!o) return keinPfad(w, m[3], 'echo')
    const alt = o.kinder[t.at(-1)]; o.kinder[t.at(-1)] = datei((m[2] === '>>' && alt ? alt.inhalt : '') + inhalt + '\n'); return { zeilen: [] }
  },
  git: (w, a) => {
    if (a[1] === 'clone') {
      if (!a[2] || !a[2].includes(REPO)) return { zeilen: [F(`fatal: repository '${a[2] || ''}' not found`)], hinweis: 'repo' }
      const name = a[3] || a[2].replace(/\.git$/, '').split('/').at(-1); const o = knoten(w, w.pfad)
      if (o.kinder[name]) return { zeilen: [F(`fatal: destination path '${name}' already exists and is not an empty directory.`)], hinweis: 'existiert' }
      o.kinder[name] = projekt()
      return { zeilen: [A(`Cloning into '${name}'...`), A('remote: Enumerating objects: 412, done.'), A('Receiving objects: 100% (412/412), 8.31 MiB | 6.20 MiB/s, done.'), A('Resolving deltas: 100% (231/231), done.')] }
    }
    if (a[1] === 'status') return imProjekt(w) ? { zeilen: [A('On branch main'), A("Your branch is up to date with 'origin/main'."), A('nothing to commit, working tree clean')] } : { zeilen: [F('fatal: not a git repository (or any of the parent directories): .git')], hinweis: 'kein-repo' }
    if (a[1] === 'log') return imProjekt(w) ? { zeilen: [A('5a3f74c Fix synced model cache and blank summary-only answers'), A('eec74d4 Unify local and OpenAI RAG with session-only GUI keys and validated retrieval'), A('dc85695 feat(guardrail): refuse to hallucinate when the question isn\'t in the manual'), A('1a52f03 feat(phase1+): table-row chunking + hybrid error-code retrieval'), A('d9f62d9 feat(phase1): two-stage retrieval — vector overfetch + cross-encoder rerank'), A('0266af9 feat(phase0): e5 prefix fix, persistent index, retrieval eval harness'), A('538ad35 chore: initial baseline of Siemens washing-machine troubleshooting LLM')] } : { zeilen: [F('fatal: not a git repository (or any of the parent directories): .git')], hinweis: 'kein-repo' }
    return unbekannt(w, 'git ' + (a[1] || ''))
  },
  source: (w, a) => {
    if (w.os !== 'mac') return unbekannt(w, 'source')
    if (!w.venv || !/activate$/.test(a[1] || '')) return keinPfad(w, a[1] || '', 'source')
    w.aktiv = true; return { zeilen: [] }
  },
  deactivate: (w) => { w.aktiv = false; return { zeilen: [] } },
  curl: (w, a) => {
    const u = a.find(x => x.startsWith('http')) || ''
    if (u.includes(':1234')) {
      if (!w.lmStudio.laeuft) return { zeilen: [F("curl: (7) Failed to connect to 127.0.0.1 port 1234 after 2 ms: Couldn't connect to server"), H('→ In LM Studio den lokalen Server starten (Developer-Ansicht, „Start Server“).')], hinweis: 'lms-aus' }
      w.modelleGeprueft = true
      return { zeilen: [A(JSON.stringify({ data: w.lmStudio.modelle.map(id => ({ id, object: 'model', owned_by: 'organization_owner' })), object: 'list' }, null, 2))] }
    }
    if (u.includes(':3001')) return w.server ? { zeilen: [A('{"model_connection":"not_checked","status":"ok"}')] } : { zeilen: [F("curl: (7) Failed to connect to 127.0.0.1 port 3001 after 1 ms: Couldn't connect to server"), H('→ Der Server läuft nicht: python server.py in einem zweiten Terminal starten.')], hinweis: 'server-aus' }
    return { zeilen: [F('curl: (6) Could not resolve host')], hinweis: 'host' }
  },
  lms: (w, a) => {
    if (a[1] === 'server' && a[2] === 'start') { w.lmStudio.laeuft = true; w.lmStudio.cors = a.includes('--cors'); return { zeilen: [A('Starting server...'), A(`Success! Server is now running on port 1234${w.lmStudio.cors ? ' (CORS enabled)' : ''}`)] } }
    if (a[1] === 'ls') return { zeilen: [A('LLMs (Large Language Models)'), ...chatModelle(w).map(m => A('  ' + m))] }
    return unbekannt(w, 'lms ' + (a[1] || ''))
  },
  open: (w, a) => ({ zeilen: [H(`→ Der Browser öffnet ${a[1] || ''}.`)] }),
  clear: () => ({ zeilen: [], leeren: true }),
  exit: () => ({ zeilen: [H('→ Diese Sitzung bleibt offen; „Zurücksetzen“ stellt den Ausgangszustand her.')] })
}
const ALIAS = {
  win: { dir: 'ls', type: 'cat', copy: 'cp', del: 'rm', md: 'mkdir', start: 'open', cls: 'clear', 'Get-ChildItem': 'ls', 'Get-Content': 'cat', 'Copy-Item': 'cp', 'Remove-Item': 'rm', 'Set-Location': 'cd', 'Get-Location': 'pwd', 'New-Item': 'mkdir', 'Clear-Host': 'clear' },
  mac: {}
}
const NUR_WIN = ['dir', 'type', 'copy', 'del', 'md', 'cls', 'start']

export function fuehreAus (w, roh) {
  const zeile = String(roh || '').trim(); if (!zeile) return { zeilen: [] }
  w.historie.push(zeile); if (w.historie.length > 100) w.historie.shift()
  const argv = (zeile.match(/"[^"]*"|'[^']*'|\S+/g) || []).map(t => t.replace(/^["']|["']$/g, ''))
  let cmd = argv[0]
  if (w.os === 'win' && /(^|[\\/])\.venv[\\/]Scripts[\\/][Aa]ctivate(\.ps1|\.bat)?$/.test(cmd)) {
    if (!w.venv) return { zeilen: [F(`${cmd} : The term '${cmd}' is not recognized as the name of a cmdlet, function, script file, or operable program.`), H('→ Erst die venv anlegen: py -3.12 -m venv .venv')], hinweis: 'kein-pfad' }
    w.aktiv = true; return { zeilen: [] }
  }
  if (w.os === 'mac' && cmd === '.') { cmd = 'source'; argv[0] = 'source' }
  if (/^python(3(\.\d+)?)?$|^py$/.test(cmd)) return python(w, argv)
  if (w.os === 'mac' && NUR_WIN.includes(cmd)) return unbekannt(w, cmd)
  cmd = ALIAS[w.os][cmd] || cmd
  const f = CMDS[cmd]; if (!f) return unbekannt(w, argv[0])
  const erg = f(w, argv, zeile)
  if (erg.zeilen.some(z => z.art === 'fehler') && !erg.hinweis) erg.hinweis = 'fehler'
  return erg
}

/* ---------------------------------------------------------------- Pruefung */
export function zustandTrifft (w, z) {
  if (!z) return true
  if (z.pfad != null && w.pfad.join('/') !== z.pfad) return false
  if (z.datei) { const k = knoten(w, aufloesen(w, z.datei.startsWith('~') ? z.datei : `~/Projekte/${z.datei}`)); if (!k) return false }
  if (z.venvVorhanden && !w.venv) return false
  if (z.venvPython && (!w.venv || w.venv.python !== z.venvPython)) return false
  if (z.venvAktiv != null && w.aktiv !== z.venvAktiv) return false
  if (z.pakete && !w.pakete.has('flask')) return false
  if (z.devPakete && !w.devPakete) return false
  if (z.profil && !(profil(w) || '').includes(z.profil)) return false
  if (z.serverLaeuft && !w.server) return false
  if (z.cors && !w.lmStudio.cors) return false
  if (z.modelleGeprueft && !w.modelleGeprueft) return false
  if (z.antwortErhalten && !w.antwortErhalten) return false
  if (z.testsGelaufen && !w.testsGelaufen) return false
  return true
}
/**
 * Ist dieser Schritt durch die eingegebene Zeile erledigt? Drei Regeln (aus PITM):
 * nur der erste offene Schritt wird geprueft; ein Schritt ohne Muster verlangt
 * eine Aenderung; ein fehlgeschlagener Befehl zaehlt nur, wenn sein Hinweis als
 * erwarteterFehler Teil der Aufgabe ist.
 */
export function schrittErfuellt (w, schritt, zeile, vorher, ergebnis) {
  const fehl = !!(ergebnis && ergebnis.zeilen.some(z => z.art === 'fehler'))
  if (schritt.erwarteterFehler) { if (!fehl || ergebnis.hinweis !== schritt.erwarteterFehler) return false } else if (fehl) return false
  if (schritt.muster && !new RegExp(schritt.muster, 'i').test(zeile)) return false
  if (schritt.zustand) { if (!zustandTrifft(w, schritt.zustand)) return false; if (!schritt.muster && vorher) return false }
  return true
}

/* ------------------------------------------------------------------ Ablage */
export const serialisiere = (w) => JSON.stringify({ ...w, pakete: [...w.pakete] })
export const deserialisiere = (s) => { const w = JSON.parse(s); w.pakete = new Set(w.pakete || []); w.historie = w.historie || []; return w }

/* ------------------------------------------------------------- Oberflaeche */
const HINWEISE_EN = {
  'nicht-im-projekt': 'Change into the project folder first: cd ' + REPO,
  'venv-inaktiv': 'Without an active venv, packages land in the system installation. Activate first: source .venv/bin/activate (Mac) or .venv\\Scripts\\activate (Windows).',
  'kein-modul': 'The packages are not in the active environment. Activate the venv and install.',
  'python-version': 'This venv uses the wrong Python; the project needs 3.12. Delete the venv and recreate it with python3.12 (Mac) or py -3.12 (Windows).',
  'kein-pytest': 'python -m pip install -r requirements-dev.txt',
  'falscher-ordner': 'The scripts live in the project folder: cd ~/Projekte/' + REPO,
  'port-belegt': 'Port 3001 is taken: stop the old server or set PORT=3002 in .env.',
  'lms-aus': 'LM Studio is not running or its server is off. Start the local server in LM Studio (port 1234).',
  'modell-id': 'LM Studio offers several chat models; auto-selection is ambiguous. Put the ID into profiles/local/.env (curl …/v1/models shows it).',
  'modell-falsch': 'The ID must match the one LM Studio shows exactly (curl http://127.0.0.1:1234/v1/models).',
  'server-aus': 'The server is not running: start python server.py in a second terminal.',
  'kein-pfad': 'Path not found. ls (Mac) or dir (Windows) shows what is here.'
}
const OS_NAMEN = { mac: 'zsh · macOS', win: 'PowerShell · Windows' }
const TT = {
  leeren: { de: 'Leeren', en: 'Clear' }, zurueck: { de: 'Zurücksetzen', en: 'Reset' }, eingabe: { de: 'Befehl eingeben und mit Enter ausführen', en: 'Type a command and press Enter' },
  auftrag: { de: 'Auftrag', en: 'Task' }, fertig: { de: 'Alle Schritte erledigt.', en: 'All steps done.' }, lms: { de: 'LM Studio läuft', en: 'LM Studio is running' },
  gewechselt: { de: 'Shell gewechselt. Der Dateibaum bleibt.', en: 'Shell changed. The file tree stays.' }, terminal: { de: 'Terminal', en: 'Terminal' }
}
const el = (tag, klasse, text) => { const n = document.createElement(tag); if (klasse) n.className = klasse; if (text != null) n.textContent = text; return n }
const t = (o, lang) => (typeof o === 'string' ? o : (o[lang] ?? o.de))
const OS_SCHLUESSEL = 'rag:os'

export function baueTerminal (ziel, opt = {}, ctx) {
  const lang = () => ctx.lang()
  const fest = opt.os && opt.os !== 'alle' ? opt.os : null
  let osWahl = fest; if (!osWahl) { try { osWahl = localStorage.getItem(OS_SCHLUESSEL) || (navigator.platform.includes('Win') ? 'win' : 'mac') } catch { osWahl = 'mac' } }
  const key = opt.id ? `rag:terminal:${opt.id}` : null
  let welt = null
  if (key) { try { const s = localStorage.getItem(key); if (s) welt = deserialisiere(s) } catch { welt = null } }
  if (!welt || (fest && welt.os !== fest)) welt = neueWelt(osWahl, opt.szenario || {})
  const speichere = () => { if (key) { try { localStorage.setItem(key, serialisiere(welt)) } catch { /* egal */ } } }

  const kasten = el('div', 'terminal')
  const kopf = el('div', 'terminal-kopf'); const ampel = el('span', 'ampel'); ampel.append(el('i'), el('i'), el('i'))
  const shell = el('span', 'shell'); kopf.append(ampel, shell, el('span', 'spacer'))
  if (!fest) {
    for (const os of ['mac', 'win']) { const b = el('button', 'btn-mini os' + (welt.os === os ? ' aktiv' : ''), os === 'mac' ? 'Mac' : 'Windows'); b.type = 'button'; b.dataset.os = os; kopf.append(b) }
  }
  const lmsLab = el('label', 'lms-schalter'); const lmsCb = el('input'); lmsCb.type = 'checkbox'; lmsCb.checked = welt.lmStudio.laeuft; const lmsTxt = el('span'); lmsLab.append(lmsCb, ' ', lmsTxt); kopf.append(lmsLab)
  const btnLeeren = el('button', 'btn-mini'); const btnZurueck = el('button', 'btn-mini'); btnLeeren.type = btnZurueck.type = 'button'; kopf.append(btnLeeren, btnZurueck)
  kasten.append(kopf)
  const schirm = el('div', 'terminal-schirm'); schirm.setAttribute('role', 'log'); schirm.setAttribute('aria-live', 'polite'); kasten.append(schirm)
  const eingabeZeile = el('div', 'terminal-eingabe'); const promptSpan = el('span', 'prompt'); const eingabe = el('input'); eingabe.type = 'text'; eingabe.spellcheck = false; eingabe.autocapitalize = 'off'; eingabe.autocomplete = 'off'
  eingabeZeile.append(promptSpan, eingabe); kasten.append(eingabeZeile)
  let auftrag = null; let schritte = []
  if (opt.schritte && opt.schritte.length) { schritte = opt.schritte.map(s => ({ ...s, fertig: false })); auftrag = el('div', 'terminal-auftrag'); kasten.append(auftrag) }
  ziel.replaceChildren(kasten)

  const schreibe = (art, text) => { const z = el('div', art, text); schirm.append(z); schirm.scrollTop = schirm.scrollHeight }
  const zeichneKopf = () => {
    shell.textContent = `${OS_NAMEN[welt.os]} — ${pfadText(welt)}`; promptSpan.textContent = prompt(welt)
    eingabe.setAttribute('aria-label', t(TT.terminal, lang())); eingabe.placeholder = t(TT.eingabe, lang())
    btnLeeren.textContent = t(TT.leeren, lang()); btnZurueck.textContent = t(TT.zurueck, lang()); lmsTxt.textContent = t(TT.lms, lang())
    kopf.querySelectorAll('button.os').forEach(b => b.classList.toggle('aktiv', b.dataset.os === welt.os))
  }
  const zeichneAuftrag = () => {
    if (!auftrag) return
    auftrag.replaceChildren()
    const kz = el('div'); kz.append(el('strong', null, t(TT.auftrag, lang()) + ': '), document.createTextNode(`${schritte.filter(s => s.fertig).length} / ${schritte.length}`)); auftrag.append(kz)
    const ol = el('ol'); const naechster = schritte.find(s => !s.fertig)
    for (const s of schritte) ol.append(el('li', s.fertig ? 'erledigt' : (s === naechster ? 'aktuell' : null), t(s.text, lang())))
    auftrag.append(ol)
    if (schritte.every(s => s.fertig)) auftrag.append(el('div', 'gut', t(TT.fertig, lang())))
  }
  const offenerSchritt = () => schritte.find(s => !s.fertig) || null
  const pruefeSchritte = (zeile, vorher, ergebnis) => {
    const s = offenerSchritt(); if (!s) return
    if (!schrittErfuellt(welt, s, zeile, vorher, ergebnis)) return
    s.fertig = true; zeichneAuftrag()
    if (schritte.every(x => x.fertig) && opt.beiFertig) opt.beiFertig()
  }
  const verarbeite = (roh) => {
    const offen = offenerSchritt(); const vorher = offen ? zustandTrifft(welt, offen.zustand) : false
    schreibe('eingabe-zeile', `${prompt(welt)} ${roh}`)
    const r = fuehreAus(welt, roh)
    if (r.leeren) schirm.replaceChildren()
    for (const z of r.zeilen) {
      if (z.art === 'hinweis') schreibe('dim', lang() === 'en' && r.hinweis && HINWEISE_EN[r.hinweis] ? '→ ' + HINWEISE_EN[r.hinweis] : z.text)
      else schreibe(z.art === 'fehler' ? 'fehler' : 'aus', z.text)
    }
    zeichneKopf(); pruefeSchritte(roh.trim(), vorher, r); speichere()
  }
  let zeiger = welt.historie.length
  eingabe.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { const roh = eingabe.value; eingabe.value = ''; if (roh.trim()) verarbeite(roh); zeiger = welt.historie.length; return }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault(); const h = welt.historie; if (!h.length) return
      zeiger = Math.max(0, Math.min(h.length, zeiger + (e.key === 'ArrowUp' ? -1 : 1))); eingabe.value = zeiger === h.length ? '' : h[zeiger]
    }
  })
  kasten.addEventListener('click', (e) => { if (!['BUTTON', 'INPUT', 'LABEL'].includes(e.target.tagName)) eingabe.focus() })
  btnLeeren.addEventListener('click', () => schirm.replaceChildren())
  btnZurueck.addEventListener('click', () => {
    welt = neueWelt(welt.os, opt.szenario || {}); lmsCb.checked = welt.lmStudio.laeuft; schirm.replaceChildren(); schritte.forEach(s => { s.fertig = false }); zeiger = 0
    zeichneKopf(); zeichneAuftrag(); speichere()
  })
  kopf.querySelectorAll('button.os').forEach(b => b.addEventListener('click', () => {
    if (welt.os === b.dataset.os) return
    welt.os = b.dataset.os; welt.rechner = welt.os === 'mac' ? 'macbook' : 'PC-BA'
    try { localStorage.setItem(OS_SCHLUESSEL, welt.os) } catch { /* egal */ }
    zeichneKopf(); schreibe('dim', '→ ' + t(TT.gewechselt, lang())); speichere()
  }))
  lmsCb.addEventListener('change', () => { welt.lmStudio.laeuft = lmsCb.checked; speichere() })
  document.addEventListener('rag:sprache', () => { zeichneKopf(); zeichneAuftrag() })
  zeichneKopf(); zeichneAuftrag()
  return { get welt () { return welt }, verarbeite, schritte }
}
