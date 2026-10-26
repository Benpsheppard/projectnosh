// The price lookup: "what does one pack of this ingredient cost?". It is deliberately tiny and
// replaceable. Anything with { store, dateChecked, find(itemKey) } can stand in for it (a different
// supermarket file, a database, a test double), and nothing else in the app needs to change.
//
// Prices come from server/data/prices.json, keyed by NORMALISED ingredient name, so "Chopped tomatoes"
// in the file matches the shopping list's "chopped tomato". No scraping and no live prices.
const fs = require('node:fs')
const path = require('node:path')
const { priceTableSchema } = require('@nosh/shared')
const { normaliseName } = require('../shopping/normaliseName')

const PRICES_FILE = path.join(__dirname, '../../data/prices.json')

// table: { store, dateChecked, prices: [{ item, packSize, unit, packPrice }] }, already valid.
// Prices are converted to whole pence so totals never suffer from floating-point drift.
function createPriceLookup(table) {
  const byItem = new Map()
  for (const entry of table.prices) {
    const key = normaliseName(entry.item)
    if (byItem.has(key)) throw new Error(`Price table has "${entry.item}" more than once`)
    byItem.set(key, { packSize: entry.packSize, unit: entry.unit, packPence: Math.round(entry.packPrice * 100) })
  }
  return {
    store: table.store,
    dateChecked: table.dateChecked,
    find: (itemKey) => byItem.get(itemKey) ?? null,
  }
}

// Reads and checks the price file. Like the recipe seed, it fails loudly with every problem listed,
// and names the ingredient so you can find the entry quickly.
function loadPriceLookup(file = PRICES_FILE) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  const result = priceTableSchema.safeParse(raw)
  if (!result.success) {
    const problems = result.error.issues.map((issue) => {
      const [first, index, ...rest] = issue.path
      if (first !== 'prices' || index === undefined) return `${issue.path.join('.') || 'file'}: ${issue.message}`
      const name = raw.prices?.[index]?.item ?? 'unnamed entry'
      return `"${name}" (price number ${index + 1}) ${rest.join('.')}: ${issue.message}`
    })
    throw new Error(`Price file ${path.basename(file)} is invalid:\n  ${problems.join('\n  ')}`)
  }
  return createPriceLookup(result.data)
}

module.exports = { createPriceLookup, loadPriceLookup }
