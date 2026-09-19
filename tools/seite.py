"""PDF-Seite 33 als PNG (Lab 03) und ihr Markdown aus dem Docling-Parser mit echtem Seitenmarker."""
import fitz  # PyMuPDF
from fall import FALL, ROOT, DATA, pruefe_fall
pruefe_fall()
PDF = FALL / "siemens-handbuch.pdf"
SEITE = 33

doc = fitz.open(PDF)
pix = doc[SEITE - 1].get_pixmap(dpi=150)
pix.save(ROOT / "assets/seite-33.png")
print("PNG", pix.width, pix.height, (ROOT / "assets/seite-33.png").stat().st_size // 1024, "KB")

# Dieselbe Exportlogik wie parser.py des Fallbeispiels, beschraenkt auf die eine Seite.
from docling.document_converter import DocumentConverter
result = DocumentConverter().convert(str(PDF), page_range=(SEITE, SEITE))
md = f"<!-- pdf-page: {SEITE} -->\n\n" + result.document.export_to_markdown(page_no=SEITE)
(DATA / "seite-33.md").write_text(md, encoding="utf-8")
print("Markdown", len(md), "Zeichen,", md.count("\n"), "Zeilen")
