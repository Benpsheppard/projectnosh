// Builds the Express app: wires repository -> service -> controller -> routes, then error handling.
// Takes the database as an argument so tests can pass an in-memory one.

const express = require('express')
const { createRecipeRepository } = require('./repositories/recipeRepository')
const { createPreferenceRepository } = require('./repositories/preferenceRepository')
const { createPlanRepository } = require('./repositories/planRepository')
const { createHomeItemRepository } = require('./repositories/homeItemRepository')
const { createRecipeService } = require('./services/recipeService')
const { createPreferenceService } = require('./services/preferenceService')
const { createPlanService } = require('./services/planService')
const { createShoppingListService } = require('./services/shoppingListService')
const { createRecipeController } = require('./controllers/recipeController')
const { createPreferenceController } = require('./controllers/preferenceController')
const { createPlanController } = require('./controllers/planController')
const { createShoppingListController } = require('./controllers/shoppingListController')
const { createRecipeRoutes } = require('./routes/recipeRoutes')
const { createPreferenceRoutes } = require('./routes/preferenceRoutes')
const { createPlanRoutes } = require('./routes/planRoutes')
const { createShoppingListRoutes } = require('./routes/shoppingListRoutes')
const { notFound, errorHandler } = require('./middleware/errorHandler')

// Takes the database as an argument so tests can pass an in-memory one.
function createApp(db) {
  const app = express()
  app.use(express.json())

  const preferenceService = createPreferenceService(createPreferenceRepository(db))
  const recipeRepo = createRecipeRepository(db)
  const recipeService = createRecipeService(recipeRepo, preferenceService)
  const planRepo = createPlanRepository(db)
  const planService = createPlanService(planRepo, recipeRepo, preferenceService)
  const shoppingListService = createShoppingListService(planRepo, recipeRepo, createHomeItemRepository(db), preferenceService)

  app.get('/api/health', (req, res) => res.json({ ok: true }))
  app.use('/api/recipes', createRecipeRoutes(createRecipeController(recipeService)))
  app.use('/api/preferences', createPreferenceRoutes(createPreferenceController(preferenceService)))
  app.use('/api/plan', createPlanRoutes(createPlanController(planService)))
  app.use('/api/shopping-list', createShoppingListRoutes(createShoppingListController(shoppingListService)))

  app.use(notFound)
  app.use(errorHandler)
  return app
}

module.exports = { createApp }
