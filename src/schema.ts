import { z } from 'zod'
import { parseYouTube } from './lib/youtube'

export const MEALS = ['desayuno', 'almuerzo', 'once', 'cena', 'entrecomidas'] as const
export const MEAL_LABEL: Record<Meal, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  once: 'Once',
  cena: 'Cena',
  entrecomidas: 'Entre comidas',
}

export const CATEGORIES = ['lacteos', 'frutas', 'verduras', 'proteinas', 'harinas', 'despensa'] as const
export const CATEGORY_LABEL: Record<Category, string> = {
  lacteos: 'Lácteos y huevos',
  frutas: 'Frutas',
  verduras: 'Verduras',
  proteinas: 'Carnes y proteínas',
  harinas: 'Harinas y granos',
  despensa: 'Despensa',
}

const slug = z.string().regex(/^[a-z0-9-]+$/, 'solo minúsculas, números y guiones')

export const IngredientSchema = z.object({
  id: slug,
  name: z.string().min(1),
  category: z.enum(CATEGORIES),
  /** id de un ingrediente genérico: "queso-campesino" pertenece a "queso". */
  family: slug.optional(),
  /** clave del set de iconos propio o un emoji. */
  icon: z.string().optional(),
  photo: z.string().optional(),
  /** básicos de despensa: se asume que siempre están. */
  pantryStaple: z.boolean().default(false),
})

export const RecipeIngredientSchema = z.object({
  ingredientId: slug,
  qty: z.number().positive().optional(),
  unit: z.string().optional(),
  note: z.string().optional(),
  optional: z.boolean().default(false),
})

export const StepSchema = z.object({
  text: z.string().min(1),
  minutes: z.number().positive().optional(),
  /** enlace de YouTube (normal o Short) que se ve en el modo cocinar. */
  video: z
    .string()
    .refine((v) => parseYouTube(v) !== null, 'el video debe ser un enlace de YouTube')
    .optional(),
})

export const RecipeSchema = z.object({
  id: slug,
  name: z.string().min(1),
  description: z.string().default(''),
  photo: z.string().optional(),
  meals: z.array(z.enum(MEALS)).min(1),
  prepMinutes: z.number().int().min(0),
  cookMinutes: z.number().int().min(0),
  servings: z.number().int().positive(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  ingredients: z.array(RecipeIngredientSchema).min(1),
  steps: z.array(StepSchema).min(1),
  tags: z.array(z.string()).default([]),
})

export const RecetarioSchema = z
  .object({
    version: z.literal(1),
    ingredients: z.array(IngredientSchema),
    recipes: z.array(RecipeSchema),
  })
  .superRefine((r, ctx) => {
    const ids = new Set<string>()
    r.ingredients.forEach((ing, i) => {
      if (ids.has(ing.id)) ctx.addIssue({ code: 'custom', path: ['ingredients', i, 'id'], message: `id repetido: ${ing.id}` })
      ids.add(ing.id)
    })
    r.ingredients.forEach((ing, i) => {
      if (ing.family && !ids.has(ing.family))
        ctx.addIssue({ code: 'custom', path: ['ingredients', i, 'family'], message: `familia inexistente: ${ing.family}` })
      if (ing.family === ing.id)
        ctx.addIssue({ code: 'custom', path: ['ingredients', i, 'family'], message: 'un ingrediente no puede ser su propia familia' })
    })
    const recipeIds = new Set<string>()
    r.recipes.forEach((rec, i) => {
      if (recipeIds.has(rec.id)) ctx.addIssue({ code: 'custom', path: ['recipes', i, 'id'], message: `id repetido: ${rec.id}` })
      recipeIds.add(rec.id)
      rec.ingredients.forEach((ri, j) => {
        if (!ids.has(ri.ingredientId))
          ctx.addIssue({
            code: 'custom',
            path: ['recipes', i, 'ingredients', j],
            message: `"${rec.name}" usa un ingrediente que no existe: ${ri.ingredientId}`,
          })
      })
    })
  })

export type Meal = (typeof MEALS)[number]
export type Category = (typeof CATEGORIES)[number]
export type Ingredient = z.infer<typeof IngredientSchema>
export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>
export type Step = z.infer<typeof StepSchema>
export type Recipe = z.infer<typeof RecipeSchema>
export type Recetario = z.infer<typeof RecetarioSchema>

export function parseRecetario(data: unknown): { ok: true; value: Recetario } | { ok: false; errors: string[] } {
  const res = RecetarioSchema.safeParse(data)
  if (res.success) return { ok: true, value: res.data }
  return {
    ok: false,
    errors: res.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
  }
}
