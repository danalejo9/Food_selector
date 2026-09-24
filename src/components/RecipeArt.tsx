import type { Meal, Recipe } from '../schema'
import { useRecetario } from '../data/store'
import { FoodIcon } from './FoodIcon'
import { normalizeName } from '../lib/normalize'

// Ilustración temporal hasta tener fotos reales. El mantel toma tonos de la
// paleta según el momento del día (la categoría principal del plato).
const MEAL_TINT: Record<Meal, [string, string]> = {
  desayuno: ['#E8B90F', '#F3DC8A'],
  almuerzo: ['#8E4430', '#C9A092'],
  once: ['#B9B7B0', '#E3E6E0'],
  cena: ['#1E2124', '#8A8F93'],
  entrecomidas: ['#4F5E3A', '#AEB89C'],
}

/** Posiciones de los ingredientes sobre el plato (en % y grados). */
const SPOTS = [
  { x: 50, y: 34, r: -8, s: 1.25 },
  { x: 33, y: 60, r: 12, s: 1.05 },
  { x: 66, y: 62, r: -14, s: 1.1 },
  { x: 50, y: 58, r: 4, s: 0.85 },
]

/**
 * Ilustración para platos sin foto: mantel de cuadros del color del momento
 * del día y un plato visto desde arriba con los ingredientes principales.
 */
export function RecipeArt({ recipe, className }: { recipe: Recipe; className?: string }) {
  const { ingredientsById } = useRecetario()
  const [strong, soft] = MEAL_TINT[recipe.meals[0]]
  // el ingrediente que da nombre al plato va primero: "Pancakes de arándanos" → arándanos
  const title = normalizeName(recipe.name)
  const main = recipe.ingredients
    .filter((ri) => !ri.optional)
    .map((ri) => ingredientsById.get(ri.ingredientId))
    .filter((i) => i && !i.pantryStaple)
    .map((i, k) => ({ i: i!, score: title.includes(normalizeName(i!.name).split(' ')[0]) ? -1 : k }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((x) => x.i)
  const pid = `gingham-${recipe.id}`
  return (
    <div className={`recipe-art ${className ?? ''}`} aria-hidden="true">
      <svg className="recipe-art__cloth" preserveAspectRatio="xMidYMid slice" viewBox="0 0 400 300">
        <defs>
          <pattern id={pid} width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(-6)">
            <rect width="36" height="36" fill={soft} />
            <rect width="18" height="36" fill={strong} opacity="0.35" />
            <rect width="36" height="18" fill={strong} opacity="0.35" />
          </pattern>
        </defs>
        <rect width="400" height="300" fill={`url(#${pid})`} />
        <ellipse cx="206" cy="160" rx="118" ry="118" fill="rgba(0,0,0,.14)" />
        <circle cx="200" cy="150" r="118" fill="#FFFFFF" stroke="#1E2124" strokeWidth="2" />
        <circle cx="200" cy="150" r="88" fill="none" stroke="#1E2124" strokeOpacity=".2" strokeWidth="1.5" />
      </svg>
      <div className="recipe-art__food">
        {main.map((ing, k) => {
          const s = SPOTS[main.length === 1 ? 3 : k]
          return (
            <span
              key={ing.id}
              style={{ left: `${s.x}%`, top: `${s.y}%`, transform: `translate(-50%,-50%) rotate(${s.r}deg) scale(${main.length === 1 ? 1.6 : s.s})` }}
            >
              <FoodIcon icon={ing.icon} size={56} variant="color" />
            </span>
          )
        })}
      </div>
    </div>
  )
}

/** Foto del plato si existe; si no, la ilustración. */
export function RecipeImage({ recipe, className }: { recipe: Recipe; className?: string }) {
  const { photoUrl } = useRecetario()
  const url = photoUrl(recipe.photo)
  if (url) return <img className={`recipe-photo ${className ?? ''}`} src={url} alt="" loading="lazy" />
  return <RecipeArt recipe={recipe} className={className} />
}
