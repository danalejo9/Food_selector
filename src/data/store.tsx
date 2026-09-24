import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { get, set, del } from 'idb-keyval'
import raw from '../../data/recetario.json'
import { parseRecetario, type Ingredient, type Recetario, type Recipe } from '../schema'

const parsedBase = parseRecetario(raw)

export const baseRecetario: Recetario | null = parsedBase.ok ? parsedBase.value : null
export const baseErrors: string[] = parsedBase.ok ? [] : parsedBase.errors

/**
 * El recetario vive en data/recetario.json (el repo). Lo que edites en la app
 * queda como borrador en este navegador hasta que lo descargues y reemplaces
 * el archivo del repo.
 */
interface Draft {
  recetario: Recetario
  /** fotos nuevas aún no subidas al repo, por ruta (fotos/recetas/x.webp). */
  photos: Record<string, Blob>
  changes: number
}

const DRAFT_KEY = 'recetario-borrador'

interface Store {
  recetario: Recetario
  ingredientsById: Map<string, Ingredient>
  draft: Draft | null
  ready: boolean
  photoUrl: (path: string | undefined) => string | undefined
  saveRecipe: (r: Recipe, photo?: { path: string; blob: Blob }) => void
  deleteRecipe: (id: string) => void
  saveIngredient: (i: Ingredient, photo?: { path: string; blob: Blob }) => void
  deleteIngredient: (id: string) => void
  /** reemplazo completo (importaciones masivas). */
  commit: (next: Recetario, photos?: Record<string, Blob>, changes?: number) => void
  discardDraft: () => void
}

const Ctx = createContext<Store | null>(null)

export function RecetarioProvider({ base, children }: { base: Recetario; children: ReactNode }) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [ready, setReady] = useState(false)
  const urls = useRef(new Map<string, string>())

  useEffect(() => {
    get<Draft>(DRAFT_KEY)
      .then((d) => {
        if (!d) return
        const check = parseRecetario(d.recetario)
        if (check.ok) setDraft({ ...d, recetario: check.value })
      })
      .catch(() => {})
      .finally(() => setReady(true))
  }, [])

  const persist = useCallback((d: Draft | null) => {
    setDraft(d)
    ;(d ? set(DRAFT_KEY, d) : del(DRAFT_KEY)).catch((e) => console.error('No se pudo guardar el borrador', e))
  }, [])

  const recetario = draft?.recetario ?? base

  const update = useCallback(
    (fn: (r: Recetario) => Recetario, photo?: { path: string; blob: Blob }, changes = 1) => {
      const cur = draft ?? { recetario: base, photos: {}, changes: 0 }
      const photos = photo ? { ...cur.photos, [photo.path]: photo.blob } : cur.photos
      persist({ recetario: fn(cur.recetario), photos, changes: cur.changes + changes })
    },
    [draft, base, persist],
  )

  const store = useMemo<Store>(
    () => ({
      recetario,
      ingredientsById: new Map(recetario.ingredients.map((i) => [i.id, i])),
      draft,
      ready,
      photoUrl: (path) => {
        if (!path) return undefined
        if (/^(https?:|data:|blob:)/.test(path)) return path
        const blob = draft?.photos[path]
        if (blob) {
          let u = urls.current.get(path)
          if (!u) {
            u = URL.createObjectURL(blob)
            urls.current.set(path, u)
          }
          return u
        }
        return import.meta.env.BASE_URL + path.replace(/^\//, '')
      },
      saveRecipe: (r, photo) =>
        update((cur) => {
          const exists = cur.recipes.some((x) => x.id === r.id)
          return {
            ...cur,
            recipes: exists ? cur.recipes.map((x) => (x.id === r.id ? r : x)) : [...cur.recipes, r],
          }
        }, photo),
      deleteRecipe: (id) => update((cur) => ({ ...cur, recipes: cur.recipes.filter((x) => x.id !== id) })),
      saveIngredient: (i, photo) =>
        update((cur) => {
          const exists = cur.ingredients.some((x) => x.id === i.id)
          return {
            ...cur,
            ingredients: exists ? cur.ingredients.map((x) => (x.id === i.id ? i : x)) : [...cur.ingredients, i],
          }
        }, photo),
      deleteIngredient: (id) =>
        update((cur) => ({
          ...cur,
          ingredients: cur.ingredients
            .filter((x) => x.id !== id)
            .map((x) => (x.family === id ? { ...x, family: undefined } : x)),
        })),
      commit: (next, photos = {}, changes = 1) => {
        const cur = draft ?? { recetario: base, photos: {}, changes: 0 }
        persist({ recetario: next, photos: { ...cur.photos, ...photos }, changes: cur.changes + changes })
      },
      discardDraft: () => {
        urls.current.forEach((u) => URL.revokeObjectURL(u))
        urls.current.clear()
        persist(null)
      },
    }),
    [recetario, draft, ready, update, persist, base],
  )

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useRecetario(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useRecetario fuera de RecetarioProvider')
  return s
}

/** Cuántas recetas usan cada ingrediente (para no borrar lo que está en uso). */
export function usageCount(r: Recetario): Map<string, number> {
  const m = new Map<string, number>()
  for (const rec of r.recipes) for (const ri of rec.ingredients) m.set(ri.ingredientId, (m.get(ri.ingredientId) ?? 0) + 1)
  for (const i of r.ingredients) if (i.family) m.set(i.family, (m.get(i.family) ?? 0) + 1)
  return m
}
