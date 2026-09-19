/**
 * RAG-Lab · Modell im Browser
 *
 * Laedt Tokenizer (17 MB) und Embedding-Modell (118 MB, ONNX q8) von
 * Xenova/multilingual-e5-small ueber den Hugging-Face-Hub - erst auf Klick,
 * danach im Browser-Cache (Cache API). transformers.js und die ONNX-Runtime
 * sind mitgeliefert (assets/transformers/), die Gewichte nicht: 118 MB liegen
 * ueber der Dateigrenze von GitHub.
 *
 * Nur WASM: q8-Gewichte sind der kleinste Download; WebGPU braeuchte fp16
 * (235 MB). Ohne Cross-Origin-Isolation (GitHub Pages) laeuft WASM einfaedig.
 */
import { env, pipeline, AutoTokenizer } from './transformers/transformers.min.js'

export const MODELL = 'Xenova/multilingual-e5-small'
const Z = { tokenizer: 'aus', modell: 'aus', fehler: null, fortschritt: null }
let tok = null, extractor = null, ladeT = null, ladeM = null
const hoerer = new Set()
const melde = () => { const d = zustand(); for (const f of hoerer) f(d); document.dispatchEvent(new CustomEvent('rag:modell', { detail: d })) }

export function konfiguriere (basis = '.') {
  env.allowLocalModels = false
  env.useBrowserCache = true
  env.backends.onnx.wasm.wasmPaths = new URL('assets/transformers/', new URL(basis + '/', location.href)).href
}
export function zustand () { return { ...Z } }
export function beiAenderung (fn) { hoerer.add(fn); return () => hoerer.delete(fn) }

const fortschritt = (p) => {
  if (p && p.status === 'progress') {
    Z.fortschritt = { datei: p.file, prozent: Math.round(p.progress || 0), geladen: p.loaded, gesamt: p.total }
    melde()
  }
}

export function ladeTokenizer () {
  if (tok) return Promise.resolve(tok)
  if (!ladeT) {
    Z.tokenizer = 'laedt'; Z.fehler = null; melde()
    ladeT = AutoTokenizer.from_pretrained(MODELL, { progress_callback: fortschritt })
      .then(t => { tok = t; Z.tokenizer = 'bereit'; Z.fortschritt = null; melde(); return t })
      .catch(e => { Z.tokenizer = 'fehler'; Z.fehler = String((e && e.message) || e); ladeT = null; melde(); throw e })
  }
  return ladeT
}
/** Tokens und IDs ohne Sondertokens; braucht einen geladenen Tokenizer. */
export function tokenisiere (text) {
  if (!tok) throw new Error('Tokenizer nicht geladen')
  let ids = tok.encode(text, { add_special_tokens: false })
  if (ids && ids.data) ids = Array.from(ids.data)
  ids = Array.from(ids, Number)
  // transformers.js 4.x: tokenize() liefert die Stuecke mit dem SentencePiece-Wortanfang ▁.
  const tokens = typeof tok.tokenize === 'function' ? tok.tokenize(text) : ids.map(i => tok.decode([i]))
  return { tokens, ids }
}
export function ladeModell () {
  if (extractor) return Promise.resolve(extractor)
  if (!ladeM) {
    Z.modell = 'laedt'; Z.fehler = null; melde()
    ladeM = pipeline('feature-extraction', MODELL, { dtype: 'q8', device: 'wasm', progress_callback: fortschritt })
      .then(p => { extractor = p; Z.modell = 'bereit'; Z.fortschritt = null; melde(); return p })
      .catch(e => { Z.modell = 'fehler'; Z.fehler = String((e && e.message) || e); ladeM = null; melde(); throw e })
  }
  return ladeM
}
/** Normalisierter 384-dim-Vektor (Mean Pooling), wie HuggingFaceEmbedding im Fallbeispiel. */
export async function embed (text, { praefix = 'query: ' } = {}) {
  const p = await ladeModell()
  const out = await p(praefix + text, { pooling: 'mean', normalize: true })
  return Float32Array.from(out.data)
}
/** Vergleicht den Browser-Vektor einer Katalogfrage mit dem Python-Vektor aus data/fragen.json. */
export async function selbsttest (frage) {
  const v = await embed(frage.frage, { praefix: 'query: ' })
  let s = 0; for (let i = 0; i < v.length; i++) s += v[i] * frage.vMit[i]
  return { kosinus: s, ok: s > 0.99 }
}
