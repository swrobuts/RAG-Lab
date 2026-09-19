"""Top-20 nächste Tokens mit Logits und drei Fortsetzungen je Prompt (kleines offenes Basismodell)."""
import datetime
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from fall import schreibe
NAME = "Qwen/Qwen2.5-0.5B"
tok = AutoTokenizer.from_pretrained(NAME)
model = AutoModelForCausalLM.from_pretrained(NAME, dtype=torch.float32).eval()
PROMPTS = {"e18": "Die Waschmaschine zeigt den Fehlercode E:18. Das bedeutet, dass",
           "hauptstadt": "Die Hauptstadt von Frankreich ist",
           "pumpe": "Vor dem Reinigen der Laugenpumpe muss man zuerst",
           "zahlen": "1, 2, 3, 4, 5,",
           "wasser": "Wasser läuft aus der Waschmaschine, weil",
           "englisch": "The washing machine shows error E:18, which means that"}


def fortsetzung(ids, temperatur, seed=7):
    torch.manual_seed(seed)
    if temperatur > 0:
        out = model.generate(ids, max_new_tokens=24, do_sample=True, temperature=temperatur, top_k=0, top_p=1.0,
                             pad_token_id=tok.eos_token_id)
    else:
        out = model.generate(ids, max_new_tokens=24, do_sample=False, pad_token_id=tok.eos_token_id)
    return tok.decode(out[0][ids.shape[1]:], skip_special_tokens=True)


eintraege = []
for key, p in PROMPTS.items():
    ids = tok(p, return_tensors="pt").input_ids
    with torch.no_grad():
        logits = model(ids).logits[0, -1]
    top = torch.topk(logits, 20)
    eintraege.append({"id": key, "prompt": p,
                      "tokens": [{"token": tok.decode([int(i)]), "logit": round(float(l), 3)} for l, i in zip(top.values, top.indices)],
                      "restLogsumexp": round(float(torch.logsumexp(logits, 0)), 3),
                      "fortsetzungen": {"0": fortsetzung(ids, 0), "0.7": fortsetzung(ids, 0.7), "1.5": fortsetzung(ids, 1.5)}})
    print(key, "→", [t["token"] for t in eintraege[-1]["tokens"][:5]], "| T=0:", eintraege[-1]["fortsetzungen"]["0"][:60])
schreibe("logits.json", {"modell": NAME, "datum": datetime.date.today().isoformat(), "vokabular": len(tok),
                         "hinweis": "Basismodell ohne Instruktionstuning; Fortsetzungen mit festem Zufallsstartwert 7, 24 neue Tokens; Logits aus einem Vorwärtslauf in float32.",
                         "prompts": eintraege})
