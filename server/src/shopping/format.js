// Turns summed base amounts into friendly values, e.g. 1200 g -> 1.2 kg.
// Rounding happens here, AFTER everything has been added up.

const { UNIT_PLURALS } = require('@nosh/shared')

// Float maths can leave 3.0000000000000004; nudge down before rounding up.
const ceil = (n) => Math.ceil(n - 1e-9)
const trim = (n) => Math.round(n * 100) / 100

// Weight in grams. Round up to whole grams, switch to kg from 1000 g.
function formatWeight(grams) {
  const g = ceil(grams)
  return g >= 1000 ? { amount: trim(g / 1000), unit: 'kg' } : { amount: g, unit: 'g' }
}

// Volume in ml. If the user only ever used spoons and it is small, keep spoons
// (round up to half a teaspoon); otherwise show ml, or litres from 1000 ml.
function formatVolume(ml, onlySpoons) {
  if (onlySpoons && ml < 60) {
    const tsp = Math.ceil(ml / 5 * 2 - 1e-9) / 2
    return tsp >= 3 && tsp % 3 === 0 ? { amount: tsp / 3, unit: 'tbsp' } : { amount: tsp, unit: 'tsp' }
  }
  const total = ceil(ml)
  return total >= 1000 ? { amount: trim(total / 1000), unit: 'l' } : { amount: total, unit: 'ml' }
}

// Things you cannot buy half of: always round up.
function formatCount(count, unit) {
  return { amount: ceil(count), unit }
}


// "1.2 kg", "2 tins", or just "4" for a plain count.
function formatLabel(amount, unit) {
  if (unit === null) return String(amount)
  const word = amount > 1 && UNIT_PLURALS[unit] ? UNIT_PLURALS[unit] : unit
  return `${amount} ${word}`
}

module.exports = { formatWeight, formatVolume, formatCount, formatLabel }
