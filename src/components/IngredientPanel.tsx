import { useMemo, useState } from 'react'
import { CATEGORIES, CATEGORY_LABEL, type Ingredient } from '../schema'
import { useRecetario } from '../data/store'
import { usePersonal } from '../data/personal'
import { matchesQuery } from '../lib/normalize'
import { Search } from 'lucide-react'
import { IngredientChip } from './IngredientChip'

interface Group {
  head: Ingredient
  children: Ingredient[]
}

/** Agrupa cada familia: el genérico primero y sus variantes debajo. */
function groupFamilies(list: Ingredient[], all: Ingredient[]): Group[] {
  const byId = new Map(all.map((i) => [i.id, i]))
  const groups = new Map<string, Group>()
  const order: string[] = []
  for (const i of list) {
    const parent = i.family && byId.get(i.family)
    const key = parent && parent.category === i.category ? parent.id : i.id
    if (!groups.has(key)) {
      groups.set(key, { head: byId.get(key)!, children: [] })
      order.push(key)
    }
    if (key !== i.id) groups.get(key)!.children.push(i)
  }
  return order.map((k) => groups.get(k)!)
}

export function IngredientPanel({ onToggle }: { onToggle: (id: string) => void }) {
  const { recetario } = useRecetario()
  const { fridgeSet, freq, staplesOut, toggleStaple, clearFridge, fridge } = usePersonal()
  const [query, setQuery] = useState('')

  const byName = (a: Ingredient, b: Ingredient) => a.name.localeCompare(b.name, 'es')
  const regular = useMemo(() => recetario.ingredients.filter((i) => !i.pantryStaple), [recetario])
  const staples = useMemo(() => recetario.ingredients.filter((i) => i.pantryStaple).sort(byName), [recetario])
  const shown = regular.filter((i) => matchesQuery(i.name, query))

  const frequent = useMemo(
    () =>
      regular
        .filter((i) => (freq[i.id] ?? 0) >= 2)
        .sort((a, b) => (freq[b.id] ?? 0) - (freq[a.id] ?? 0))
        .slice(0, 8),
    [regular, freq],
  )
  const out = new Set(staplesOut)
  const selectedNames = fridge.map((id) => recetario.ingredients.find((i) => i.id === id)?.name).filter(Boolean)

  return (
    <div className="panel">
      <div className="panel__head">
        <h2 className="panel__title">
          Tu nevera
          <span className="panel__count">{fridge.length}</span>
        </h2>
        {fridge.length > 0 && (
          <button className="link" onClick={clearFridge}>
            Vaciar
          </button>
        )}
      </div>
      <p className="panel__summary" aria-live="polite">
        {fridge.length === 0 ? 'Sin ingredientes seleccionados.' : selectedNames.join(', ')}
      </p>
      <label className="search">
        <span className="visually-hidden">Buscar ingrediente</span>
        <Search size={18} aria-hidden="true" />
        <input type="search" placeholder="Buscar ingrediente" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>

      {!query && frequent.length > 0 && (
        <section className="panel__section">
          <h3 className="kicker">Más usados</h3>
          <div className="chips">
            {frequent.map((i) => (
              <IngredientChip key={i.id} ingredient={i} selected={fridgeSet.has(i.id)} onToggle={onToggle} />
            ))}
          </div>
        </section>
      )}

      {CATEGORIES.map((cat) => {
        const list = shown.filter((i) => i.category === cat).sort(byName)
        if (!list.length) return null
        return (
          <section key={cat} className="panel__section">
            <h3 className="kicker">{CATEGORY_LABEL[cat]}</h3>
            <div className="chips">
              {groupFamilies(list, recetario.ingredients).map((g) =>
                g.children.length ? (
                  <div key={g.head.id} className="family">
                    <IngredientChip ingredient={g.head} selected={fridgeSet.has(g.head.id)} onToggle={onToggle} />
                    <div className="family__kids">
                      {g.children.map((c) => (
                        <IngredientChip key={c.id} ingredient={c} selected={fridgeSet.has(c.id)} onToggle={onToggle} child />
                      ))}
                    </div>
                  </div>
                ) : (
                  <IngredientChip key={g.head.id} ingredient={g.head} selected={fridgeSet.has(g.head.id)} onToggle={onToggle} />
                ),
              )}
            </div>
          </section>
        )
      })}
      {query && shown.length === 0 && <p className="muted">No hay ingredientes con “{query}”. Se crean en Recetario → Ingredientes.</p>}

      {!query && staples.length > 0 && (
        <section className="panel__section panel__section--staples">
          <h3 className="kicker">Siempre tengo</h3>
          <p className="muted small">Se cuentan como disponibles. Toca uno para marcarlo agotado.</p>
          <div className="chips">
            {staples.map((i) => (
              <IngredientChip key={i.id} ingredient={i} selected={!out.has(i.id)} onToggle={toggleStaple} variant="staple" />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
