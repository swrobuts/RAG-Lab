/** Registry der lebenden Stuecke: Name → baue(wrap, parameter, ctx). */
import { el } from './gemein.js'
import * as tokenizer from './tokenizer.js'
import * as temperatur from './temperatur.js'
import * as kontext from './kontext.js'
import * as vergleich from './vergleich.js'
import * as seite from './seite.js'
import * as chunking from './chunking.js'
import * as embedding from './embedding.js'
import * as karte from './karte.js'
import * as suche from './suche.js'
import * as prompt from './prompt.js'
import * as llm from './llm.js'
import * as metrik from './metrik.js'
import * as schwelle from './schwelle.js'
import * as architektur from './architektur.js'
import * as kosten from './kosten.js'
import * as terminal from './terminal.js'
export const WERKZEUGE = {
  tokenizer: tokenizer.baue, temperatur: temperatur.baue, kontext: kontext.baue, vergleich: vergleich.baue, seite: seite.baue,
  chunking: chunking.baue, embedding: embedding.baue, karte: karte.baue, suche: suche.baue, prompt: prompt.baue, llm: llm.baue,
  metrik: metrik.baue, schwelle: schwelle.baue, architektur: architektur.baue, kosten: kosten.baue, terminal: terminal.baue
}
export function baueWerkzeug (ziel, name, parameter, ctx) {
  const b = WERKZEUGE[name]
  const wrap = el('div', 'werkzeug'); wrap.dataset.werkzeug = name; ziel.replaceChildren(wrap)
  if (!b) { wrap.textContent = `Werkzeug „${name}“ folgt.`; return null }
  try { return b(wrap, parameter || {}, ctx) } catch (e) { console.error(name, e); wrap.textContent = `Werkzeug „${name}“ konnte nicht aufgebaut werden.`; return null }
}
