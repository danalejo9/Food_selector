import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usageCount, useRecetario } from '../data/store'
import { CATEGORIES, CATEGORY_LABEL, IngredientSchema, type Category, type Ingredient } from '../schema'
import { FoodIcon, ICON_KEYS } from '../components/FoodIcon'
import { PhotoInput } from '../components/PhotoInput'
import { matchesQuery, uniqueId } from '../lib/normalize'

export function IngredientesAdmin() {
  const { recetario, deleteIngredient, photoUrl } = useRecetario()
  const [editing, setEditing] = useState<Ingredient | 'new' | null>(null)
  const [q, setQ] = useState('')
  const usage = useMemo(() => usageCount(recetario), [recetario])
  const byId = new Map(recetario.ingredients.map((i) => [i.id, i]))

  return (
    <section>
      <div className="toolbar">
        <input className="input" type="search" placeholder="Buscar ingrediente" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar ingrediente" />
        <span className="muted mono">{recetario.ingredients.length} ingredientes</span>
        <button className="btn btn--ink" onClick={() => setEditing('new')}>
          + Nuevo ingrediente
        </button>
      </div>
      {CATEGORIES.map((cat) => {
        const list = recetario.ingredients
          .filter((i) => i.category === cat && matchesQuery(i.name, q))
          .sort((a, b) => a.name.localeCompare(b.name, 'es'))
        if (!list.length) return null
        return (
          <div key={cat} className="ing-admin">
            <h2 className="kicker">{CATEGORY_LABEL[cat]}</h2>
            <ul>
              {list.map((i) => {
                const n = usage.get(i.id) ?? 0
                const photo = photoUrl(i.photo)
                return (
                  <li key={i.id}>
                    <button className="ing-admin__main" onClick={() => setEditing(i)}>
                      <span className="chip__sticker">{photo ? <img src={photo} alt="" /> : <FoodIcon icon={i.icon} size={28} />}</span>
                      <span>
                        <b>{i.name}</b>
                        <span className="muted small">
                          {i.family && `de ${byId.get(i.family)?.name ?? i.family} · `}
                          {i.pantryStaple && 'básico · '}
                          {n ? `en ${n} ${n === 1 ? 'receta' : 'recetas'}` : 'sin usar'}
                        </span>
                      </span>
                    </button>
                    <button
                      className="link danger"
                      disabled={n > 0}
                      title={n > 0 ? 'Se usa en recetas o como familia: no se puede borrar' : undefined}
                      onClick={() => {
                        if (confirm(`¿Borrar “${i.name}”?`)) deleteIngredient(i.id)
                      }}
                    >
                      borrar
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
      {editing && <IngredientDialog initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </section>
  )
}

export function IngredientDialog({
  initial,
  onClose,
  presetName,
  onSaved,
}: {
  initial: Ingredient | null
  onClose: () => void
  presetName?: string
  onSaved?: (i: Ingredient) => void
}) {
  const { recetario, saveIngredient, photoUrl } = useRecetario()
  const ref = useRef<HTMLDialogElement>(null)
  const [name, setName] = useState(initial?.name ?? presetName ?? '')
  const [category, setCategory] = useState<Category>(initial?.category ?? 'verduras')
  const [family, setFamily] = useState(initial?.family ?? '')
  const [icon, setIcon] = useState(initial?.icon ?? '')
  const [staple, setStaple] = useState(initial?.pantryStaple ?? false)
  const [photo, setPhoto] = useState<{ path: string; blob: Blob; url: string } | null>(null)
  const [keepPhoto, setKeepPhoto] = useState(!!initial?.photo)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  const families = recetario.ingredients.filter((i) => !i.family && i.id !== initial?.id).sort((a, b) => a.name.localeCompare(b.name, 'es'))

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    // el diálogo puede abrirse desde el editor de recetas: que no envíe ese formulario
    e.stopPropagation()
    const clean = name.trim()
    if (!clean) return setError('Ponle un nombre.')
    const dup = recetario.ingredients.find((i) => i.name.toLowerCase() === clean.toLowerCase() && i.id !== initial?.id)
    if (dup) return setError(`Ya existe “${dup.name}”.`)
    const id = initial?.id ?? uniqueId(clean, new Set(recetario.ingredients.map((i) => i.id)))
    const candidate = {
      id,
      name: clean,
      category,
      pantryStaple: staple,
      ...(family && { family }),
      ...(icon.trim() && { icon: icon.trim() }),
      ...(photo ? { photo: photo.path } : keepPhoto && initial?.photo ? { photo: initial.photo } : {}),
    }
    const res = IngredientSchema.safeParse(candidate)
    if (!res.success) return setError(res.error.issues[0].message)
    saveIngredient(res.data, photo ? { path: photo.path, blob: photo.blob } : undefined)
    onSaved?.(res.data)
    onClose()
  }

  const currentPhoto = photo?.url ?? (keepPhoto ? photoUrl(initial?.photo) : undefined)

  return createPortal(
    <dialog ref={ref} className="dialog" onClose={onClose} onCancel={onClose}>
      <form onSubmit={save}>
        <header className="dialog__head">
          <h2>{initial ? 'Editar ingrediente' : 'Nuevo ingrediente'}</h2>
          <button type="button" className="link" onClick={onClose} aria-label="Cerrar">
            cerrar
          </button>
        </header>
        <div className="form-grid">
          <label className="field">
            <span>Nombre</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
          </label>
          <label className="field">
            <span>Categoría</span>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Familia (opcional)</span>
            <select className="input" value={family} onChange={(e) => setFamily(e.target.value)}>
              <option value="">— ninguna —</option>
              {families.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <small className="muted">Ej.: “Queso campesino” es de la familia “Queso”: sirve cuando una receta pide queso.</small>
          </label>
          <label className="check">
            <input type="checkbox" checked={staple} onChange={(e) => setStaple(e.target.checked)} />
            Básico de despensa (siempre lo tengo)
          </label>
        </div>
        <fieldset className="icon-picker">
          <legend>Icono</legend>
          <div className="icon-picker__grid">
            {ICON_KEYS.map((k) => (
              <button type="button" key={k} className={icon === k ? 'is-on' : ''} onClick={() => setIcon(k)} aria-label={k} title={k}>
                <FoodIcon icon={k} size={28} />
              </button>
            ))}
          </div>
          <label className="field field--inline">
            <span>o un emoji</span>
            <input className="input input--small" value={ICON_KEYS.includes(icon) ? '' : icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} placeholder="🥥" />
          </label>
        </fieldset>
        <div className="field">
          <span>Foto real (reemplaza el icono)</span>
          <PhotoInput
            small
            url={currentPhoto}
            onPick={(blob) => {
              const id = initial?.id ?? (uniqueId(name || 'ingrediente', new Set(recetario.ingredients.map((i) => i.id))))
              setPhoto({ path: `fotos/ingredientes/${id}-${Date.now().toString(36)}.webp`, blob, url: URL.createObjectURL(blob) })
            }}
            onClear={() => {
              setPhoto(null)
              setKeepPhoto(false)
            }}
          />
        </div>
        {error && <p className="error">{error}</p>}
        <footer className="dialog__foot">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn--ink">Guardar</button>
        </footer>
      </form>
    </dialog>,
    document.body,
  )
}
