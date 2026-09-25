import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
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
    <article className={`card card--${status}`}>
      <Link to={`/receta/${recipe.id}`} state={{ back: true }} className="card__link">
        <div className="card__img">
          <RecipeImage recipe={recipe} />
          {status === 'ready' && <span className="state state--ready">Lista</span>}
        </div>
        <div className="card__body">
          <p className="card__meals">{recipe.meals.map((m) => MEAL_LABEL[m]).join(' · ')}</p>
          <h3 className="card__title">{recipe.name}</h3>
          <p className="card__meta">
            <span>{formatMinutes(totalMinutes(recipe))}</span>
            <span>{recipe.servings} porc.</span>
            {cooked && <span>{cooked.replace('hecha ', 'Hecha ')}</span>}
          </p>
        </div>
      </Link>
      {status !== 'ready' && (
        <div className="card__missing">
          <span className="card__missing-text">
            <span className="dot dot--senal" aria-hidden="true" />
            Falta {missing.map((m) => m.name.toLowerCase()).join(', ')}
          </span>
          {onAddMissing && status === 'almost' && (
            <button className="link" onClick={() => onAddMissing(result)}>
              Agregar a compras
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
        <Heart size={18} strokeWidth={2} fill={fav ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>
    </article>
  )
}
