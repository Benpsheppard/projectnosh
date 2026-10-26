// The content of the "Add to plan" sheet opened from a recipe card: choose a day and a meal slot.
// If that slot already has a meal we say it will be replaced. Servings use the household size.
import { DAYS, MEAL_TYPES } from '@nosh/shared'
import { useState } from 'react'
import { usePlan, useSetPlanEntry } from '../api/plan'
import { todayIndex } from '../lib/dates'
import Button from './Button'
import FilterChip from './FilterChip'
import { errorClass } from './ui'

function AddToPlanSheet({ recipe, onAdded }) {
  const [day, setDay] = useState(todayIndex())
  const [slot, setSlot] = useState(recipe.mealType[0])
  const { data: plan = [] } = usePlan()
  const setEntry = useSetPlanEntry()
  const existing = plan.find((e) => e.day === day && e.slot === slot)

  return (
    <div className="space-y-5">
      <p className="font-heading text-xl font-bold">{recipe.name}</p>

      <fieldset>
        <legend className="mb-1 font-semibold">Which day?</legend>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((name, i) => (
            <FilterChip key={name} label={name.slice(0, 3)} selected={day === i} onToggle={() => setDay(i)} />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 font-semibold">Which meal?</legend>
        <div className="flex flex-wrap gap-2">
          {MEAL_TYPES.map((type) => (
            <FilterChip key={type} label={type} selected={slot === type} onToggle={() => setSlot(type)} />
          ))}
        </div>
      </fieldset>

      {existing && (
        <p role="status" className="font-semibold">
          {DAYS[day]} {slot} already has {existing.recipe.name}. This will swap it.
        </p>
      )}
      {setEntry.error && <p role="alert" className={errorClass}>{setEntry.error.message}</p>}

      <Button
        disabled={setEntry.isPending}
        onClick={() =>
          setEntry.mutate(
            { day, slot, recipeId: recipe.id },
            { onSuccess: () => onAdded(`Added ${recipe.name} to ${DAYS[day]} ${slot}.`) },
          )
        }
      >
        {setEntry.isPending ? 'Adding…' : `Add to ${DAYS[day]} ${slot}`}
      </Button>
    </div>
  )
}

export default AddToPlanSheet
