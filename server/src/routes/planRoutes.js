// Maps /api/plan URLs to the plan controller. The day and slot in the URL are validated first.
const { Router } = require('express')
const { planEntrySchema, planSlotSchema } = require('@nosh/shared')
const { validate } = require('../middleware/validate')

function createPlanRoutes(controller) {
  const router = Router()
  router.get('/', controller.list)
  router.put('/:day/:slot', validate(planSlotSchema, 'params'), validate(planEntrySchema), controller.set)
  router.delete('/:day/:slot', validate(planSlotSchema, 'params'), controller.remove)
  return router
}

module.exports = { createPlanRoutes }
