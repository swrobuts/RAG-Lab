# Prüfbericht RAG-Lab

Stand: 19.09.2026. Die Abschnitte folgen dem Umsetzungsplan: Textdurchsicht (Arbeitspaket 8),
Abnahme (Arbeitspaket 9), Veröffentlichung (Arbeitspaket 10).

## Textdurchsicht (Verfahren „Folientext prüfen“)

Lauf: `node tools/pruefung/texte.mjs` sammelt 1 632 Texte (821 DE, 811 EN) aus `.lab-intro`,
dem ersten Absatz jedes Abschnitts, den Kästen, Bildunterschriften, Begriffskarten,
Zusammenfassungen, allen Feldern der Übungsdateien und den Wörterbüchern der Werkzeuge; zwei
Mustersuchen (Floskeln, Meta und Metaphern, je DE und EN) und ein Vergleich aller
Einleitungstexte auf Wortgleichheit. Dazu wurden alle 87 deutschen Einleitungstexte einzeln gelesen und
die Zahlwörter gegen die Seiten gezählt.

Ergebnis: 14 Mustertreffer, davon 6 geändert und 8 als Ausnahme vermerkt; 0 doppelte
Einleitungen; 20 Übungszahlen („Fünf Übungen“) stimmen mit den Übungsdateien überein; drei
weitere Zahlangaben korrigiert.

Geändert (Stelle · gestrichen · ersetzt durch):

- Lab 01, Einleitung · „Dieses Lab zeigt, warum:“ · der Text beginnt mit der Tatsache: „Ein Sprachmodell zerlegt Text in Tokens …“
- Lab 03, Einleitung · „Dieses Lab zeigt, was ein PDF speichert, wie der Parser Docling …“ · „Ein PDF speichert Glyphen an Koordinaten; der Parser Docling macht daraus Markdown …“
- Lab 02, Abschnitt „Vier Wege“ · „Die Tabelle stellt sie nach den Kriterien gegenüber … Aufwand beim Einrichten“ (Bildbeschreibung; nannte ein Kriterium, das in der Tabelle nicht steht) · Begründung der Wahl von RAG im Fallbeispiel: Quelle und Seite je Antwort, neuer Index statt neues Training
- Lab 09, Abschnitt „Komponenten“ · „Die Trennung ist die wichtigste Entscheidung der Architektur“ (Wichtigkeitsbehauptung) · die Tatsache: rag_engine.py kennt keine HTTP-Anfragen, server.py keine Vektoren; was die Trennung erlaubt
- Lab 09, Abschnitt „Eine Anfrage“ · „acht Routen“ · „zehn Routen, fünf davon unter /api“ (gezählt in server.py: zehn Dekoratoren @app.get/@app.post)
- Lab 09, Bildunterschrift Architektur · „drei Zonen“ · „vier Zonen: Browser, Daten, lokaler Server, Sprachmodell“ (das Diagramm hat vier Bereiche)
- Lab 10, Einleitung · „drei Zeilen für LM Studio“ · „eine Modell-ID für LM Studio“ (die Zahl hatte kein Gegenstück auf der Seite)
- Lab 03, Abschnitt „Docling“ · „Der Parser des Fallbeispiels ist neun Zeilen lang“ · „Die Funktion convert() im Parser hat neun Zeilen“ (die Datei hat 19 Codezeilen, die Funktion neun)
- Übung R08-01, Aufgabe · „Die Tabelle zeigt für die Variante …“ · „Für die Variante „Vektor allein“ stehen in der Tabelle je Frage …“

Ausnahmen (gemeldet, nicht geändert):

- Übung R05-04, Aufgabe und Antwortoption „Die Karte zeigt …“: Übungstext; die Aufgabe erklärt die Bedienung des Kartenwerkzeugs, die Option ist eine Antwortmöglichkeit, deren Wortlaut die Frage vorgibt.
- Lab 07, Abschnitt „Eigenes Modell“, „Diese Seite kann dasselbe tun wie server.py“: die Seite ist hier der handelnde Akteur (der Client, der die Nachrichten baut und sendet), keine Selbstbeschreibung.
- Übung R01-03, Erklärung „Das Modell hat diese Seite nie gesehen“: gemeint ist die Handbuchseite, keine Webseite.
- Übung R07-06, Prüffrage und Option „Warum braucht diese Seite CORS …“: Übungsfrage; die Seite ist Akteur mit anderer Herkunft als der Server.
- Einleitungen aller Labs („Dieses Lab rechnet die Kosinusähnlichkeit vor, erklärt …“): Inhaltsangaben mit benannten Mechanismen und Zahlen (Modellnamen, Messwerte, Dateinamen); sie bleiben, weil sie sagen, was die Seite tut, nicht dass sie wichtig sei.

## Abnahme

Stand: 20.09.2026, lokal über `http://localhost:8777/RAG-Lab/` (Python-http.server) im
eingebauten Chromium-Browser der Claude-Desktop-App.

Läufe:

