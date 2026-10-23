const { Router } = require('express')

function createRecipeRoutes(controller) {
  const router = Router()
  router.get('/', controller.list)
  return router
}

module.exports = { createRecipeRoutes }
