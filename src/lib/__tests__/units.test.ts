import { describe, expect, it } from 'vitest'
import { normalizeName } from '../normalize'
import { formatAmount, parseQty } from '../units'

describe('units', () => {
  it('formatea fracciones y plurales', () => {
    expect(formatAmount(1.5, 'taza')).toBe('1 ½ tazas')
    expect(formatAmount(0.25, 'taza')).toBe('¼ taza')
    expect(formatAmount(2, 'cda')).toBe('2 cda')
    expect(formatAmount(1, 'diente', 2)).toBe('2 dientes')
    expect(formatAmount(2, 'pastilla')).toBe('2 pastillas')
    expect(formatAmount(500, 'g', 1.5)).toBe('750 g')
  })
  it('lee cantidades', () => {
    expect(parseQty('1 1/2')).toBe(1.5)
    expect(parseQty('1/2')).toBe(0.5)
    expect(parseQty('½')).toBe(0.5)
    expect(parseQty('1,5')).toBe(1.5)
    expect(parseQty('abc')).toBeUndefined()
  })
  it('normaliza nombres', () => {
    expect(normalizeName('Arándanos')).toBe(normalizeName('arandano'))
    expect(normalizeName('Limones')).toBe('limon')
    expect(normalizeName('Fríjoles cocidos')).toBe(normalizeName('frijol cocido'))
    expect(normalizeName('Huevos')).toBe('huevo')
  })
})
