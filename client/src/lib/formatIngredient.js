// Turns an ingredient into the text shown in a recipe, e.g. "2 tins chopped tomatoes".
import { UNIT_PLURALS } from '@nosh/shared'

export function formatIngredient({ item, quantity, unit, prep }) {
  const suffix = prep ? `, ${prep}` : ''
  if (quantity === null) return `${item}${suffix} (to taste)`
  const unitText = unit === null ? '' : ` ${quantity > 1 && UNIT_PLURALS[unit] ? UNIT_PLURALS[unit] : unit}`
  return `${quantity}${unitText} ${item}${suffix}`
}
