// API tests for the shopping list: derived from the plan, scaled by servings, and the "got it at home" split.
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { openDb } from '../src/db/connection.js'
import { createPriceLookup } from '../src/pricing/priceLookup.js'
import { seedRecipes } from '../src/db/seed.js'
import { noPrices } from './helpers.js'

let app
beforeEach(() => {
  const db = openDb(':memory:')
  seedRecipes(db)
  app = createApp(db, { priceLookup: noPrices })
})

const plan = (day, slot, recipeId, servings) => request(app).put(`/api/plan/${day}/${slot}`).send({ recipeId, servings })
const getList = async () => (await request(app).get('/api/shopping-list')).body
const find = (lines, name) => lines.find((l) => l.name === name)

describe('GET /api/shopping-list', () => {
  it('is empty when nothing is planned', async () => {
    const list = await getList()
    expect(list).toMatchObject({ plannedMeals: 0, toBuy: [], atHome: [] })
    expect(list.estimate).toMatchObject({ totalPence: 0, pricedCount: 0, unknownCount: 0 })
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

describe('estimated cost', () => {
  // A small fake price table, injected into the app, so the numbers below are exact.
  let priced
  beforeEach(async () => {
    const lookup = createPriceLookup({
      store: 'Test Store',
      dateChecked: '2026-01-01',
      prices: [
        { item: 'chopped tomatoes', packSize: 1, unit: 'tin', packPrice: 0.5 },
        { item: 'olive oil', packSize: 500, unit: 'ml', packPrice: 4 },
        { item: 'onion', packSize: 1, unit: 'kg', packPrice: 0.9 }, // recipe counts onions, so no match
      ],
    })
    const db = openDb(':memory:')
    seedRecipes(db)
    priced = createApp(db, { priceLookup: lookup })
    await request(priced).put('/api/plan/0/lunch').send({ recipeId: 'tomato-soup', servings: 4 })
  })
  const list = async () => (await request(priced).get('/api/shopping-list')).body

  it('prices whole packs and counts what it cannot price', async () => {
    const { estimate, toBuy } = await list()
    // 2 tins x 50p + 1 bottle of olive oil (30 ml needs one 500 ml pack) = 500p. Onion, garlic and stock are unknown.
    expect(estimate).toMatchObject({ store: 'Test Store', dateChecked: '2026-01-01', totalPence: 500, pricedCount: 2, unknownCount: 3 })
    expect(find(toBuy, 'chopped tomatoes').price).toMatchObject({ status: 'priced', packs: 2, costPence: 100 })
    expect(find(toBuy, 'onion').price).toEqual({ status: 'unknown', reason: 'unit-mismatch' })
    expect(find(toBuy, 'garlic').price).toEqual({ status: 'unknown', reason: 'no-price' })
    expect(find(toBuy, 'salt and pepper').price).toBeNull()
  })

  it('drops items marked "got it at home" out of the total', async () => {
    await request(priced).put('/api/shopping-list/home-items/olive%20oil')
    const { estimate, atHome } = await list()
    expect(estimate).toMatchObject({ totalPence: 100, pricedCount: 1, unknownCount: 3 })
    expect(find(atHome, 'olive oil')).toBeDefined()
  })

  it('never treats unknown items as zero: with no prices the total is 0 but everything is "unknown"', async () => {
    await request(priced).put('/api/shopping-list/home-items/chopped%20tomato')
    await request(priced).put('/api/shopping-list/home-items/olive%20oil')
    expect((await list()).estimate).toMatchObject({ totalPence: 0, pricedCount: 0, unknownCount: 3 })
  })

  describe('against the weekly budget', () => {
    const setBudget = (weeklyBudgetPence) =>
      request(priced).put('/api/preferences').send({ dietary: [], householdSize: 2, weeklyBudgetPence })

    it('has no comparison when there is no budget', async () => {
      expect((await list()).estimate).toMatchObject({ budgetPence: null, remainingPence: null })
    })

    it('says how much is left when under budget', async () => {
      await setBudget(2000) // total is 500
      expect((await list()).estimate).toMatchObject({ budgetPence: 2000, remainingPence: 1500 })
    })

    it('goes negative when over budget', async () => {
      await setBudget(300)
      expect((await list()).estimate).toMatchObject({ budgetPence: 300, remainingPence: -200 })
    })

    it('is zero when exactly on budget', async () => {
      await setBudget(500)
      expect((await list()).estimate.remainingPence).toBe(0)
    })

    it('gets more room when something is marked "got it at home"', async () => {
      await setBudget(1000)
      await request(priced).put('/api/shopping-list/home-items/olive%20oil') // takes 400 off the total
      expect((await list()).estimate).toMatchObject({ totalPence: 100, remainingPence: 900 })
    })

    it('cannot compare when nothing could be priced (a £0 total is not "under budget")', async () => {
      await setBudget(1000)
      await request(priced).put('/api/shopping-list/home-items/chopped%20tomato')
      await request(priced).put('/api/shopping-list/home-items/olive%20oil')
      expect((await list()).estimate).toMatchObject({ budgetPence: 1000, pricedCount: 0, remainingPence: null })
    })
  })
})
