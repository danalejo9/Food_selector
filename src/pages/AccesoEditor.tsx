import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useEditor } from '../data/editor'

/** Pantalla sin enlace en el menú: activa el modo editor en este navegador. */
export function AccesoEditor() {
  const { canEdit, hasKey, unlock, lock } = useEditor()
  const navigate = useNavigate()
  const [clave, setClave] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (canEdit) {
    return (
      <div className="acceso">
        <header className="page-head">
          <h1>Modo editor activo</h1>
          <p className="muted">En este navegador puedes crear, editar y borrar recetas.</p>
        </header>
        <div className="acceso__actions">
          <Link className="btn btn--primary" to="/recetario">
            Ir al recetario
          </Link>
          {!import.meta.env.DEV && (
            <button className="btn" onClick={lock}>
              Salir del modo editor
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!hasKey) {
    return (
      <div className="acceso">
        <header className="page-head">
          <h1>Modo editor</h1>
          <p className="muted">
            Todavía no hay una clave configurada. En el computador, corre <code>npm run clave -- "tu clave"</code> y sube el cambio.
          </p>
        </header>
      </div>
    )
  }

  return (
    <form
      className="acceso"
      onSubmit={async (e) => {
        e.preventDefault()
        setBusy(true)
        setError(null)
        const ok = await unlock(clave)
        setBusy(false)
        if (ok) navigate('/recetario', { replace: true })
        else setError('Clave incorrecta.')
      }}
    >
      <header className="page-head">
        <h1>Modo editor</h1>
        <p className="muted">Escribe la clave para editar el recetario en este navegador.</p>
      </header>
      <label className="field">
        <span>Clave</span>
        <input className="input" type="password" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} autoFocus />
      </label>
      {error && <p className="error-box" role="alert">{error}</p>}
      <div className="acceso__actions">
        <button className="btn btn--primary" disabled={busy || !clave}>
          {busy ? 'Revisando…' : 'Entrar'}
        </button>
      </div>
    </form>
  )
}
