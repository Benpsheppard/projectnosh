// Business logic for recipes: searching/filtering, looking one up, and creating custom ones.
const crypto = require('node:crypto')
const { filterSuitable, DIETARY_TAGS } = require('@nosh/shared')
const { HttpError } = require('../errors')

// "Mum's Chilli!" -> "mums-chilli-3fa9": readable, and the suffix keeps ids unique.
function makeId(name) {
  const slug = name.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${slug || 'recipe'}-${crypto.randomBytes(2).toString('hex')}`
}

// Words a search can match: name, cuisine, tags and ingredient names.
function searchText(recipe) {
  return [recipe.name, recipe.cuisine, ...recipe.tags, ...recipe.ingredients.map((i) => i.item)].join(' ').toLowerCase()
}

function createRecipeService(recipeRepo, preferenceService) {
  return {
    // filters: { q?, mealType?, tags? (must ALL match), suitable? }
    // suitable: true keeps only recipes that fit the saved dietary preferences.
    list({ q = '', mealType, tags = [], suitable = false } = {}) {
      const text = q.trim().toLowerCase()
      const dietaryTags = tags.filter((t) => DIETARY_TAGS.includes(t))
      const otherTags = tags.filter((t) => !DIETARY_TAGS.includes(t))
      const recipes = suitable
        ? filterSuitable(recipeRepo.findAll(), preferenceService.get().dietary)
        : recipeRepo.findAll()
      return filterSuitable(recipes, dietaryTags).filter(
        (r) =>
          (!text || searchText(r).includes(text)) &&
          (!mealType || r.mealType.includes(mealType)) &&
          otherTags.every((t) => r.tags.includes(t)),
      )
    },

    get(id) {
      const recipe = recipeRepo.findById(id)
      if (!recipe) throw new HttpError(404, 'NOT_FOUND', 'We could not find that recipe')
      return recipe
    },

    // `input` has already been validated by the route's schema.
    create(input) {
      const recipe = { id: makeId(input.name), ...input }
      recipeRepo.insertCustom(recipe)
      return { ...recipe, isBuiltin: false }
    },
  }
}

module.exports = { createRecipeService }
