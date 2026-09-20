# Quellen

Alle Quellen der zehn Labs, je Lab in der Reihenfolge der Seite. Abrufdatum der Web-Quellen: 19.09.2026, sofern nicht anders angegeben. Fallbeispiel: [SiemensWashingMachineTroubleShooting_LocalLLM](https://github.com/swrobuts/SiemensWashingMachineTroubleShooting_LocalLLM), Stand 19.09.2026 (Commit `375ae9b`); die daraus erzeugten Daten sind in `data/QUELLE.md` beschrieben.

## Lab 01 · Sprachmodelle

- Vaswani, A. et al. (2017): Attention Is All You Need. NeurIPS. [arXiv:1706.03762](https://arxiv.org/abs/1706.03762)
- Brown, T. B. et al. (2020): Language Models are Few-Shot Learners. [arXiv:2005.14165](https://arxiv.org/abs/2005.14165)
- Ouyang, L. et al. (2022): Training language models to follow instructions with human feedback. [arXiv:2203.02155](https://arxiv.org/abs/2203.02155)
- Sennrich, R., Haddow, B., Birch, A. (2016): Neural Machine Translation of Rare Words with Subword Units. ACL. [arXiv:1508.07909](https://arxiv.org/abs/1508.07909)
- Kudo, T., Richardson, J. (2018): SentencePiece: A simple and language independent subword tokenizer and detokenizer for Neural Text Processing. [arXiv:1808.06226](https://arxiv.org/abs/1808.06226)
- Conneau, A. et al. (2020): Unsupervised Cross-lingual Representation Learning at Scale (XLM-R). ACL. [arXiv:1911.02116](https://arxiv.org/abs/1911.02116)
- Holtzman, A. et al. (2020): The Curious Case of Neural Text Degeneration. ICLR. [arXiv:1904.09751](https://arxiv.org/abs/1904.09751)
- Liu, N. F. et al. (2023): Lost in the Middle: How Language Models Use Long Contexts. [arXiv:2307.03172](https://arxiv.org/abs/2307.03172)
- Ji, Z. et al. (2023): Survey of Hallucination in Natural Language Generation. ACM Computing Surveys 55(12). [arXiv:2202.03629](https://arxiv.org/abs/2202.03629)
- Wang, L. et al. (2024): Multilingual E5 Text Embeddings: A Technical Report. [arXiv:2402.05672](https://arxiv.org/abs/2402.05672); Modellkarte [intfloat/multilingual-e5-small](https://huggingface.co/intfloat/multilingual-e5-small) (12 Schichten, 384 Dimensionen, 512 Tokens), abgerufen 19.09.2026
- Messungen dieses Labs: `data/tokens.json` (e5-Tokenizer), `data/logits.json` (Qwen/Qwen2.5-0.5B, Apache-2.0), `data/antworten.json` (gemma-4-12b-it-mlx in LM Studio, 19.09.2026); Kontextfenster laut LM-Studio-API `/api/v0/models`, 19.09.2026.

## Lab 02 · Warum RAG?

- Lewis, P. et al. (2020): Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. NeurIPS. [arXiv:2005.11401](https://arxiv.org/abs/2005.11401)
- Gao, Y. et al. (2023): Retrieval-Augmented Generation for Large Language Models: A Survey. [arXiv:2312.10997](https://arxiv.org/abs/2312.10997)
- Ovadia, O. et al. (2023): Fine-Tuning or Retrieval? Comparing Knowledge Injection in LLMs. [arXiv:2312.05934](https://arxiv.org/abs/2312.05934)
- Liu, N. F. et al. (2023): Lost in the Middle: How Language Models Use Long Contexts. [arXiv:2307.03172](https://arxiv.org/abs/2307.03172)
- OpenAI: API-Preisliste, Standardpreise gpt-4.1-mini (0,40 / 1,60 USD je 1 Mio. Tokens), [developers.openai.com/api/docs/pricing](https://developers.openai.com/api/docs/pricing), abgerufen 19.09.2026
- Verordnung (EU) 2016/679 (DSGVO), Art. 28 Auftragsverarbeiter, Art. 44 ff. Drittlandübermittlung.
- Fallbeispiel: [swrobuts/SiemensWashingMachineTroubleShooting_LocalLLM](https://github.com/swrobuts/SiemensWashingMachineTroubleShooting_LocalLLM), README, docs/TECHNICAL.md und docs/evaluation/LIVE.md (Tokenzahlen der OpenAI-Antworten), Stand 19.09.2026; aufgezeichnete Antworten in `data/antworten.json`.

## Lab 03 · Dokumente aufbereiten

- Auer, C. et al. (2024): Docling Technical Report. IBM Research. [arXiv:2408.09869](https://arxiv.org/abs/2408.09869); Dokumentation [docling-project.github.io/docling](https://docling-project.github.io/docling/), abgerufen 19.09.2026
- ISO 32000-2:2020: Document management – Portable document format – Part 2: PDF 2.0. [iso.org](https://www.iso.org/standard/75839.html)
- PyMuPDF-Dokumentation: [pymupdf.readthedocs.io](https://pymupdf.readthedocs.io/); pypdf: [pypdf.readthedocs.io](https://pypdf.readthedocs.io/); Unstructured: [docs.unstructured.io](https://docs.unstructured.io/), abgerufen 19.09.2026
- Fallbeispiel: `parser.py`, `rag_engine.py` (prepare_nodes, format_source_reference), `manual_context.py`, `docs/AUDIT.md` („Querverweise erschienen wie Fundseiten“), README (Abschnitt zur PDF-Neuverarbeitung), Stand 19.09.2026. Seite 33 als `assets/seite-33.png` (PyMuPDF, 150 dpi) und `data/seite-33.md` (Docling 2.129, page_range 33).

## Lab 04 · Chunking

- LlamaIndex-Dokumentation: Node Parser Modules (MarkdownNodeParser, SentenceSplitter, TokenTextSplitter), [developers.llamaindex.ai](https://developers.llamaindex.ai/python/framework/module_guides/loading/node_parsers/modules/), abgerufen 19.09.2026
- Wang, L. et al. (2024): Multilingual E5 Text Embeddings: A Technical Report. [arXiv:2402.05672](https://arxiv.org/abs/2402.05672); Modellkarte [intfloat/multilingual-e5-small](https://huggingface.co/intfloat/multilingual-e5-small) (max_position_embeddings 512), abgerufen 19.09.2026
- Anthropic (2024): Introducing Contextual Retrieval, 19.09.2024, [anthropic.com/news/contextual-retrieval](https://www.anthropic.com/news/contextual-retrieval), abgerufen 19.09.2026
- Fallbeispiel: `rag_engine.py` (prepare_nodes, _explode_markdown_tables, CHUNK_TOKENS, CHUNK_OVERLAP, MAX_NODE_CHARS), `manual_context.py` (BOUNDARIES, expand_sources), `docs/AUDIT.md` („Fehlender Arbeitskontext“), Stand 19.09.2026; Chunks in `data/chunks.json`, Zählungen in `data/tokens.json`.

## Lab 05 · Embeddings

- Reimers, N., Gurevych, I. (2019): Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. EMNLP. [arXiv:1908.10084](https://arxiv.org/abs/1908.10084)
- Wang, L. et al. (2022): Text Embeddings by Weakly-Supervised Contrastive Pre-training. [arXiv:2212.03533](https://arxiv.org/abs/2212.03533)
- Wang, L. et al. (2024): Multilingual E5 Text Embeddings: A Technical Report. [arXiv:2402.05672](https://arxiv.org/abs/2402.05672); Modellkarten [small](https://huggingface.co/intfloat/multilingual-e5-small), [base](https://huggingface.co/intfloat/multilingual-e5-base), [large](https://huggingface.co/intfloat/multilingual-e5-large), abgerufen 19.09.2026
- Chen, J. et al. (2024): M3-Embedding: Multi-Linguality, Multi-Functionality, Multi-Granularity Text Embeddings Through Self-Knowledge Distillation. [arXiv:2402.03216](https://arxiv.org/abs/2402.03216); Modellkarte [BAAI/bge-m3](https://huggingface.co/BAAI/bge-m3), abgerufen 19.09.2026
- Nussbaum, Z. et al. (2024): Nomic Embed; Modellkarte [nomic-ai/nomic-embed-text-v1.5](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5), abgerufen 19.09.2026
- Muennighoff, N. et al. (2022): MTEB: Massive Text Embedding Benchmark. [arXiv:2210.07316](https://arxiv.org/abs/2210.07316)
- Fallbeispiel: `rag_engine.py` (get_embed_model, _needs_e5_prefix), `docs/2026-07-07-optimization-design.md` (Kernbefund 1), `docs/evaluation/MAC-LIVE.md` („Wasser schießt aus der Maschine“), Stand 19.09.2026; Messung dieses Labs mit und ohne Präfix in `data/fragen.json` und `data/chunks-ohne-praefix.json` (tools/embed_fragen.py).

## Lab 06 · Retrieval und Reranking

- Karpukhin, V. et al. (2020): Dense Passage Retrieval for Open-Domain Question Answering. EMNLP. [arXiv:2004.04906](https://arxiv.org/abs/2004.04906)
- Robertson, S., Zaragoza, H. (2009): The Probabilistic Relevance Framework: BM25 and Beyond. Foundations and Trends in Information Retrieval 3(4). [doi:10.1561/1500000019](https://doi.org/10.1561/1500000019)
- Cormack, G. V., Clarke, C. L. A., Buettcher, S. (2009): Reciprocal Rank Fusion outperforms Condorcet and individual Rank Learning Methods. SIGIR. [doi:10.1145/1571941.1572114](https://doi.org/10.1145/1571941.1572114)
- Malkov, Y. A., Yashunin, D. A. (2018): Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs. [arXiv:1603.09320](https://arxiv.org/abs/1603.09320)
- Nogueira, R., Cho, K. (2019): Passage Re-ranking with BERT. [arXiv:1901.04085](https://arxiv.org/abs/1901.04085)
- Chen, J. et al. (2024): M3-Embedding. [arXiv:2402.03216](https://arxiv.org/abs/2402.03216); Modellkarte [BAAI/bge-reranker-v2-m3](https://huggingface.co/BAAI/bge-reranker-v2-m3) (Sigmoid-Hinweis), abgerufen 19.09.2026
- LlamaIndex: [Vector Stores](https://developers.llamaindex.ai/python/framework/module_guides/storing/vector_stores/); pgvector [github.com/pgvector/pgvector](https://github.com/pgvector/pgvector); Qdrant [qdrant.tech](https://qdrant.tech/documentation/overview/); Chroma [docs.trychroma.com](https://docs.trychroma.com/), abgerufen 19.09.2026
- Fallbeispiel: `rag_engine.py` (_CODE_RE, extract_error_codes, make_retriever, get_reranker, select_context_nodes, is_grounded), `server.py` (Backend.retrieve), `docs/TECHNICAL.md` („weder BM25 noch RRF“), `docs/AUDIT.md` (Ablation, Negativtests), `docs/evaluation/*.json`, Stand 19.09.2026; Nachrechnung in `data/fragen.json`.

## Lab 07 · Prompt und Generierung

- OWASP (2025): LLM01:2025 Prompt Injection, OWASP Top 10 for LLM Applications, [genai.owasp.org](https://genai.owasp.org/llmrisk/llm01-prompt-injection/), abgerufen 19.09.2026
- MDN Web Docs: Using server-sent events, [developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events); Mixed content, [developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content), abgerufen 19.09.2026
- OpenAI: Chat Completions API (roles, temperature, max_tokens, stream, finish_reason), [developers.openai.com](https://developers.openai.com/api/docs/api-reference/chat), abgerufen 19.09.2026
- LM Studio: Server Settings („Enable CORS“), [lmstudio.ai/docs](https://lmstudio.ai/docs/developer/core/server/settings); `lms server start`, [lmstudio.ai/docs/cli](https://lmstudio.ai/docs/cli/serve/server-start), abgerufen 19.09.2026
- Ollama: OpenAI compatibility und `OLLAMA_ORIGINS`, [docs.ollama.com](https://docs.ollama.com/), abgerufen 19.09.2026
- Fallbeispiel: `server.py` (SYSTEM_PROMPT, _messages, parse_ai_response, /api/ask_stream), `llm_client.py` (temperature=0, max_tokens, stream_options), `docs/2026-07-07-optimization-design.md` (40 s gegenüber 250 s, Quelle @1,3 s), `docs/AUDIT.md`, Stand 19.09.2026; aufgezeichnete Antworten in `data/antworten.json`.

## Lab 08 · Evaluation und Guardrails

- Manning, C. D., Raghavan, P., Schütze, H. (2008): Introduction to Information Retrieval, Kapitel 8 (Evaluation). Cambridge University Press. [nlp.stanford.edu/IR-book](https://nlp.stanford.edu/IR-book/)
- Es, S., James, J., Espinosa-Anke, L., Schockaert, S. (2023): Ragas: Automated Evaluation of Retrieval Augmented Generation. [arXiv:2309.15217](https://arxiv.org/abs/2309.15217)
- Saad-Falcon, J. et al. (2023): ARES: An Automated Evaluation Framework for Retrieval-Augmented Generation Systems. [arXiv:2311.09476](https://arxiv.org/abs/2311.09476)
- Fallbeispiel: `eval/questions.json`, `eval/run_eval.py`, `docs/evaluation/vector.json`, `hybrid-no-rerank.json`, `hybrid-rerank.json`, `negative-checks.json`, `pageindex-baseline.json`, `pageindex.json` (PageIndex vor und nach dem Umbau vom 20.09.2026, `eval/run_eval_pageindex.py`, `build_pageindex_summaries.py`), `docs/AUDIT.md` (Reale Retrieval-Messung, Gegenbeispiele, Verbleibende Grenzen), `docs/evaluation/LIVE.md` (Hauptstadt-Frage), Stand 20.09.2026; Nachrechnung in `data/fragen.json` und `tools/pruefung.test.mjs`.

## Lab 09 · Architektur, Betrieb, Sicherheit

- Pallets Projects: Flask Documentation – Security Considerations. [flask.palletsprojects.com/en/stable/web-security/](https://flask.palletsprojects.com/en/stable/web-security/) (abgerufen 19.09.2026)
- OWASP Cheat Sheet Series: Cross-Site Request Forgery Prevention Cheat Sheet. [cheatsheetseries.owasp.org](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) (19.09.2026)
- MDN Web Docs: Content Security Policy (CSP); Sec-Fetch-Site; Origin; Using HTTP cookies. [developer.mozilla.org/…/CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP), […/Sec-Fetch-Site](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Sec-Fetch-Site), […/Origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Origin), […/Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies) (19.09.2026)
- Python Software Foundation: hashlib – Secure hashes and message digests. [docs.python.org/3/library/hashlib.html](https://docs.python.org/3/library/hashlib.html); filelock – platform-independent file locking. [py-filelock.readthedocs.io](https://py-filelock.readthedocs.io/en/latest/) (19.09.2026)
- LM Studio: System Requirements. [lmstudio.ai/docs/app/system-requirements](https://lmstudio.ai/docs/app/system-requirements) (19.09.2026)
- OpenAI: API Pricing, gpt-4.1-mini Standard (0,40 / 1,60 USD je 1 Mio. Tokens). [openai.com/api/pricing](https://openai.com/api/pricing/) (abgerufen 19.09.2026; Preise ändern sich, Datum beachten)
- Fallbeispiel: `server.py` (create_app, before_request, after_request, validate, SSE), `session_keys.py`, `rag_engine.py` (compute_cache_key, build_or_load_index), `storage/.cache_key`, `docs/TECHNICAL.md` (Architektur, Routen, Konfiguration, Schutz des API-Schlüssels, Grenzen), `docs/evaluation/LIVE.md` (Tokenzahlen), `MAC-LIVE.md` (Cache-Fehler, Laufzeiten) und `pageindex.json` (PageIndex-Kosten), `pageindex_engine.py`, Stand 20.09.2026; Nachrechnung in `data/betrieb.json` über `tools/betrieb.py`.

## Lab 10 · Nachbauen

- Python Software Foundation: venv – Creation of virtual environments; Python Launcher for Windows. [docs.python.org/3/library/venv.html](https://docs.python.org/3/library/venv.html), […/using/windows.html](https://docs.python.org/3/using/windows.html#python-launcher-for-windows) (19.09.2026)
- pip documentation: Requirements File Format. [pip.pypa.io](https://pip.pypa.io/en/stable/reference/requirements-file-format/); PEP 668 – Marking Python base environments as “externally managed”. [peps.python.org/pep-0668](https://peps.python.org/pep-0668/) (19.09.2026)
- LM Studio Docs: Download an LLM; OpenAI Compatibility API; lms server start (Flag --cors); System Requirements. [lmstudio.ai/docs](https://lmstudio.ai/docs/app/basics/download-model), […/openai-compat](https://lmstudio.ai/docs/developer/openai-compat), […/cli/server-start](https://lmstudio.ai/docs/cli/server-start) (19.09.2026)
- Hugging Face: Manage huggingface_hub cache-system (HF_HOME, HF_HUB_CACHE, Snapshot-Symlinks). [huggingface.co/docs/huggingface_hub/guides/manage-cache](https://huggingface.co/docs/huggingface_hub/guides/manage-cache) (19.09.2026)
- Git: git-clone Documentation. [git-scm.com/docs/git-clone](https://git-scm.com/docs/git-clone); Microsoft: about_Execution_Policies (PowerShell). [learn.microsoft.com](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies) (19.09.2026)
- Fallbeispiel: `README.md` (Start, Lokales Modell auf dem Mac, Prüfung und Weiterentwicklung), `requirements.txt`, `profiles/local/.env.example`, `docs/2026-07-07-optimization-design.md` (Umsetzungsstand mit Messwerten), `docs/evaluation/MAC-LIVE.md` und `docs/AUDIT.md` (Fehlerbilder), `git log` (37 Commits), Stand 20.09.2026; Hashes und Phasenwerte in `data/betrieb.json`.

## Bibliotheken und Modelle

- Hugging Face: transformers.js 4.3.0 (`@huggingface/transformers`), Apache-2.0. https://huggingface.co/docs/transformers.js
- Microsoft: ONNX Runtime Web 1.31.0-dev, MIT. https://onnxruntime.ai/docs/tutorials/web/
- Xenova/multilingual-e5-small (ONNX-Fassung von intfloat/multilingual-e5-small, MIT laut Modellkarte). https://huggingface.co/Xenova/multilingual-e5-small
- BAAI/bge-reranker-v2-m3 (Apache-2.0); Scores vorberechnet, nicht im Browser. https://huggingface.co/BAAI/bge-reranker-v2-m3
- Qwen/Qwen2.5-0.5B (Apache-2.0); Logits für Lab 01 vorberechnet. https://huggingface.co/Qwen/Qwen2.5-0.5B
- Mermaid (MIT) über @mermaid-js/mermaid-cli für die Diagramme. https://mermaid.js.org

THWS Business School · Prof. Dr. Robert Butscher