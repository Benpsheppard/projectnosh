// Business logic for recipes (will hold filtering and creating custom recipes).

// Business rules live here (filtering etc. arrives in later phases).

function createRecipeService(recipeRepo) {
  return {
    list() {
      return recipeRepo.findAll()
    },
  }
}

module.exports = { createRecipeService }
