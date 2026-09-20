# Herkunft der Daten

Alle Dateien in diesem Ordner wurden mit den Skripten unter `tools/` aus dem Fallbeispiel
[SiemensWashingMachineTroubleShooting_LocalLLM](https://github.com/swrobuts/SiemensWashingMachineTroubleShooting_LocalLLM)
erzeugt oder daraus kopiert (Stand 19.09.2026, Commit `375ae9b`; `betrieb.json` und die PageIndex-Protokolle unter `eval/` vom 20.09.2026, Commit `67834f2`; Code-Stand der Labs `faa573f`).

| Datei | Herkunft | Skript |
|---|---|---|
| `handbuch.md` | `siemens_wissen.md` des Fallbeispiels (Docling-Extraktion der Bedienungsanleitung) | `export_chunks.py` |
| `seite-33.md`, `../assets/seite-33.png` | Seite 33 der Anleitung, Docling-Export und Rendering | `seite.py` |
| `chunks.json`, `chunks-ohne-praefix.json` | `storage/docstore.json`, Vektoren neu berechnet mit `multilingual-e5-small` | `export_chunks.py` |
| `fragen.json` | 24 Fragen; zehn aus `eval/questions.json`, vier aus `negative-checks.json`, zehn eigene; Kandidaten und Reranker-Scores mit der Python-Umgebung des Fallbeispiels | `embed_fragen.py` |
| `eval/*.json` | Messprotokolle des Fallbeispiels, unverändert kopiert; `pageindex-baseline.json` und `pageindex.json` aus `eval/run_eval_pageindex.py` (20.09.2026) | `export_chunks.py` |
| `projektion.json` | PCA der 346 Chunk-Vektoren | `projektion.py` |
| `tokens.json` | Zählungen mit dem e5-Tokenizer | `tokens.py` |
| `logits.json` | Logits von `Qwen/Qwen2.5-0.5B` für vier Prompts | `logits.py` |
| `antworten.json` | Antworten von `gemma-4-12b-it-mlx` über LM Studio, aufgezeichnet | `aufzeichnen.py` |
| `umgebung.json` | Modellliste von LM Studio (`/api/v0/models`) | `umgebung.py` |
| `betrieb.json` | Fingerprint nachgerechnet, Speichergrößen, Header, Live-Tokens, Commits | `betrieb.py` |

## Rechte an den Handbuchtexten

Die Handbuchtexte sind Auszüge aus der Bedienungsanleitung einer Siemens-Waschmaschine.
Rechteinhaber ist BSH Hausgeräte GmbH (Marke Siemens). Die Auszüge werden hier ausschließlich
zu Lehrzwecken verwendet, um die Verarbeitung eines realen Dokuments durch ein RAG-System
nachvollziehbar zu machen; sie sind keine Reparaturanleitung und ersetzen nicht die
Sicherheits- und Kundendiensthinweise des Originals. Das Modell-Logo und die PDF-Datei sind
nicht enthalten.
