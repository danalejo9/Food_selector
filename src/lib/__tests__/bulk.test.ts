import { describe, expect, it } from 'vitest'
import raw from '../../../data/recetario.json'
import { parseRecetario, RecetarioSchema, type Recetario } from '../../schema'
import { applyBulk, parseBulk, parseIngredientItem, recipeToRow, TEMPLATE_EXAMPLES } from '../bulk'

const parsed = parseRecetario(raw)
if (!parsed.ok) throw new Error('recetario inválido')
const recetario: Recetario = parsed.value
const byId = new Map(recetario.ingredients.map((i) => [i.id, i]))

describe('parseIngredientItem', () => {
  it('lee nombre, cantidad y unidad', () => {
    expect(parseIngredientItem('harina de trigo 1 1/2 taza')).toEqual({ name: 'harina de trigo', qty: 1.5, unit: 'taza', optional: false, note: undefined })
    expect(parseIngredientItem('huevos 2')).toMatchObject({ name: 'huevos', qty: 2 })
    expect(parseIngredientItem('cebolla 1/2')).toMatchObject({ name: 'cebolla', qty: 0.5 })
  })
  it('lee opcional, notas y al gusto', () => {
    expect(parseIngredientItem('miel (opcional)')).toMatchObject({ name: 'miel', optional: true })
    expect(parseIngredientItem('tomate 1 (opcional), en rodajas')).toMatchObject({ name: 'tomate', qty: 1, optional: true, note: 'en rodajas' })
    expect(parseIngredientItem('sal al gusto')).toMatchObject({ name: 'sal', note: 'al gusto' })
  })
})

describe('parseBulk', () => {
  it('la plantilla de ejemplo carga sin errores', () => {
    const p = parseBulk(recetario, TEMPLATE_EXAMPLES)
    expect(p.errors).toEqual([])
    expect(p.recipes).toHaveLength(2)
    const sandwich = p.recipes[0].recipe
    expect(sandwich.ingredients.map((i) => i.ingredientId)).toEqual(['pan-tajado', 'queso-mozzarella', 'tomate', 'mantequilla'])
    const crema = p.recipes[1].recipe
    expect(crema.steps).toHaveLength(3)
    expect(crema.steps[1].minutes).toBe(20)
    expect(crema.ingredients.find((i) => i.ingredientId === 'crema-leche')?.optional).toBe(true)
    const { next } = applyBulk(recetario, p, { replaceDuplicates: false })
    expect(RecetarioSchema.safeParse(next).success).toBe(true)
  })

  it('lee el video y los minutos de un paso', () => {
    const p = parseBulk(recetario, [
      {
        nombre: 'Prueba video',
        momentos: 'cena',
        ingredientes: 'huevo 1',
        pasos: '1. Batir (2 min) [video: https://youtu.be/dQw4w9WgXcQ]\n2. Servir [video: youtube.com/shorts/dQw4w9WgXcQ] (1 min)\n3. Comer',
      },
    ])
    expect(p.errors).toEqual([])
    expect(p.recipes[0].recipe.steps).toEqual([
      { text: 'Batir', minutes: 2, video: 'https://youtu.be/dQw4w9WgXcQ' },
      { text: 'Servir', minutes: 1, video: 'youtube.com/shorts/dQw4w9WgXcQ' },
      { text: 'Comer' },
    ])
  })

  it('rechaza un video que no es de YouTube', () => {
    const p = parseBulk(recetario, [{ nombre: 'Mal video', momentos: 'cena', ingredientes: 'huevo 1', pasos: 'Batir [video: https://vimeo.com/1]' }])
    expect(p.recipes).toHaveLength(0)
    expect(p.errors[0].messages.join(' ')).toMatch(/YouTube/)
  })

  it('reporta errores por fila', () => {
    const p = parseBulk(recetario, [{ nombre: 'Algo', momentos: 'almuerso', ingredientes: 'huevo 1', pasos: 'x', dificultad: '7' }])
    expect(p.recipes).toHaveLength(0)
    expect(p.errors[0].row).toBe(2)
    expect(p.errors[0].messages.join(' ')).toMatch(/almuerso/)
    expect(p.errors[0].messages.join(' ')).toMatch(/dificultad/)
  })

  it('crea ingredientes nuevos y los reconoce con plural y tildes', () => {
    const p = parseBulk(
      recetario,
      [{ nombre: 'Maracuyá con arándano', momentos: 'entre comidas', ingredientes: 'maracuyás 3; arandano 1 taza', pasos: 'Mezclar' }],
      [{ nombre: 'Maracuyá', categoria: 'frutas' }],
    )
    expect(p.errors).toEqual([])
    expect(p.newIngredients.map((n) => n.ingredient.id)).toEqual(['maracuya'])
    expect(p.newIngredients[0].ingredient.category).toBe('frutas')
    expect(p.recipes[0].recipe.ingredients.map((i) => i.ingredientId)).toEqual(['maracuya', 'arandanos'])
  })

  it('exportar y volver a cargar da las mismas recetas', () => {
    const rows = recetario.recipes.map((r) => recipeToRow(r, byId))
    const p = parseBulk(recetario, rows)
    expect(p.errors).toEqual([])
    expect(p.newIngredients).toEqual([])
    for (const pr of p.recipes) {
      const orig = recetario.recipes.find((r) => r.id === pr.duplicateOf)!
      expect(pr.recipe.ingredients).toEqual(orig.ingredients)
      expect(pr.recipe.steps).toEqual(orig.steps)
      expect(pr.recipe.meals).toEqual(orig.meals)
    }
  })
})
