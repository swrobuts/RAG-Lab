# RAG-Lab · Umsetzungsplan

Interaktive Lernumgebung zu Retrieval-Augmented Generation und Sprachmodellen für die
THWS Business School. Stand: 19. September 2026. Status: **Design freigegeben, Umsetzung läuft.**

Zielbild: Studierende arbeiten sich in zehn Labs von der Frage, was ein Sprachmodell tut, über
Dokumentaufbereitung, Chunking, Embeddings, Retrieval und Generierung bis zu Evaluation,
Architektur und dem eigenhändigen Nachbau eines RAG-Systems vor. Fallbeispiel ist der
**Waschmaschinen-Assistent** (Repository `swrobuts/SiemensWashingMachineTroubleShooting_LocalLLM`):
ein lokal laufender Handbuchassistent mit LlamaIndex, `multilingual-e5-small`,
`bge-reranker-v2-m3`, Flask und LM Studio bzw. OpenAI. Jede Zahl im Lab stammt aus dessen
Messprotokollen oder wird mit dessen Python-Umgebung reproduzierbar erzeugt.

Schwesterprojekte: DABA-Lab (Datenbanken), PROM-Lab (Prozessmodellierung), PITM-Lab (Werkzeuge),
BINT-Lab (Business Intelligence). Formsprache, Laufzeit und Prüfwerkzeuge folgen PROM und PITM.

---

## 1. Leitentscheidungen

| Entscheidung | Festlegung | Begründung |
|---|---|---|
| Plattform | Statische Seite auf GitHub Pages, Repo `swrobuts/RAG-Lab`, kein Build-Schritt, kein Server, keine Anmeldung | Wie alle Schwesterlabs; wartbar, datenschutzfrei |
| Laufzeit | `assets/prom.js`/`prom.css` werden zu `rag.js`/`rag.css` geforkt (Sprache, Fortschritt, Quiz, Navigation, Startseite); BPMN-Teile entfallen, RAG-Werkzeuge und Übungstypen kommen hinzu; `terminal.js` aus PITM wird für Python, pip, LM Studio umgebaut | Erprobtes Verhalten der Familie, kein Nachbau gelöster Dinge |
| Roter Faden | Die Frage „Was bedeutet E:18?“ läuft durch alle zehn Labs: tokenisiert, falsch beantwortet, gefunden, gechunkt, eingebettet, gesucht, belegt beantwortet, gemessen, ausgeliefert, nachgebaut | Ein konkreter Fall trägt weiter als zehn Themeninseln |
| Lebendes Stück | **Echtes Embedding-Modell im Browser**: transformers.js lädt `Xenova/multilingual-e5-small` (ONNX q8, 118 MB) und dessen Tokenizer (17 MB) vom Hugging-Face-Hub, erst auf Klick, danach im Browser-Cache | Das ist für RAG, was PGlite für DABA und bpmn-js für PROM ist: das Modell des Fallbeispiels läuft im Browserfenster |
| Fallback | Vorberechnete Vektoren, Trefferlisten und Reranker-Scores für einen Fragenkatalog (10 Evaluationsfragen, 4 Negativfälle, weitere Beispielfragen); die lebenden Stücke laufen damit ohne Hub, und die Seite sagt, was gerade nicht live ist | Hub kann gesperrt oder langsam sein; das Lab darf nie leer bleiben |
| Reranker | Bleibt vorberechnet (ONNX-Fassung 279 MB); jede Anzeige eines Reranker-Scores ist als vorberechnet gekennzeichnet | Zu schwer für den Browser; Ehrlichkeit vor Effekt |
| Eigenes LLM | Lab 07 spricht LM Studio oder Ollama direkt aus der Seite an (`/v1/models`, `/v1/chat/completions` mit Stream); Voraussetzung ist der CORS-Schalter des Servers. Ohne Server zeigt das Lab aufgezeichnete echte Antworten | Generierung erfahrbar machen, ohne Schlüssel oder Cloud; Safari-Grenze (kein Mixed Content zu localhost) wird erklärt |
| Sprachen | Deutsch und Englisch, `lang`-Spans wie in PROM; `verify.mjs` erzwingt Vollständigkeit | Einheit der Familie |
| Farbe | Helles Sandbeige `#EFE7D6` trägt die Flächen, Umbra `#2E2418` Text und Buttons, Terrakotta `#C4602A` signalisiert | Sandbeige kann keine weiße Schrift tragen; Kontraste: Umbra auf Sandbeige 12,6:1, Weiß auf Umbra 15,0:1, Terrakotta nur als Fläche, Textakzent `#9E4A1C` 6,2:1 auf Weiß |
| Daten | Kein Wert von Hand: `tools/*.py` lesen den persistierten Index, die Modelle und LM Studio des Fallbeispiels und schreiben `data/*.json`; `verify.mjs` vergleicht Zahlen im Text mit den Daten | Reproduzierbar, nachprüfbar, korrigierbar mit einem Lauf |
| Handbuchtexte | Chunks und Markdown des Siemens-Handbuchs werden mit Quellenhinweis mitgeliefert (bereits öffentlich im Fallbeispiel-Repo) | Kein Laufzeitzugriff auf fremde Repos |
| Öffentlichkeit | Repo öffentlich, Musterlösungen lesbar (Hinweis im README) | Selbstlernumgebung, kein Prüfungsinstrument |

