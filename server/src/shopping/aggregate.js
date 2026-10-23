// Builds the combined shopping list from planned meals. PURE: plain data in, plain data out,
// no database or Express, so it is easy to test and to explain.
//
// Steps: scale each ingredient -> group by (name, unit family) -> sum -> round LAST.

const { normaliseName } = require('./normaliseName')
const { describeUnit } = require('./units')
const { formatWeight, formatVolume, formatCount, formatLabel } = require('./format')

/**
 * @param {{ recipeId: string, servings?: number | null }[]} entries  planned meals (a recipe may appear many times)
 * @param {Map<string, object>} recipesById
 * @param {number} householdSize  used when an entry has no servings of its own
 * @returns {{ key: string, name: string, amount: number | null, unit: string | null,
 *             label: string, toTaste: boolean, recipes: { id: string, name: string }[] }[]}
 */
function aggregate(entries, recipesById, householdSize) {
  const groups = new Map()

  for (const entry of entries) {
    const recipe = recipesById.get(entry.recipeId)
    if (!recipe) continue
    const scale = (entry.servings ?? householdSize) / recipe.serves

    for (const ingredient of recipe.ingredients) {
      const name = normaliseName(ingredient.item)
      const group = getGroup(groups, name, ingredient, scale)
      if (!group.recipes.some((r) => r.id === recipe.id)) {
        group.recipes.push({ id: recipe.id, name: recipe.name })
      }
    }
  }

  return [...groups.values()]
    .map(toLine)
    .sort((a, b) => a.name.localeCompare(b.name) || a.key.localeCompare(b.key))
}

// Finds (or creates) the group for this ingredient and adds its scaled quantity.
// `prep` is deliberately ignored.
function getGroup(groups, name, ingredient, scale) {
  const { quantity, unit } = ingredient

  // Null quantity = "to taste": one line per item, never summed.
  const unitInfo = describeUnit(unit)
  const groupId = quantity === null ? 'to-taste' : unitInfo.family === 'count' ? `count:${unit}` : unitInfo.family
  const key = `${name}|${groupId}`

  if (!groups.has(key)) {
    groups.set(key, { key, name: ingredient.item.toLowerCase().trim(), groupId, unit, total: 0, onlySpoons: true, recipes: [] })
  }
  const group = groups.get(key)
  if (quantity !== null) {
    group.total += quantity * scale * unitInfo.factor
    if (unit !== 'tsp' && unit !== 'tbsp') group.onlySpoons = false
  }
  return group
}

// Rounds a finished group and shapes it for the API.
function toLine(group) {
  const base = { key: group.key, name: group.name, recipes: group.recipes }
  if (group.groupId === 'to-taste') {
    return { ...base, amount: null, unit: null, label: 'to taste', toTaste: true }
  }
  let rounded
  if (group.groupId === 'weight') rounded = formatWeight(group.total)
  else if (group.groupId === 'volume') rounded = formatVolume(group.total, group.onlySpoons)
  else rounded = formatCount(group.total, group.unit)
  return { ...base, ...rounded, label: formatLabel(rounded.amount, rounded.unit), toTaste: false }
}

module.exports = { aggregate }
