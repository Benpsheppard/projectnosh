// Starts the API: opens the database, builds the Express app and listens on PORT.
// Kept tiny so tests can import the app (src/app.js) without starting a server.

require('dotenv').config()
const { openDb } = require('./src/db/connection')
const { createApp } = require('./src/app')

const PORT = process.env.PORT || 8000

createApp(openDb()).listen(PORT, () => {
  console.log(`Server listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`)
})
