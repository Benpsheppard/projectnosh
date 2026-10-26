// Data access for "got it at home" items, stored by normalised ingredient name (e.g. "chopped tomato").
// Storing the name (not a list line) means the choice survives changes to the plan.

function createHomeItemRepository(db) {
  return {
    findAll() {
      return new Set(db.prepare('SELECT normalised_name FROM home_items').all().map((row) => row.normalised_name))
    },

    add(name) {
      db.prepare('INSERT OR IGNORE INTO home_items (normalised_name) VALUES (?)').run(name)
    },

    remove(name) {
      db.prepare('DELETE FROM home_items WHERE normalised_name = ?').run(name)
    },
  }
}

module.exports = { createHomeItemRepository }
