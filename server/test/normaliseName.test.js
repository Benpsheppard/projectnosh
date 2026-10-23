// Tests for ingredient-name normalisation: spelling variants merge, different products do not.
import { describe, expect, it } from 'vitest'
import { normaliseName } from '../src/shopping/normaliseName.js'

describe('normaliseName', () => {
  it('ignores case and surrounding spaces', () => {
    expect(normaliseName('  Olive OIL ')).toBe('olive oil')
  })

  it.each([
    ['carrot', 'carrots'],
    ['apple', 'apples'],
    ['tomatoes', 'tomato'],
    ['mixed berries', 'mixed berry'],
  ])('treats %s and %s as the same', (a, b) => {
    expect(normaliseName(a)).toBe(normaliseName(b))
  })

  it('keeps genuinely different products apart', () => {
    const names = ['tomatoes', 'chopped tomatoes', 'cherry tomatoes', 'oil', 'olive oil', 'sesame oil', 'rice', 'basmati rice', 'jasmine rice']
    expect(new Set(names.map(normaliseName)).size).toBe(names.length)
  })

  it('leaves words that only look plural alone', () => {
    expect(normaliseName('molasses')).toBe('molasses')
    expect(normaliseName('asparagus')).toBe('asparagus')
  })
})