- `npm test`: 21 Tests bestanden (Prüflogik, Metriken gegen die drei Protokolle, Chunking-Port, Terminal in beiden Shells).
- `npm run verify`: 986 Prüfungen ohne Befund – Labs und Übungen (55, neun Typen), Werkzeuge (16), Datendateien, 235 `data-wert`-Marker und 3 `data-wert-text`-Blöcke in DE und EN, Rechenlösungen gegen die Daten (R09-04), Terminal-Musterlösungen in zsh und PowerShell, Commit-Hashes des Phasendiagramms gegen die Historie des Fallbeispiels.
- `tools/pruefung/durchlauf.js` auf allen zehn Lab-Seiten: 55 von 55 Übungen mit der Musterlösung „Richtig“; die beiden Terminal-Übungen zusätzlich in PowerShell.
- `tools/pruefung/audit.js` auf allen elf Seiten: keine Befunde (Überschriftenfolge, Alternativtexte, Beschriftungen, interne Links und Anker, Überlauf, Sprachumschaltung, deutsche Reste im EN-Modus, Werkzeuge, Prüfen-Knöpfe).
- Elf Seiten in DE und EN bei 390, 768 und 1 440 px Breite: kein horizontaler Überlauf.
- Modell im Browser (Lab 05): Laden 43 s beim ersten Mal (118 MB + 17 MB vom Hub, danach Cache API), Selbsttest Kosinus 0,9966 (E:18-Frage) und 0,9972 (Kindersicherung) gegen die Python-Vektoren; erster Vektor 9,3 s (WASM-Aufwärmen), danach 150–180 ms je Frage.
- Hub blockiert (`env.remoteHost` auf 0.0.0.0, Cache geleert): Fehlermeldung im Werkzeug, Status bleibt „Vorberechnete Vektoren“, Werkzeug arbeitet weiter.
- LLM-Werkzeug (Lab 07) gegen LM Studio ohne CORS: Fehlertext mit den Schritten zum Einschalten; „Senden“ gesperrt.
- Safari 26.5.2 (20.09.2026, Live-Seite, gesteuert über AppleScript „JavaScript von Apple Events“): `audit.js` auf allen elf Seiten ohne Befund, `durchlauf.js` 55/55 Übungen „Richtig“, kein Überlauf bei 390/768/1 440 px in DE und EN; Modell vom Hub in 12,6 s geladen (Cache API `transformers-cache`), Selbsttest 0,9966 / 0,9972, danach 20–56 ms je Vektor (schneller als Chromium); Such-Stepper mit eigener Frage live. LLM-Werkzeug: `fetch` an `http://localhost` scheitert mit „Load failed“ – auch gegen einen Prüfserver mit CORS-Headern –, und mit dem auf diesem Mac aktiven Modus „Nur HTTPS“ lädt Safari HTTP-Adressen gar nicht (WebKitErrorDomain 305), also auch nicht das lokal über `http://localhost:8777` geöffnete Lab. Fehlertext des Werkzeugs und Lab-07-Text entsprechend ergänzt.
- LLM-Werkzeug mit CORS (20.09.2026, `lms server start --cors`, gemma-4-12b-it-mlx): lokal (`http://localhost:8777`) und auf der Live-Seite (`https://swrobuts.github.io`, Chrome 152) verbunden mit drei Chatmodellen; Stream der E:18-Frage mit Kontext in 8,1–9,4 s, erstes Token nach 1,1–2,4 s, 396/149 Tokens, Ausgabe wächst sichtbar (47 → 220 → 365 → 461 Zeichen), drei Tags geparst (Laugenpumpe, Ablaufschlauch, Seiten 30/31); ohne Kontext 6,2 s, 50/122 Tokens, die „Wasserzufuhr“-Halluzination. Befund dabei: Der laufende LM-Studio-Server hatte den CORS-Schalter der Oberfläche nicht übernommen und musste neu gestartet werden; und Chrome fragt von einer HTTPS-Seite aus einmal je Site nach „Local Network Access“ (Chrome 142+), die Anfrage wartet bis zum Klick auf „Zulassen“ – Hinweis in Werkzeug und Text ergänzt. Der eingebettete Browser der Claude-Desktop-App blockt solche Aufrufe (`ERR_BLOCKED_BY_CLIENT`); geprüft wurde deshalb im regulären Chrome.

Behoben während der Abnahme:

- Werkzeug-Zwischenüberschriften waren `h4` unter `h2` (Überschriftensprung); jetzt `h3`.
- Checkbox-Schritte in Vergleich, Prompt-Baukasten und LLM-Werkzeug hatten keine Beschriftung; jetzt in `label` gefasst.
- Abschnittstitel des Handbuchs im Chunking-Werkzeug wurden im EN-Modus als deutsche Reste gemeldet; als Handbuchdaten markiert (`data-quelle`), nicht übersetzt.
- Bei 390 px schoben `select`-Felder mit langen Einträgen (Katalogfragen, Abschnittstitel) die Seite auf; `max-width: 100%`.
- Lange Link-Texte in den Quellen (Repository-Name) brachen nicht um; `overflow-wrap: anywhere`.
- Lab 08: Zähler des Schwellen-Reglers im Singular („1 Handbuchfrage abgelehnt“); Metrik-Tabelle mit Mindestbreiten.
- Lab 09: die CSP in der Header-Tabelle durfte nicht umbrechen; Klasse `umbruch`.

