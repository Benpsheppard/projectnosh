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

// Tags used for the filter chips and the add-recipe form.
export const RECIPE_TAGS = ['quick', 'batch-cook', 'freezer-friendly', 'kid-friendly']

// Plural forms for count-like units, so "2 tin" reads as "2 tins".
export const UNIT_PLURALS = {
  tin: 'tins', slice: 'slices', rasher: 'rashers', clove: 'cloves',
  thumb: 'thumbs', ball: 'balls', handful: 'handfuls',
}
