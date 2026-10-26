// Data access for the weekly plan: one row per (day, meal slot). Day 0 = Monday.

function createPlanRepository(db) {
  const toEntry = (row) => ({ day: row.day, slot: row.slot, recipeId: row.recipe_id, servings: row.servings })

  return {
    findAll() {
      return db.prepare('SELECT * FROM plan_entries ORDER BY day').all().map(toEntry)
    },

    // Setting a slot that already has a meal replaces it.
    upsert({ day, slot, recipeId, servings }) {
      db.prepare(
        `INSERT INTO plan_entries (day, slot, recipe_id, servings) VALUES (?, ?, ?, ?)
         ON CONFLICT(day, slot) DO UPDATE SET recipe_id = excluded.recipe_id, servings = excluded.servings`,
      ).run(day, slot, recipeId, servings)
    },

    remove(day, slot) {
      db.prepare('DELETE FROM plan_entries WHERE day = ? AND slot = ?').run(day, slot)
    },
  }
}

module.exports = { createPlanRepository }
