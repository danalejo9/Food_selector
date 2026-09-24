/**
 * Carga masiva: convierte filas de la plantilla (Excel/CSV) en recetas y
 * al revés. Sin dependencias del navegador para poder probarlo.
 */
import {
  CATEGORIES,
  CATEGORY_LABEL,
  MEAL_LABEL,
  MEALS,
  RecipeSchema,
  type Category,
  type Ingredient,
  type Meal,
  type Recetario,
  type Recipe,
  type RecipeIngredient,
} from '../schema'
import { normalizeName, slugify, uniqueId } from './normalize'
import { formatQty, parseQty } from './units'

export const RECIPE_COLUMNS = [
  'nombre',
  'descripcion',
  'momentos',
  'prep_min',
  'coccion_min',
  'porciones',
  'dificultad',
  'ingredientes',
  'pasos',
  'etiquetas',
  'foto',
] as const
export const INGREDIENT_COLUMNS = ['nombre', 'categoria', 'familia', 'basico', 'icono'] as const

export type Row = Record<string, string>

export interface NewIngredient {
  ingredient: Ingredient
  /** true si su categoría se adivinó y conviene revisarla. */
  guessed: boolean
}

export interface ParsedRecipe {
  row: number
  recipe: Recipe
  duplicateOf?: string
}

export interface RowError {
  row: number
  name: string
  messages: string[]
}

export interface Preview {
  recipes: ParsedRecipe[]
  errors: RowError[]
  newIngredients: NewIngredient[]
}

const MEAL_ALIASES: Record<string, Meal> = {
  desayuno: 'desayuno',
  almuerzo: 'almuerzo',
  once: 'once',
  onces: 'once',
  merienda: 'once',
  cena: 'cena',
  comida: 'cena',
  'entre comida': 'entrecomidas',
  entrecomida: 'entrecomidas',
  snack: 'entrecomidas',
  mecato: 'entrecomidas',
}

function parseMeal(s: string): Meal | undefined {
  return MEAL_ALIASES[normalizeName(s)]
}

function parseCategory(s: string): Category | undefined {
  const n = normalizeName(s)
  if (!n) return undefined
  return CATEGORIES.find((c) => normalizeName(c) === n || normalizeName(CATEGORY_LABEL[c]).startsWith(n) || normalizeName(CATEGORY_LABEL[c]).includes(n))
}

const YES = new Set(['si', 'sí', 'x', '1', 'true', 'verdadero', 'yes'])

/** "arándanos 1 taza", "harina 1 1/2 taza, cernida", "miel (opcional)", "sal al gusto". */
export function parseIngredientItem(raw: string): { name: string; qty?: number; unit?: string; note?: string; optional: boolean } | null {
  let s = raw.trim()
  if (!s) return null
  let optional = false
  s = s.replace(/\((opcional|opc\.?)\)|\bopcional\b/gi, () => {
    optional = true
    return ''
  })
  let note: string | undefined
  const comma = s.indexOf(',')
  if (comma >= 0) {
    note = s.slice(comma + 1).trim() || undefined
    s = s.slice(0, comma)
  }
  s = s.replace(/\bal gusto\b/i, () => {
    note = note ? `al gusto, ${note}` : 'al gusto'
    return ''
  })
  const tokens = s.trim().split(/\s+/).filter(Boolean)
  for (let i = 1; i < tokens.length; i++) {
    const two = i + 1 < tokens.length ? parseQty(`${tokens[i]} ${tokens[i + 1]}`) : undefined
    const one = parseQty(tokens[i])
    if (one === undefined && two === undefined) continue
    const useTwo = two !== undefined && /[/¼½¾⅓⅔]/.test(tokens[i + 1] ?? '')
    const qty = useTwo ? two : one
    const rest = tokens.slice(i + (useTwo ? 2 : 1)).join(' ')
    return { name: tokens.slice(0, i).join(' '), qty, unit: rest || undefined, note, optional }
  }
  return tokens.length ? { name: tokens.join(' '), note, optional } : null
}

function splitList(s: string, seps = /[;\n]/): string[] {
  return s
    .split(seps)
    .map((x) => x.trim())
    .filter(Boolean)
}

