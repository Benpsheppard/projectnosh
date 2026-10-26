// Data access for the single preferences row (dietary tags, household size, weekly budget).

function createPreferenceRepository(db) {
  return {
    get() {
      const row = db.prepare('SELECT dietary, household_size, weekly_budget_pence FROM preferences WHERE id = 1').get()
      return { dietary: JSON.parse(row.dietary), householdSize: row.household_size, weeklyBudgetPence: row.weekly_budget_pence }
    },

    save({ dietary, householdSize, weeklyBudgetPence }) {
      db.prepare('UPDATE preferences SET dietary = ?, household_size = ?, weekly_budget_pence = ? WHERE id = 1').run(
        JSON.stringify(dietary),
        householdSize,
        weeklyBudgetPence,
      )
    },
  }
}

module.exports = { createPreferenceRepository }
