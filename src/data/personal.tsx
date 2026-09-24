import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

/**
 * Estado de este dispositivo: lo que hay en la nevera hoy, favoritas,
 * historial y lista de compras. No va al repo.
 */
export interface ShoppingItem {
  key: string
  ingredientId?: string
  text: string
  done: boolean
  /** receta que lo pidió, para mostrar "para: Ajiaco". */
  forRecipe?: string
}

interface PersonalState {
  fridge: string[]
  staplesOut: string[]
  favorites: string[]
  /** fechas ISO (yyyy-mm-dd) en que se preparó cada receta. */
  history: Record<string, string[]>
  shopping: ShoppingItem[]
  /** cuántas veces se ha seleccionado cada ingrediente. */
  freq: Record<string, number>
}

const EMPTY: PersonalState = { fridge: [], staplesOut: [], favorites: [], history: {}, shopping: [], freq: {} }
const KEY = 'la-nevera:personal:v1'

function load(): PersonalState {
  try {
    const s = localStorage.getItem(KEY)
    return s ? { ...EMPTY, ...JSON.parse(s) } : EMPTY
  } catch {
    return EMPTY
  }
}

interface Personal extends PersonalState {
  fridgeSet: Set<string>
  favoriteSet: Set<string>
  toggleFridge: (id: string) => void
  setFridge: (ids: string[]) => void
  clearFridge: () => void
  toggleStaple: (id: string) => void
  toggleFavorite: (id: string) => void
  markCooked: (recipeId: string) => void
  unmarkCooked: (recipeId: string, date: string) => void
  addShopping: (items: Omit<ShoppingItem, 'key' | 'done'>[]) => number
  toggleShopping: (key: string) => void
  removeShopping: (key: string) => void
  clearBought: () => void
}

const Ctx = createContext<Personal | null>(null)

export function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function PersonalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersonalState>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* modo privado o almacenamiento lleno: la app sigue funcionando */
    }
  }, [state])

  // si la app está abierta en otra pestaña, mantenerlas iguales
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setState(load())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toggleFridge = useCallback(
    (id: string) =>
      setState((s) => {
        const has = s.fridge.includes(id)
        return {
          ...s,
          fridge: has ? s.fridge.filter((x) => x !== id) : [...s.fridge, id],
          freq: has ? s.freq : { ...s.freq, [id]: (s.freq[id] ?? 0) + 1 },
        }
      }),
    [],
  )

  const value = useMemo<Personal>(
    () => ({
      ...state,
      fridgeSet: new Set(state.fridge),
      favoriteSet: new Set(state.favorites),
      toggleFridge,
      setFridge: (ids) => setState((s) => ({ ...s, fridge: [...new Set(ids)] })),
      clearFridge: () => setState((s) => ({ ...s, fridge: [] })),
      toggleStaple: (id) =>
        setState((s) => ({
          ...s,
          staplesOut: s.staplesOut.includes(id) ? s.staplesOut.filter((x) => x !== id) : [...s.staplesOut, id],
        })),
      toggleFavorite: (id) =>
        setState((s) => ({
          ...s,
          favorites: s.favorites.includes(id) ? s.favorites.filter((x) => x !== id) : [...s.favorites, id],
        })),
      markCooked: (id) =>
        setState((s) => {
          const list = s.history[id] ?? []
          const t = today()
          return list.includes(t) ? s : { ...s, history: { ...s.history, [id]: [...list, t].sort() } }
        }),
      unmarkCooked: (id, date) =>
        setState((s) => ({ ...s, history: { ...s.history, [id]: (s.history[id] ?? []).filter((d) => d !== date) } })),
      addShopping: (items) => {
        const pending = new Set(state.shopping.filter((x) => !x.done).map((x) => x.ingredientId ?? x.text))
        const fresh = items
          .filter((it) => !pending.has(it.ingredientId ?? it.text))
          .map((it) => ({ ...it, done: false, key: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}` }))
        if (fresh.length) setState((s) => ({ ...s, shopping: [...s.shopping, ...fresh] }))
        return fresh.length
      },
      toggleShopping: (key) =>
        setState((s) => ({ ...s, shopping: s.shopping.map((x) => (x.key === key ? { ...x, done: !x.done } : x)) })),
      removeShopping: (key) => setState((s) => ({ ...s, shopping: s.shopping.filter((x) => x.key !== key) })),
      clearBought: () => setState((s) => ({ ...s, shopping: s.shopping.filter((x) => !x.done) })),
    }),
    [state, toggleFridge],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePersonal(): Personal {
  const s = useContext(Ctx)
  if (!s) throw new Error('usePersonal fuera de PersonalProvider')
  return s
}

export function lastCooked(history: Record<string, string[]>, recipeId: string): string | undefined {
  const l = history[recipeId]
  return l && l.length ? l[l.length - 1] : undefined
}

export function daysSince(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const then = new Date(y, m - 1, d).getTime()
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return Math.round((start - then) / 86_400_000)
}

export function cookedLabel(iso: string | undefined): string | null {
  if (!iso) return null
  const n = daysSince(iso)
  if (n <= 0) return 'hecha hoy'
  if (n === 1) return 'hecha ayer'
  if (n < 60) return `hecha hace ${n} días`
  return `hecha hace ${Math.round(n / 30)} meses`
}
