// Unit knowledge for the shopping list: which "family" a unit belongs to and how to convert.
// Only units in the same family are ever combined. We never guess across families
// (a tin is NOT assumed to be 400 ml, a chicken breast has no assumed weight).

// factor = how many base units (grams or millilitres) one of this unit is. UK spoon sizes.
const MEASURES = {
  g: { family: 'weight', factor: 1 },
  kg: { family: 'weight', factor: 1000 },
  ml: { family: 'volume', factor: 1 },
  l: { family: 'volume', factor: 1000 },
  tsp: { family: 'volume', factor: 5 },
  tbsp: { family: 'volume', factor: 15 },
}

// Everything else is count-like and is only added to the SAME unit (null = plain count).
function describeUnit(unit) {
  if (unit !== null && MEASURES[unit]) return MEASURES[unit]
  return { family: 'count', factor: 1 }
}

module.exports = { describeUnit }
