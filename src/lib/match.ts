import type { Ingredient, Meal, Recetario, Recipe } from '../schema'
import { matchesQuery } from './normalize'
import { totalMinutes } from './units'

export type Status = 'ready' | 'almost' | 'far'

export interface MatchResult {
  recipe: Recipe
  status: Status
  /** ingredientes requeridos que no tienes. */
  missing: Ingredient[]
  /** cuántos ingredientes de tu nevera (sin contar básicos) usa la receta. */
  used: number
}

/** Te falta poco = como máximo esta cantidad de ingredientes. */
export const ALMOST_LIMIT = 2

/**
 * Lo que hay disponible: lo seleccionado, los básicos (menos los que marcaste
 * como agotados) y la familia de cada cosa seleccionada: si tienes queso
 * campesino, tienes "queso".
 */
export function buildAvailable(
  ingredients: Ingredient[],
  selected: Iterable<string>,
  staplesOut: Iterable<string> = [],
): Set<string> {
  const byId = new Map(ingredients.map((i) => [i.id, i]))
  const out = new Set(staplesOut)
  const available = new Set<string>()
  for (const i of ingredients) if (i.pantryStaple && !out.has(i.id)) available.add(i.id)
  for (const id of selected) {
    let cur = byId.get(id)
    const seen = new Set<string>()
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id)
      available.add(cur.id)
      cur = cur.family ? byId.get(cur.family) : undefined
    }
  }
  return available
}

export function matchRecipe(
  recipe: Recipe,
  available: Set<string>,
  byId: Map<string, Ingredient>,
): MatchResult {
  const missing: Ingredient[] = []
  let used = 0
  for (const ri of recipe.ingredients) {
    const ing = byId.get(ri.ingredientId)
    if (available.has(ri.ingredientId)) {
      if (!ing?.pantryStaple) used++
    } else if (!ri.optional && ing) {
      missing.push(ing)
    }
  }
  const status: Status = missing.length === 0 ? 'ready' : missing.length <= ALMOST_LIMIT ? 'almost' : 'far'
  return { recipe, status, missing, used }
}

export interface Filters {
  meal: Meal | null
  maxMinutes: number | null
  query: string
  onlyFavorites: boolean
}

export const NO_FILTERS: Filters = { meal: null, maxMinutes: null, query: '', onlyFavorites: false }

export function passesFilters(r: Recipe, f: Filters, favorites: Set<string>): boolean {
  if (f.meal && !r.meals.includes(f.meal)) return false
  if (f.maxMinutes !== null && totalMinutes(r) > f.maxMinutes) return false
  if (f.onlyFavorites && !favorites.has(r.id)) return false
  if (f.query && !matchesQuery(r.name, f.query) && !r.tags.some((t) => matchesQuery(t, f.query))) return false
  return true
}

const STATUS_ORDER: Record<Status, number> = { ready: 0, almost: 1, far: 2 }

export function compareResults(favorites: Set<string>) {
  return (a: MatchResult, b: MatchResult): number =>
    STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
    a.missing.length - b.missing.length ||
    Number(favorites.has(b.recipe.id)) - Number(favorites.has(a.recipe.id)) ||
    b.used - a.used ||
    totalMinutes(a.recipe) - totalMinutes(b.recipe) ||
    a.recipe.name.localeCompare(b.recipe.name, 'es')
}

export interface Grouped {
  ready: MatchResult[]
  almost: MatchResult[]
  far: MatchResult[]
}

export function findRecipes(
  recetario: Recetario,
  selected: Iterable<string>,
  opts: { staplesOut?: Iterable<string>; filters?: Filters; favorites?: Set<string> } = {},
): Grouped {
  const favorites = opts.favorites ?? new Set<string>()
  const filters = opts.filters ?? NO_FILTERS
  const byId = new Map(recetario.ingredients.map((i) => [i.id, i]))
  const available = buildAvailable(recetario.ingredients, selected, opts.staplesOut)
  const results = recetario.recipes
    .filter((r) => passesFilters(r, filters, favorites))
    .map((r) => matchRecipe(r, available, byId))
    .sort(compareResults(favorites))
  return {
    ready: results.filter((r) => r.status === 'ready'),
    almost: results.filter((r) => r.status === 'almost'),
    far: results.filter((r) => r.status === 'far'),
  }
}
