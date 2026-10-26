// Works out the estimated cost of a shopping list. PURE: shopping lines and a price lookup in,
// priced lines and a summary out.
//
// Rules: price WHOLE packs (packs needed, rounded up, x pack price), never pro-rata. If we have no price,
// or the units are not the same kind, the line is "unknown": left out of the total, never counted as £0.
const { describeUnit } = require('../shopping/units')

// How many packs does this line need, and what do they cost? Or why can't we say?
function priceLine(line, lookup) {
  const entry = lookup.find(line.itemKey)
  if (!entry) return { status: 'unknown', reason: 'no-price' }

  const need = describeUnit(line.unit)
  const pack = describeUnit(entry.unit)
  // Same family (weight with weight, volume with volume), and count-like units must match exactly
  // (a tin is not a clove). We never guess a conversion between families.
  const comparable = need.family === pack.family && (need.family !== 'count' || line.unit === entry.unit)
  if (!comparable) return { status: 'unknown', reason: 'unit-mismatch' }

  const packs = Math.ceil((line.amount * need.factor) / (entry.packSize * pack.factor) - 1e-9)
  return { status: 'priced', packs, packSize: entry.packSize, unit: entry.unit, costPence: packs * entry.packPence }
}

// lines: the "to buy" lines. "To taste" lines have nothing to buy, so they get no price and are not counted.
function estimateCost(lines, lookup) {
  let totalPence = 0
  let pricedCount = 0
  let unknownCount = 0

  const priced = lines.map((line) => {
    if (line.toTaste) return { ...line, price: null }
    const price = priceLine(line, lookup)
    if (price.status === 'priced') {
      totalPence += price.costPence
      pricedCount++
    } else {
      unknownCount++
    }
    return { ...line, price }
  })

  return {
    lines: priced,
    summary: { store: lookup.store, dateChecked: lookup.dateChecked, totalPence, pricedCount, unknownCount },
  }
}

// Compares the estimated total with the weekly budget (both in whole pence).
// remainingPence is positive when under budget and negative when over. It is null when there is no
// budget, or when nothing could be priced (a total of £0 would wrongly look "under budget").
function compareToBudget(summary, budgetPence) {
  const canCompare = budgetPence !== null && summary.pricedCount > 0
  return { ...summary, budgetPence, remainingPence: canCompare ? budgetPence - summary.totalPence : null }
}

module.exports = { estimateCost, compareToBudget }
