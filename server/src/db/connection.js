const fs = require('node:fs')
const path = require('node:path')
const Database = require('better-sqlite3')

// Pass ':memory:' in tests to get a throwaway database.
function openDb(file = path.join(__dirname, '../../data/nosh.db')) {
  const db = new Database(file)
  db.pragma('foreign_keys = ON')
  db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'))
  return db
}

module.exports = { openDb }
