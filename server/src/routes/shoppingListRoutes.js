// Maps /api/shopping-list URLs to the controller. The ingredient name in the URL is validated first.
const { Router } = require('express')
const { homeItemSchema } = require('@nosh/shared')
const { validate } = require('../middleware/validate')

function createShoppingListRoutes(controller) {
  const router = Router()
  router.get('/', controller.get)
  router.put('/home-items/:name', validate(homeItemSchema, 'params'), controller.markAtHome)
  router.delete('/home-items/:name', validate(homeItemSchema, 'params'), controller.markNeeded)
  return router
}

module.exports = { createShoppingListRoutes }
