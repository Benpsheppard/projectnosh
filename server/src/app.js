// Builds the Express app: wires repository -> service -> controller -> routes, then error handling.
// Takes the database as an argument so tests can pass an in-memory one.

const express = require('express')
const { createRecipeRepository } = require('./repositories/recipeRepository')
const { createRecipeService } = require('./services/recipeService')
const { createRecipeController } = require('./controllers/recipeController')
const { createRecipeRoutes } = require('./routes/recipeRoutes')
const { notFound, errorHandler } = require('./middleware/errorHandler')

// Takes the database as an argument so tests can pass an in-memory one.
function createApp(db) {
  const app = express()
  app.use(express.json())

  const recipeService = createRecipeService(createRecipeRepository(db))

  app.get('/api/health', (req, res) => res.json({ ok: true }))
  app.use('/api/recipes', createRecipeRoutes(createRecipeController(recipeService)))

  app.use(notFound)
  app.use(errorHandler)
  return app
}

module.exports = { createApp }
