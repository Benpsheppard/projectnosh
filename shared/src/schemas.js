// Zod schemas describing a recipe and its ingredients.
// The server validates input and the seed file with these; the client can reuse them for forms.

import { z } from 'zod'
import { DIETARY_TAGS, MEAL_TYPES, UNITS } from './constants.js'

/**
 * @typedef {{ 
 *  item: string, 
 *  quantity: number | null, 
 *  unit: string | null, 
 *  prep?: string 
 * }} Ingredient
 * @typedef {{
 *  id: string, 
 *  name: string, 
 *  cuisine: string, 
 *  mealType: string[], 
 *  dietary: string[],
 *  tags: string[], 
 *  serves: number, 
 *  ingredients: Ingredient[], 
 *  method: string[]
 * }} Recipe
 */

export const ingredientSchema = z.object({
  item: z.string().trim().min(1, 'Add a name for each ingredient'),
  // null quantity means "to taste"
  quantity: z.number({ error: 'Quantity must be a number' }).positive('Quantity must be more than 0').nullable(),
  // null unit means a plain count
  unit: z.enum(UNITS).nullable(),
  prep: z.string().optional(),
})

export const recipeSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Give your recipe a name'),
  cuisine: z.string().trim().min(1),
  mealType: z.array(z.enum(MEAL_TYPES)).min(1, 'Pick at least one meal type'),
  dietary: z.array(z.enum(DIETARY_TAGS)),
  tags: z.array(z.string()),
  serves: z.number({ error: 'Serves must be a number' }).int('Serves must be a whole number').positive('Serves must be at least 1'),
  ingredients: z.array(ingredientSchema).min(1, 'Add at least one ingredient'),
  method: z.array(z.string().trim().min(1)).min(1, 'Add at least one step'),
})

export const preferencesSchema = z.object({
  dietary: z.array(z.enum(DIETARY_TAGS)),
  householdSize: z.number().int().min(1, 'Household size must be at least 1').max(20),
  // The weekly shopping budget in whole pence, or null for "no budget". The settings form takes
  // pounds and converts, so the server never deals with decimals.
  weeklyBudgetPence: z
    .number({ error: 'Weekly budget must be a number' })
    .int('Weekly budget must be a number')
    .min(100, 'Weekly budget must be at least £1')
    .max(100000, 'Weekly budget can be up to £1,000')
    .nullable()
    .default(null),
})

// One planned meal. `servings` is optional: when missing, the household size is used.
export const planEntrySchema = z.object({
  recipeId: z.string().min(1, 'Pick a recipe'),
  servings: z
    .number({ error: 'Servings must be a number' })
    .int('Servings must be a whole number')
    .min(1, 'Servings must be at least 1')
    .max(20, 'Servings can be up to 20')
    .optional(),
})

// The price table (server/data/prices.json): one supermarket's own-brand pack prices.
// `item` is a plain ingredient name (we normalise it, so "Chopped tomatoes" is fine).
// `unit` is what the pack size is measured in, using the same units as recipes; null means a count.
export const priceEntrySchema = z.object({
  item: z.string().trim().min(1, 'Add an ingredient name'),
  packSize: z.number({ error: 'packSize must be a number' }).positive('packSize must be more than 0'),
  unit: z.enum(UNITS, { error: `unit must be one of ${UNITS.join(', ')}, or null for a count` }).nullable(),
  packPrice: z.number({ error: 'packPrice must be a number' }).positive('packPrice must be more than 0'),
})

export const priceTableSchema = z.object({
  store: z.string().trim().min(1, 'Add the store name'),
  dateChecked: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'dateChecked must look like 2026-10-26').nullable(),
  prices: z.array(priceEntrySchema),
})

// The normalised ingredient name taken from the URL, e.g. /api/shopping-list/home-items/chopped%20tomato.
export const homeItemSchema = z.object({
  name: z.string().trim().toLowerCase().min(1, 'Pick an ingredient').max(100),
})

// The day (0 = Monday ... 6 = Sunday) and meal slot taken from the URL, e.g. /api/plan/0/dinner.
const dayError = 'Pick a day from Monday to Sunday'
export const planSlotSchema = z.object({
  day: z.coerce.number({ error: dayError }).int(dayError).min(0, dayError).max(6, dayError),
  slot: z.enum(MEAL_TYPES, { error: 'Pick breakfast, lunch, dinner or dessert' }),
})

// What a user sends when adding their own recipe: the server makes the id.
export const newRecipeSchema = recipeSchema.omit({ id: true }).extend({
  cuisine: z.string().trim().min(1).default('home cooking'),
})
