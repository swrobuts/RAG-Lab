#!/bin/sh
# Erzeugt alle Datendateien aus dem Fallbeispiel (Pfad in tools/fall.py oder RAG_FALL).
#   sh tools/daten.sh            ohne LM Studio
#   sh tools/daten.sh --mit-llm  zusaetzlich die aufgezeichneten Antworten (LM Studio muss laufen)
set -e
cd "$(dirname "$0")"
PY=${PY:-/Users/robert/miniforge3/bin/python3.12}
export KMP_DUPLICATE_LIB_OK=TRUE
$PY export_chunks.py && $PY umgebung.py && $PY embed_fragen.py && $PY projektion.py && $PY tokens.py && $PY logits.py && $PY seite.py && $PY betrieb.py
[ "$1" = "--mit-llm" ] && $PY aufzeichnen.py
echo "Daten erzeugt."
