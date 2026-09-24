import { flushSync } from 'react-dom'

/** Anima el reacomodo de tarjetas con View Transitions cuando el navegador lo soporta. */
export function withTransition(fn: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  if (!doc.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return fn()
  doc.startViewTransition(() => flushSync(fn))
}