function parseSteps(s: string): { text: string; minutes?: number }[] {
  const parts = s.includes('|') ? s.split('|') : s.split(/\n+/)
  return parts
    .map((p) => p.trim().replace(/^\d+\s*[.)-]\s*/, ''))
    .filter(Boolean)
    .map((text) => {
      const m = text.match(/\((\d+)\s*min\.?\)\s*$/i)
      return m ? { text: text.slice(0, m.index).trim(), minutes: Number(m[1]) } : { text }
    })
}

function num(s: string | undefined, field: string, errs: string[], opts: { int?: boolean; def?: number } = {}): number {
  const t = (s ?? '').trim()
  if (!t) {
    if (opts.def !== undefined) return opts.def
    errs.push(`falta ${field}`)
    return 0
  }
  const v = Number(t.replace(',', '.'))
  if (!Number.isFinite(v) || v < 0) {
    errs.push(`${field} debe ser un número (llegó “${t}”)`)
    return 0
  }
  return opts.int ? Math.round(v) : v
}

/** Normaliza encabezados: "Prep (min)" → "prep_min". */
export function normalizeHeader(h: string): string {
  const n = normalizeName(h).replace(/\s+/g, '_')
  const alias: Record<string, string> = {
    descripcion: 'descripcion',
    momento: 'momentos',
    momentos_del_dia: 'momentos',
    prep: 'prep_min',
    preparacion: 'prep_min',
    preparacion_min: 'prep_min',
    coccion: 'coccion_min',
    porcion: 'porciones',
    ingrediente: 'ingredientes',
    paso: 'pasos',
    etiqueta: 'etiquetas',
    basico: 'basico',
    categoria: 'categoria',
    icono: 'icono',
    foto_url: 'foto',
  }
  return alias[n] ?? n
}