---

## 2. Kapitelstruktur

Zehn Labs. Jedes Lab: Einordnung (Voraussetzung, Ziel, Zeit), Erklärabschnitte mit lebendem
Stück, Begriffskarte (Pendant zur Befehlskarte in DABA), Beleg am Fallbeispiel, drei bis sechs
Übungen, Zusammenfassung, Quellen.

| Lab | Titel | Lernziel (Sie können …) | Lebendes Stück | Übungen | Zeit |
|---|---|---|---|---|---|
| 01 | Sprachmodelle | erklären, was ein Token ist, wie ein Sprachmodell das nächste Token vorhersagt, was Kontextfenster, Temperatur, Halluzination und Wissensstand bedeuten | Tokenizer live (e5-Tokenizer); Temperatur-Regler auf echten Logits; Kontextfenster-Füllstand | 5 | 35 min |
| 02 | Warum RAG? | die Grenzen eines reinen Sprachmodells benennen und RAG gegen Fine-Tuning, Long Context und Prompting abgrenzen; Kosten- und Datenschutzgründe für lokale Modelle nennen | Ohne/mit Handbuch: dieselbe Frage nackt und per RAG (aufgezeichnet) | 5 | 30 min |
| 03 | Dokumente aufbereiten | ein PDF in Markdown überführen, OCR-Artefakte erkennen, Seitenmarker und Tabellen als Provenienz verstehen | PDF-Seite 33 neben dem Markdown | 5 | 30 min |
| 04 | Chunking | Chunking-Strategien vergleichen, Größe und Überlappung in Tokens begründen, Tabellenzeilen und Metadaten richtig behandeln | Chunking-Spielplatz am echten Handbuch | 6 | 40 min |
| 05 | Embeddings | Vektoren und Kosinusähnlichkeit erklären, das `query:`/`passage:`-Präfix begründen, Embedding-Modelle nach Sprache, Dimension und Länge auswählen | Embedding live; Vektorraum-Karte der 346 Chunks | 6 | 45 min |
| 06 | Retrieval und Reranking | Top-k-Suche, Hybrid mit Schlüsselwörtern, BM25 und RRF einordnen, Cross-Encoder-Reranking und Relevanzschwelle erklären | Such-Stepper mit Ablation | 6 | 45 min |
| 07 | Prompt und Generierung | einen Systemprompt für belegte Antworten schreiben, Kontext als Daten übergeben, strukturierte Ausgabe erzwingen, Tokenbudget und Streaming einordnen | Prompt-Baukasten; Bring your own LLM | 6 | 45 min |
| 08 | Evaluation und Guardrails | Hit@k, MRR und Abdeckung berechnen, Negativtests und Ablationen lesen, Grenzen von Stichwort-Proxys und Belegtreue erklären | Metrik-Rechner; Schwellen-Regler | 6 | 40 min |
| 09 | Architektur, Betrieb, Sicherheit | die Komponenten eines RAG-Systems und den API-Vertrag beschreiben, Cache-Invalidierung, Schlüsselschutz und Loopback-Betrieb begründen, Kosten lokal gegen Cloud schätzen | Klickbares Architekturdiagramm; Sequenzdiagramm; Kostenrechner | 5 | 35 min |
| 10 | Nachbauen | das Fallbeispiel auf dem eigenen Rechner einrichten, die Phasen des Aufbaus nachvollziehen und die typischen Fehlerbilder beheben | Nachgebildetes Terminal (mac/win); Fehlerbild-Sprechstunde | 5 | 45 min |

Summe: **55 Übungen**, rund 6,5 Stunden.

### Inhalt je Lab

