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
})

// One planned meal. `servings` is optional: when missing, the household size is used.
export const planEntrySchema = z.object({
  recipeId: z.string().min(1),
  servings: z.number().int().positive().optional(),
})

// What a user sends when adding their own recipe: the server makes the id.
export const newRecipeSchema = recipeSchema.omit({ id: true }).extend({
  cuisine: z.string().trim().min(1).default('home cooking'),
})
