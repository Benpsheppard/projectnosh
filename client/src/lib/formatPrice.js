// Turns price data into the text shown on the shopping list: "£2.40", "2 × 500 g", "26 Oct 2026".

// The server works in whole pence (no floating-point drift); we only format at the very end.
export const formatMoney = (pence) => `£${(pence / 100).toFixed(2)}`

const MEASURES = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp']

// What is in one pack, e.g. "500 g", "tin" (a single tin), "6-pack" (six of something), "each".
export function formatPack(packSize, unit) {
  if (unit === null) return packSize === 1 ? 'each' : `${packSize}-pack`
  if (packSize === 1 && !MEASURES.includes(unit)) return unit
  return `${packSize} ${unit}`
}

// "2 × 500 g = £5.50"
export function formatPriceLine({ packs, packSize, unit, costPence }) {
  return `${packs} × ${formatPack(packSize, unit)} = ${formatMoney(costPence)}`
}

// "2026-10-26" -> "26 Oct 2026"
export function formatDate(isoDate) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