**Lab 01 · Sprachmodelle.** Token und Tokenizer (Subwörter, SentencePiece/BPE, warum „Laugenpumpe“
in mehrere Stücke zerfällt, Tokenzahl DE gegenüber EN); Vorhersage des nächsten Tokens als
Wahrscheinlichkeitsverteilung; Transformer und Attention in Grundzügen; Training in drei Stufen
(Vortraining, Instruktion, Präferenz); Kontextfenster und warum 14.000 Zeichen Handbuch ein Budget
sind; Temperatur und Sampling; Halluzination als Folge des Verfahrens, nicht als Defekt;
Wissensstand (Cutoff). Roter Faden: „Was bedeutet E:18?“ wird tokenisiert.

**Lab 02 · Warum RAG?** Was das nackte Modell zu E:18 sagt (aufgezeichnet, gemma-4-12b) und was
das Handbuch sagt; die drei Lücken (Wissensstand, Firmenwissen, Belegbarkeit); Alternativen mit
Entscheidungskriterien: Prompting, Long Context, Fine-Tuning, RAG; Lewis et al. 2020 und der
Überblick von Gao et al. 2023; Kosten (Tokens, Anbieterpreise mit Stand), Datenschutz (lokal
gegenüber Cloud), warum das Fallbeispiel lokal läuft.

**Lab 03 · Dokumente aufbereiten.** PDF ist ein Druckformat, kein Textformat; Docling als Parser,
Alternativen (PyMuPDF, pypdf, Unstructured) mit Stand; Seitenmarker `<!-- pdf-page: N -->` als
Provenienz; Tabellen in Markdown; OCR-Artefakte am echten Beispiel (die Überschrift
„S t r ö n u , e g w a . ? s Notentriegelung“); warum die aktive Wissensdatei nicht blind ersetzt
wurde; Prüfung der Extraktion gegen das PDF.

**Lab 04 · Chunking.** Warum überhaupt zerlegen (Embedding-Länge 512 Tokens, Kontextbudget);
Strategien: feste Länge, Sätze, Markdown-Struktur, Tabellenzeilen-Explosion; Überlappung;
Token- statt Zeichenmaß mit dem Tokenizer des Embedding-Modells (440/40 im Fallbeispiel);
Metadaten (Abschnitt, Seite, Kontextgruppe) und warum sie nicht in den Embedding-Text gehören;
kuratierte Verfahrensgruppen (Pumpenreinigung mit Warnhinweis).

**Lab 05 · Embeddings.** Vektor, Dimension, Kosinusähnlichkeit (mit Rechnung); Bi-Encoder;
kontrastives Training; asymmetrische Präfixe bei e5 und der größte Retrieval-Fehler der
Ausgangsversion; Modellwahl (Sprache, Dimension, Maximallänge, Größe: e5-small, e5-base, bge-m3,
nomic); Vektorraum-Karte (PCA) mit Abschnittsfärbung; Grenzen der Ähnlichkeit („Wasser schießt aus
der Maschine“ gegenüber „Wasser läuft aus“).

**Lab 06 · Retrieval und Reranking.** Top-k-Vektorsuche, exakte und approximative Suche (HNSW),
Vektorspeicher (SimpleVectorStore, pgvector, Qdrant, Chroma); Hybrid: Fehlercode-Regex
(`E:18`, `E18`, `Fehler 18`, nicht `E:180`), BM25 und Reciprocal Rank Fusion als Einordnung (das
Fallbeispiel nutzt beides nicht); Cross-Encoder-Reranking (bge-reranker-v2-m3, Sigmoid,
Overfetch 12 → 5); Relevanzschwelle 0,15 und relativer Filter 0,5; Ablation 80 % → 90 % → 100 %.

**Lab 07 · Prompt und Generierung.** Rollen (System, Nutzer); der Systemprompt des Fallbeispiels
Satz für Satz; Kontext als JSON-Daten, nicht als Anweisung (Prompt-Injection); strukturierte
Ausgabe mit `summary`, `manual_intro`, `manual_steps`; Parser und Checkboxen; Temperatur 0;
Tokenbudget und abgeschnittene Antworten; Streaming (SSE) und warum die Query-Engine puffert;
Bring your own LLM: LM Studio, Ollama, OpenAI-kompatible API, CORS.

**Lab 08 · Evaluation und Guardrails.** Retrieval getrennt von Antwort messen; Hit@k, Hit@1, MRR,
Abdeckung; die zehn Fragen und ihre Stichwörter; Ablation als Experiment; Negativtests
(Hauptstadt, Gedicht, E:180, Bosch-Spülmaschine); Schwelle als Abwägung (falsche Ablehnung
gegenüber Halluzination); Belegtreue und Antwortqualität (RAGAS-Maße als Einordnung); Grenzen
kleiner Testbestände.

