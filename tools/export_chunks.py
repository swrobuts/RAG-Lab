"""Persistierten Index des Fallbeispiels nach data/chunks.json; Handbuch und Protokolle kopieren."""
import json, shutil, datetime
from fall import FALL, DATA, pruefe_fall, schreibe, rund

pruefe_fall()
store = json.loads((FALL / "storage/default__vector_store.json").read_text(encoding="utf-8"))["embedding_dict"]
docs = json.loads((FALL / "storage/docstore.json").read_text(encoding="utf-8"))["docstore/data"]
key = (FALL / "storage/.cache_key").read_text(encoding="utf-8").strip()
chunks = []
for nr, (nid, d) in enumerate(docs.items(), start=1):
    n = d["__data__"]; md = n.get("metadata", {})
    assert nid in store, f"Vektor fehlt für {nid}"
    chunks.append({"id": f"c{nr:03d}", "nr": nr, "nodeId": nid, "abschnitt": md.get("section", ""),
                   "gruppe": md.get("context_group"), "seite": md.get("pdf_page"),
                   "text": n["text"], "v": rund(store[nid])})
assert len(chunks) == 346 and all(len(c["v"]) == 384 for c in chunks)
schreibe("chunks.json", {"modell": "intfloat/multilingual-e5-small", "dimension": 384,
                         "parserVersion": "md-v5-procedure-context", "cacheKey": key,
                         "quelle": "swrobuts/SiemensWashingMachineTroubleShooting_LocalLLM · storage/ · exportiert "
                                   + datetime.date.today().isoformat(),
                         "anzahl": len(chunks), "chunks": chunks})
shutil.copy(FALL / "siemens_wissen.md", DATA / "handbuch.md")
shutil.copy(FALL / ".audit/reparsed-page33.md", DATA / "seite-33.md")
(DATA / "eval").mkdir(exist_ok=True)
for name in ("vector.json", "hybrid-no-rerank.json", "hybrid-rerank.json", "negative-checks.json"):
    shutil.copy(FALL / "docs/evaluation" / name, DATA / "eval" / name)
shutil.copy(FALL / "eval/questions.json", DATA / "eval/questions.json")
print("Handbuch, Seite 33, fünf Protokolle kopiert.")