Grenzen:

- Firefox wurde nicht geprüft.
- Die Modell-Ladezeit hängt von Verbindung und Rechner ab; die 43 s sind ein Einzelwert auf einem Mac mit Apple Silicon.

## Veröffentlichung

Stand: 20.09.2026. Repository [github.com/swrobuts/RAG-Lab](https://github.com/swrobuts/RAG-Lab),
GitHub Pages aus `main` (Wurzel), Live-Adresse <https://swrobuts.github.io/RAG-Lab/>.

- Der erste Push wurde vom Push-Schutz von GitHub abgewiesen: Der Secret-Scanner hielt den Klassennamen `Mistral3ForConditionalGeneration` (32 Zeichen) in der mitgelieferten `assets/transformers/transformers.min.js` für einen Mistral-API-Schlüssel. Nach Rücksprache wurde der Treffer über die API als Fehlalarm freigegeben (`push-protection-bypasses`, Grund `false_positive`); der Push-Schutz des Repositorys ist wieder eingeschaltet.
- SHA-256 lokal gegen live gleich für `assets/rag.js`, `data/chunks.json`, `data/uebungen/lab-06.json`, `lab-06-retrieval.html`, `assets/transformers/ort-wasm-simd-threaded.asyncify.wasm`, `assets/diagramme/architektur-de.svg`.
- Live geprüft (Chromium der Desktop-App): Startseite mit Kennzahlen 10 · 55 · 346 · 24; Lab 06 lädt das Modell vom Hub in 16,5 s, Selbsttest 0,9966, eigene Frage läuft durch die Vektorstufe; Lab 07 gegen LM Studio ohne CORS zeigt den Fehlertext (Chromium erlaubt den Aufruf von HTTPS an `http://localhost`, LM Studio antwortet ohne CORS-Header); Lab 10 Terminal mit dem Fehlerbild „venv mit Python 3.9“.

## Textdurchsicht, zweiter Lauf (20.09.2026, nach der Abnahme)

Derselbe Lauf wie oben über 1 407 Texte (708 DE, 699 EN; die Zählung ist kleiner, weil der
erste Lauf jeden Abschnittsabsatz doppelt einsammelte): 8 Mustertreffer, alle bereits als
Ausnahmen begründet (R05-04, Lab 07 „Diese Seite“, R01-03, R07-06); 0 doppelte Einleitungen;
alle 87 Einleitungen erneut gelesen, die seit dem ersten Lauf geänderten Stellen einzeln.

Geändert:

- Lab 03, Einleitung · Satzrest aus dem ersten Lauf („… und warum das Fallbeispiel eine neue Extraktion erst prüft“ hing ohne Hauptsatz) · „…: Symbole, Bilder, eine zerschossene Überschrift. Deshalb prüft das Fallbeispiel jede neue Extraktion gegen das PDF, bevor es die aktive Wissensdatei ersetzt.“ (DE und EN)
- Lab 07, Abschnitt „Eigenes Modell“ · „einmal je Seite um Erlaubnis“ · „einmal je Website“ (die Chrome-Berechtigung gilt je Website, nicht je Seite)
- Lab 07 und LLM-Werkzeug · Hinweis zum CORS-Schalter · Zusatz „wirkt erst nach einem Neustart des Servers“ (Befund der Abnahme)

Keine weiteren Rahmensätze, Bildbeschreibungen, Wichtigkeitsbehauptungen oder Metaphern;
die 20 Übungszahlen („Fünf/Sechs Übungen“) stimmen mit den Übungsdateien überein.

## Nachtrag PageIndex (20.09.2026)

Das Fallbeispiel hat am 20.09.2026 den PageIndex-Modus umgebaut (Commit `faa573f`:
Fehlercode-Vorfilter, deutsche Stichwort-Kurzfassungen) und erstmals gemessen. Aufgenommen:

- `data/eval/pageindex-baseline.json` und `pageindex.json` (kopiert), `data/betrieb.json`
  neu erzeugt (35 Commits, Block `pageindex` mit Knotenzahl und Voreinstellungen).
- Lab 08: neuer Abschnitt „Ohne Vektoren: PageIndex“ mit Tabelle vorher/nachher
  (Hit@5, Hit@1, MRR, Abdeckung, Tokens und Aufrufe je Frage) und Einordnung der Kosten;
  Lab 09: Architekturzeile PageIndex mit Tokens, Aufrufen und Sekunden; Lab 10:
  Historie 35 Commits bis `faa573f`, Git-Graph mit elftem Commit (SVG neu erzeugt).
- `tools/verify.mjs`: 25 neue Werte (`eval.pageindex.*`, `eval.pageindexAlt.*`,
  `pageindex.*`) und zwei Strukturprüfungen der Protokolle; `npm run verify`
  1036 Prüfungen ohne Befund, `tools/pruefung/texte.mjs` unverändert 8 Mustertreffer
  (alle Bestand, keine im neuen Text), `npm test` grün.