**Lab 09 · Architektur, Betrieb, Sicherheit.** Komponenten und Zuständigkeiten
(GUI, Flask, Retrieval, LLM-Client, Speicher); Ablauf einer Anfrage als Sequenz; SSE-Vertrag
(`status`, `meta`, `token`, `result`, `[DONE]`); Cache-Fingerprint (SHA-256 über Quelle, Modell,
Parser-Version, Chunk-Parameter) und FileLock; Schlüssel nur im Arbeitsspeicher, CSRF, Loopback,
Origin-Prüfung, CSP; Kosten lokal gegen Cloud mit den gemessenen Tokenzahlen; Grenzen
(Mehrbenutzer, Folgefragen).

**Lab 10 · Nachbauen.** Voraussetzungen (Python 3.12, Git, LM Studio, Speicher); Klonen, venv,
Installation, Profil, Modell-ID, Start, erste Frage, Tests, Eval-Lauf; die Phasen des echten
Aufbaus (Präfix-Fix, Persistenz, Reranking, Tabellen-Chunking, Hybrid, Quellen, SSE, Guardrail);
Fehlerbilder mit Ursache und Abhilfe (OneDrive-synchronisierte venv und Modellcache, mehrere
Chatmodelle ohne `LOCAL_LLM_MODEL`, Windows cp1252, Port belegt, HTML-Datei direkt geöffnet);
Übertragung auf ein eigenes Dokument.

---

## 3. Interaktionskonzept

Neun Übungstypen, jede mit sofortiger Rückmeldung. Die Definition liegt in
`data/uebungen/lab-XX.json`; die Seite enthält je Übung einen Platzhalter
`<div data-uebung="R06-03"></div>`, je lebendem Stück `<div data-werkzeug="suche"></div>`.

| Typ | Was Studierende tun | Wie geprüft wird | Herkunft |
|---|---|---|---|
| `quiz` | Einfach- oder Mehrfachauswahl | Vergleich mit `richtig`; Erklärung nach der Prüfung | PROM |
| `experiment` | Ein lebendes Stück bedienen, dann Fragen beantworten | wie `quiz`; die Übung nennt das Werkzeug und seine Voreinstellung | PROM `erkunden` |
| `zuordnen` | Begriffe, Fälle oder Maßnahmen auf Kategorien ziehen | paarweise gegen `ziel`; falsche Zuordnungen werden markiert | PITM |
| `sortieren` | Schritte oder Ereignisse in die richtige Reihenfolge bringen | Reihenfolge gegen `reihenfolge`; falsch platzierte Elemente werden markiert | neu |
| `rechnen` | Eine Zahl berechnen (Kosinus, MRR, Tokens, Kosten) | Betrag innerhalb `toleranz`; Lösungsweg nach der Prüfung | neu |
| `luecken` | Lücken in `.env`, Code oder Prompt füllen | je Lücke Liste zulässiger Werte oder Muster, Groß-/Kleinschreibung tolerant | neu |
| `belegen` | Sätze einer Modellantwort als belegt oder unbelegt gegen die Quellen markieren | Menge gegen `belegt`; Rückmeldung nennt übersehene und falsch markierte Sätze | neu |
| `terminal` | Befehle in der nachgebildeten Shell eingeben | Muster und Zustand der Welt (Pfad, venv, Pakete, Server, Profil) | PITM |
| `checkliste` | Schritte außerhalb des Browsers abarbeiten und bestätigen | Selbstbestätigung mit Prüffrage je Schritt | PITM |

Gemeinsame Felder: `id`, `typ`, `titel`, `aufgabe` (HTML), optional `hinweis` (aufklappbar) und
`rueckmeldung` (nach dem Lösen). Alle Texte `{ "de": …, "en": … }`.

**Fortschritt.** Gelöste Übungen unter `rag:fortschritt:<lab>`, Sprache unter `rag:sprache`,
Terminalzustand unter `rag:terminal:<id>`, LLM-Endpunkt unter `rag:llm`. Startseite mit Balken je
Lab und „Weiter mit Lab X · Aufgabe Y“ (Anker auf die erste offene Übung). „Lernfortschritt
zurücksetzen“ fragt nach und lässt Endpunkt und Terminalzustände stehen.

---

## 4. Lebende Stücke

