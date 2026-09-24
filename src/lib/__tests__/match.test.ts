import { describe, expect, it } from 'vitest'
import raw from '../../../data/recetario.json'
import { parseRecetario, type Recetario } from '../../schema'
import { buildAvailable, findRecipes } from '../match'

const parsed = parseRecetario(raw)
if (!parsed.ok) throw new Error(parsed.errors.join('\n'))
const recetario: Recetario = parsed.value
const ids = (xs: { recipe: { id: string } }[]) => xs.map((x) => x.recipe.id)

describe('buildAvailable', () => {
  it('incluye básicos y sube a la familia', () => {
    const a = buildAvailable(recetario.ingredients, ['queso-campesino'])
    expect(a.has('queso')).toBe(true)
    expect(a.has('queso-campesino')).toBe(true)
    expect(a.has('sal')).toBe(true)
    expect(a.has('queso-mozzarella')).toBe(false)
  })
  it('lo genérico no cubre lo específico', () => {
    const a = buildAvailable(recetario.ingredients, ['queso'])
    expect(a.has('queso-campesino')).toBe(false)
  })
  it('respeta básicos agotados', () => {
    const a = buildAvailable(recetario.ingredients, [], ['aceite'])
    expect(a.has('aceite')).toBe(false)
    expect(a.has('sal')).toBe(true)
  })
})

describe('findRecipes', () => {
  const pancakes = ['harina', 'leche', 'huevo', 'polvo-hornear', 'mantequilla', 'arandanos']

  it('pancakes listos con sus ingredientes (miel es opcional)', () => {
    const g = findRecipes(recetario, pancakes)
    expect(ids(g.ready)).toContain('pancakes-arandanos')
  })

  it('sin huevos pasa a "te falta poco" y dice qué falta', () => {
    const g = findRecipes(recetario, pancakes.filter((x) => x !== 'huevo'))
    const hit = g.almost.find((r) => r.recipe.id === 'pancakes-arandanos')
    expect(hit?.missing.map((m) => m.id)).toEqual(['huevo'])
  })

  it('leche deslactosada sirve donde piden leche', () => {
    const g = findRecipes(recetario, ['fresa', 'leche-deslactosada'])
    expect(ids(g.ready)).toContain('batido-fresa')
  })

  it('queso campesino sirve para la boloñesa que pide queso (opcional) y el chocolate', () => {
    const g = findRecipes(recetario, ['chocolate', 'leche', 'queso-campesino', 'pan-tajado'])
    expect(ids(g.ready)).toContain('chocolate-queso')
  })

  it('más de 2 faltantes queda lejos', () => {
    const g = findRecipes(recetario, [])
    expect(ids(g.far)).toContain('ajiaco')
  })

  it('filtra por momento del día y favoritas', () => {
    const g = findRecipes(recetario, pancakes, {
      filters: { meal: 'cena', maxMinutes: null, query: '', onlyFavorites: false },
    })
    expect(ids(g.ready)).not.toContain('pancakes-arandanos')
    const f = findRecipes(recetario, pancakes, {
      filters: { meal: null, maxMinutes: null, query: '', onlyFavorites: true },
      favorites: new Set(['changua']),
    })
    expect([...ids(f.ready), ...ids(f.almost), ...ids(f.far)]).toEqual(['changua'])
  })

  it('ordena listas por menos faltantes y luego por más ingredientes usados', () => {
    const g = findRecipes(recetario, ['huevo', 'tomate', 'cebolla', 'arepa', 'mantequilla', 'arroz', 'frijoles'])
    expect(ids(g.ready).slice(0, 2)).toEqual(['calentado', 'huevos-pericos'])
  })
})
