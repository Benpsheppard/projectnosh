// Plan tab: pick a day, then fill its four meal slots (breakfast, lunch, dinner, dessert).
// Tap an empty slot to choose a recipe, or tap a planned meal to change servings, swap or remove it.
// Everything is tap-to-add; there is no drag and drop.
import { DAYS, MEAL_TYPES } from '@nosh/shared'
import { ChevronRight, Plus, ShoppingBasket } from 'lucide-react'
import { useState } from 'react'
import { usePlan, useSetPlanEntry } from '../api/plan'
import AddRecipeForm from '../components/AddRecipeForm'
import Button from '../components/Button'
import DaySelector from '../components/DaySelector'
import MealDetails from '../components/MealDetails'
import RecipePicker from '../components/RecipePicker'
import Sheet from '../components/Sheet'
import { todayIndex } from '../lib/dates'

// "5 meals planned across 3 days" (or a gentle nudge when the plan is empty).
function summarise(plan) {
  if (plan.length === 0) return 'Nothing planned yet. Pick a day, then tap a meal to add something.'
  const days = new Set(plan.map((e) => e.day)).size
  return `${plan.length} ${plan.length === 1 ? 'meal' : 'meals'} planned across ${days} ${days === 1 ? 'day' : 'days'}.`
}

function Plan({ dietaryFilterOn, onDietaryFilterChange, onNavigate }) {
  const [day, setDay] = useState(todayIndex())
  // sheet: null, or { type: 'pick' | 'meal', slot }. creating: the slot a new recipe is for.
  const [sheet, setSheet] = useState(null)
  const [creating, setCreating] = useState(null)
  const { data: plan = [], isPending, error } = usePlan()
  const setEntry = useSetPlanEntry()

  const mealCounts = {}
  for (const entry of plan) mealCounts[entry.day] = (mealCounts[entry.day] ?? 0) + 1
  const entryFor = (slot) => plan.find((e) => e.day === day && e.slot === slot)

  const closeSheet = () => setSheet(null)
  const current = sheet && entryFor(sheet.slot)

  // Choosing a recipe keeps the servings already planned for that slot (if any).
  const pick = (recipe) =>
    setEntry.mutate({ day, slot: sheet.slot, recipeId: recipe.id, servings: current?.servings }, { onSuccess: closeSheet })

  if (creating) {
    return (
      <AddRecipeForm
        initialMealType={creating}
        intro={`When you save, it goes straight into ${DAYS[day]} ${creating}.`}
        onCancel={() => setCreating(null)}
        onDone={(recipe) => {
          setEntry.mutate({ day, slot: creating, recipeId: recipe.id })
          setCreating(null)
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl font-bold">Plan</h2>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-nosh-green/40 p-3">
        <p className="font-semibold">{summarise(plan)}</p>
        {plan.length > 0 && (
          <Button variant="secondary" className="inline-flex items-center gap-2 text-sm" onClick={() => onNavigate('shopping')}>
            <ShoppingBasket aria-hidden="true" size={18} /> See shopping list
          </Button>
        )}
      </div>

      {isPending && <p>Loading your plan…</p>}
      {error && <p role="alert">{error.message}</p>}

      <DaySelector selected={day} mealCounts={mealCounts} onSelect={setDay} />

      <h3 className="font-heading text-xl font-bold">{DAYS[day]}</h3>
      <ul className="space-y-3">
        {MEAL_TYPES.map((slot) => {
          const entry = entryFor(slot)
          return (
            <li key={slot}>
              <button
                type="button"
                onClick={() => setSheet({ type: entry ? 'meal' : 'pick', slot })}
                className={`flex min-h-20 w-full items-center justify-between gap-3 rounded-2xl border-2 p-4 text-left ${
                  entry ? 'border-charcoal bg-white' : 'border-dashed border-charcoal/50'
                }`}
              >
                <span>
                  <span className="block text-sm font-semibold capitalize text-charcoal/75">{slot}</span>
                  {entry ? (
                    <>
                      <span className="block font-heading text-lg font-bold">{entry.recipe.name}</span>
                      <span className="block text-charcoal/75">For {entry.servings} {entry.servings === 1 ? 'person' : 'people'}</span>
                    </>
                  ) : (
                    <span className="flex items-center gap-1 font-semibold">
                      <Plus aria-hidden="true" size={18} /> Add {slot}
                    </span>
                  )}
                </span>
                {entry && <ChevronRight aria-hidden="true" className="shrink-0" />}
              </button>
            </li>
          )
        })}
      </ul>

      <Sheet
        open={sheet?.type === 'pick'}
        onClose={closeSheet}
        title={sheet ? `Pick ${sheet.slot} for ${DAYS[day]}` : ''}
      >
        {sheet && (
          <RecipePicker
            slot={sheet.slot}
            dietaryFilterOn={dietaryFilterOn}
            onDietaryFilterChange={onDietaryFilterChange}
            onPick={pick}
            onCreate={() => {
              setCreating(sheet.slot)
              closeSheet()
            }}
          />
        )}
      </Sheet>

      <Sheet
        open={sheet?.type === 'meal' && !!current}
        onClose={closeSheet}
        title={sheet ? `${DAYS[day]} ${sheet.slot}` : ''}
      >
        {current && <MealDetails entry={current} onClose={closeSheet} onChangeRecipe={() => setSheet({ type: 'pick', slot: sheet.slot })} />}
      </Sheet>
    </div>
  )
}

export default Plan
