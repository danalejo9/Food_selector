import { useEffect, useMemo, useState } from 'react'
import { IngredientPanel } from '../components/IngredientPanel'
import { RecipeCard } from '../components/RecipeCard'
import { useRecetario } from '../data/store'
import { usePersonal } from '../data/personal'
import { findRecipes, NO_FILTERS, type Filters, type MatchResult } from '../lib/match'
import { withTransition } from '../lib/transition'
import { useToast } from '../lib/useToast'
import { MEAL_LABEL, MEALS, type Meal } from '../schema'

const TIMES = [
  { v: null, label: 'Cualquier tiempo' },
  { v: 15, label: '≤ 15 min' },
  { v: 30, label: '≤ 30 min' },
  { v: 60, label: '≤ 1 hora' },
]

function mealForNow(d = new Date()): Meal {
  const h = d.getHours()
  if (h >= 5 && h < 11) return 'desayuno'
  if (h >= 11 && h < 15) return 'almuerzo'
  if (h >= 15 && h < 18) return 'once'
  if (h >= 18 && h < 22) return 'cena'
  return 'entrecomidas'
}

export function Cocina() {
  const { recetario } = useRecetario()
  const { fridge, fridgeSet, staplesOut, favoriteSet, toggleFridge, addShopping } = usePersonal()
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [sheetOpen, setSheetOpen] = useState(false)
  const toast = useToast()
  const suggested = useMemo(() => mealForNow(), [])

  const groups = useMemo(
    () => findRecipes(recetario, fridgeSet, { staplesOut, filters, favorites: favoriteSet }),
    [recetario, fridgeSet, staplesOut, filters, favoriteSet],
  )

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sheetOpen])

  const toggle = (id: string) => withTransition(() => toggleFridge(id))
  const setF = (patch: Partial<Filters>) => withTransition(() => setFilters((f) => ({ ...f, ...patch })))

  const addMissing = (r: MatchResult) => {
    const n = addShopping(r.missing.map((m) => ({ ingredientId: m.id, text: m.name, forRecipe: r.recipe.name })))
    toast.show(n ? `${n === 1 ? 'Agregado' : `${n} agregados`} a la lista de compras` : 'Ya estaba en la lista')
  }

  const hasFilters = filters.meal || filters.maxMinutes || filters.query || filters.onlyFavorites
  const total = groups.ready.length + groups.almost.length

  return (
    <div className="cocina">
      <aside className={`cocina__aside${sheetOpen ? ' is-open' : ''}`} aria-label="Ingredientes">
        <div className="sheet-grip">
          <button className="btn btn--ink" onClick={() => setSheetOpen(false)}>
            Ver {total} {total === 1 ? 'receta' : 'recetas'}
          </button>
        </div>
        <IngredientPanel onToggle={toggle} />
      </aside>

      <section className="cocina__results" aria-label="Recetas">
        <div className="filters">
          <div className="meals" role="group" aria-label="Momento del día">
            <button className={`tab${!filters.meal ? ' is-on' : ''}`} onClick={() => setF({ meal: null })}>
              Todo
            </button>
            {MEALS.map((m) => (
              <button key={m} className={`tab${filters.meal === m ? ' is-on' : ''}`} onClick={() => setF({ meal: filters.meal === m ? null : m })}>
                {MEAL_LABEL[m]}
              </button>
            ))}
          </div>
          <div className="filters__row">
            <input
              type="search"
              className="input input--small"
              placeholder="Buscar receta"
              value={filters.query}
              onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
              aria-label="Buscar receta"
            />
            <select
              className="input input--small"
              value={filters.maxMinutes ?? ''}
              onChange={(e) => setF({ maxMinutes: e.target.value ? Number(e.target.value) : null })}
              aria-label="Tiempo máximo"
            >
              {TIMES.map((t) => (
                <option key={t.label} value={t.v ?? ''}>
                  {t.label}
                </option>
              ))}
            </select>
            <label className="check">
              <input type="checkbox" checked={filters.onlyFavorites} onChange={(e) => setF({ onlyFavorites: e.target.checked })} />
              Solo favoritas
            </label>
            {hasFilters && (
              <button className="link" onClick={() => setF(NO_FILTERS)}>
                quitar filtros
              </button>
            )}
          </div>
          {!filters.meal && (
            <button className="hint" onClick={() => setF({ meal: suggested })}>
              Es hora de <b>{MEAL_LABEL[suggested].toLowerCase()}</b> — ver solo eso →
            </button>
          )}
        </div>

        {fridge.length === 0 && (
          <div className="intro">
            <h1>
              Abre la nevera, <em>toca lo que haya</em>, y aquí aparece lo que puedes cocinar.
            </h1>
          </div>
        )}

        <ResultGroup
          title="Puedes hacerla"
          note="tienes todo"
          items={groups.ready}
          onAddMissing={addMissing}
          empty={fridge.length > 0 ? 'Aún nada completo. Mira abajo lo que está cerca.' : undefined}
        />
        <ResultGroup title="Te falta poco" note="1 o 2 cosas" items={groups.almost} onAddMissing={addMissing} />
        {groups.far.length > 0 && (
          <details className="far">
            <summary>
              Las demás <span className="mono">({groups.far.length})</span>
            </summary>
            <div className="grid">
              {groups.far.map((r) => (
                <RecipeCard key={r.recipe.id} result={r} />
              ))}
            </div>
          </details>
        )}
        {total + groups.far.length === 0 && (
          <div className="empty">
            <p>Ninguna receta con esos filtros.</p>
            <button className="btn" onClick={() => setF(NO_FILTERS)}>
              Quitar filtros
            </button>
          </div>
        )}
      </section>

      <button className="sheet-toggle" onClick={() => setSheetOpen(true)}>
        <span>
          Tu nevera <b className="mono">{fridge.length}</b>
        </span>
        <span className="mono">
          {groups.ready.length} listas · {groups.almost.length} cerca
        </span>
      </button>
      {toast.node}
    </div>
  )
}

function ResultGroup({
  title,
  note,
  items,
  onAddMissing,
  empty,
}: {
  title: string
  note: string
  items: MatchResult[]
  onAddMissing: (r: MatchResult) => void
  empty?: string
}) {
  if (!items.length && !empty) return null
  return (
    <section className="group">
      <header className="group__head">
        <h2>{title}</h2>
        <span className="group__note">
          {note} · <span className="mono">{items.length}</span>
        </span>
      </header>
      {items.length ? (
        <div className="grid">
          {items.map((r) => (
            <RecipeCard key={r.recipe.id} result={r} onAddMissing={onAddMissing} />
          ))}
        </div>
      ) : (
        <p className="muted">{empty}</p>
      )}
    </section>
  )
}
