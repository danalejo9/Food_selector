import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Timer as TimerIcon } from 'lucide-react'
import { useRecetario } from '../data/store'
import { usePersonal } from '../data/personal'

type WakeLockSentinelLike = { release: () => Promise<void> }

/** Mantiene la pantalla encendida mientras se cocina. */
function useWakeLock() {
  useEffect(() => {
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<WakeLockSentinelLike> } }
    let lock: WakeLockSentinelLike | undefined
    const acquire = () => {
      nav.wakeLock?.request('screen').then((l) => (lock = l)).catch(() => {})
    }
    acquire()
    const onVis = () => document.visibilityState === 'visible' && acquire()
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      lock?.release().catch(() => {})
    }
  }, [])
}

function Timer({ minutes }: { minutes: number }) {
  const [left, setLeft] = useState<number | null>(null)
  useEffect(() => {
    if (left === null || left <= 0) return
    const t = window.setTimeout(() => setLeft((l) => (l === null ? null : l - 1)), 1000)
    return () => window.clearTimeout(t)
  }, [left])
  useEffect(() => {
    if (left === 0) navigator.vibrate?.([300, 150, 300])
  }, [left])
  if (left === null)
    return (
      <button className="btn" onClick={() => setLeft(minutes * 60)}>
        <TimerIcon size={18} aria-hidden="true" /> Temporizador · {minutes} min
      </button>
    )
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  return (
    <div className={`timer${left === 0 ? ' is-done' : ''}`} role="timer" aria-live="polite">
      <span className="num">{left === 0 ? 'Tiempo cumplido' : `${mm}:${ss}`}</span>
      <button className="link" onClick={() => setLeft(null)}>
        {left === 0 ? 'Cerrar' : 'Cancelar'}
      </button>
    </div>
  )
}

export function ModoCocinar() {
  const { id } = useParams()
  const { recetario } = useRecetario()
  const { markCooked } = usePersonal()
  const navigate = useNavigate()
  const cameFromDetail = !!(useLocation().state as { back?: boolean } | null)?.back
  const recipe = recetario.recipes.find((r) => r.id === id)
  const [i, setI] = useState(0)
  const [done, setDone] = useState(false)
  useWakeLock()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!recipe) return
      if (e.key === 'ArrowRight') setI((x) => Math.min(recipe.steps.length - 1, x + 1))
      if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [recipe])

  if (!recipe) return <p className="empty">Receta no encontrada.</p>
  const step = recipe.steps[i]
  const last = i === recipe.steps.length - 1

  return (
    <div className="cook">
      <header className="cook__head">
        <button
          className="link"
          // salir deshace la entrada del modo cocinar, así "Volver" en la receta no regresa aquí
          onClick={() => (cameFromDetail ? navigate(-1) : navigate(`/receta/${recipe.id}`, { replace: true }))}
        >
          <ArrowLeft size={16} aria-hidden="true" /> Salir
        </button>
        <span className="cook__name">{recipe.name}</span>
        <span className="num">
          {i + 1}/{recipe.steps.length}
        </span>
      </header>
      <div className="cook__progress" aria-hidden="true">
        {recipe.steps.map((_, k) => (
          <span key={k} className={k <= i ? 'is-on' : ''} />
        ))}
      </div>
      <main className="cook__step" key={i}>
        <span className="cook__n">
          Paso {i + 1} de {recipe.steps.length}
        </span>
        <p>{step.text}</p>
        {step.minutes && <Timer key={i} minutes={step.minutes} />}
      </main>
      <footer className="cook__nav">
        <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>
          Anterior
        </button>
        {last ? (
          <button
            className={`btn btn--primary${done ? ' is-done' : ''}`}
            disabled={done}
            onClick={() => {
              markCooked(recipe.id)
              setDone(true)
            }}
          >
            {done ? (
              <>
                <Check size={18} aria-hidden="true" /> Anotada
              </>
            ) : (
              'Terminé'
            )}
          </button>
        ) : (
          <button className="btn btn--primary" onClick={() => setI(i + 1)}>
            Siguiente
          </button>
        )}
      </footer>
    </div>
  )
}
