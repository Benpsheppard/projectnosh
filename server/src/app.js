// Builds the Express app: wires repository -> service -> controller -> routes, then error handling.
// Takes the database as an argument so tests can pass an in-memory one.

const express = require('express')
const { createRecipeRepository } = require('./repositories/recipeRepository')
const { createPreferenceRepository } = require('./repositories/preferenceRepository')
const { createRecipeService } = require('./services/recipeService')
const { createPreferenceService } = require('./services/preferenceService')
const { createRecipeController } = require('./controllers/recipeController')
const { createPreferenceController } = require('./controllers/preferenceController')
const { createRecipeRoutes } = require('./routes/recipeRoutes')
const { createPreferenceRoutes } = require('./routes/preferenceRoutes')
const { notFound, errorHandler } = require('./middleware/errorHandler')

// Takes the database as an argument so tests can pass an in-memory one.
function createApp(db) {
  const app = express()
  app.use(express.json())

  const preferenceService = createPreferenceService(createPreferenceRepository(db))
  const recipeService = createRecipeService(createRecipeRepository(db), preferenceService)

  app.get('/api/health', (req, res) => res.json({ ok: true }))
  app.use('/api/recipes', createRecipeRoutes(createRecipeController(recipeService)))
  app.use('/api/preferences', createPreferenceRoutes(createPreferenceController(preferenceService)))

  app.use(notFound)
  app.use(errorHandler)
  return app
}

module.exports = { createApp }