Jedes Werkzeug ist ein Modul unter `assets/werkzeuge/` mit `baue(container, parameter, ctx)`,
registriert unter seinem Namen. Alle laufen mit vorberechneten Daten; wo ein geladenes Modell mehr
kann, sagt das Werkzeug es an Ort und Stelle.

| Name | Lab | Live mit Modell | Ohne Modell |
|---|---|---|---|
| `tokenizer` | 01, 04 | beliebiger Text in Tokens (Stücke, IDs, Anzahl) | Beispiele aus `data/tokens.json` |
| `temperatur` | 01 | – (Softmax über gespeicherte Logits läuft immer im Browser) | Regler 0–2, Verteilung, Ziehen einer Stichprobe, drei aufgezeichnete Fortsetzungen |
| `kontext` | 01, 07 | – | Füllstand eines Kontextfensters aus Systemprompt, Frage, k Chunks; Modellgrößen wählbar |
| `vergleich` | 02 | – | Frage, Antwort ohne Handbuch, Antwort mit Handbuch, Quellen, Tokens, Zeit (aufgezeichnet) |
| `seite` | 03 | – | PDF-Seite 33 als Bild neben dem Markdown-Ausschnitt, synchron scrollend, Artefakte anklickbar |
| `chunking` | 04 | Tokenzahl je Chunk exakt | drei Strategien, Regler Größe/Overlap, Zeichen-Schätzung; E:18-Zeile hervorgehoben |
| `embedding` | 05 | zwei Texte → Vektor-Ausschnitt, Kosinus; Präfix ein/aus | Katalogfragen mit gespeicherten Vektoren |
| `karte` | 05 | getippte Frage wird per PCA-Matrix projiziert | 346 Chunks als Punkte, Abschnittsfarbe, Hover-Text, Katalogfragen |
| `suche` | 06, 08 | Vektorstufe und Hybridstufe live; Reranker-Stufe nur für Katalogfragen | alle Stufen für Katalogfragen; Schwelle und Verhältnis als Regler |
| `prompt` | 07 | – | `messages`-JSON aus Systemprompt, Frage und Kontext; Zeichen- und Tokenbudget; Parser-Vorschau |
| `llm` | 07 | – | Endpunkt, Modellliste, Senden, SSE-Stream, Parser; ohne Server aufgezeichnete Antworten |
| `metrik` | 08 | – | zehn Fragen mit Rängen; Felder für Hit@5, Hit@1, MRR, Abdeckung; „Aufdecken“ |
| `schwelle` | 08 | – | 14 Fälle mit echten Scores auf einer Achse; Regler; Zähler für Ablehnungen und Annahmen |
| `architektur` | 09 | – | SVG mit Komponenten; Klick erklärt Datei, Aufgabe, Verbot |
| `kosten` | 09 | – | Tokens ein/aus, Preis je Million, Anfragen je Tag → Monatskosten Cloud gegen lokal |
| `terminal` | 10 | – | nachgebildete Shell, mac/win, Weltzustand (Python, venv, Pakete, LM Studio, Port) |

### Modell im Browser (`assets/modell.js`)

* transformers.js (Paket `@huggingface/transformers`, Stand bei Umsetzung prüfen) mitgeliefert unter
  `assets/transformers/` samt ONNX-Runtime-WASM; Modellgewichte kommen vom Hub
  (`Xenova/multilingual-e5-small`, `dtype: 'q8'`), weil 118 MB die Dateigrenze von GitHub überschreiten.
* Zwei Stufen: `ladeTokenizer()` (17 MB) und `ladeModell()` (118 MB), jeweils auf Klick mit
  Fortschrittsbalken, Größenangabe und Hinweis, dass die Dateien im Browser-Cache bleiben.
* `embed(text, { praefix })` liefert einen normalisierten 384-dim-Vektor (Mean Pooling), so dass
  Kosinus = Skalarprodukt. Ein Selbsttest vergleicht den Vektor einer Katalogfrage mit dem
  gespeicherten Python-Vektor (Kosinus > 0,99), sonst meldet das Werkzeug eine Abweichung.
* WebGPU, wenn vorhanden, sonst WASM. Kein Modell wird ohne Klick geladen.

### Eigenes LLM (`assets/werkzeuge/llm.js`)

* Endpunkt frei wählbar, Voreinstellung `http://localhost:1234/v1` (LM Studio), Alternative
  `http://localhost:11434/v1` (Ollama, braucht `OLLAMA_ORIGINS`).
* `GET /v1/models` füllt die Modellliste; `POST /v1/chat/completions` mit `stream: true` und den
  exakten `messages` des Fallbeispiels; SSE-Zeilen werden wie in `server.py` geparst.
