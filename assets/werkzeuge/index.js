/** Platzhalter bis Aufgabe 5: Registry der lebenden Stuecke. */
export const WERKZEUGE = {}
export function baueWerkzeug (ziel, name) {
  const wrap = document.createElement('div'); wrap.className = 'werkzeug'; wrap.dataset.werkzeug = name
  wrap.textContent = `Werkzeug „${name}“ folgt.`; ziel.replaceChildren(wrap); return null
}
