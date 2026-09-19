"""Fragenkatalog: Vektoren mit/ohne Präfix, Vektortreffer, Hybrid, Reranker, Kontext, Gedeckt.

Nutzt die Modelle und die Retrieval-Logik des Fallbeispiels (rag_engine.py). Der erste Lauf
liest die Gewichte aus dem Hugging-Face-Cache; LM Studio wird nicht gebraucht.
"""
import json, time
import numpy as np, torch
from fall import FALL, pruefe_fall, schreibe, lese, rund
pruefe_fall()
import rag_engine  # noqa: E402  (aus dem Fallbeispiel)
from llama_index.embeddings.huggingface import HuggingFaceEmbedding  # noqa: E402
from huggingface_hub.constants import HF_HUB_CACHE  # noqa: E402
from sentence_transformers import CrossEncoder  # noqa: E402

RETRIEVE_K, FINAL_K = rag_engine.RETRIEVE_K, rag_engine.FINAL_K
chunks = lese("chunks.json")["chunks"]
M = np.array([c["v"] for c in chunks], dtype=np.float32)          # mit passage:-Präfix (aus dem Index)
texte = {c["id"]: c["text"] for c in chunks}

mit = HuggingFaceEmbedding(model_name=rag_engine.DEFAULT_EMBED_MODEL, cache_folder=HF_HUB_CACHE,
                           query_instruction="query: ", text_instruction="passage: ")
ohne = HuggingFaceEmbedding(model_name=rag_engine.DEFAULT_EMBED_MODEL, cache_folder=HF_HUB_CACHE)
print("Chunks ohne Präfix einbetten …")
Mo = np.array([ohne.get_text_embedding(c["text"]) for c in chunks], dtype=np.float32)
schreibe("chunks-ohne-praefix.json", {"hinweis": "Dieselben 346 Chunks ohne passage:-Präfix (zum Nachstellen des Präfixfehlers)",
                                      "chunks": [{"id": c["id"], "v": rund(v)} for c, v in zip(chunks, Mo)]})

reranker = CrossEncoder(rag_engine.RERANK_MODEL, trust_remote_code=False)


def topk(q, mat, k=RETRIEVE_K):
    s = mat @ q
    idx = np.argsort(-s)[:k]
    return [{"chunk": chunks[i]["id"], "score": round(float(s[i]), 4)} for i in idx]


def hybrid(frage, vektor):
    codes = rag_engine.extract_error_codes(frage)
    if not codes:
        return [dict(t, exakt=False) for t in vektor]
    exakt = [{"chunk": c["id"], "score": 1.0, "exakt": True} for c in chunks
             if codes & rag_engine.extract_error_codes(c["text"])]
    have = {e["chunk"] for e in exakt}
    return exakt + [dict(t, exakt=False) for t in vektor if t["chunk"] not in have]


def rerank(frage, kandidaten):
    paare = [(frage, texte[k["chunk"]]) for k in kandidaten]
    scores = reranker.predict(paare, activation_fn=torch.nn.Sigmoid())
    out = [{"chunk": k["chunk"], "score": round(float(s), 4), "exakt": k.get("exakt", False)}
           for k, s in zip(kandidaten, scores)]
    return sorted(out, key=lambda x: -x["score"])


def kontext(sortiert):
    top = sortiert[:FINAL_K]
    if not top:
        return []
    boden = max(rag_engine.GUARDRAIL_MIN_SCORE, top[0]["score"] * rag_engine.CONTEXT_SCORE_RATIO)
    return [k["chunk"] for k in top if k["score"] >= boden]


def gedeckt(frage, ctx_ids, sortiert):
    ok = bool(ctx_ids) and sortiert[0]["score"] >= rag_engine.GUARDRAIL_MIN_SCORE
    asked = rag_engine.extract_error_codes(frage)
    known = set().union(*(rag_engine.extract_error_codes(texte[i]) for i in ctx_ids)) if ctx_ids else set()
    return ok and (not asked or asked <= known)


eval_q = json.loads((FALL / "eval/questions.json").read_text(encoding="utf-8"))["questions"]
negativ = json.loads((FALL / "docs/evaluation/negative-checks.json").read_text(encoding="utf-8"))
katalog = [dict(id=q["id"], art="eval", frage=q["frage"], erwartet=q["expect"]) for q in eval_q]
katalog += [dict(id=f"negativ-{i + 1}", art="negativ", frage=n["question"], erwartet=[]) for i, n in enumerate(negativ)]
katalog += [dict(id=k, art="beispiel", frage=f, erwartet=[]) for k, f in [
    ("laugenpumpe-reinigen", "Wie reinige ich die Laugenpumpe? Welche Sicherheitsmaßnahmen sind vorher nötig?"),
    ("wasser-schiesst", "Wasser schießt aus der Maschine"),
    ("wasser-laeuft", "Wasser läuft aus"),
    ("fehler-18-ohne-doppelpunkt", "Fehler 18 an der Waschmaschine"),
    ("e23-englisch", "What does error E:23 mean?"),
    ("pumpe-blockiert", "Die Pumpe ist blockiert"),
    ("gewicht", "Wie schwer ist die Waschmaschine?"),
    ("transport", "Wie bereite ich die Maschine für einen Umzug vor?"),
    ("schleudern", "Die Wäsche ist nach dem Schleudern noch nass"),
    ("geruch", "Die Maschine riecht unangenehm")]]

fragen = []
for q in katalog:
    t0 = time.perf_counter()
    v_mit = np.array(mit.get_query_embedding(q["frage"]), dtype=np.float32)
    v_ohne = np.array(ohne.get_query_embedding(q["frage"]), dtype=np.float32)
    vek = topk(v_mit, M); vek_ohne = topk(v_ohne, Mo)
    hyb = hybrid(q["frage"], vek); rr = rerank(q["frage"], hyb); ctx = kontext(rr)
    fragen.append({**q, "codes": sorted(rag_engine.extract_error_codes(q["frage"])),
                   "vMit": rund(v_mit), "vOhne": rund(v_ohne), "vektor": vek, "vektorOhne": vek_ohne,
                   "hybrid": hyb, "rerank": rr, "kontext": ctx, "gedeckt": gedeckt(q["frage"], ctx, rr),
                   "obersterScore": rr[0]["score"] if rr else 0.0,
                   "sekunden": round(time.perf_counter() - t0, 2)})
    print(f"{q['id']:28s} top={fragen[-1]['obersterScore']:.4f} gedeckt={fragen[-1]['gedeckt']} kontext={len(ctx)}")

schreibe("fragen.json", {"modell": rag_engine.DEFAULT_EMBED_MODEL, "reranker": rag_engine.RERANK_MODEL,
                         "retrieveK": RETRIEVE_K, "finalK": FINAL_K, "schwelle": rag_engine.GUARDRAIL_MIN_SCORE,
                         "verhaeltnis": rag_engine.CONTEXT_SCORE_RATIO, "fragen": fragen})
