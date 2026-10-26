// Opens the SQLite database and makes sure the tables in schema.sql exist.
// Used by server.js, the seed script and tests (with ":memory:").

const fs = require('node:fs')
const path = require('node:path')
const Database = require('better-sqlite3')

// Pass ':memory:' in tests to get a throwaway database. Set DB_FILE to use a different file
// (handy for trying things out without touching your real data).
function openDb(file = process.env.DB_FILE || path.join(__dirname, '../../data/nosh.db')) {
  const db = new Database(file)
  db.pragma('foreign_keys = ON')
  db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'))
  return db
}

module.exports = { openDb }
