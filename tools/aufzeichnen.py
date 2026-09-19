"""Echte Antworten des Fallbeispiels: nackt (ohne Handbuch) und per RAG, über LM Studio.

Voraussetzung: LM Studio läuft mit geladenem Chatmodell (Server auf Port 1234) und
profiles/local/.env des Fallbeispiels nennt dessen ID (sonst Autoauswahl bei genau einem Modell).
"""
import datetime, time
from fall import pruefe_fall, schreibe
pruefe_fall()
from server import Backend, _messages, parse_ai_response, SYSTEM_PROMPT  # noqa: E402
from rag_engine import NOT_IN_MANUAL  # noqa: E402

backend = Backend()
llm = backend.llm("local")
FRAGEN = [("e18", "Was bedeutet der Fehlercode E:18?"), ("e23", "Was bedeutet E:23?"),
          ("pumpe", "Wie reinige ich die Laugenpumpe? Welche Sicherheitsmaßnahmen sind vorher nötig?"),
          ("kindersicherung", "Wie schalte ich die Kindersicherung wieder aus?"),
          ("wasser", "Wasser läuft unter meiner Waschmaschine aus, was kann ich tun?"),
          ("e180", "Was bedeutet E:180?"), ("hauptstadt", "Was ist die Hauptstadt von Frankreich?")]
NACKT_SYSTEM = "Du bist ein hilfsbereiter Assistent. Antworte auf Deutsch in höchstens sechs Sätzen."
eintraege = []
for key, frage in FRAGEN:
    t0 = time.perf_counter()
    msgs = [{"role": "system", "content": NACKT_SYSTEM}, {"role": "user", "content": frage}]
    r = llm.answer(msgs)
    eintraege.append({"id": f"{key}-nackt", "frage": frage, "modus": "nackt", "anbieter": "LM Studio", "modell": llm.model_id(),
                      "messages": msgs, "antwort": r.choices[0].message.content, "geparst": None, "abgelehnt": False,
                      "usage": {"ein": r.usage.prompt_tokens, "aus": r.usage.completion_tokens},
                      "sekunden": round(time.perf_counter() - t0, 1)})
    print(key, "nackt", eintraege[-1]["sekunden"], "s")
    t0 = time.perf_counter()
    ret = backend.retrieve(frage, "hybrid", provider="local")
    if not ret.grounded:
        eintraege.append({"id": f"{key}-rag", "frage": frage, "modus": "rag", "anbieter": "LM Studio", "modell": llm.model_id(),
                          "messages": None, "antwort": NOT_IN_MANUAL, "geparst": None, "abgelehnt": True, "referenz": "",
                          "quellen": [], "usage": None, "sekunden": round(time.perf_counter() - t0, 1)})
        print(key, "rag: abgelehnt", eintraege[-1]["sekunden"], "s")
        continue
    msgs = _messages(frage, ret.context)
    r = llm.answer(msgs)
    roh = r.choices[0].message.content or ""
    try:
        s, body, _ = parse_ai_response(roh)
        geparst = {"summary": s, "inhalt": body}
    except ValueError as e:
        geparst = {"fehler": str(e)}
    eintraege.append({"id": f"{key}-rag", "frage": frage, "modus": "rag", "anbieter": "LM Studio", "modell": llm.model_id(),
                      "messages": msgs, "antwort": roh, "geparst": geparst, "abgelehnt": False, "referenz": ret.reference,
                      "quellen": [{"id": q["id"], "abschnitt": q["section"], "text": q["text"], "score": q.get("score")}
                                  for q in ret.sources],
                      "usage": {"ein": r.usage.prompt_tokens, "aus": r.usage.completion_tokens},
                      "sekunden": round(time.perf_counter() - t0, 1)})
    print(key, "rag", eintraege[-1]["sekunden"], "s", "geparst" if "summary" in geparst else geparst)
schreibe("antworten.json", {"datum": datetime.date.today().isoformat(), "systemprompt": SYSTEM_PROMPT,
                            "nacktSystem": NACKT_SYSTEM,
                            "protokolliert": {"quelle": "docs/evaluation/LIVE.md des Fallbeispiels, gpt-4.1-mini, 19.09.2026",
                                              "tokens": {"pumpe": [646, 375], "e18": [355, 121], "e23": [341, 107],
                                                         "e23-pageindex": [1227, 102]}},
                            "eintraege": eintraege})
