/** Platzhalter bis Aufgabe 5: kein Modell geladen, Werkzeuge laufen mit vorberechneten Daten. */
const Z = { tokenizer: 'aus', modell: 'aus', fehler: null, fortschritt: null }
export function konfiguriere () {}
export function zustand () { return { ...Z } }
export function beiAenderung () { return () => {} }
export function ladeTokenizer () { return Promise.reject(new Error('Modell folgt in Aufgabe 5')) }
export function ladeModell () { return Promise.reject(new Error('Modell folgt in Aufgabe 5')) }
export function tokenisiere () { throw new Error('Tokenizer nicht geladen') }
export function embed () { return Promise.reject(new Error('Modell nicht geladen')) }
