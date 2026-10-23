// Shared lists (meal types, dietary tags, units).
// Used by the API validation and by the client dropdowns so both always agree.

// Lists used by both the API validation and the UI dropdowns.

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'dessert']

export const DIETARY_TAGS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free']

// A unit of `null` means "a count" (e.g. 4 sausages), so it is not listed here.
export const UNITS = [
  'g', 'kg', 'ml', 'l', 'tsp', 'tbsp',
  'tin', 'slice', 'rasher', 'clove', 'thumb', 'ball', 'handful',
]

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
