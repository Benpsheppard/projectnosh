// Business logic for the weekly plan: list it (with recipe details), set or replace a meal, remove one.
const { MEAL_TYPES } = require('@nosh/shared')
const { HttpError } = require('../errors')

function createPlanService(planRepo, recipeRepo, preferenceService) {
  // Adds the bits of the recipe the screen needs, so the client does not need a second request.
  function withRecipe(entry) {
    const { id, name, serves, mealType, dietary } = recipeRepo.findById(entry.recipeId)
    return { day: entry.day, slot: entry.slot, servings: entry.servings, recipe: { id, name, serves, mealType, dietary } }
  }

  return {
    list() {
      return planRepo
        .findAll()
        .sort((a, b) => a.day - b.day || MEAL_TYPES.indexOf(a.slot) - MEAL_TYPES.indexOf(b.slot))
        .map(withRecipe)
    },

    // `slotInfo` ({ day, slot }) and `input` ({ recipeId, servings? }) are already validated.
    // Any recipe may go in any slot (e.g. a dinner recipe as lunch leftovers); the picker just
    // suggests recipes for the slot's meal type. No servings means "use the household size".
    set({ day, slot }, { recipeId, servings }) {
      if (!recipeRepo.findById(recipeId)) throw new HttpError(404, 'NOT_FOUND', 'We could not find that recipe')
      const planned = servings ?? preferenceService.get().householdSize
      planRepo.upsert({ day, slot, recipeId, servings: planned })
      return withRecipe({ day, slot, recipeId, servings: planned })
    },

    remove({ day, slot }) {
      planRepo.remove(day, slot)
    },
  }
}

module.exports = { createPlanService }