export function parseBulk(recetario: Recetario, recipeRows: Row[], ingredientRows: Row[] = []): Preview {
  const ingredients = [...recetario.ingredients]
  const takenIng = new Set(ingredients.map((i) => i.id))
  const byName = new Map<string, Ingredient>()
  for (const i of ingredients) {
    byName.set(normalizeName(i.name), i)
    byName.set(normalizeName(i.id.replace(/-/g, ' ')), i)
  }
  const newIngredients: NewIngredient[] = []

  const createIngredient = (name: string, category?: Category, extra: Partial<Ingredient> = {}): Ingredient => {
    const ing: Ingredient = {
      id: uniqueId(name, takenIng),
      name: name.charAt(0).toUpperCase() + name.slice(1),
      category: category ?? 'despensa',
      pantryStaple: false,
      ...extra,
    }
    takenIng.add(ing.id)
    byName.set(normalizeName(ing.name), ing)
    newIngredients.push({ ingredient: ing, guessed: !category })
    return ing
  }

  // 1. Hoja de ingredientes: solo agrega los que no existen.
  const pendingFamilies: [Ingredient, string][] = []
  for (const r of ingredientRows) {
    const name = (r.nombre ?? '').trim()
    if (!name || byName.has(normalizeName(name))) continue
    const ing = createIngredient(name, parseCategory(r.categoria ?? ''), {
      pantryStaple: YES.has(normalizeName(r.basico ?? '')),
      icon: (r.icono ?? '').trim() || undefined,
    })
    if (r.familia?.trim()) pendingFamilies.push([ing, r.familia.trim()])
  }
  for (const [ing, fam] of pendingFamilies) {
    const parent = byName.get(normalizeName(fam))
    if (parent && parent.id !== ing.id) ing.family = parent.id
  }

  // 2. Recetas.
  const takenRecipe = new Set(recetario.recipes.map((r) => r.id))
  const existingByName = new Map(recetario.recipes.map((r) => [normalizeName(r.name), r.id]))
  const seenInFile = new Set<string>()
  const recipes: ParsedRecipe[] = []
  const errors: RowError[] = []

  recipeRows.forEach((r, idx) => {
    const rowNum = idx + 2 // fila 1 = encabezados
    const values = RECIPE_COLUMNS.map((c) => (r[c] ?? '').trim())
    if (values.every((v) => !v)) return
    const errs: string[] = []
    const name = (r.nombre ?? '').trim()
    if (!name) errs.push('falta el nombre')

    const mealsRaw = splitList(r.momentos ?? '', /[,;/\n]| y /)
    const meals: Meal[] = []
    for (const m of mealsRaw) {
      const v = parseMeal(m)
      if (v) {
        if (!meals.includes(v)) meals.push(v)
      } else errs.push(`momento “${m}” no existe (usa: ${MEALS.map((x) => MEAL_LABEL[x].toLowerCase()).join(', ')})`)
    }
    if (!mealsRaw.length) errs.push('falta al menos un momento del día')

    const prep = num(r.prep_min, 'prep_min', errs, { int: true, def: 0 })
    const cook = num(r.coccion_min, 'coccion_min', errs, { int: true, def: 0 })
    const servings = num(r.porciones, 'porciones', errs, { int: true, def: 2 }) || 2
    const diffN = num(r.dificultad, 'dificultad', errs, { int: true, def: 1 })
    const difficulty = (diffN >= 1 && diffN <= 3 ? diffN : 1) as 1 | 2 | 3
    if (r.dificultad?.trim() && !(diffN >= 1 && diffN <= 3)) errs.push('dificultad debe ser 1, 2 o 3')

    const ings: RecipeIngredient[] = []
    const items = splitList(r.ingredientes ?? '')
    if (!items.length) errs.push('faltan ingredientes')
    for (const item of items) {
      const p = parseIngredientItem(item)
      if (!p) continue
      const ing = byName.get(normalizeName(p.name)) ?? createIngredient(p.name)
      if (ings.some((x) => x.ingredientId === ing.id)) continue
      ings.push({
        ingredientId: ing.id,
        optional: p.optional,
        ...(p.qty !== undefined && { qty: p.qty }),
        ...(p.unit && { unit: p.unit }),
        ...(p.note && { note: p.note }),
      })
    }

    const steps = parseSteps(r.pasos ?? '')
    if (!steps.length) errs.push('faltan los pasos')

    if (errs.length) {
      errors.push({ row: rowNum, name: name || `(fila ${rowNum})`, messages: errs })
      return
    }

    const key = normalizeName(name)
    if (seenInFile.has(key)) {
      errors.push({ row: rowNum, name, messages: ['esta receta ya aparece más arriba en el archivo'] })
      return
    }
    seenInFile.add(key)
    const duplicateOf = existingByName.get(key)
    const id = duplicateOf ?? uniqueId(name, takenRecipe)
    takenRecipe.add(id)

    const candidate = {
      id,
      name,
      description: (r.descripcion ?? '').trim(),
      meals,
      prepMinutes: prep,
      cookMinutes: cook,
      servings,
      difficulty,
      ingredients: ings,
      steps,
      tags: splitList(r.etiquetas ?? '', /[,;]/),
      ...((r.foto ?? '').trim() && { photo: r.foto.trim() }),
    }
    const check = RecipeSchema.safeParse(candidate)
    if (!check.success) {
      errors.push({ row: rowNum, name, messages: check.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) })
      return
    }
    recipes.push({ row: rowNum, recipe: check.data, duplicateOf })
  })

  // Solo proponemos ingredientes nuevos que de verdad se usan o vienen de la hoja.
  const used = new Set(recipes.flatMap((p) => p.recipe.ingredients.map((i) => i.ingredientId)))
  const fromSheet = new Set(ingredientRows.map((r) => normalizeName(r.nombre ?? '')))
  const keep = newIngredients.filter(
    (n) => used.has(n.ingredient.id) || fromSheet.has(normalizeName(n.ingredient.name)) || newIngredients.some((o) => o.ingredient.family === n.ingredient.id),
  )
  return { recipes, errors, newIngredients: keep }
}

