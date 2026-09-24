import { useRef, useState } from 'react'
import { useRecetario } from '../data/store'
import { applyBulk, parseBulk, type Preview } from '../lib/bulk'
import { downloadTemplate, exportRecetarioExcel, readBulkFile, saveBlob } from '../lib/excel'
import { CATEGORIES, CATEGORY_LABEL, MEAL_LABEL, parseRecetario, type Category } from '../schema'
import { FoodIcon } from '../components/FoodIcon'

export function CargaMasiva() {
  const { recetario, commit } = useRecetario()
  const fileRef = useRef<HTMLInputElement>(null)
  const jsonRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [fileName, setFileName] = useState('')
  const [replace, setReplace] = useState(false)
  const [cats, setCats] = useState<Record<string, Category>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label)
    setMsg(null)
    try {
      await fn()
    } catch (e) {
      console.error(e)
      setMsg({ ok: false, text: `No se pudo: ${(e as Error).message}` })
    } finally {
      setBusy(null)
    }
  }

  const onFile = (f: File) =>
    run('leyendo', async () => {
      const { recipes, ingredients } = await readBulkFile(f)
      const p = parseBulk(recetario, recipes, ingredients)
      setFileName(f.name)
      setPreview(p)
      setCats(Object.fromEntries(p.newIngredients.map((n) => [n.ingredient.id, n.ingredient.category])))
    })

  const doImport = () => {
    if (!preview) return
    const newIngredients = preview.newIngredients.map((n) => ({ ...n.ingredient, category: cats[n.ingredient.id] ?? n.ingredient.category }))
    const { next, added, replaced } = applyBulk(recetario, preview, { replaceDuplicates: replace, newIngredients })
    const check = parseRecetario(next)
    if (!check.ok) {
      setMsg({ ok: false, text: check.errors.slice(0, 3).join(' · ') })
      return
    }
    commit(check.value, {}, added + replaced + newIngredients.length)
    setPreview(null)
    setMsg({
      ok: true,
      text: `Listo: ${added} recetas nuevas${replaced ? `, ${replaced} reemplazadas` : ''}${newIngredients.length ? ` y ${newIngredients.length} ingredientes nuevos` : ''}. Recuerda descargar el recetario para guardarlo en el repo.`,
    })
  }

  const dups = preview?.recipes.filter((r) => r.duplicateOf) ?? []
  const willImport = preview ? preview.recipes.length - (replace ? 0 : dups.length) : 0

  return (
    <section className="bulk">
      <div className="bulk__cards">
        <article className="bulk__card">
          <span className="bulk__num">Paso 1</span>
          <h2>Descarga la plantilla</h2>
          <p className="muted">Un Excel con dos recetas de ejemplo, el catálogo de ingredientes e instrucciones por columna.</p>
          <button className="btn btn--primary" disabled={!!busy} onClick={() => run('plantilla', () => downloadTemplate(recetario))}>
            {busy === 'plantilla' ? 'Generando…' : 'Descargar plantilla .xlsx'}
          </button>
        </article>
        <article className="bulk__card">
          <span className="bulk__num">Paso 2</span>
          <h2>Llénala</h2>
          <p className="muted">
            Una fila por receta. Ingredientes separados por <code>;</code> como <code>harina 1 1/2 taza; huevos 2; miel (opcional)</code>. Pasos uno por
            línea.
          </p>
        </article>
        <article className="bulk__card">
          <span className="bulk__num">Paso 3</span>
          <h2>Cárgala</h2>
          <p className="muted">Verás una vista previa con errores y cambios antes de importar. También acepta .csv.</p>
          <button className="btn btn--primary" disabled={!!busy} onClick={() => fileRef.current?.click()}>
            {busy === 'leyendo' ? 'Leyendo…' : 'Elegir archivo'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.csv"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) onFile(f)
            }}
          />
        </article>
      </div>

      {msg && <p className={msg.ok ? 'ok-box' : 'error-box'}>{msg.text}</p>}

      {preview && (
        <div className="preview">
          <header className="section-head">
            <h2>
              Vista previa <span className="muted small">{fileName}</span>
            </h2>
            <button className="link" onClick={() => setPreview(null)}>
              Cancelar
            </button>
          </header>

          <p className="preview__summary">
            <span className="num">{preview.recipes.length}</span> recetas válidas · <span className="num">{preview.errors.length}</span> con errores ·{' '}
            <span className="num">{preview.newIngredients.length}</span> ingredientes nuevos
          </p>

          {preview.errors.length > 0 && (
            <div className="error-box">
              <b>Estas filas no se importarán hasta corregirlas:</b>
              <ul>
                {preview.errors.map((e) => (
                  <li key={e.row}>
                    <span className="num">fila {e.row}</span> · <b>{e.name}</b>: {e.messages.join('; ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.newIngredients.length > 0 && (
            <div className="preview__block">
              <h3>Ingredientes que se van a crear</h3>
              <p className="muted small">Revisa la categoría: las marcadas con • se adivinaron.</p>
              <ul className="new-ings">
                {preview.newIngredients.map(({ ingredient: i, guessed }) => (
                  <li key={i.id}>
                    <FoodIcon icon={i.icon} size={22} />
                    <span>
                      {i.name}
                      {guessed && ' •'}
                    </span>
                    <select className="input input--small" value={cats[i.id]} onChange={(e) => setCats((c) => ({ ...c, [i.id]: e.target.value as Category }))}>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {CATEGORY_LABEL[c]}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {preview.recipes.length > 0 && (
            <div className="preview__block">
              <h3>Recetas</h3>
              {dups.length > 0 && (
                <label className="check">
                  <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
                  Reemplazar las {dups.length} que ya existen (si no, se omiten)
                </label>
              )}
              <table className="table">
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>Receta</th>
                    <th>Momentos</th>
                    <th>Ingr.</th>
                    <th>Pasos</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.recipes.map((p) => (
                    <tr key={p.row} className={p.duplicateOf && !replace ? 'is-skip' : ''}>
                      <td className="num">{p.row}</td>
                      <td>{p.recipe.name}</td>
                      <td>{p.recipe.meals.map((m) => MEAL_LABEL[m]).join(', ')}</td>
                      <td className="num">{p.recipe.ingredients.length}</td>
                      <td className="num">{p.recipe.steps.length}</td>
                      <td>{p.duplicateOf ? (replace ? 'reemplaza' : 'ya existe · se omite') : 'nueva'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <footer className="editor__foot">
            <span className="spacer" />
            <button className="btn btn--primary" disabled={willImport === 0 && preview.newIngredients.length === 0} onClick={doImport}>
              Importar {willImport} {willImport === 1 ? 'receta' : 'recetas'}
            </button>
          </footer>
        </div>
      )}

      <div className="bulk__more">
        <h2>Otras opciones</h2>
        <div className="bulk__row">
          <div>
            <b>Exportar recetario a Excel</b>
            <p className="muted small">Mismo formato que la plantilla: edítalo en Excel y vuelve a cargarlo marcando “reemplazar”.</p>
          </div>
          <button className="btn" disabled={!!busy} onClick={() => run('export', () => exportRecetarioExcel(recetario))}>
            {busy === 'export' ? 'Generando…' : 'Exportar .xlsx'}
          </button>
        </div>
        <div className="bulk__row">
          <div>
            <b>Descargar solo el archivo recetario.json</b>
            <p className="muted small">Para reemplazar data/recetario.json en el repo (sin fotos nuevas).</p>
          </div>
          <button
            className="btn"
            onClick={() => saveBlob(new Blob([JSON.stringify(recetario, null, 2) + '\n'], { type: 'application/json' }), 'recetario.json')}
          >
            Descargar .json
          </button>
        </div>
        <div className="bulk__row">
          <div>
            <b>Abrir un recetario.json</b>
            <p className="muted small">Reemplaza el borrador de este navegador con otro archivo (por ejemplo, uno de otro dispositivo).</p>
          </div>
          <button className="btn" onClick={() => jsonRef.current?.click()}>
            Abrir .json
          </button>
          <input
            ref={jsonRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              try {
                const res = parseRecetario(JSON.parse(await f.text()))
                if (!res.ok) return setMsg({ ok: false, text: `El archivo tiene errores: ${res.errors.slice(0, 3).join(' · ')}` })
                if (confirm(`Cargar ${res.value.recipes.length} recetas y ${res.value.ingredients.length} ingredientes de ${f.name}?`)) {
                  commit(res.value)
                  setMsg({ ok: true, text: 'Recetario cargado en el borrador.' })
                }
              } catch {
                setMsg({ ok: false, text: 'Ese archivo no es un JSON válido.' })
              }
            }}
          />
        </div>
      </div>
    </section>
  )
}