* Fehlerbilder werden erklärt: CORS aus, Server aus, Safari-Mixed-Content, kein Chatmodell geladen.
* Kein Schlüssel wird gespeichert; OpenAI-Endpunkte werden nicht angeboten.

---

## 5. Daten und Werkzeuge

Alle Datendateien entstehen mit Skripten unter `tools/` aus dem Fallbeispiel-Repo
(Pfad per Argument oder `RAG_FALL` in der Umgebung) und dessen Python-Umgebung
(`/Users/robert/miniforge3/bin/python3.12`, llama-index 0.14, sentence-transformers 5.6,
torch 2.12). LM Studio muss für `aufzeichnen.py` laufen.

| Datei | Inhalt | Erzeugt von |
|---|---|---|
| `data/chunks.json` | 346 Chunks: `id`, `nr`, `abschnitt`, `gruppe`, `text`, `v` (384 Werte, 4 Nachkommastellen); Kopf mit Modell, Parser-Version, Cache-Schlüssel, Quelle | `export_chunks.py` aus `storage/docstore.json` und `default__vector_store.json` |
| `data/handbuch.md` | Markdown des Handbuchs (Kopie mit Quellenhinweis) | `export_chunks.py` |
| `data/fragen.json` | Fragenkatalog: 10 Evaluationsfragen, 4 Negativfälle, ca. 10 weitere; je Frage Vektor mit und ohne Präfix, Top-12 Vektortreffer (mit/ohne Präfix), Hybrid-Kandidaten, Reranker-Scores der Kandidaten, Kontextauswahl, Gedeckt-Entscheidung | `embed_fragen.py` mit e5-small und bge-reranker-v2-m3 |
| `data/projektion.json` | PCA: Mittelwert, zwei Komponenten (384 Werte), erklärte Varianz, 2D-Punkte aller Chunks | `projektion.py` (scikit-learn) |
| `data/antworten.json` | Aufgezeichnete Antworten: Frage, Modus (nackt / RAG), Anbieter, Modell, `messages`, Rohantwort, geparste Teile, Tokens, Sekunden, Datum | `aufzeichnen.py` gegen LM Studio (und die im Fallbeispiel protokollierten gpt-4.1-mini-Werte) |
| `data/logits.json` | Für ca. 6 Prompts die Top-20 nächsten Tokens mit Logits eines kleinen Modells und drei aufgezeichnete Fortsetzungen (T = 0 / 0,7 / 1,5) | `logits.py` (transformers, kleines Modell, Name mit Stand) |
| `data/tokens.json` | Tokenisierung von Beispieltexten (DE/EN) mit dem e5-Tokenizer | `tokens.py` |
| `data/eval/*.json` | Kopien der drei Ablationsprotokolle und der Negativtests | `export_chunks.py` |
| `assets/seite-33.png` | Gerenderte PDF-Seite 33 | `seite.py` (PyMuPDF) |

`verify.mjs` liest diese Dateien und prüft: Chunk-Zahl = 346, Dimension = 384, jede Katalogfrage
hat alle Stufen, Ablationswerte in den Texten stimmen mit `data/eval` überein (Marker
`<span data-wert="hybrid.rerank.hit5">100 %</span>` im HTML werden gegen die Daten geprüft).

---

## 6. Technische Architektur

```
index.html                     Übersicht: Hero, Kacheln, Gesamtfortschritt, „Wie das hier funktioniert“
lab-01-sprachmodelle.html      … lab-10-nachbauen.html
assets/
  rag.css                      Stylesheet (aus prom.css, Farben nach Abschnitt 7)
  rag.js                       Laufzeit: Sprache, LABS, Übungsboxen, Werkzeug-Registry, Fortschritt
  pruefung.js                  Reine Funktionen: Kosinus, Fehlercode-Regex, Hybrid, Schwelle, Kontextauswahl,
                               Antwort-Parser, Metriken, Prüfer je Übungstyp — Browser UND Tests
  chunking.js                  Strategien (fest, Sätze, Markdown, Tabellenzeilen) — Browser UND Tests
  modell.js                    transformers.js-Wrapper: Tokenizer, Embedding, Selbsttest, Fortschritt
  terminal.js                  Nachgebildete Shell (aus PITM): zsh und PowerShell, git, python, pip, lms, curl
  werkzeuge/<name>.js          Ein Modul je lebendem Stück (Abschnitt 4)
  transformers/                transformers.js und ONNX-Runtime-WASM, mitgeliefert, mit Lizenz
  diagramme/<name>-de.svg,-en  Aus Mermaid-Quellen erzeugte Diagramme
  seite-33.png
data/uebungen/lab-XX.json · chunks.json · handbuch.md · fragen.json · projektion.json · antworten.json
     logits.json · tokens.json · eval/
diagramme/quellen/*.mmd        Mermaid-Quellen (DE und EN je Datei über Platzhalter)
tools/
  export_chunks.py · embed_fragen.py · projektion.py · aufzeichnen.py · logits.py · tokens.py · seite.py
  gen_diagramme.mjs            Mermaid → SVG (mermaid-cli), beide Sprachen
  verify.mjs                   Abnahmelauf ohne Browser
  pruefung.test.mjs            Regressionstests für pruefung.js und chunking.js
  pruefung/durchlauf.js        Bedientest im Browser: löst jede Übung mit der Musterlösung
  pruefung/audit.js            Struktur, Sprache, Links, Überlauf, Alternativtexte
README.md · UMSETZUNGSPLAN.md · PRUEFBERICHT.md · QUELLEN.md · .nojekyll · .gitignore · package.json
```

