/** Registry der lebenden Stuecke: Name → baue(wrap, parameter, ctx). */
import { el } from './gemein.js'
import * as tokenizer from './tokenizer.js'
import * as embedding from './embedding.js'
import * as karte from './karte.js'
import * as suche from './suche.js'
export const WERKZEUGE = { tokenizer: tokenizer.baue, embedding: embedding.baue, karte: karte.baue, suche: suche.baue }
export function baueWerkzeug (ziel, name, parameter, ctx) {
  const b = WERKZEUGE[name]
  const wrap = el('div', 'werkzeug'); wrap.dataset.werkzeug = name; ziel.replaceChildren(wrap)
  if (!b) { wrap.textContent = `Werkzeug „${name}“ folgt.`; return null }
  try { return b(wrap, parameter || {}, ctx) } catch (e) { console.error(name, e); wrap.textContent = `Werkzeug „${name}“ konnte nicht aufgebaut werden.`; return null }
}
