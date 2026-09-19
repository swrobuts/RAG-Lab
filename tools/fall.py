"""Pfade und Helfer der Datenpipeline. Das Fallbeispiel wird nur gelesen."""
from __future__ import annotations
import json, os, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
FALL = Path(os.environ.get("RAG_FALL", "/Users/robert/Library/CloudStorage/OneDrive-Persönlich/Vorlesungen/"
                           "Datenbasierte Fallstudien/SiemensWashingMachineTroubleShooting_LocalLLM"))
PYTHON = "/Users/robert/miniforge3/bin/python3.12"


def pruefe_fall():
    for name in ("siemens_wissen.md", "storage/docstore.json", "storage/default__vector_store.json", "rag_engine.py"):
        if not (FALL / name).exists():
            sys.exit(f"Fallbeispiel unvollständig: {FALL / name} fehlt (RAG_FALL setzen).")
    if str(FALL) not in sys.path:
        sys.path.insert(0, str(FALL))


def schreibe(name: str, obj) -> Path:
    ziel = DATA / name
    ziel.parent.mkdir(parents=True, exist_ok=True)
    ziel.write_text(json.dumps(obj, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{ziel.relative_to(ROOT)}: {ziel.stat().st_size // 1024} KB")
    return ziel


def lese(name: str):
    return json.loads((DATA / name).read_text(encoding="utf-8"))


def rund(v, n=4):
    return [round(float(x), n) for x in v]
