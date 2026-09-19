# Prüfbericht RAG-Lab

Stand: 19.09.2026. Die Abschnitte folgen dem Umsetzungsplan: Textdurchsicht (Arbeitspaket 8),
Abnahme (Arbeitspaket 9), Veröffentlichung (Arbeitspaket 10).

## Textdurchsicht (Verfahren „Folientext prüfen“)

Lauf: `node tools/pruefung/texte.mjs` sammelt 1 632 Texte (821 DE, 811 EN) aus `.lab-intro`,
dem ersten Absatz jedes Abschnitts, den Kästen, Bildunterschriften, Begriffskarten,
Zusammenfassungen, allen Feldern der Übungsdateien und den Wörterbüchern der Werkzeuge; zwei
Mustersuchen (Floskeln, Meta und Metaphern, je DE und EN) und ein Vergleich aller
Einleitungstexte auf Wortgleichheit. Dazu wurden alle 110 Einleitungstexte einzeln gelesen und
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
