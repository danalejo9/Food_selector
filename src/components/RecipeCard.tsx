import { Link } from 'react-router-dom'
import type { MatchResult } from '../lib/match'
import { formatMinutes, totalMinutes } from '../lib/units'
import { cookedLabel, lastCooked, usePersonal } from '../data/personal'
import { MEAL_LABEL } from '../schema'
import { RecipeImage } from './RecipeArt'

export function RecipeCard({ result, onAddMissing }: { result: MatchResult; onAddMissing?: (r: MatchResult) => void }) {
  const { recipe, status, missing } = result
  const { favoriteSet, toggleFavorite, history } = usePersonal()
  const fav = favoriteSet.has(recipe.id)
  const cooked = cookedLabel(lastCooked(history, recipe.id))

  return (
    <article className={`card card--${status}`} style={{ viewTransitionName: `r-${recipe.id}` }}>
      <Link to={`/receta/${recipe.id}`} className="card__link">
        <div className="card__img">
          <RecipeImage recipe={recipe} />
          {status === 'ready' && <span className="stamp stamp--ready">Lista</span>}
        </div>
        <div className="card__body">
          <p className="card__meals">{recipe.meals.map((m) => MEAL_LABEL[m]).join(' · ')}</p>
          <h3 className="card__title">{recipe.name}</h3>
          <p className="card__meta">
            <span>{formatMinutes(totalMinutes(recipe))}</span>
            <span>{recipe.servings} porc.</span>
            {cooked && <span>{cooked}</span>}
          </p>
        </div>
      </Link>
      {status !== 'ready' && (
        <div className="card__missing">
          <span>
            <b>Falta:</b> {missing.map((m) => m.name.toLowerCase()).join(', ')}
          </span>
          {onAddMissing && status === 'almost' && (
            <button className="link" onClick={() => onAddMissing(result)} title="Agregar a la lista de compras">
              + a compras
            </button>
          )}
        </div>
      )}
      <button
        className={`fav${fav ? ' is-on' : ''}`}
        aria-pressed={fav}
        aria-label={fav ? 'Quitar de favoritas' : 'Marcar como favorita'}
        onClick={() => toggleFavorite(recipe.id)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
        </svg>
      </button>
    </article>
  )
}
