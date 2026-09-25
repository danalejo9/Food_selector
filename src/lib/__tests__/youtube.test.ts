import { describe, expect, it } from 'vitest'
import { embedUrl, parseYouTube } from '../youtube'

describe('parseYouTube', () => {
  it('acepta los formatos de compartir', () => {
    expect(parseYouTube('https://youtu.be/dQw4w9WgXcQ?si=abc')).toEqual({ id: 'dQw4w9WgXcQ', vertical: false })
    expect(parseYouTube('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s')).toEqual({ id: 'dQw4w9WgXcQ', vertical: false })
    expect(parseYouTube('https://m.youtube.com/watch?v=dQw4w9WgXcQ')?.id).toBe('dQw4w9WgXcQ')
    expect(parseYouTube('youtube.com/shorts/dQw4w9WgXcQ')).toEqual({ id: 'dQw4w9WgXcQ', vertical: true })
    expect(parseYouTube('https://www.youtube.com/embed/dQw4w9WgXcQ')?.id).toBe('dQw4w9WgXcQ')
  })
  it('rechaza lo que no es YouTube', () => {
    expect(parseYouTube('https://vimeo.com/123')).toBeNull()
    expect(parseYouTube('hola')).toBeNull()
    expect(parseYouTube('https://youtu.be/corto')).toBeNull()
    expect(parseYouTube('')).toBeNull()
  })
  it('arma el enlace embebido sin cookies', () => {
    expect(embedUrl('dQw4w9WgXcQ')).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ')
  })
})
