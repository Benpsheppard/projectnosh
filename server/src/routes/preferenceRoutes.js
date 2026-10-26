// Maps /api/preferences URLs to the preference controller (PUT is validated first).
const { Router } = require('express')
const { preferencesSchema } = require('@nosh/shared')
const { validate } = require('../middleware/validate')

function createPreferenceRoutes(controller) {
  const router = Router()
  router.get('/', controller.get)
  router.put('/', validate(preferencesSchema), controller.update)
  return router
}

module.exports = { createPreferenceRoutes }
