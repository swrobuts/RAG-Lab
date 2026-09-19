/** Klickbares Architekturdiagramm des Fallbeispiels: Komponente, Datei, Aufgabe, Verbot. */
import { el, txt, kopf } from './gemein.js'
const K = [
  { id: 'gui', x: 20, y: 110, w: 130, name: { de: 'Browser', en: 'Browser' }, datei: 'index.html',
    aufgabe: { de: 'Anbieter- und Suchumschalter, Frage senden, SSE lesen, Antwort und Quellen anzeigen. Maskiert alle Modell- und Nutzertexte vor der Darstellung.', en: 'Provider and search toggle, send the question, read SSE, show answer and sources. Escapes all model and user text before rendering.' },
    verbot: { de: 'Speichert nie einen API-Schlüssel (kein localStorage, kein Cookie).', en: 'Never stores an API key (no localStorage, no cookie).' } },
  { id: 'flask', x: 200, y: 110, w: 150, name: { de: 'Flask-App', en: 'Flask app' }, datei: 'server.py',
    aufgabe: { de: 'Validiert Eingaben (1–2 000 Zeichen, 16 KiB), prüft Loopback und Origin, orchestriert Retrieval und Antwort, streamt SSE.', en: 'Validates input (1–2,000 characters, 16 KiB), checks loopback and origin, orchestrates retrieval and answer, streams SSE.' },
    verbot: { de: 'Gibt nie eine ungeparste Modellantwort als Handbuchbeleg aus.', en: 'Never returns an unparsed model answer as manual evidence.' } },
  { id: 'rag', x: 400, y: 30, w: 160, name: { de: 'Hybrid-Retrieval', en: 'Hybrid retrieval' }, datei: 'rag_engine.py',
    aufgabe: { de: 'Chunking, Embeddings, Index, Fehlercode-Lookup, Reranking, Schwelle, Quellenangabe.', en: 'Chunking, embeddings, index, error-code lookup, reranking, threshold, source reference.' },
    verbot: { de: 'Nutzt nie einen Index, dessen Fingerprint nicht zu Quelle, Modell und Chunk-Parametern passt.', en: 'Never uses an index whose fingerprint does not match source, model and chunk parameters.' } },
  { id: 'store', x: 600, y: 30, w: 110, name: { de: 'Vektorspeicher', en: 'Vector store' }, datei: 'storage/*.json',
    aufgabe: { de: 'SimpleVectorStore, Docstore und Index-Metadaten als JSON; .cache_key hält den Fingerprint.', en: 'SimpleVectorStore, docstore and index metadata as JSON; .cache_key holds the fingerprint.' },
    verbot: { de: 'Kein Datenbankserver, keine Cloud.', en: 'No database server, no cloud.' } },
  { id: 'pageindex', x: 400, y: 190, w: 160, name: 'PageIndex', datei: 'pageindex_engine.py',
    aufgabe: { de: 'Vektorlose Auswahl: das Sprachmodell wählt Abschnitts-IDs aus Titeln und Zusammenfassungen (experimentell).', en: 'Vectorless selection: the language model picks section IDs from titles and summaries (experimental).' },
    verbot: { de: 'Akzeptiert nie IDs außerhalb des aktuellen Batches.', en: 'Never accepts IDs outside the current batch.' } },
  { id: 'llm', x: 200, y: 220, w: 150, name: { de: 'LLM-Client', en: 'LLM client' }, datei: 'llm_client.py',
    aufgabe: { de: 'Ein OpenAI-kompatibler Client für LM Studio und OpenAI; Profil je Anbieter; Temperatur 0; Streaming.', en: 'One OpenAI-compatible client for LM Studio and OpenAI; profile per provider; temperature 0; streaming.' },
    verbot: { de: 'Liest den OpenAI-Schlüssel nie aus Datei oder Umgebung.', en: 'Never reads the OpenAI key from a file or the environment.' } },
  { id: 'keys', x: 20, y: 220, w: 130, name: { de: 'Sitzungsschlüssel', en: 'Session keys' }, datei: 'session_keys.py',
    aufgabe: { de: 'Schlüssel nur im Arbeitsspeicher, je Browsersitzung, acht Stunden gültig; CSRF-Token im Cookie.', en: 'Keys only in memory, per browser session, valid for eight hours; CSRF token in the cookie.' },
    verbot: { de: 'Serialisiert nie auf Platte oder in Cookies.', en: 'Never serialises to disk or cookies.' } },
  { id: 'lms', x: 600, y: 190, w: 110, name: 'LM Studio', datei: 'http://127.0.0.1:1234/v1',
    aufgabe: { de: 'Lokaler OpenAI-kompatibler Server mit dem geladenen Chatmodell.', en: 'Local OpenAI-compatible server with the loaded chat model.' },
    verbot: { de: 'Verlässt den Rechner nicht.', en: 'Never leaves the machine.' } },
  { id: 'openai', x: 600, y: 270, w: 110, name: 'OpenAI API', datei: 'https://api.openai.com/v1',
    aufgabe: { de: 'Cloud-Alternative; Frage und Auszüge werden übertragen, Kosten entstehen je Token.', en: 'Cloud alternative; question and excerpts are transmitted, costs arise per token.' },
    verbot: { de: 'Wird nie ohne Schlüssel aus der Oberfläche aufgerufen.', en: 'Never called without a key entered in the interface.' } }
]
const KANTEN = [['gui', 'flask'], ['flask', 'rag'], ['flask', 'pageindex'], ['rag', 'store'], ['flask', 'llm'], ['flask', 'keys'], ['llm', 'lms'], ['llm', 'openai'], ['pageindex', 'llm']]
const L = { titel: { de: 'Architektur des Fallbeispiels: Komponente anklicken', en: 'Architecture of the case study: click a component' }, aufgabe: { de: 'Aufgabe', en: 'Task' }, verbot: { de: 'Darf nie', en: 'Must never' }, status: { de: 'nach docs/TECHNICAL.md des Fallbeispiels', en: 'after the case study’s docs/TECHNICAL.md' }, wahl: { de: 'Klicken Sie eine Komponente an.', en: 'Click a component.' } }
const ns = (t) => document.createElementNS('http://www.w3.org/2000/svg', t)
export function baue (wrap, p, ctx) {
  const k = kopf(wrap, L.titel, ctx)
  const svg = ns('svg'); svg.setAttribute('viewBox', '0 0 740 330'); svg.setAttribute('class', 'karte'); svg.setAttribute('role', 'img')
  const panel = el('div', 'concept-box'); wrap.append(svg, panel)
  let aktiv = p.aktiv || null
  const mitte = (c) => [c.x + c.w / 2, c.y + 22]
  const zeichne = () => {
    const lang = ctx.lang(); svg.replaceChildren()
    for (const [a, b] of KANTEN) {
      const A = K.find(c => c.id === a), B = K.find(c => c.id === b); const l = ns('line'); const [x1, y1] = mitte(A), [x2, y2] = mitte(B)
      l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2); l.setAttribute('stroke', '#C9C3B4'); l.setAttribute('stroke-width', '2'); svg.append(l)
    }
    for (const c of K) {
      const g = ns('g'); g.style.cursor = 'pointer'; g.setAttribute('tabindex', '0'); g.setAttribute('role', 'button')
      const r = ns('rect'); r.setAttribute('x', c.x); r.setAttribute('y', c.y); r.setAttribute('width', c.w); r.setAttribute('height', 44); r.setAttribute('rx', 8)
      r.setAttribute('fill', c.id === aktiv ? '#F5E3D6' : '#fff'); r.setAttribute('stroke', c.id === aktiv ? '#C4602A' : '#2E2418'); r.setAttribute('stroke-width', c.id === aktiv ? 2.5 : 1.5)
      const t = ns('text'); t.setAttribute('x', c.x + c.w / 2); t.setAttribute('y', c.y + 27); t.setAttribute('text-anchor', 'middle'); t.setAttribute('font-size', '13'); t.setAttribute('font-weight', '700'); t.setAttribute('fill', '#2E2418'); t.textContent = txt(c.name, lang)
      const ti = ns('title'); ti.textContent = c.datei; g.append(r, t, ti)
      const waehle = () => { aktiv = c.id; zeichne() }
      g.addEventListener('click', waehle); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); waehle() } })
      svg.append(g)
    }
    const c = K.find(x => x.id === aktiv)
    if (!c) panel.replaceChildren(el('p', null, txt(L.wahl, lang)))
    else panel.replaceChildren(el('h3', null, txt(c.name, lang)), el('p', null, c.datei), el('p', null, `${txt(L.aufgabe, lang)}: ${txt(c.aufgabe, lang)}`), el('p', null, `${txt(L.verbot, lang)}: ${txt(c.verbot, lang)}`))
    wrap.dataset.aktiv = aktiv || ''
  }
  zeichne(); document.addEventListener('rag:sprache', zeichne); k.status(L.status, '')
}