`LABS` in `rag.js` bleibt die einzige Stelle für Reihenfolge, Umfang, Voraussetzung, Ziel und
Zeit. Übungsboxen entstehen wie in PROM aus JSON; Werkzeuge werden über `data-werkzeug` und
`data-parameter` (JSON) eingebunden.

---

## 7. Gestaltung

Aus `prom.css` mit neuer Palette; Struktur, Kopfleiste, Seitennavigation, Kacheln, Kästen,
Übungsboxen bleiben.

| Rolle | Wert | Verwendung |
|---|---|---|
| Sandbeige | `#EFE7D6` | Hero, weiche Abschnitte, aktive Navigation, Chips |
| Sand hell | `#F8F4EC` | Codeflächen, Tabellenzebra, Hinweiskästen |
| Sand dunkel | `#E2D6BC` | Haarlinien, Rahmen, Bänder |
| Umbra | `#2E2418` | Text, Überschriften, Buttons (weiße Schrift), Tabellenkopf |
| Umbra weich | `#5B4E3E` | Sekundärtext |
| Terrakotta | `#C4602A` | Akzentlinie, Badges, Fortschritt, Kachelnummern; nie als Schriftfarbe auf Weiß |
| Terrakotta dunkel | `#9E4A1C` | Links und Textakzente (6,2:1 auf Weiß) |
| Ok / Warnung | `#2F7D32` / `#B23B1E` | wie PROM |

Im englischen Modus wechselt der Textakzent auf Oliv `#6B6A1C`, die Leitfarbe bleibt.
Schrift Space Grotesk (Google Fonts) wie die Schwestern, Monospace für Code und Terminal.
Diagramme nutzen dieselbe Palette (Mermaid `themeVariables`). Kein Emoji; ✓ ✗ ▸ · erlaubt.

---

## 8. Recherche, Quellen, Texte

Jede fachliche Aussage wird vor dem Schreiben belegt und mit Stand versehen. Quellen je Lab am
Ende der Seite und gesammelt in `QUELLEN.md`. Kernliteratur: Vaswani et al. 2017 (Transformer);
Brown et al. 2020 (In-Context Learning); Ouyang et al. 2022 (Instruktion und Präferenz);
Sennrich et al. 2016 und Kudo/Richardson 2018 (Tokenisierung); Lewis et al. 2020 (RAG); Gao et al.
2023 (RAG-Überblick); Karpukhin et al. 2020 (Dense Passage Retrieval); Wang et al. 2022/2024 (E5,
multilingual E5); Chen et al. 2024 (BGE M3, Reranker); Robertson/Zaragoza 2009 (BM25); Cormack
et al. 2009 (RRF); Malkov/Yashunin 2018 (HNSW); Liu et al. 2023 (Lost in the Middle); Es et al.
2023 (RAGAS); Ji et al. 2023 (Halluzination). Werkzeugdokumentation: LlamaIndex, Docling,
sentence-transformers, transformers.js, LM Studio, Ollama, OpenAI-API, MDN (SSE, Mixed Content),
GitHub Pages. Anbieterpreise nur mit Datum.

Nach jedem Schreibdurchgang läuft `/folientext-pruefen` über Einleitungen, Karten, Merksätze und
Übungstexte: Rahmensätze, Bildbeschreibungen, Wichtigkeitsbehauptungen und Metaphern fliegen;
Zahlangaben werden gegen die Daten geprüft. Englische Fachbegriffe bleiben englisch (Embedding,
Chunk, Reranker, Guardrail, Token, Prompt); Denglisch bleibt draußen.

