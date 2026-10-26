// Data access for the single preferences row (dietary tags + household size).

function createPreferenceRepository(db) {
  return {
    get() {
      const row = db.prepare('SELECT dietary, household_size FROM preferences WHERE id = 1').get()
      return { dietary: JSON.parse(row.dietary), householdSize: row.household_size }
    },

    save({ dietary, householdSize }) {
      db.prepare('UPDATE preferences SET dietary = ?, household_size = ? WHERE id = 1').run(
        JSON.stringify(dietary),
        householdSize,
      )
    },
  }
}

module.exports = { createPreferenceRepository }
