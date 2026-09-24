const ABBREV = new Set(['g', 'kg', 'ml', 'l', 'cda', 'cdta', 'oz', 'lb'])

const FRACTIONS: [number, string][] = [
  [1 / 4, '¼'],
  [1 / 3, '⅓'],
  [1 / 2, '½'],
  [2 / 3, '⅔'],
  [3 / 4, '¾'],
]

/** 1.5 → "1 ½", 0.25 → "¼", 350 → "350". */
export function formatQty(q: number): string {
  if (q >= 20) return String(Math.round(q))
  const whole = Math.floor(q)
  const frac = q - whole
  if (frac < 0.07) return String(whole || q.toFixed(2))
  if (frac > 0.93) return String(whole + 1)
  const hit = FRACTIONS.find(([v]) => Math.abs(v - frac) < 0.07)
  if (hit) return whole ? `${whole} ${hit[1]}` : hit[1]
  return (Math.round(q * 10) / 10).toString().replace('.', ',')
}

export function formatUnit(unit: string | undefined, q: number | undefined): string {
  if (!unit) return ''
  if (q === undefined || q <= 1 || ABBREV.has(unit) || /s$/.test(unit)) return unit
  return /[aeiou]$/.test(unit) ? `${unit}s` : `${unit}es`
}

/** "2 tazas", "½ taza", "3" o "" si no hay cantidad. */
export function formatAmount(qty: number | undefined, unit: string | undefined, factor = 1): string {
  if (qty === undefined) return unit ?? ''
  const q = qty * factor
  return [formatQty(q), formatUnit(unit, q)].filter(Boolean).join(' ')
}

/** Lee "1 1/2", "1/2", "½", "1,5" o "1.5". */
export function parseQty(s: string): number | undefined {
  const t = s.trim().replace(',', '.')
  if (!t) return undefined
  const uni: Record<string, number> = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 }
  const m = t.match(/^(\d+(?:\.\d+)?)?\s*(?:(\d+)\/(\d+)|([¼½¾⅓⅔]))?$/)
  if (!m || (!m[1] && !m[2] && !m[4])) return undefined
  let v = m[1] ? parseFloat(m[1]) : 0
  if (m[2] && m[3]) {
    if (!m[1]) v = parseInt(m[2]) / parseInt(m[3])
    else v += parseInt(m[2]) / parseInt(m[3])
  }
  if (m[4]) v += uni[m[4]]
  return v > 0 ? v : undefined
}

export function totalMinutes(r: { prepMinutes: number; cookMinutes: number }): number {
  return r.prepMinutes + r.cookMinutes
}

export function formatMinutes(m: number): string {
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h} h ${rest}` : `${h} h`
}
