// Tests for the shopping-list aggregation: scaling, unit families, rounding, to-taste, merging.
import { describe, expect, it } from 'vitest'
import { aggregate } from '../src/shopping/aggregate.js'

// Tiny recipe builder: ing('flour', 200, 'g') -> an ingredient.
const ing = (item, quantity, unit = null, prep) => ({ item, quantity, unit, ...(prep && { prep }) })
const recipe = (id, serves, ingredients) => ({ id, name: id.toUpperCase(), serves, ingredients })
const run = (entries, recipes, household = 2) =>
  aggregate(entries, new Map(recipes.map((r) => [r.id, r])), household)
const find = (lines, name) => lines.filter((l) => l.name === name)

describe('aggregate', () => {
  it('returns nothing for an empty plan', () => {
    expect(run([], [])).toEqual([])
  })

  it('adds the same unit across recipes and lists both recipes', () => {
    const a = recipe('a', 2, [ing('plain flour', 100, 'g')])
    const b = recipe('b', 2, [ing('plain flour', 150, 'g')])
    const [line] = run([{ recipeId: 'a' }, { recipeId: 'b' }], [a, b])
    expect(line).toMatchObject({ amount: 250, unit: 'g', label: '250 g' })
    expect(line.recipes.map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('adds g and kg and displays 1200 g as 1.2 kg', () => {
    const a = recipe('a', 2, [ing('potatoes', 700, 'g')])
    const b = recipe('b', 2, [ing('potatoes', 0.5, 'kg')])
    expect(run([{ recipeId: 'a' }, { recipeId: 'b' }], [a, b])[0]).toMatchObject({ amount: 1.2, unit: 'kg' })
  })

  it('adds ml and tbsp (1 tbsp = 15 ml)', () => {
    const a = recipe('a', 2, [ing('milk', 100, 'ml')])
    const b = recipe('b', 2, [ing('milk', 2, 'tbsp')])
    expect(run([{ recipeId: 'a' }, { recipeId: 'b' }], [a, b])[0]).toMatchObject({ amount: 130, unit: 'ml' })
  })

  it('keeps small all-spoon totals as spoons (tsp + tbsp)', () => {
    const a = recipe('a', 2, [ing('soy sauce', 1, 'tbsp')])
    const b = recipe('b', 2, [ing('soy sauce', 2, 'tsp')])
    expect(run([{ recipeId: 'a' }, { recipeId: 'b' }], [a, b])[0]).toMatchObject({ amount: 5, unit: 'tsp' })
  })

  it('shows litres from 1000 ml', () => {
    const a = recipe('a', 2, [ing('vegetable stock', 1500, 'ml')])
    expect(run([{ recipeId: 'a' }], [a])[0]).toMatchObject({ amount: 1.5, unit: 'l' })
  })

  it('merges spelling variants but keeps different products separate', () => {
    const a = recipe('a', 2, [ing('carrot', 2), ing('chopped tomatoes', 1, 'tin'), ing('olive oil', 1, 'tbsp')])
    const b = recipe('b', 2, [ing('Carrots', 3), ing('cherry tomatoes', 100, 'g'), ing('oil', 1, 'tbsp')])
    const lines = run([{ recipeId: 'a' }, { recipeId: 'b' }], [a, b])
    expect(lines.filter((l) => l.name.includes('carrot'))).toHaveLength(1)
    expect(lines.find((l) => l.name.includes('carrot'))).toMatchObject({ amount: 5, unit: null })
    expect(lines.map((l) => l.name)).toEqual(expect.arrayContaining(['chopped tomatoes', 'cherry tomatoes', 'olive oil', 'oil']))
    expect(lines).toHaveLength(5)
  })

  it('keeps incompatible units for the same item as separate lines', () => {
    const a = recipe('a', 2, [ing('tomatoes', 2)])
    const b = recipe('b', 2, [ing('tomatoes', 200, 'g')])
    const c = recipe('c', 2, [ing('tomatoes', 1, 'tin')])
    const lines = run([{ recipeId: 'a' }, { recipeId: 'b' }, { recipeId: 'c' }], [a, b, c])
    expect(lines).toHaveLength(3)
  })

  it('only sums count-like units when the unit is the same', () => {
    const a = recipe('a', 2, [ing('garlic', 2, 'clove')])
    const b = recipe('b', 2, [ing('garlic', 1, 'handful')])
    const c = recipe('c', 2, [ing('garlic', 3, 'clove')])
    const lines = run([{ recipeId: 'a' }, { recipeId: 'b' }, { recipeId: 'c' }], [a, b, c])
    expect(find(lines, 'garlic').map((l) => l.label).sort()).toEqual(['1 handful', '5 cloves'])
  })

  it('shows null-quantity items once as "to taste", never summed', () => {
    const a = recipe('a', 2, [ing('salt and pepper', null)])
    const b = recipe('b', 2, [ing('salt and pepper', null)])
    const lines = run([{ recipeId: 'a' }, { recipeId: 'b' }], [a, b])
    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatchObject({ toTaste: true, amount: null, label: 'to taste' })
    expect(lines[0].recipes).toHaveLength(2)
  })

  it('scales by planned servings / recipe serves and rounds counts up', () => {
    const a = recipe('a', 4, [ing('eggs', 3), ing('butter', 100, 'g')])
    const lines = run([{ recipeId: 'a', servings: 2 }], [a])
    expect(find(lines, 'eggs')[0].amount).toBe(2) // 1.5 -> 2
    expect(find(lines, 'butter')[0].amount).toBe(50)
  })

  it('uses the household size when servings are not set', () => {
    const a = recipe('a', 2, [ing('rice', 100, 'g')])
    expect(run([{ recipeId: 'a' }], [a], 4)[0].amount).toBe(200)
  })

  it('sums first and rounds last', () => {
    // Each portion needs 0.5 egg: rounding each first would give 1 + 1 = 2, but 0.5 + 0.5 = 1.
    const a = recipe('a', 2, [ing('eggs', 1)])
    const lines = run([{ recipeId: 'a', servings: 1 }, { recipeId: 'a', servings: 1 }], [a])
    expect(lines[0].amount).toBe(1)
  })

  it('adds up the same recipe planned twice and lists it once', () => {
    const a = recipe('a', 2, [ing('pasta', 200, 'g')])
    const [line] = run([{ recipeId: 'a' }, { recipeId: 'a' }], [a])
    expect(line.amount).toBe(400)
    expect(line.recipes).toHaveLength(1)
  })

  it('ignores prep', () => {
    const a = recipe('a', 2, [ing('onion', 1, null, 'finely chopped')])
    const b = recipe('b', 2, [ing('onion', 1, null, 'sliced')])
    expect(run([{ recipeId: 'a' }, { recipeId: 'b' }], [a, b])).toHaveLength(1)
  })

  it('skips planned recipes it cannot find', () => {
    expect(run([{ recipeId: 'ghost' }], [])).toEqual([])
  })
})
