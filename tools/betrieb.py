"""Betriebsdaten des Fallbeispiels fuer Lab 09: Cache-Fingerprint nachgerechnet,
Groesse des Vektorspeichers, Schutzmassnahmen aus server.py, Tokenzahlen des Live-Protokolls.
Liest nur; importiert compute_cache_key aus dem Fallbeispiel (lazy Imports dort, kein torch noetig)."""
from __future__ import annotations
import hashlib, json, re
from fall import FALL, pruefe_fall, schreibe

pruefe_fall()
import rag_engine  # noqa: E402  (nur leichte Importe: hashlib, json, dotenv)

md = FALL / "siemens_wissen.md"
gespeichert = (FALL / "storage/.cache_key").read_text(encoding="utf-8").strip()
nachgerechnet = rag_engine.compute_cache_key(md, rag_engine.DEFAULT_EMBED_MODEL)
# Dieselbe Rechnung ohne das Fallbeispiel, damit der Weg im Lab nachvollziehbar ist
h = hashlib.sha256()
h.update(md.read_bytes()); h.update(b"\x00")
h.update(rag_engine.DEFAULT_EMBED_MODEL.encode()); h.update(b"\x00")
h.update(rag_engine.PARSER_VERSION.encode())
h.update(json.dumps([rag_engine.MAX_NODE_CHARS, rag_engine.CHUNK_TOKENS, rag_engine.CHUNK_OVERLAP, "e5-prefix-v1"]).encode())
von_hand = h.hexdigest()
assert nachgerechnet == von_hand, "Nachrechnung weicht von compute_cache_key ab"
# Was passiert bei einem anderen Modell oder einem geaenderten Zeichen?
anderes_modell = rag_engine.compute_cache_key(md, "intfloat/multilingual-e5-base")
h2 = hashlib.sha256(); h2.update(md.read_bytes() + b" "); h2.update(b"\x00")
h2.update(rag_engine.DEFAULT_EMBED_MODEL.encode()); h2.update(b"\x00"); h2.update(rag_engine.PARSER_VERSION.encode())
h2.update(json.dumps([rag_engine.MAX_NODE_CHARS, rag_engine.CHUNK_TOKENS, rag_engine.CHUNK_OVERLAP, "e5-prefix-v1"]).encode())

speicher = {p.name: p.stat().st_size for p in sorted((FALL / "storage").glob("*.json"))}
server = (FALL / "server.py").read_text(encoding="utf-8")
csp = re.search(r'Content-Security-Policy"\] = \(\s*((?:\s*"[^"]*"\s*)+)\)', server)
csp_text = "".join(re.findall(r'"([^"]*)"', csp.group(1))) if csp else ""
header = dict(re.findall(r'response\.headers\["([\w-]+)"\] = "([^"]+)"', server))
if csp_text: header["Content-Security-Policy"] = csp_text
live = (FALL / "docs/evaluation/LIVE.md").read_text(encoding="utf-8")
tokens = []
for zeile in live.splitlines():
    m = re.match(r"\| (Hybrid|PageIndex): ([^|]+?) \| .*\| (\d+) / (\d+) \|$", zeile.strip())
    if m:
        tokens.append({"modus": m.group(1).lower(), "frage": m.group(2).strip(), "ein": int(m.group(3)), "aus": int(m.group(4))})
mac = (FALL / "docs/evaluation/MAC-LIVE.md").read_text(encoding="utf-8")
laufzeit = re.search(r"E:23\?“: Antwort .*?Laufzeit etwa ([\d,]+) s", mac, re.S)
ablehnung = re.search(r"E:999\?“: ausdrückliche Ablehnung .*?etwa ([\d,]+) s", mac, re.S)

design = (FALL / "docs/2026-07-07-optimization-design.md").read_text(encoding="utf-8")
ph = re.search(r"Recall (\d+) %→(\d+) %, MRR ([\d.]+)→([\d.]+),\s+hit@1 (\d+) %→(\d+) %", design)
import subprocess
log = subprocess.run(["git", "-C", str(FALL), "log", "--format=%h|%ad|%s", "--date=short"], capture_output=True, text=True, check=True).stdout
commits = [dict(zip(("hash", "datum", "titel"), z.split("|", 2))) for z in log.strip().splitlines()]

schreibe("betrieb.json", {
    "phasen": {"datum": "2026-07-07", "recallVor": int(ph.group(1)), "recallNach": int(ph.group(2)), "mrrVor": float(ph.group(3)),
               "mrrNach": float(ph.group(4)), "hit1Vor": int(ph.group(5)), "hit1Nach": int(ph.group(6)),
               "quelle": "docs/2026-07-07-optimization-design.md, Umsetzungsstand"},
    "commits": commits,
    "datum": "2026-09-19",
    "fingerprint": {
        "gespeichert": gespeichert, "nachgerechnet": nachgerechnet, "gleich": gespeichert == nachgerechnet,
        "zutaten": {"markdown": md.name, "markdownBytes": md.stat().st_size, "embedModel": rag_engine.DEFAULT_EMBED_MODEL,
                    "parserVersion": rag_engine.PARSER_VERSION, "maxNodeChars": rag_engine.MAX_NODE_CHARS,
                    "chunkTokens": rag_engine.CHUNK_TOKENS, "chunkOverlap": rag_engine.CHUNK_OVERLAP, "praefixLogik": "e5-prefix-v1"},
        "anderesModell": anderes_modell, "einLeerzeichenMehr": h2.hexdigest()
    },
    "speicher": {"dateien": speicher, "gesamtBytes": sum(speicher.values())},
    "grenzen": {"frageZeichen": rag_engine.__dict__.get("MAX_QUESTION_CHARS") or int(re.search(r"MAX_QUESTION_CHARS = (\d+)", server).group(1)),
                "bodyBytes": 16 * 1024, "kontextZeichen": 14000, "antwortTokens": 1024, "schluesselStunden": 8,
                "port": 3001, "host": "127.0.0.1", "lmStudio": "http://127.0.0.1:1234/v1", "retrieveK": rag_engine.RETRIEVE_K, "finalK": rag_engine.FINAL_K},
    "header": header,
    "cookie": {"name": "rag_session", "httpOnly": True, "sameSite": "Strict", "inhalt": ["sid", "csrf"]},
    "liveTokens": tokens,
    # Recherchierte Preise (keine Messung): OpenAI-Preisliste, Standardstufe, abgerufen am 19.09.2026
    "preise": {"modell": "gpt-4.1-mini", "einUsdJeMio": 0.40, "ausUsdJeMio": 1.60, "stand": "2026-09-19",
               "quelle": "https://openai.com/api/pricing/"},
    # Annahmen des Kostenrechners (editierbar im Werkzeug)
    "annahmen": {"anfragenJeTag": 200, "tage": 30, "rechnerUsd": 2500, "monate": 48, "stromUsdJeMonat": 5},
    "lmStudioSekunden": {"e23": float(laufzeit.group(1).replace(",", ".")) if laufzeit else None,
                         "e999Ablehnung": float(ablehnung.group(1).replace(",", ".")) if ablehnung else None},
    "quelle": "Fallbeispiel: storage/.cache_key, rag_engine.compute_cache_key, server.py, docs/evaluation/LIVE.md und MAC-LIVE.md"
})
print("Phasen:", ph and ph.groups(), "| Commits:", len(commits))
print("Fingerprint gleich:", gespeichert == nachgerechnet, "| Live-Tokens:", len(tokens), "| LM Studio s:", laufzeit and laufzeit.group(1), ablehnung and ablehnung.group(1))
