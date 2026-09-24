import { Link, NavLink, useParams } from 'react-router-dom'
import { useRecetario } from '../data/store'
import { RecipeImage } from '../components/RecipeArt'
import { MEAL_LABEL } from '../schema'
import { formatMinutes, totalMinutes } from '../lib/units'
import { IngredientesAdmin } from './IngredientesAdmin'
import { CargaMasiva } from './CargaMasiva'
import { useState } from 'react'
import { matchesQuery } from '../lib/normalize'

export function Recetario() {
  const { tab = 'recetas' } = useParams()
  return (
    <div className="admin">
      <header className="page-head">
        <h1>Recetario</h1>
        <p className="muted">Aquí se configuran las recetas y los ingredientes que ves en la cocina.</p>
      </header>
      <nav className="subnav" aria-label="Secciones del recetario">
        <NavLink to="/recetario" end className={() => (tab === 'recetas' ? 'active' : '')}>
          Recetas
        </NavLink>
        <NavLink to="/recetario/ingredientes">Ingredientes</NavLink>
        <NavLink to="/recetario/plantilla">Carga masiva</NavLink>
      </nav>
      {tab === 'ingredientes' ? <IngredientesAdmin /> : tab === 'plantilla' ? <CargaMasiva /> : <RecetasAdmin />}
    </div>
  )
}

function RecetasAdmin() {
  const { recetario, deleteRecipe } = useRecetario()
  const [q, setQ] = useState('')
  const list = [...recetario.recipes].filter((r) => matchesQuery(r.name, q)).sort((a, b) => a.name.localeCompare(b.name, 'es'))
  return (
    <section>
      <div className="toolbar">
        <input className="input" type="search" placeholder="Buscar receta" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar receta" />
        <span className="muted mono">{recetario.recipes.length} recetas</span>
        <Link className="btn btn--ink" to="/recetario/receta/nueva">
          + Nueva receta
        </Link>
      </div>
      <ul className="admin-list">
        {list.map((r) => (
          <li key={r.id}>
            <Link to={`/recetario/receta/${r.id}`} className="admin-list__main">
              <span className="admin-list__thumb">
                <RecipeImage recipe={r} />
              </span>
              <span>
                <b className="admin-list__name">{r.name}</b>
                <span className="muted small">
                  {r.meals.map((m) => MEAL_LABEL[m]).join(', ')} · {formatMinutes(totalMinutes(r))} · {r.ingredients.length} ingredientes ·{' '}
                  {r.steps.length} pasos
                </span>
              </span>
            </Link>
            <div className="admin-list__actions">
              <Link className="link" to={`/receta/${r.id}`}>
                ver
              </Link>
              <button
                className="link danger"
                onClick={() => {
                  if (confirm(`¿Borrar “${r.name}”?`)) deleteRecipe(r.id)
                }}
              >
                borrar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
