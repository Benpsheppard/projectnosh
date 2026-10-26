// API tests for preferences and for filtering recipes by them (?suitable=true).
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { openDb } from '../src/db/connection.js'
import { seedRecipes } from '../src/db/seed.js'

let app
beforeEach(() => {
  const db = openDb(':memory:')
  seedRecipes(db)
  app = createApp(db)
})

const save = (prefs) => request(app).put('/api/preferences').send(prefs)
const ids = (res) => res.body.map((r) => r.id).sort()

describe('preferences', () => {
  it('starts with no dietary needs and a household of 2', async () => {
    const res = await request(app).get('/api/preferences')
    expect(res.body).toEqual({ dietary: [], householdSize: 2 })
  })

  it('saves and returns new preferences', async () => {
    await save({ dietary: ['vegetarian', 'vegetarian'], householdSize: 4 })
    const res = await request(app).get('/api/preferences')
    expect(res.body).toEqual({ dietary: ['vegetarian'], householdSize: 4 })
  })

  it('rejects bad input with friendly messages', async () => {
    const res = await save({ dietary: ['pescatarian'], householdSize: 0 })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(res.body.error.details.map((d) => d.message)).toContain('Household size must be at least 1')
  })
})

describe('GET /api/recipes?suitable=true', () => {
  it('shows everything when no preferences are set', async () => {
    const res = await request(app).get('/api/recipes?suitable=true')
    expect(res.body).toHaveLength(20)
  })

  it('shows only recipes carrying every selected tag', async () => {
    await save({ dietary: ['vegetarian', 'gluten-free'], householdSize: 2 })
    const res = await request(app).get('/api/recipes?suitable=true')
    expect(ids(res)).toEqual([
      'halloumi-and-roasted-vegetable-salad', 'jacket-potato-with-cheese-and-beans', 'lentil-dahl', 'tomato-soup',
    ])
  })

  it('counts vegan recipes as dairy-free', async () => {
    await save({ dietary: ['dairy-free'], householdSize: 2 })
    const res = await request(app).get('/api/recipes?suitable=true')
    expect(ids(res)).toContain('tomato-soup') // tagged vegan, not dairy-free
  })

  it('leaves a meal type empty when nothing fits (no vegan dessert)', async () => {
    await save({ dietary: ['vegan'], householdSize: 2 })
    const res = await request(app).get('/api/recipes?suitable=true&mealType=dessert')
    expect(res.body).toEqual([])
  })

  it('still lists everything when the filter is not requested', async () => {
    await save({ dietary: ['vegan'], householdSize: 2 })
    expect((await request(app).get('/api/recipes')).body).toHaveLength(20)
  })
})
