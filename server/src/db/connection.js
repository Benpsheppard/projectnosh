// Opens the SQLite database and makes sure the tables in schema.sql exist.
// Used by server.js, the seed script and tests (with ":memory:").

const fs = require('node:fs')
const path = require('node:path')
const Database = require('better-sqlite3')

// CREATE TABLE IF NOT EXISTS leaves an existing table alone, so a database made before a column existed
// would be missing it. This adds such columns without touching any saved data. (SQLite has no
// "ADD COLUMN IF NOT EXISTS", so we look first.)
function addMissingColumns(db) {
  const preferenceColumns = db.pragma('table_info(preferences)').map((column) => column.name)
  if (!preferenceColumns.includes('weekly_budget_pence')) {
    db.exec('ALTER TABLE preferences ADD COLUMN weekly_budget_pence INTEGER')
  }
}

// Pass ':memory:' in tests to get a throwaway database. Set DB_FILE to use a different file
// (handy for trying things out without touching your real data).
function openDb(file = process.env.DB_FILE || path.join(__dirname, '../../data/nosh.db')) {
  const db = new Database(file)
  db.pragma('foreign_keys = ON')
  db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'))
  addMissingColumns(db)
  return db
}

module.exports = { openDb }
