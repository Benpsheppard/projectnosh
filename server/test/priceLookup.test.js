// Tests for the price lookup: normalised matching, pence conversion, and failing loudly on a bad file.
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createPriceLookup, loadPriceLookup } from '../src/pricing/priceLookup.js'

const table = (prices, extra = {}) => ({ store: 'Test Store', dateChecked: '2026-01-01', prices, ...extra })
const writeTemp = (content) => {
  const file = join(mkdtempSync(join(tmpdir(), 'nosh-prices-')), 'prices.json')
  writeFileSync(file, JSON.stringify(content))
  return file
}

describe('createPriceLookup', () => {
  it('matches by normalised name, so spelling and plurals in the file do not matter', () => {
    const lookup = createPriceLookup(table([{ item: 'Chopped Tomatoes', packSize: 1, unit: 'tin', packPrice: 0.5 }]))
    expect(lookup.find('chopped tomato')).toEqual({ packSize: 1, unit: 'tin', packPence: 50 })
  })

  it('keeps different products apart', () => {
    const lookup = createPriceLookup(table([{ item: 'chopped tomatoes', packSize: 1, unit: 'tin', packPrice: 0.5 }]))
    expect(lookup.find('cherry tomato')).toBeNull()
    expect(lookup.find('tomato')).toBeNull()
  })

  it('turns pounds into whole pence without rounding errors', () => {
    const lookup = createPriceLookup(table([{ item: 'milk', packSize: 2, unit: 'l', packPrice: 1.1 }]))
    expect(lookup.find('milk').packPence).toBe(110)
  })

  it('exposes the store and date checked', () => {
    expect(createPriceLookup(table([]))).toMatchObject({ store: 'Test Store', dateChecked: '2026-01-01' })
  })

  it('rejects the same ingredient listed twice', () => {
    const rows = [{ item: 'egg', packSize: 6, unit: null, packPrice: 1 }, { item: 'Eggs', packSize: 12, unit: null, packPrice: 2 }]
    expect(() => createPriceLookup(table(rows))).toThrow(/more than once/)
  })
})

describe('loadPriceLookup', () => {
  it('loads a valid file', () => {
    const file = writeTemp(table([{ item: 'rice', packSize: 1, unit: 'kg', packPrice: 1.2 }]))
    expect(loadPriceLookup(file).find('rice')).toMatchObject({ packPence: 120 })
  })

  it('accepts a skeleton file with no date yet', () => {
    expect(loadPriceLookup(writeTemp(table([], { dateChecked: null }))).dateChecked).toBeNull()
  })

  it('fails loudly, listing every problem', () => {
    const file = writeTemp(table([{ item: 'rice', packSize: 0, unit: 'cups', packPrice: -1 }], { dateChecked: 'yesterday' }))
    expect(() => loadPriceLookup(file)).toThrow(/dateChecked must look like[\s\S]*packSize must be more than 0[\s\S]*unit must be one of[\s\S]*packPrice must be more than 0/)
  })

  it('names the ingredient in the error so the entry is easy to find', () => {
    const file = writeTemp(table([{ item: 'bread', packSize: null, unit: null, packPrice: 1.25 }]))
    expect(() => loadPriceLookup(file)).toThrow(/"bread" \(price number 1\) packSize: packSize must be a number/)
  })

  it('loads the real prices.json that ships with the app', () => {
    expect(() => loadPriceLookup()).not.toThrow()
  })
})
