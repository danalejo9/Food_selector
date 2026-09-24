import type { Recetario } from '../schema'

const README = `CÓMO GUARDAR ESTE RECETARIO EN EL REPO
=======================================

1. Descomprime este .zip.
2. Copia las carpetas encima del proyecto Food_selector:
     data/recetario.json   → reemplaza el archivo actual
     public/fotos/...       → fotos nuevas (si hay)
3. Haz commit y push. Si el sitio está publicado en GitHub Pages,
   en un par de minutos lo verás igual en el computador y el celular.
4. En la app, pulsa “Descartar borrador” para volver a leer el archivo.
`

/** Todo lo que el repo necesita: el JSON y las fotos nuevas, en sus rutas. */
export async function packRecetario(recetario: Recetario, photos: Record<string, Blob>): Promise<Blob> {
  const { default: JSZip } = await import('jszip')
  const zip = new JSZip()
  zip.file('data/recetario.json', JSON.stringify(recetario, null, 2) + '\n')
  const used = new Set([...recetario.recipes.map((r) => r.photo), ...recetario.ingredients.map((i) => i.photo)])
  for (const [path, blob] of Object.entries(photos)) {
    if (used.has(path)) zip.file(`public/${path}`, blob)
  }
  zip.file('LEEME.txt', README)
  return zip.generateAsync({ type: 'blob' })
}
