require('dotenv').config()
const { openDb } = require('./src/db/connection')
const { createApp } = require('./src/app')

const PORT = process.env.PORT || 8000

createApp(openDb()).listen(PORT, () => {
  console.log(`Server listening on port ${PORT} (${process.env.NODE_ENV})`)
})
