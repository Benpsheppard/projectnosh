// Tests that opening a database made BEFORE the weekly budget existed adds the new column
// without losing anything that was already saved.
import Database from 'better-sqlite3'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { openDb } from '../src/db/connection.js'

function makeOldDatabase() {
  const file = join(mkdtempSync(join(tmpdir(), 'nosh-old-db-')), 'old.db')
  const old = new Database(file)
  // The preferences table exactly as it was before the budget column.
  old.exec(`CREATE TABLE preferences (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    dietary TEXT NOT NULL DEFAULT '[]',
    household_size INTEGER NOT NULL DEFAULT 2
  );
  INSERT INTO preferences (id, dietary, household_size) VALUES (1, '["vegetarian"]', 4);`)
  old.close()
  return file
}

describe('opening an older database', () => {
  it('adds the weekly budget column and keeps existing preferences', () => {
    const db = openDb(makeOldDatabase())
    const row = db.prepare('SELECT dietary, household_size, weekly_budget_pence FROM preferences WHERE id = 1').get()
    expect(row).toEqual({ dietary: '["vegetarian"]', household_size: 4, weekly_budget_pence: null })
  })

  it('is safe to open again (does not try to add the column twice)', () => {
    const file = makeOldDatabase()
    openDb(file).close()
    expect(() => openDb(file)).not.toThrow()
  })

  it('creates new databases with the column already in place', () => {
    const columns = openDb(':memory:').pragma('table_info(preferences)').map((c) => c.name)
    expect(columns).toContain('weekly_budget_pence')
  })
})
