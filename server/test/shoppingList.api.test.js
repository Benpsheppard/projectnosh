// API tests for the shopping list: derived from the plan, scaled by servings, and the "got it at home" split.
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

const plan = (day, slot, recipeId, servings) => request(app).put(`/api/plan/${day}/${slot}`).send({ recipeId, servings })
const getList = async () => (await request(app).get('/api/shopping-list')).body
const find = (lines, name) => lines.find((l) => l.name === name)

describe('GET /api/shopping-list', () => {
  it('is empty when nothing is planned', async () => {
    expect(await getList()).toEqual({ plannedMeals: 0, toBuy: [], atHome: [] })
  })

  it('scales to the planned servings', async () => {
    await plan(0, 'lunch', 'tomato-soup', 2) // recipe serves 4, so half
    const { toBuy } = await getList()
    expect(find(toBuy, 'chopped tomatoes')).toMatchObject({ amount: 1, unit: 'tin' })
    expect(find(toBuy, 'vegetable stock')).toMatchObject({ label: '250 ml' })
  })

  it('adds the same ingredient across recipes and says where it came from', async () => {
    await plan(0, 'lunch', 'tomato-soup', 4)
    await plan(1, 'dinner', 'chilli-con-carne', 4)
    const { toBuy } = await getList()
    const tomatoes = find(toBuy, 'chopped tomatoes')
    expect(tomatoes).toMatchObject({ amount: 3, label: '3 tins' }) // 2 in the soup + 1 in the chilli
    expect(tomatoes.recipes.map((r) => r.id)).toEqual(['tomato-soup', 'chilli-con-carne'])
    expect(find(toBuy, 'onion').amount).toBe(2)
  })

  it('uses the household size for meals added without servings', async () => {
    await request(app).put('/api/preferences').send({ dietary: [], householdSize: 8 })
    await request(app).put('/api/plan/0/dinner').send({ recipeId: 'chilli-con-carne' })
    expect(find((await getList()).toBuy, 'beef mince').label).toBe('1 kg') // 500 g x 2
  })

  it('shows "to taste" once', async () => {
    await plan(0, 'lunch', 'tomato-soup', 4)
    await plan(1, 'breakfast', 'scrambled-eggs-on-toast', 2)
    const salt = (await getList()).toBuy.filter((l) => l.name === 'salt and pepper')
    expect(salt).toHaveLength(1)
    expect(salt[0].toTaste).toBe(true)
  })

  it('updates when the plan changes', async () => {
    await plan(0, 'lunch', 'tomato-soup', 4)
    await request(app).delete('/api/plan/0/lunch')
    expect((await getList()).toBuy).toEqual([])
  })
})

describe('got it at home', () => {
  beforeEach(async () => {
    await plan(0, 'lunch', 'tomato-soup', 4)
  })

  it('moves an item to "at home" and back', async () => {
    expect((await request(app).put('/api/shopping-list/home-items/chopped%20tomato')).status).toBe(204)
    let list = await getList()
    expect(find(list.atHome, 'chopped tomatoes')).toBeDefined()
    expect(find(list.toBuy, 'chopped tomatoes')).toBeUndefined()

    await request(app).delete('/api/shopping-list/home-items/chopped%20tomato')
    list = await getList()
    expect(find(list.toBuy, 'chopped tomatoes')).toBeDefined()
    expect(list.atHome).toEqual([])
  })

  it('matches by normalised name, so spelling in the plan does not matter', async () => {
    await request(app).put('/api/shopping-list/home-items/Onion')
    expect(find((await getList()).atHome, 'onion')).toBeDefined()
  })

  it('remembers the choice even when the item leaves the plan, and when it comes back', async () => {
    await request(app).put('/api/shopping-list/home-items/onion')
    await request(app).delete('/api/plan/0/lunch')
    await plan(2, 'dinner', 'chilli-con-carne', 4)
    expect(find((await getList()).atHome, 'onion')).toBeDefined()
  })

  it('is safe to mark twice', async () => {
    await request(app).put('/api/shopping-list/home-items/onion')
    expect((await request(app).put('/api/shopping-list/home-items/onion')).status).toBe(204)
  })
})
