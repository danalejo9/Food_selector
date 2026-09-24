/** npm run clave -- "tu clave"  → guarda la huella de la clave del modo editor. */
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'

const clave = process.argv.slice(2).join(' ').trim()
if (clave.length < 6) {
  console.error('Uso: npm run clave -- "una clave de al menos 6 caracteres"')
  process.exit(1)
}
const hash = createHash('sha256').update(clave, 'utf8').digest('hex')
writeFileSync(
  'src/editorKey.ts',
  `/**
 * Huella SHA-256 de la clave del modo editor. Se genera con
 *   npm run clave -- "tu clave"
 * La clave no se guarda en el repo: solo esta huella. Vacía = modo editor
 * desactivado en la página publicada (en \`npm run dev\` siempre se puede editar).
 */
export const EDITOR_KEY_HASH = '${hash}'
`,
)
console.log('✓ Clave guardada en src/editorKey.ts. Haz commit y push para publicarla.')
