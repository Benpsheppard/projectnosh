// Builds the Express app: wires repository -> service -> controller -> routes, then error handling.
// Takes the database as an argument so tests can pass an in-memory one.

const express = require('express')
const { createRecipeRepository } = require('./repositories/recipeRepository')
const { createPreferenceRepository } = require('./repositories/preferenceRepository')
const { createPlanRepository } = require('./repositories/planRepository')
const { createRecipeService } = require('./services/recipeService')
const { createPreferenceService } = require('./services/preferenceService')
const { createPlanService } = require('./services/planService')
const { createRecipeController } = require('./controllers/recipeController')
const { createPreferenceController } = require('./controllers/preferenceController')
const { createPlanController } = require('./controllers/planController')
const { createRecipeRoutes } = require('./routes/recipeRoutes')
const { createPreferenceRoutes } = require('./routes/preferenceRoutes')
const { createPlanRoutes } = require('./routes/planRoutes')
const { notFound, errorHandler } = require('./middleware/errorHandler')

// Takes the database as an argument so tests can pass an in-memory one.
function createApp(db) {
  const app = express()
  app.use(express.json())

  const preferenceService = createPreferenceService(createPreferenceRepository(db))
  const recipeRepo = createRecipeRepository(db)
  const recipeService = createRecipeService(recipeRepo, preferenceService)
  const planService = createPlanService(createPlanRepository(db), recipeRepo, preferenceService)

  app.get('/api/health', (req, res) => res.json({ ok: true }))
  app.use('/api/recipes', createRecipeRoutes(createRecipeController(recipeService)))
  app.use('/api/preferences', createPreferenceRoutes(createPreferenceController(preferenceService)))
  app.use('/api/plan', createPlanRoutes(createPlanController(planService)))

  app.use(notFound)
  app.use(errorHandler)
  return app
}

module.exports = { createApp }
