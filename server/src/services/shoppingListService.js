// Builds the shopping list on demand from the plan (it is never stored), then splits it into
// "to buy" and "got it at home", and puts an estimated price on the "to buy" side.
// The actual maths lives in the pure aggregate and estimateCost modules.
const { compareToBudget, estimateCost } = require('../pricing/estimate')
const { aggregate } = require('../shopping/aggregate')

function createShoppingListService(planRepo, recipeRepo, homeItemRepo, preferenceService, priceLookup) {
  return {
    get() {
      const plan = planRepo.findAll()
      const recipesById = new Map()
      for (const { recipeId } of plan) recipesById.set(recipeId, recipeRepo.findById(recipeId))

      const { householdSize, weeklyBudgetPence } = preferenceService.get()
      const lines = aggregate(plan, recipesById, householdSize)
      const atHome = homeItemRepo.findAll()
      // Items you already have drop out of the estimate because only "to buy" lines are priced.
      const { lines: toBuy, summary } = estimateCost(lines.filter((line) => !atHome.has(line.itemKey)), priceLookup)
      return {
        plannedMeals: plan.length,
        toBuy,
        atHome: lines.filter((line) => atHome.has(line.itemKey)),
        estimate: compareToBudget(summary, weeklyBudgetPence), // adds how far under or over budget we are
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
