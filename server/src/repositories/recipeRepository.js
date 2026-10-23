// Data access only: SQL in, plain recipe objects out.

function createRecipeRepository(db) {
  const toRecipe = (row) => ({ ...JSON.parse(row.data), isBuiltin: row.is_builtin === 1 })

  return {
    findAll() {
      return db.prepare('SELECT * FROM recipes ORDER BY is_builtin DESC, rowid').all().map(toRecipe)
    },

    findById(id) {
      const row = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id)
      return row ? toRecipe(row) : null
    },

    // Re-running the seed updates built-ins in place and never touches custom recipes.
    upsertBuiltIn(recipe) {
      db.prepare(
        `INSERT INTO recipes (id, is_builtin, data) VALUES (?, 1, ?)
         ON CONFLICT(id) DO UPDATE SET data = excluded.data WHERE is_builtin = 1`,
      ).run(recipe.id, JSON.stringify(recipe))
    },
  }
}

module.exports = { createRecipeRepository }
