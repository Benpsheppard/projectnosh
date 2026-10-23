const fs = require('node:fs')
const path = require('node:path')
const { openDb } = require('./connection')
const { createRecipeRepository } = require('../repositories/recipeRepository')

const RECIPES_FILE = path.join(__dirname, '../../data/project-nosh-sample-recipes.json')

// Validates every recipe first and throws with ALL problems, so bad data fails loudly
// before anything is written.
async function seedRecipes(db, file = RECIPES_FILE) {
  // @nosh/shared is an ES module; dynamic import works from this CommonJS file.
  const { recipeSchema } = await import('@nosh/shared')
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  if (!Array.isArray(raw)) throw new Error('Seed file must contain an array of recipes')

  const problems = []
  const recipes = []
  const seenIds = new Set()
  raw.forEach((item, index) => {
    const result = recipeSchema.safeParse(item)
    const label = item?.id ?? `#${index}`
    if (!result.success) {
      for (const issue of result.error.issues) problems.push(`${label}: ${issue.path.join('.')} ${issue.message}`)
      return
    }
    if (seenIds.has(result.data.id)) problems.push(`${label}: duplicate id`)
    seenIds.add(result.data.id)
    recipes.push(result.data)
  })
  if (problems.length > 0) throw new Error(`Seed data is invalid:\n  ${problems.join('\n  ')}`)

  const repo = createRecipeRepository(db)
  db.transaction(() => recipes.forEach((r) => repo.upsertBuiltIn(r)))()
  return recipes.length
}

module.exports = { seedRecipes }

if (require.main === module) {
  seedRecipes(openDb())
    .then((n) => console.log(`Seeded ${n} built-in recipes`))
    .catch((err) => {
      console.error(err.message)
      process.exit(1)
    })
}
