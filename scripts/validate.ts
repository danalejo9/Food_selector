/** npm run validate — revisa data/recetario.json y que existan las fotos que menciona. */
import { existsSync, readFileSync } from 'node:fs'
import { parseRecetario } from '../src/schema'

const raw = JSON.parse(readFileSync('data/recetario.json', 'utf8'))
const res = parseRecetario(raw)
if (!res.ok) {
  console.error('✗ data/recetario.json tiene errores:\n' + res.errors.map((e) => '  - ' + e).join('\n'))
  process.exit(1)
}
const missing = [...res.value.recipes.map((r) => r.photo), ...res.value.ingredients.map((i) => i.photo)]
  .filter((p): p is string => !!p && !/^https?:/.test(p))
  .filter((p) => !existsSync(`public/${p}`))
if (missing.length) {
  console.error('✗ Fotos que no están en public/:\n' + missing.map((p) => '  - ' + p).join('\n'))
  process.exit(1)
}
console.log(`✓ recetario válido: ${res.value.recipes.length} recetas, ${res.value.ingredients.length} ingredientes`)
