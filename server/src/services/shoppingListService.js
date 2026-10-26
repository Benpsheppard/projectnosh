// Builds the shopping list on demand from the plan (it is never stored), then splits it into
// "to buy" and "got it at home". The actual maths lives in the pure aggregate module.
const { aggregate } = require('../shopping/aggregate')

function createShoppingListService(planRepo, recipeRepo, homeItemRepo, preferenceService) {
  return {
    get() {
      const plan = planRepo.findAll()
      const recipesById = new Map()
      for (const { recipeId } of plan) recipesById.set(recipeId, recipeRepo.findById(recipeId))

      const lines = aggregate(plan, recipesById, preferenceService.get().householdSize)
      const atHome = homeItemRepo.findAll()
      return {
        plannedMeals: plan.length,
        toBuy: lines.filter((line) => !atHome.has(line.itemKey)),
        atHome: lines.filter((line) => atHome.has(line.itemKey)),
      }
    },

    // `name` has already been validated and lower-cased by the route's schema.
    markAtHome(name) {
      homeItemRepo.add(name)
    },

    markNeeded(name) {
      homeItemRepo.remove(name)
    },
  }
}

module.exports = { createShoppingListService }