---

## 9. Prüfung und Veröffentlichung

```bash
node --test tools/pruefung.test.mjs       # Kosinus, Regex, Schwelle, Parser, Metriken, Chunking, Prüfer je Typ
node tools/verify.mjs                     # Platzhalter ↔ JSON, beide Sprachen, LABS-Zahlen, Daten, Zahlen im Text
```

Bedientest im Browser (`tools/pruefung/durchlauf.js`, `audit.js`) in DE und EN bei 390, 768 und
1440 px; Modell-Ladeweg (Hub) und Fallback (Hub gesperrt) getrennt geprüft; Bring your own LLM
gegen das laufende LM Studio mit CORS an und aus.

```bash
gh repo create swrobuts/RAG-Lab --public --source=. --push
gh api repos/swrobuts/RAG-Lab/pages -X POST -f source[branch]=main -f source[path]=/
```

Danach SHA-256 von `assets/rag.js`, `data/chunks.json`, einer Übungsdatei und einer Lab-Seite
zwischen lokal und `swrobuts.github.io/RAG-Lab` vergleichen. `.nojekyll` liegt bei.

---

## 10. Arbeitspakete und Reihenfolge

| Nr | Paket | Ergebnis |
|---|---|---|
| 1 | Grundgerüst | Ordner, `rag.css` mit Palette, `rag.js` aus PROM (Sprache, LABS, Fortschritt, Quiz), `index.html`, leere Lab-Seiten, `verify.mjs`, `package.json`, Git |
| 2 | Datenpipeline | `tools/*.py`, alle `data/*.json`, `seite-33.png`, `verify.mjs` prüft die Daten |
| 3 | Bewertung | `pruefung.js`, `chunking.js` mit Tests; Übungstypen `zuordnen`, `sortieren`, `rechnen`, `luecken`, `belegen`, `checkliste` in `rag.js` |
| 4 | Modell | `modell.js`, vendored transformers.js, Werkzeuge `tokenizer`, `embedding`, `karte`, `suche` |
| 5 | Übrige Werkzeuge | `temperatur`, `kontext`, `vergleich`, `seite`, `chunking`, `prompt`, `llm`, `metrik`, `schwelle`, `architektur`, `kosten` |
| 6 | Terminal | `terminal.js` für Lab 10 mit Welt, Befehlen, Fehlerbildern; Übungstyp `terminal` |
| 7 | Inhalte | Recherche und Text je Lab (01–10), Übungsdateien, Diagramme aus Mermaid, Quellen |
| 8 | Textdurchsicht | `/folientext-pruefen` über alle Seiten und Übungen, Zahlangaben gegen Daten |
| 9 | Abnahme | Tests, verify, Browser-Durchlauf DE/EN, drei Breiten, Modell-Ladeweg, LLM live, PRUEFBERICHT.md |
| 10 | Veröffentlichung | README, GitHub-Repo, Pages, SHA-Vergleich |

---

## 11. Risiken und offene Punkte

| Risiko | Umgang |
|---|---|
| Hugging-Face-Hub aus Hochschulnetzen gesperrt oder langsam | Fallback auf Katalogdaten ist Pflicht in jedem Werkzeug; Hinweis mit Größe vor dem Laden |
| transformers.js-Version (4.x) weicht in API oder Pooling von der Doku ab | Selbsttest gegen gespeicherten Python-Vektor; Version im README festhalten |
| ONNX-q8-Vektoren weichen leicht von den Python-fp32-Vektoren ab | Kosinus-Selbsttest mit Schwelle 0,99; Abweichung wird im Werkzeug genannt, nicht verschwiegen |
| Safari blockt Aufrufe an `http://localhost` von HTTPS | Erklärung im Lab; lokaler Aufruf über `python -m http.server` als Ausweg |
| LM Studio ändert Oberfläche oder CORS-Schalter | Schritte mit Stand und Screenshot-freiem Text; CLI-Weg `lms server start --cors` als zweite Route |
| Handbuchtexte urheberrechtlich | Kurze Chunks und Markdown wie im öffentlichen Fallbeispiel; Quellenhinweis; keine PDF-Kopie außer Seite 33 als Abbildung |
| Preise und Modellnamen veralten | Jede Zahl mit Datum; Kostenrechner mit editierbaren Preisen |
| Umfang (55 Übungen, zwei Sprachen) | Arbeitspakete 1–6 zuerst, damit jede Übung sofort lauffähig ist; Inhalte labweise mit Zwischenständen |
