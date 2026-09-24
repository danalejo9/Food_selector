/** Clave para comparar nombres: minúsculas, sin tildes, singular simple. */
export function normalizeName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(singular)
    .join(' ')
}

function singular(w: string): string {
  if (w.length <= 3) return w
  if (/[lnrdzj]es$/.test(w)) return w.slice(0, -2)
  if (w.endsWith('s')) return w.slice(0, -1)
  return w
}

export function slugify(s: string): string {
  return (
    s
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item'
  )
}

/** Devuelve un id que no choca con los existentes: pan, pan-2, pan-3… */
export function uniqueId(base: string, taken: Set<string>): string {
  const b = slugify(base)
  if (!taken.has(b)) return b
  let i = 2
  while (taken.has(`${b}-${i}`)) i++
  return `${b}-${i}`
}

/** Búsqueda tolerante: "arand" encuentra "Arándanos". */
export function matchesQuery(name: string, query: string): boolean {
  const q = query
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
  if (!q) return true
  const n = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
  return n.includes(q)
}
