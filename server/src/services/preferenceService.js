// Business logic for the user's preferences. Other services read them through here
// (e.g. recipes use the dietary tags, the shopping list uses the household size).

function createPreferenceService(preferenceRepo) {
  return {
    get() {
      return preferenceRepo.get()
    },

    // `input` has already been validated by the route's schema.
    update(input) {
      preferenceRepo.save({ ...input, dietary: [...new Set(input.dietary)] }) // no duplicate tags
      return preferenceRepo.get()
    },
  }
}

module.exports = { createPreferenceService }
