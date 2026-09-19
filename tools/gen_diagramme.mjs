#!/usr/bin/env node
/**
 * gen_diagramme.mjs - Mermaid-Quellen -> SVG in beiden Sprachen.
 *
 *   node tools/gen_diagramme.mjs            alle Quellen
 *   node tools/gen_diagramme.mjs pipeline   nur Quellen, deren Name so beginnt
 *
 * Quelle: diagramme/quellen/<name>.mmd mit Platzhaltern [[deutsch|english]].
 * Ziel:   assets/diagramme/<name>-de.svg und <name>-en.svg
 * Braucht npx (laedt @mermaid-js/mermaid-cli beim ersten Lauf) und diagramme/theme.json.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
const HIER = dirname(fileURLToPath(import.meta.url)); const ROOT = join(HIER, '..')
const QUELLEN = join(ROOT, 'diagramme', 'quellen'); const ZIEL = join(ROOT, 'assets', 'diagramme')
const filter = process.argv[2] || ''
mkdirSync(ZIEL, { recursive: true })
const tmp = join(tmpdir(), 'rag-lab-mmd'); mkdirSync(tmp, { recursive: true })
let n = 0
for (const datei of readdirSync(QUELLEN).filter(f => f.endsWith('.mmd') && f.startsWith(filter)).sort()) {
  const name = datei.replace(/\.mmd$/, ''); const quelle = readFileSync(join(QUELLEN, datei), 'utf8')
  for (const lang of ['de', 'en']) {
    const text = quelle.replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, (_, de, en) => (lang === 'de' ? de : en))
    const ein = join(tmp, `${name}-${lang}.mmd`); const aus = join(ZIEL, `${name}-${lang}.svg`)
    writeFileSync(ein, text)
    execFileSync('npx', ['-y', '@mermaid-js/mermaid-cli', '-i', ein, '-o', aus, '-c', join(ROOT, 'diagramme', 'theme.json'), '-b', 'transparent', '-q'], { stdio: 'inherit' })
    // Eindeutige IDs, damit mehrere Diagramme auf einer Seite (als <img>) sich nicht stoeren, und eine Beschreibung fuer Screenreader.
    let svg = readFileSync(aus, 'utf8').replace(/id="my-svg"/g, `id="svg-${name}-${lang}"`).replace(/#my-svg/g, `#svg-${name}-${lang}`)
    // Natuerliche Groesse aus der viewBox, damit das Bild im <img> nicht auf Spaltenbreite schrumpft, sondern in seiner Figur scrollt.
    const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)
    if (vb) svg = svg.replace(/width="100%"/, `width="${Math.round(+vb[1])}" height="${Math.round(+vb[2])}"`)
    writeFileSync(aus, svg); n++
    console.log(`  ${name}-${lang}.svg`)
  }
}
rmSync(tmp, { recursive: true, force: true })
console.log(`${n} Diagramme erzeugt.`)
