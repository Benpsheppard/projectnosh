// Controllers only translate HTTP <-> service calls.

function createRecipeController(recipeService) {
  return {
    list(req, res) {
      res.json(recipeService.list())
    },
  }
}

module.exports = { createRecipeController }
