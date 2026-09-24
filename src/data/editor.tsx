import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { EDITOR_KEY_HASH } from '../editorKey'

/**
 * Modo editor: quien lo tenga puede crear, editar y borrar en el Recetario.
 * Los visitantes solo consultan. Esto oculta la edición; la protección real
 * es que solo el dueño del repo puede subir data/recetario.json.
 */
const KEY = 'la-nevera:editor'

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function stored(): boolean {
  if (!EDITOR_KEY_HASH) return false
  try {
    return localStorage.getItem(KEY) === EDITOR_KEY_HASH
  } catch {
    return false
  }
}

interface Editor {
  canEdit: boolean
  /** true si en esta instalación existe una clave (para mostrar el acceso). */
  hasKey: boolean
  unlock: (clave: string) => Promise<boolean>
  lock: () => void
}

const Ctx = createContext<Editor | null>(null)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(stored)
  const unlock = useCallback(async (clave: string) => {
    if (!EDITOR_KEY_HASH) return false
    const ok = (await sha256(clave.trim())) === EDITOR_KEY_HASH
    if (ok) {
      try {
        localStorage.setItem(KEY, EDITOR_KEY_HASH)
      } catch {
        /* sin almacenamiento: dura mientras la pestaña esté abierta */
      }
      setUnlocked(true)
    }
    return ok
  }, [])
  const lock = useCallback(() => {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* nada que borrar */
    }
    setUnlocked(false)
  }, [])
  const value: Editor = {
    canEdit: import.meta.env.DEV || unlocked,
    hasKey: !!EDITOR_KEY_HASH,
    unlock,
    lock,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useEditor(): Editor {
  const e = useContext(Ctx)
  if (!e) throw new Error('useEditor fuera de EditorProvider')
  return e
}
