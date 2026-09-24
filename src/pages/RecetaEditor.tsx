import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useRecetario } from '../data/store'
import { MEAL_LABEL, MEALS, RecipeSchema, type Ingredient, type Meal, type Recipe } from '../schema'
import { FoodIcon } from '../components/FoodIcon'
import { PhotoInput } from '../components/PhotoInput'
import { normalizeName, uniqueId } from '../lib/normalize'
import { formatQty, parseQty } from '../lib/units'
import { IngredientDialog } from './IngredientesAdmin'

const UNITS = ['taza', 'cda', 'cdta', 'g', 'kg', 'ml', 'l', 'diente', 'tallo', 'manojo', 'tajada', 'lata', 'pizca', 'astilla', 'pastilla']

interface IngRow {
  key: string
  text: string
  ingredientId: string
  qty: string
  unit: string
  note: string
  optional: boolean
}
interface StepRow {
  key: string
  text: string
  minutes: string
}

const k = () => Math.random().toString(36).slice(2, 9)

export function RecetaEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { recetario, ingredientsById, saveRecipe, deleteRecipe, photoUrl } = useRecetario()
  const existing = id ? recetario.recipes.find((r) => r.id === id) : undefined

  const [name, setName] = useState(existing?.name ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [meals, setMeals] = useState<Meal[]>(existing?.meals ?? [])
  const [prep, setPrep] = useState(String(existing?.prepMinutes ?? 10))
  const [cook, setCook] = useState(String(existing?.cookMinutes ?? 0))
  const [servings, setServings] = useState(String(existing?.servings ?? 2))
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(existing?.difficulty ?? 1)
  const [tags, setTags] = useState(existing?.tags.join(', ') ?? '')
  const [photo, setPhoto] = useState<{ path: string; blob: Blob; url: string } | null>(null)
  const [keepPhoto, setKeepPhoto] = useState(!!existing?.photo)
  const [ings, setIngs] = useState<IngRow[]>(
    existing?.ingredients.map((ri) => ({
      key: k(),
      text: ingredientsById.get(ri.ingredientId)?.name ?? ri.ingredientId,
      ingredientId: ri.ingredientId,
      qty: ri.qty !== undefined ? formatQty(ri.qty) : '',
      unit: ri.unit ?? '',
      note: ri.note ?? '',
      optional: ri.optional,
    })) ?? [{ key: k(), text: '', ingredientId: '', qty: '', unit: '', note: '', optional: false }],
  )
  const [steps, setSteps] = useState<StepRow[]>(
    existing?.steps.map((s) => ({ key: k(), text: s.text, minutes: s.minutes ? String(s.minutes) : '' })) ?? [{ key: k(), text: '', minutes: '' }],
  )
  const [errors, setErrors] = useState<string[]>([])
  const [creating, setCreating] = useState<{ rowKey: string; name: string } | null>(null)

  const byName = useMemo(() => new Map(recetario.ingredients.map((i) => [normalizeName(i.name), i])), [recetario])

  if (id && !existing) {
    return (
      <div className="empty">
        <h2>No existe esa receta.</h2>
        <Link to="/recetario" className="btn">
          Volver al recetario
        </Link>
      </div>
    )
  }

  const setIng = (key: string, patch: Partial<IngRow>) => setIngs((xs) => xs.map((x) => (x.key === key ? { ...x, ...patch } : x)))
  const move = <T,>(xs: T[], i: number, d: -1 | 1): T[] => {
    const j = i + d
    if (j < 0 || j >= xs.length) return xs
    const c = [...xs]
    ;[c[i], c[j]] = [c[j], c[i]]
    return c
  }

  const onIngText = (row: IngRow, text: string) => {
    const hit = byName.get(normalizeName(text))
    setIng(row.key, { text, ingredientId: hit?.id ?? '' })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: string[] = []
    const cleanIngs = ings.filter((r) => r.text.trim())
    cleanIngs.forEach((r) => {
      if (!r.ingredientId) errs.push(`“${r.text}” no está en el catálogo: créalo con el botón “crear”.`)
      if (r.qty.trim() && parseQty(r.qty) === undefined) errs.push(`La cantidad “${r.qty}” de ${r.text} no es un número.`)
    })
    const ids = cleanIngs.map((r) => r.ingredientId)
    if (new Set(ids).size !== ids.length) errs.push('Hay un ingrediente repetido.')
    if (!meals.length) errs.push('Elige al menos un momento del día.')
    const recipeId = existing?.id ?? uniqueId(name || 'receta', new Set(recetario.recipes.map((r) => r.id)))
    const candidate: Recipe = {
      id: recipeId,
      name: name.trim(),
      description: description.trim(),
      meals,
      prepMinutes: Number(prep) || 0,
      cookMinutes: Number(cook) || 0,
      servings: Number(servings) || 1,
      difficulty,
      ingredients: cleanIngs.map((r) => ({
        ingredientId: r.ingredientId,
        optional: r.optional,
        ...(parseQty(r.qty) !== undefined && { qty: parseQty(r.qty) }),
        ...(r.unit.trim() && { unit: r.unit.trim() }),
        ...(r.note.trim() && { note: r.note.trim() }),
      })),
      steps: steps
        .filter((s) => s.text.trim())
        .map((s) => ({ text: s.text.trim(), ...(Number(s.minutes) > 0 && { minutes: Number(s.minutes) }) })),
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      ...(photo ? { photo: photo.path } : keepPhoto && existing?.photo ? { photo: existing.photo } : {}),
    }
    const res = RecipeSchema.safeParse(candidate)
    if (!res.success) {
      const labels: Record<string, string> = {
        name: 'Falta el nombre.',
        ingredients: 'Agrega al menos un ingrediente.',
        steps: 'Agrega al menos un paso.',
        meals: 'Elige al menos un momento del día.',
      }
      for (const i of res.error.issues) {
        const m = labels[String(i.path[0])] ?? `${i.path.join('.')}: ${i.message}`
        if (!errs.includes(m)) errs.push(m)
      }
    }
    if (errs.length || !res.success) {
      setErrors(errs)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    saveRecipe(res.data, photo ? { path: photo.path, blob: photo.blob } : undefined)
    navigate(`/receta/${res.data.id}`)
  }

  const currentPhoto = photo?.url ?? (keepPhoto ? photoUrl(existing?.photo) : undefined)

  return (
    <form className="editor" onSubmit={submit} noValidate>
      <header className="page-head">
        <Link className="link" to="/recetario">
          ← recetario
        </Link>
        <h1>{existing ? `Editar: ${existing.name}` : 'Nueva receta'}</h1>
      </header>

      {errors.length > 0 && (
        <div className="error-box" role="alert">
          <b>Revisa esto antes de guardar:</b>
          <ul>
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="editor__top">
        <PhotoInput
          url={currentPhoto}
          label="Foto del plato"
          onPick={(blob) => {
            const base = existing?.id ?? uniqueId(name || 'receta', new Set(recetario.recipes.map((r) => r.id)))
            setPhoto({ path: `fotos/recetas/${base}-${Date.now().toString(36)}.webp`, blob, url: URL.createObjectURL(blob) })
          }}
          onClear={() => {
            setPhoto(null)
            setKeepPhoto(false)
          }}
        />
        <div className="form-grid">
          <label className="field field--wide">
            <span>Nombre</span>
            <input className="input input--big" value={name} onChange={(e) => setName(e.target.value)} placeholder="Pancakes de arándanos" />
          </label>
          <label className="field field--wide">
            <span>Descripción corta</span>
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Una línea que dé antojo" />
          </label>
          <fieldset className="field field--wide">
            <legend>Momento del día</legend>
            <div className="meals">
              {MEALS.map((m) => (
                <button
                  type="button"
                  key={m}
                  className={`tab${meals.includes(m) ? ' is-on' : ''}`}
                  aria-pressed={meals.includes(m)}
                  onClick={() => setMeals((xs) => (xs.includes(m) ? xs.filter((x) => x !== m) : MEALS.filter((y) => y === m || xs.includes(y))))}
                >
                  {MEAL_LABEL[m]}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="field">
            <span>Preparación (min)</span>
            <input className="input" type="number" min={0} value={prep} onChange={(e) => setPrep(e.target.value)} />
          </label>
          <label className="field">
            <span>Cocción (min)</span>
            <input className="input" type="number" min={0} value={cook} onChange={(e) => setCook(e.target.value)} />
          </label>
          <label className="field">
            <span>Porciones</span>
            <input className="input" type="number" min={1} value={servings} onChange={(e) => setServings(e.target.value)} />
          </label>
          <fieldset className="field">
            <legend>Dificultad</legend>
            <div className="seg">
              {([1, 2, 3] as const).map((d) => (
                <button type="button" key={d} className={difficulty === d ? 'is-on' : ''} onClick={() => setDifficulty(d)}>
                  {['', 'Fácil', 'Media', 'Exigente'][d]}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      <section className="editor__section">
        <h2>Ingredientes</h2>
        <p className="muted small">Escribe y elige de la lista. Las cantidades aceptan 1/2, 1 1/2 o 0,5.</p>
        <datalist id="ing-names">
          {recetario.ingredients.map((i) => (
            <option key={i.id} value={i.name} />
          ))}
        </datalist>
        <datalist id="units">
          {UNITS.map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>
        <div className="ing-rows">
          <div className="ing-rows__head" aria-hidden="true">
            <span />
            <span>Ingrediente</span>
            <span>Cant.</span>
            <span>Unidad</span>
            <span>Nota</span>
            <span>Opc.</span>
            <span />
          </div>
          {ings.map((row, i) => {
            const ing: Ingredient | undefined = row.ingredientId ? ingredientsById.get(row.ingredientId) : undefined
            return (
              <div className="ing-row" key={row.key}>
                <span className="ing-row__icon">{ing ? <FoodIcon icon={ing.icon} size={24} /> : <span className="shop__dot" />}</span>
                <span className="ing-row__name">
                  <input
                    className={`input${row.text && !row.ingredientId ? ' is-unknown' : ''}`}
                    list="ing-names"
                    value={row.text}
                    onChange={(e) => onIngText(row, e.target.value)}
                    placeholder={i === 0 ? 'harina' : undefined}
                    aria-label="Ingrediente"
                  />
                  {row.text.trim() && !row.ingredientId && (
                    <button type="button" className="link small" onClick={() => setCreating({ rowKey: row.key, name: row.text.trim() })}>
                      crear
                    </button>
                  )}
                </span>
                <input className="input" value={row.qty} onChange={(e) => setIng(row.key, { qty: e.target.value })} placeholder={i === 0 ? '1 1/2' : undefined} aria-label="Cantidad" inputMode="decimal" />
                <input className="input" list="units" value={row.unit} onChange={(e) => setIng(row.key, { unit: e.target.value })} placeholder={i === 0 ? 'taza' : undefined} aria-label="Unidad" />
                <input className="input" value={row.note} onChange={(e) => setIng(row.key, { note: e.target.value })} placeholder={i === 0 ? 'picado' : undefined} aria-label="Nota" />
                <label className="ing-row__opt">
                  <input type="checkbox" checked={row.optional} onChange={(e) => setIng(row.key, { optional: e.target.checked })} />
                  <span className="visually-hidden">Opcional</span>
                </label>
                <span className="row-tools">
                  <button type="button" onClick={() => setIngs((xs) => move(xs, i, -1))} aria-label="Subir">
                    ↑
                  </button>
                  <button type="button" onClick={() => setIngs((xs) => move(xs, i, 1))} aria-label="Bajar">
                    ↓
                  </button>
                  <button type="button" onClick={() => setIngs((xs) => xs.filter((x) => x.key !== row.key))} aria-label="Quitar">
                    ×
                  </button>
                </span>
              </div>
            )
          })}
        </div>
        <button type="button" className="btn" onClick={() => setIngs((xs) => [...xs, { key: k(), text: '', ingredientId: '', qty: '', unit: '', note: '', optional: false }])}>
          + Ingrediente
        </button>
      </section>

      <section className="editor__section">
        <h2>Pasos</h2>
        <ol className="step-rows">
          {steps.map((s, i) => (
            <li key={s.key}>
              <span className="steps__n">{i + 1}</span>
              <textarea
                className="input"
                rows={2}
                value={s.text}
                onChange={(e) => setSteps((xs) => xs.map((x) => (x.key === s.key ? { ...x, text: e.target.value } : x)))}
                placeholder="Qué hay que hacer…"
                aria-label={`Paso ${i + 1}`}
              />
              <label className="step-rows__min">
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={s.minutes}
                  onChange={(e) => setSteps((xs) => xs.map((x) => (x.key === s.key ? { ...x, minutes: e.target.value } : x)))}
                  aria-label="Minutos del temporizador"
                />
                <span className="small muted">min</span>
              </label>
              <span className="row-tools">
                <button type="button" onClick={() => setSteps((xs) => move(xs, i, -1))} aria-label="Subir">
                  ↑
                </button>
                <button type="button" onClick={() => setSteps((xs) => move(xs, i, 1))} aria-label="Bajar">
                  ↓
                </button>
                <button type="button" onClick={() => setSteps((xs) => xs.filter((x) => x.key !== s.key))} aria-label="Quitar paso">
                  ×
                </button>
              </span>
            </li>
          ))}
        </ol>
        <button type="button" className="btn" onClick={() => setSteps((xs) => [...xs, { key: k(), text: '', minutes: '' }])}>
          + Paso
        </button>
      </section>

      <section className="editor__section">
        <label className="field">
          <span>Etiquetas (separadas por coma)</span>
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="rápida, vegetariana" />
        </label>
      </section>

      <footer className="editor__foot">
        {existing && (
          <button
            type="button"
            className="btn danger"
            onClick={() => {
              if (confirm(`¿Borrar “${existing.name}”?`)) {
                deleteRecipe(existing.id)
                navigate('/recetario')
              }
            }}
          >
            Borrar receta
          </button>
        )}
        <span className="spacer" />
        <Link className="btn" to="/recetario">
          Cancelar
        </Link>
        <button className="btn btn--ink">Guardar receta</button>
      </footer>

      {creating && (
        <IngredientDialog
          initial={null}
          presetName={creating.name}
          onClose={() => setCreating(null)}
          onSaved={(ing) => setIng(creating.rowKey, { text: ing.name, ingredientId: ing.id })}
        />
      )}
    </form>
  )
}
