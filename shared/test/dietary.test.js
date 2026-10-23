// Tests for the dietary suitability rules (tags, implications, strictness).
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { expandTags, filterSuitable, isSuitable } from '../src/dietary.js'

const recipe = (name, dietary, mealType = ['dinner']) => ({ name, dietary, mealType })

describe('isSuitable', () => {
  it('accepts everything when nothing is selected', () => {
    expect(isSuitable(recipe('Any', []), [])).toBe(true)
  })

  it('treats untagged as "no claim made", so not suitable', () => {
    expect(isSuitable(recipe('Bolognese', []), ['vegetarian'])).toBe(false)
  })

  it('needs every selected tag, not just one', () => {
    const r = recipe('Salad', ['vegetarian', 'gluten-free'])
    expect(isSuitable(r, ['vegetarian', 'gluten-free'])).toBe(true)
    expect(isSuitable(r, ['vegetarian', 'dairy-free'])).toBe(false)
  })

  it('lets vegan satisfy vegetarian and dairy-free', () => {
    const r = recipe('Dahl', ['vegan'])
    expect(isSuitable(r, ['vegetarian'])).toBe(true)
    expect(isSuitable(r, ['dairy-free'])).toBe(true)
    expect(isSuitable(r, ['vegan'])).toBe(true)
  })

  it('does not let vegetarian satisfy vegan', () => {
    expect(isSuitable(recipe('Pizza', ['vegetarian']), ['vegan'])).toBe(false)
  })
})

describe('expandTags', () => {
  it('adds implied tags without changing others', () => {
    expect([...expandTags(['vegan', 'gluten-free'])].sort()).toEqual(
      ['dairy-free', 'gluten-free', 'vegan', 'vegetarian'],
    )
  })
})

describe('filterSuitable with the real starter recipes', () => {
  const recipes = JSON.parse(
    readFileSync(new URL('../../server/data/project-nosh-sample-recipes.json', import.meta.url), 'utf8'),
  )

  it('keeps vegan dishes when dairy-free is selected', () => {
    const names = filterSuitable(recipes, ['dairy-free']).map((r) => r.id)
    expect(names).toContain('tomato-soup') // tagged vegan only, not dairy-free
    expect(names).toContain('chilli-con-carne')
  })

  it('leaves an empty meal slot under strict preferences (no vegan dessert)', () => {
    const desserts = recipes.filter((r) => r.mealType.includes('dessert'))
    expect(filterSuitable(desserts, ['vegan'])).toEqual([])
  })
})
