// The one rule for "is this recipe suitable for these dietary preferences?".
// Pure functions, shared so the API and the UI can never disagree.

// A recipe tagged with the key also satisfies each tag in the list.
const IMPLIES = {
  vegan: ['vegetarian', 'dairy-free'],
}

// A recipe's tags plus everything they imply, e.g. ['vegan'] -> vegan, vegetarian, dairy-free.
export function expandTags(tags) {
  const all = new Set(tags)
  for (const tag of tags) {
    for (const implied of IMPLIES[tag] ?? []) all.add(implied)
  }
  return all
}

// Suitable only if the recipe carries EVERY selected tag. No tag means "no claim made",
// so an untagged recipe is never suitable when something is selected.
export function isSuitable(recipe, selectedTags) {
  const has = expandTags(recipe.dietary)
  return selectedTags.every((tag) => has.has(tag))
}

export function filterSuitable(recipes, selectedTags) {
  return recipes.filter((recipe) => isSuitable(recipe, selectedTags))
}
