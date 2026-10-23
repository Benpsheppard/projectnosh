// HTTP handlers for recipes: read the request, call the service, send the response.

// Query values arrive as a string (one) or an array (repeated); make them always an array.
const asArray = (value) => (value === undefined ? [] : [].concat(value))

function createRecipeController(recipeService) {
  return {
    list(req, res) {
      const { q, mealType, tag } = req.query
      res.json(recipeService.list({ q, mealType, tags: asArray(tag) }))
    },

    get(req, res) {
      res.json(recipeService.get(req.params.id))
    },

    create(req, res) {
      res.status(201).json(recipeService.create(req.body))
    },
  }
}

module.exports = { createRecipeController }
