/** Freies Terminal als lebendes Stueck (ohne Auftrag). */
import { baueTerminal } from '../terminal.js'
export function baue (wrap, p, ctx) {
  return baueTerminal(wrap, { os: p.os || 'alle', szenario: p.szenario || {}, id: p.id || 'frei', schritte: p.schritte, beiFertig: p.beiFertig }, ctx)
}
