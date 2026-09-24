import { useState } from 'react'
import { useRecetario } from '../data/store'
import { packRecetario } from '../lib/packRecetario'
import { saveBlob } from '../lib/excel'

export function DraftBar() {
  const { draft, discardDraft } = useRecetario()
  const [busy, setBusy] = useState(false)
  const [help, setHelp] = useState(false)
  if (!draft) return null

  const download = async () => {
    setBusy(true)
    try {
      saveBlob(await packRecetario(draft.recetario, draft.photos), `recetario-${new Date().toISOString().slice(0, 10)}.zip`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="draftbar" role="region" aria-label="Cambios sin guardar">
      <div className="draftbar__text">
        <b>
          {draft.changes} {draft.changes === 1 ? 'cambio' : 'cambios'} solo en este navegador.
        </b>{' '}
        Descarga el recetario y reemplaza el del repo para que quede guardado.{' '}
        <button className="link" onClick={() => setHelp((h) => !h)} aria-expanded={help}>
          ¿cómo?
        </button>
        {help && (
          <ol className="draftbar__help">
            <li>
              Pulsa <b>Descargar recetario</b>: baja un .zip con <code>data/recetario.json</code> y las fotos nuevas.
            </li>
            <li>Descomprímelo encima de la carpeta del proyecto (reemplaza el archivo).</li>
            <li>Haz commit y push. El sitio publicado se actualiza solo.</li>
            <li>
              Vuelve aquí y pulsa <b>Descartar borrador</b>.
            </li>
          </ol>
        )}
      </div>
      <div className="draftbar__actions">
        <button className="btn btn--ink" onClick={download} disabled={busy}>
          {busy ? 'Preparando…' : 'Descargar recetario'}
        </button>
        <button
          className="btn"
          onClick={() => {
            if (confirm('¿Descartar los cambios de este navegador y volver al archivo del repo?')) discardDraft()
          }}
        >
          Descartar borrador
        </button>
      </div>
    </div>
  )
}
