// HTTP handlers for the shopping list: read the request, call the service, send the response.

function createShoppingListController(shoppingListService) {
  return {
    get(req, res) {
      res.json(shoppingListService.get())
    },

    markAtHome(req, res) {
      shoppingListService.markAtHome(req.params.name)
      res.status(204).end()
    },

    markNeeded(req, res) {
      shoppingListService.markNeeded(req.params.name)
      res.status(204).end()
    },
  }
}

module.exports = { createShoppingListController }
