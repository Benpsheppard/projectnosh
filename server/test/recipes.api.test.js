// API tests for the recipes endpoints, run against an in-memory database seeded with the starter recipes.
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { openDb } from '../src/db/connection.js'
import { seedRecipes } from '../src/db/seed.js'
import { noPrices } from './helpers.js'

let db
let app
beforeEach(() => {
  db = openDb(':memory:')
  seedRecipes(db)
  app = createApp(db, { priceLookup: noPrices })
})

const validRecipe = {
  name: "Mum's Beans on Toast",
  serves: 2,
  mealType: ['lunch'],
  dietary: ['vegetarian'],
  tags: ['quick'],
  ingredients: [
    { item: 'baked beans', quantity: 1, unit: 'tin' },
    { item: 'salt and pepper', quantity: null, unit: null },
  ],
  method: ['Heat the beans.', 'Serve on toast.'],
}

describe('seeding', () => {
  it('is safe to run twice', () => {
    expect(seedRecipes(db)).toBe(20)
    const count = db.prepare('SELECT COUNT(*) AS n FROM recipes').get().n
    expect(count).toBe(20)
  })
})

describe('GET /api/recipes', () => {
  it('lists the starter recipes', async () => {
    const res = await request(app).get('/api/recipes')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(20)
    expect(res.body[0].isBuiltin).toBe(true)
  })

  it('filters by meal type', async () => {
    const res = await request(app).get('/api/recipes?mealType=dessert')
    expect(res.body.map((r) => r.id).sort()).toEqual(['apple-crumble', 'sticky-toffee-pudding'])
  })

  it('searches names and ingredients, ignoring case', async () => {
    const res = await request(app).get('/api/recipes?q=HALLOUMI')
    expect(res.body.map((r) => r.id)).toContain('halloumi-and-roasted-vegetable-salad')
  })

  it('needs every selected tag', async () => {
    const both = await request(app).get('/api/recipes?tag=quick&tag=batch-cook')
    const quick = await request(app).get('/api/recipes?tag=quick')
    expect(both.body.length).toBeLessThanOrEqual(quick.body.length)
    for (const r of both.body) expect(r.tags).toEqual(expect.arrayContaining(['quick', 'batch-cook']))
  })
})

describe('POST /api/recipes', () => {
  it('creates a custom recipe that can be fetched again', async () => {
    const created = await request(app).post('/api/recipes').send(validRecipe)
    expect(created.status).toBe(201)
    expect(created.body).toMatchObject({ isBuiltin: false, cuisine: 'home cooking' })
    expect(created.body.id).toMatch(/^mums-beans-on-toast-[0-9a-f]{4}$/)

    const fetched = await request(app).get(`/api/recipes/${created.body.id}`)
    expect(fetched.body.name).toBe("Mum's Beans on Toast")
  })

  it('rejects bad input with friendly messages in the standard error shape', async () => {
    const res = await request(app).post('/api/recipes').send({ ...validRecipe, name: ' ', ingredients: [] })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    const messages = res.body.error.details.map((d) => d.message)
    expect(messages).toContain('Give your recipe a name')
    expect(messages).toContain('Add at least one ingredient')
  })
})

describe('errors', () => {
  it('returns 404 in the standard shape for an unknown recipe', async () => {
    const res = await request(app).get('/api/recipes/nope')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})
