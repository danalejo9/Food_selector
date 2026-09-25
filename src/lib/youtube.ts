/** Enlaces de YouTube: los formatos que da el botón "Compartir" y los Shorts. */
export interface YouTubeVideo {
  id: string
  /** los Shorts son verticales (9:16). */
  vertical: boolean
}

const ID = /^[A-Za-z0-9_-]{11}$/

export function parseYouTube(raw: string | undefined): YouTubeVideo | null {
  if (!raw) return null
  let url: URL
  try {
    url = new URL(raw.trim().replace(/^(?!https?:\/\/)/, 'https://'))
  } catch {
    return null
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, '')
  let id: string | null = null
  let vertical = false
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1] ?? null
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const [, kind, value] = url.pathname.split('/')
    if (kind === 'watch') id = url.searchParams.get('v')
    else if (kind === 'shorts') {
      id = value ?? null
      vertical = true
    } else if (kind === 'embed' || kind === 'live' || kind === 'v') id = value ?? null
  }
  return id && ID.test(id) ? { id, vertical } : null
}

export function embedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1&modestbranding=1`
}

export function thumbnailUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}
