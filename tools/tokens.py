"""Tokenisierung von Beispieltexten mit dem e5-Tokenizer (XLM-R SentencePiece); Zählungen für die Labs."""
from transformers import AutoTokenizer
from fall import FALL, pruefe_fall, lese, schreibe
pruefe_fall()
import server  # noqa: E402  SYSTEM_PROMPT des Fallbeispiels
tok = AutoTokenizer.from_pretrained("intfloat/multilingual-e5-small")


def stuecke(text):
    ids = tok.encode(text, add_special_tokens=False)
    return {"text": text, "tokens": tok.convert_ids_to_tokens(ids), "ids": ids}


beispiele = {k: stuecke(t) for k, t in {
    "e18": "Was bedeutet E:18?", "laugenpumpe": "Laugenpumpe reinigen", "laugenpumpe-en": "Clean the drain pump",
    "satz-de": "Die Laugenpumpe ist verstopft. Laugenpumpe reinigen.",
    "satz-en": "The drain pump is blocked. Clean the drain pump.",
    "kindersicherung": "Kindersicherung deaktivieren", "zahl": "Programm 60 °C, 1400 U/min",
    "code": "E:18 E18 Fehler 18 E:180", "unbekannt": "Xylophonschraubenzieher"}.items()}
chunks = lese("chunks.json")["chunks"]
e18 = next(c for c in chunks if "Anzeige: E:18;" in c["text"])
handbuch = (FALL / "siemens_wissen.md").read_text(encoding="utf-8")
zaehl = {"systemprompt": len(tok.encode(server.SYSTEM_PROMPT, add_special_tokens=False)),
         "systempromptZeichen": len(server.SYSTEM_PROMPT),
         "e18Chunk": len(tok.encode(e18["text"], add_special_tokens=False)), "e18ChunkId": e18["id"],
         "handbuch": len(tok.encode(handbuch, add_special_tokens=False)),
         "handbuchZeichen": len(handbuch), "handbuchWoerter": len(handbuch.split()),
         "handbuchAbschnitte": sum(1 for z in handbuch.splitlines() if z.startswith("## ")),
         "chunkTokens": [len(tok.encode(c["text"], add_special_tokens=False)) for c in chunks]}
zaehl["zeichenJeToken"] = round(zaehl["handbuchZeichen"] / zaehl["handbuch"], 2)
zaehl["maxChunkTokens"] = max(zaehl["chunkTokens"])
zaehl["mittelChunkTokens"] = round(sum(zaehl["chunkTokens"]) / len(zaehl["chunkTokens"]), 1)
schreibe("tokens.json", {"tokenizer": "intfloat/multilingual-e5-small (XLM-RoBERTa, SentencePiece)",
                         "vokabular": len(tok), "beispiele": beispiele, "zaehlungen": zaehl})
print(zaehl["zeichenJeToken"], "Zeichen je Token;", zaehl["maxChunkTokens"], "max Tokens je Chunk;",
      zaehl["mittelChunkTokens"], "im Mittel;", zaehl["systemprompt"], "Tokens Systemprompt;", len(tok), "Vokabeln")
for k, b in beispiele.items():
    print(f"  {k:16s} {len(b['tokens']):3d}  {b['tokens']}")