/** Aplica la vista previa. `replace` decide qué hacer con recetas que ya existían. */
export function applyBulk(recetario: Recetario, preview: Preview, opts: { replaceDuplicates: boolean; newIngredients?: Ingredient[] }): {
  next: Recetario
  added: number
  replaced: number
} {
  const newIngs = opts.newIngredients ?? preview.newIngredients.map((n) => n.ingredient)
  const ingredients = [...recetario.ingredients, ...newIngs]
  let recipes = [...recetario.recipes]
  let added = 0
  let replaced = 0
  for (const p of preview.recipes) {
    if (p.duplicateOf) {
      if (!opts.replaceDuplicates) continue
      const old = recipes.find((r) => r.id === p.duplicateOf)
      recipes = recipes.map((r) => (r.id === p.duplicateOf ? { ...p.recipe, photo: p.recipe.photo ?? old?.photo } : r))
      replaced++
    } else {
      recipes.push(p.recipe)
      added++
    }
  }
  return { next: { ...recetario, ingredients, recipes }, added, replaced }
}

// ——— exportar al mismo formato ———

export function ingredientToText(ri: RecipeIngredient, byId: Map<string, Ingredient>): string {
  const name = byId.get(ri.ingredientId)?.name ?? ri.ingredientId
  const parts = [name.toLowerCase()]
  if (ri.qty !== undefined) parts.push(formatQty(ri.qty).replace(/ ([¼½¾⅓⅔])/, ' $1'))
  if (ri.unit) parts.push(ri.unit)
  let s = parts.join(' ')
  if (ri.optional) s += ' (opcional)'
  if (ri.note && ri.note !== 'al gusto') s += `, ${ri.note}`
  else if (ri.note === 'al gusto') s += ' al gusto'
  return s
}

export function recipeToRow(r: Recipe, byId: Map<string, Ingredient>): Row {
  return {
    nombre: r.name,
    descripcion: r.description,
    momentos: r.meals.map((m) => MEAL_LABEL[m].toLowerCase()).join(', '),
    prep_min: String(r.prepMinutes),
    coccion_min: String(r.cookMinutes),
    porciones: String(r.servings),
    dificultad: String(r.difficulty),
    ingredientes: r.ingredients.map((ri) => ingredientToText(ri, byId)).join('; '),
    pasos: r.steps.map((s, i) => `${i + 1}. ${s.text}${s.minutes ? ` (${s.minutes} min)` : ''}`).join('\n'),
    etiquetas: r.tags.join(', '),
    foto: r.photo ?? '',
  }
}

export function ingredientToRow(i: Ingredient, byId: Map<string, Ingredient>): Row {
  return {
    nombre: i.name,
    categoria: CATEGORY_LABEL[i.category],
    familia: i.family ? (byId.get(i.family)?.name ?? '') : '',
    basico: i.pantryStaple ? 'sí' : '',
    icono: i.icon ?? '',
  }
}

export const TEMPLATE_EXAMPLES: Row[] = [
  {
    nombre: 'Sándwich caliente',
    descripcion: 'Pan dorado en sartén con queso derretido.',
    momentos: 'once, cena',
    prep_min: '5',
    coccion_min: '6',
    porciones: '1',
    dificultad: '1',
    ingredientes: 'pan tajado 2 tajada; queso mozzarella 2 tajada; tomate 1 (opcional), en rodajas; mantequilla 1 cda',
    pasos: '1. Unta el pan con mantequilla por fuera.\n2. Arma el sándwich con queso y tomate.\n3. Dóralo en sartén tapada a fuego medio. (6 min)',
    etiquetas: 'rápida',
    foto: '',
  },
  {
    nombre: 'Crema de zanahoria',
    descripcion: 'Suave, dulce y de color naranja intenso.',
    momentos: 'almuerzo, cena',
    prep_min: '10',
    coccion_min: '25',
    porciones: '4',
    dificultad: '1',
    ingredientes: 'zanahoria 4; papa 1; cebolla 1/2; ajo 1 diente; agua 4 taza; crema de leche 2 cda (opcional); sal al gusto',
    pasos: 'Sofríe la cebolla y el ajo. | Agrega la zanahoria y la papa en trozos con el agua. (20 min) | Licúa y sirve con crema de leche.',
    etiquetas: 'sopa, vegetariana',
    foto: '',
  },
]

export { slugify }
