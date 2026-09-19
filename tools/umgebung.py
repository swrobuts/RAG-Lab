"""Modellinformationen aus der laufenden LM-Studio-Instanz (Kontextfenster, Quantisierung) mit Datum."""
import datetime, json, urllib.request
from fall import schreibe
with urllib.request.urlopen("http://127.0.0.1:1234/api/v0/models", timeout=5) as r:
    daten = json.load(r)
modelle = [{"id": m.get("id"), "typ": m.get("type"), "architektur": m.get("arch"), "quantisierung": m.get("quantization"),
            "maxKontext": m.get("max_context_length"), "geladen": m.get("state") == "loaded"} for m in daten.get("data", [])]
schreibe("umgebung.json", {"datum": datetime.date.today().isoformat(), "quelle": "LM Studio, GET http://127.0.0.1:1234/api/v0/models",
                           "lmStudioModelle": modelle})
for m in modelle:
    print(m)
