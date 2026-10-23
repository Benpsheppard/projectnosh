// Maps /api/recipes URLs to recipe controller handlers (POST is validated first).
const { Router } = require('express')
const { newRecipeSchema } = require('@nosh/shared')
const { validate } = require('../middleware/validate')

function createRecipeRoutes(controller) {
  const router = Router()
  router.get('/', controller.list)
  router.get('/:id', controller.get)
  router.post('/', validate(newRecipeSchema), controller.create)
  return router
}

module.exports = { createRecipeRoutes }
