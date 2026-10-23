// Business logic for recipes: searching/filtering, looking one up, and creating custom ones.
const crypto = require('node:crypto')
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

function createRecipeService(recipeRepo) {
  return {
    // filters: { q?: string, mealType?: string, tags?: string[] }  (tags must ALL match)
    list({ q = '', mealType, tags = [] } = {}) {
      const text = q.trim().toLowerCase()
      return recipeRepo.findAll().filter(
        (r) =>
          (!text || searchText(r).includes(text)) &&
          (!mealType || r.mealType.includes(mealType)) &&
          tags.every((t) => r.tags.includes(t)),
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
