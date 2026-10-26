// Tests for the cost estimate: whole packs rounded up, unit families, "unknown" (never £0), to-taste.
import { describe, expect, it } from 'vitest'
import { compareToBudget, estimateCost } from '../src/pricing/estimate.js'
import { createPriceLookup } from '../src/pricing/priceLookup.js'

const lookup = createPriceLookup({
  store: 'Test Store',
  dateChecked: '2026-01-01',
  prices: [
    { item: 'Rice', packSize: 1, unit: 'kg', packPrice: 1.2 },
    { item: 'beef mince', packSize: 500, unit: 'g', packPrice: 2.75 },
    { item: 'chopped tomatoes', packSize: 1, unit: 'tin', packPrice: 0.5 },
    { item: 'milk', packSize: 2, unit: 'l', packPrice: 1.55 },
    { item: 'eggs', packSize: 6, unit: null, packPrice: 1.8 },
    { item: 'onion', packSize: 1, unit: 'kg', packPrice: 0.9 },
  ],
})

// Shopping lines as the aggregate module produces them (only the fields pricing reads).
// `itemKey` is the NORMALISED name (singular), e.g. 'chopped tomato', 'egg'.
const line = (itemKey, amount, unit, extra = {}) => ({ itemKey, name: itemKey, amount, unit, toTaste: false, ...extra })
const price = (l) => estimateCost([l], lookup).lines[0].price

describe('whole packs', () => {
  it('rounds the packs up and prices each whole pack, not pro-rata', () => {
    expect(price(line('beef mince', 150, 'g'))).toMatchObject({ status: 'priced', packs: 1, costPence: 275 })
    expect(price(line('beef mince', 501, 'g'))).toMatchObject({ packs: 2, costPence: 550 })
  })

  it('does not round up when the amount fills the pack exactly', () => {
    expect(price(line('beef mince', 1, 'kg'))).toMatchObject({ packs: 2, costPence: 550 })
  })

  it('compares across units in the same family (g/kg and ml/l)', () => {
    expect(price(line('rice', 1200, 'g'))).toMatchObject({ packs: 2, costPence: 240 }) // 1.2 kg needs two 1 kg packs
    expect(price(line('milk', 2500, 'ml'))).toMatchObject({ packs: 2, costPence: 310 })
  })

  it('compares count-like units only when they are the identical unit', () => {
    expect(price(line('chopped tomato', 3, 'tin'))).toMatchObject({ packs: 3, costPence: 150 })
    expect(price(line('egg', 7, null))).toMatchObject({ packs: 2, costPence: 360 }) // 7 eggs -> two boxes of 6
  })
})

describe('unknown prices', () => {
  it('is unknown when there is no price for the ingredient', () => {
    expect(price(line('saffron', 1, 'g'))).toEqual({ status: 'unknown', reason: 'no-price' })
  })

  it('is unknown when the units are different kinds (never guessed)', () => {
    expect(price(line('onion', 2, null))).toEqual({ status: 'unknown', reason: 'unit-mismatch' }) // count vs kg
    expect(price(line('milk', 300, 'g'))).toEqual({ status: 'unknown', reason: 'unit-mismatch' }) // weight vs volume
    expect(price(line('chopped tomato', 400, 'g'))).toEqual({ status: 'unknown', reason: 'unit-mismatch' })
    expect(price(line('chopped tomato', 2, 'clove'))).toEqual({ status: 'unknown', reason: 'unit-mismatch' })
  })
})

describe('estimateCost totals', () => {
  it('adds only the priced lines and counts the unknown ones, never treating them as zero', () => {
    const { summary } = estimateCost(
      [line('rice', 1000, 'g'), line('chopped tomato', 2, 'tin'), line('saffron', 1, 'g'), line('onion', 3, null)],
      lookup,
    )
    expect(summary).toEqual({ store: 'Test Store', dateChecked: '2026-01-01', totalPence: 220, pricedCount: 2, unknownCount: 2 })
  })

  it('has a zero total and no unknowns for an empty list', () => {
    expect(estimateCost([], lookup).summary).toMatchObject({ totalPence: 0, pricedCount: 0, unknownCount: 0 })
  })

  it('leaves "to taste" lines unpriced and uncounted', () => {
    const { lines, summary } = estimateCost([line('salt and pepper', null, null, { toTaste: true })], lookup)
    expect(lines[0].price).toBeNull()
    expect(summary).toMatchObject({ pricedCount: 0, unknownCount: 0 })
  })

  it('keeps the original line fields', () => {
    expect(estimateCost([line('rice', 100, 'g', { label: '100 g' })], lookup).lines[0]).toMatchObject({ itemKey: 'rice', label: '100 g' })
  })
})

describe('compareToBudget', () => {
  const summary = { store: 'S', dateChecked: null, totalPence: 1250, pricedCount: 3, unknownCount: 1 }

  it('is positive when under budget and negative when over', () => {
    expect(compareToBudget(summary, 2000)).toMatchObject({ budgetPence: 2000, remainingPence: 750 })
    expect(compareToBudget(summary, 1000)).toMatchObject({ budgetPence: 1000, remainingPence: -250 })
    expect(compareToBudget(summary, 1250).remainingPence).toBe(0)
  })

  it('keeps the rest of the summary', () => {
    expect(compareToBudget(summary, 2000)).toMatchObject(summary)
  })

  it('has nothing to compare without a budget', () => {
    expect(compareToBudget(summary, null)).toMatchObject({ budgetPence: null, remainingPence: null })
  })

  it('has nothing to compare when no item could be priced', () => {
    expect(compareToBudget({ ...summary, totalPence: 0, pricedCount: 0 }, 2000).remainingPence).toBeNull()
  })
})
