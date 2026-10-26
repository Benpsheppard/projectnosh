// API tests for the weekly plan: set, replace, servings defaults, validation, remove.
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { openDb } from '../src/db/connection.js'
import { seedRecipes } from '../src/db/seed.js'
import { noPrices } from './helpers.js'

let app
beforeEach(() => {
  const db = openDb(':memory:')
  seedRecipes(db)
  app = createApp(db, { priceLookup: noPrices })
})

const put = (day, slot, body) => request(app).put(`/api/plan/${day}/${slot}`).send(body)

describe('plan', () => {
  it('starts empty', async () => {
    expect((await request(app).get('/api/plan')).body).toEqual([])
  })

  it('uses the household size when no servings are given', async () => {
    await request(app).put('/api/preferences').send({ dietary: [], householdSize: 3 })
    const res = await put(0, 'dinner', { recipeId: 'spaghetti-bolognese' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ day: 0, slot: 'dinner', servings: 3 })
    expect(res.body.recipe).toMatchObject({ id: 'spaghetti-bolognese', name: 'Spaghetti Bolognese', serves: 4 })
  })

  it('keeps the servings the user chose', async () => {
    const res = await put(2, 'lunch', { recipeId: 'tomato-soup', servings: 6 })
    expect(res.body.servings).toBe(6)
  })

  it('replaces the meal when the same slot is set again', async () => {
    await put(1, 'dinner', { recipeId: 'shepherds-pie' })
    await put(1, 'dinner', { recipeId: 'fish-and-chips', servings: 2 })
    const plan = (await request(app).get('/api/plan')).body
    expect(plan).toHaveLength(1)
    expect(plan[0]).toMatchObject({ slot: 'dinner', servings: 2 })
    expect(plan[0].recipe.id).toBe('fish-and-chips')
  })

  it('lists meals in day then meal order', async () => {
    await put(1, 'dinner', { recipeId: 'shepherds-pie' })
    await put(0, 'dessert', { recipeId: 'apple-crumble' })
    await put(0, 'breakfast', { recipeId: 'full-english-breakfast' })
    const plan = (await request(app).get('/api/plan')).body
    expect(plan.map((e) => `${e.day}-${e.slot}`)).toEqual(['0-breakfast', '0-dessert', '1-dinner'])
  })

  it('removes a meal', async () => {
    await put(4, 'lunch', { recipeId: 'tomato-soup' })
    expect((await request(app).delete('/api/plan/4/lunch')).status).toBe(204)
    expect((await request(app).get('/api/plan')).body).toEqual([])
  })
})

describe('plan validation', () => {
  it('rejects an unknown recipe with 404', async () => {
    const res = await put(0, 'dinner', { recipeId: 'nope' })
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('rejects a bad day or slot with friendly messages', async () => {
    const day = await put(9, 'dinner', { recipeId: 'tomato-soup' })
    expect(day.status).toBe(400)
    expect(day.body.error.details[0].message).toBe('Pick a day from Monday to Sunday')
    const slot = await put(0, 'brunch', { recipeId: 'tomato-soup' })
    expect(slot.body.error.details[0].message).toBe('Pick breakfast, lunch, dinner or dessert')
  })

  it('rejects bad servings', async () => {
    const res = await put(0, 'dinner', { recipeId: 'tomato-soup', servings: 0 })
    expect(res.status).toBe(400)
    expect(res.body.error.details[0].message).toBe('Servings must be at least 1')
  })
})
