import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { RecipeImage } from '../components/RecipeArt'
import { FoodIcon } from '../components/FoodIcon'
import { useRecetario } from '../data/store'
import { cookedLabel, today, usePersonal } from '../data/personal'
import { buildAvailable } from '../lib/match'
import { formatAmount, formatMinutes, totalMinutes } from '../lib/units'
import { useToast } from '../lib/useToast'
import { MEAL_LABEL } from '../schema'

const DIFFICULTY = ['', 'Fácil', 'Media', 'Exigente']

export function RecetaDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { recetario, ingredientsById } = useRecetario()
  const p = usePersonal()
  const toast = useToast()
  const recipe = recetario.recipes.find((r) => r.id === id)
  const [servings, setServings] = useState(recipe?.servings ?? 1)
  const available = useMemo(
    () => buildAvailable(recetario.ingredients, p.fridge, p.staplesOut),
    [recetario, p.fridge, p.staplesOut],
  )

  if (!recipe) {
    return (
      <div className="empty">
        <h2>No encontramos esa receta.</h2>
        <Link className="btn" to="/">
          Volver
        </Link>
      </div>
    )
  }

  const factor = servings / recipe.servings
  const fav = p.favoriteSet.has(recipe.id)
  const dates = p.history[recipe.id] ?? []
  const missing = recipe.ingredients.filter((ri) => !ri.optional && !available.has(ri.ingredientId))
  const cookedToday = dates.includes(today())

  const addToList = (ids: string[]) => {
    const n = p.addShopping(
      ids.map((iid) => ({ ingredientId: iid, text: ingredientsById.get(iid)?.name ?? iid, forRecipe: recipe.name })),
    )
    toast.show(n ? `${n === 1 ? 'Agregado' : `${n} agregados`} a la lista de compras` : 'Ya estaba en la lista')
  }

  return (
    <article className="detail">
      <button className="back link" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}>
        ← volver
      </button>

      <div className="detail__top">
        <div className="detail__img" style={{ viewTransitionName: `r-${recipe.id}` }}>
          <RecipeImage recipe={recipe} />
        </div>
        <header className="detail__head">
          <p className="kicker">{recipe.meals.map((m) => MEAL_LABEL[m]).join(' · ')}</p>
          <h1 className="detail__title">{recipe.name}</h1>
          {recipe.description && <p className="detail__desc">{recipe.description}</p>}

          <dl className="facts">
            <div>
              <dt>Preparación</dt>
              <dd>{formatMinutes(recipe.prepMinutes)}</dd>
            </div>
            <div>
              <dt>Cocción</dt>
              <dd>{recipe.cookMinutes ? formatMinutes(recipe.cookMinutes) : '—'}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{formatMinutes(totalMinutes(recipe))}</dd>
            </div>
            <div>
              <dt>Dificultad</dt>
              <dd>{DIFFICULTY[recipe.difficulty]}</dd>
            </div>
          </dl>

          <div className="detail__actions">
            <Link className="btn btn--ink" to={`/receta/${recipe.id}/cocinar`}>
              Cocinar paso a paso
            </Link>
            <button className={`btn${fav ? ' is-on' : ''}`} aria-pressed={fav} onClick={() => p.toggleFavorite(recipe.id)}>
              {fav ? '♥ Favorita' : '♡ Favorita'}
            </button>
            <button
              className="btn"
              disabled={cookedToday}
              onClick={() => {
                p.markCooked(recipe.id)
                toast.show('Anotado en el historial')
              }}
            >
              {cookedToday ? '✓ Hecha hoy' : 'La hice hoy'}
            </button>
          </div>
          {dates.length > 0 && (
            <p className="muted small">
              {cookedLabel(dates[dates.length - 1])} · {dates.length} {dates.length === 1 ? 'vez' : 'veces'} en total
            </p>
          )}
        </header>
      </div>

      <div className="detail__cols">
        <section className="ingredients">
          <div className="section-head">
            <h2>Ingredientes</h2>
            <div className="stepper" aria-label="Porciones">
              <button onClick={() => setServings((s) => Math.max(1, s - 1))} aria-label="Menos porciones">
                −
              </button>
              <span className="mono">
                {servings} porc.
              </span>
              <button onClick={() => setServings((s) => s + 1)} aria-label="Más porciones">
                +
              </button>
            </div>
          </div>
          {missing.length > 0 && (
            <div className="missing-box">
              <span>
                Te falta{missing.length > 1 ? 'n' : ''} {missing.length}.
              </span>
              <button className="link" onClick={() => addToList(missing.map((m) => m.ingredientId))}>
                Agregar a compras
              </button>
            </div>
          )}
          <ul className="ing-list">
            {recipe.ingredients.map((ri) => {
              const ing = ingredientsById.get(ri.ingredientId)
              const have = available.has(ri.ingredientId)
              return (
                <li key={ri.ingredientId} className={have ? 'have' : ri.optional ? 'opt' : 'miss'}>
                  <span className="ing-list__icon">
                    <FoodIcon icon={ing?.icon} size={26} />
                  </span>
                  <span className="ing-list__name">
                    {ing?.name ?? ri.ingredientId}
                    {ri.note && <span className="muted"> — {ri.note}</span>}
                    {ri.optional && <span className="tag">opcional</span>}
                  </span>
                  <span className="ing-list__qty mono">{formatAmount(ri.qty, ri.unit, factor)}</span>
                  <span className="ing-list__state" aria-label={have ? 'lo tienes' : 'no lo tienes'}>
                    {have ? '✓' : ri.optional ? '' : '✗'}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="steps">
          <h2>Preparación</h2>
          <ol>
            {recipe.steps.map((s, i) => (
              <li key={i}>
                <span className="steps__n">{i + 1}</span>
                <p>
                  {s.text}
                  {s.minutes && <span className="mono muted"> · {s.minutes} min</span>}
                </p>
              </li>
            ))}
          </ol>
          {recipe.tags.length > 0 && (
            <p className="tags">
              {recipe.tags.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </p>
          )}
          <p className="small">
            <Link className="link" to={`/recetario/receta/${recipe.id}`}>
              Editar esta receta
            </Link>
          </p>
        </section>
      </div>
      {toast.node}
    </article>
  )
}
