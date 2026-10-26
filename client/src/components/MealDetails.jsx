// The content of the "planned meal" sheet: change the number of people, swap the recipe, or remove it.
// Servings are edited as a draft and saved when you tap Done.
import { useState } from 'react'
import { useRemovePlanEntry, useSetPlanEntry } from '../api/plan'
import Button from './Button'
import PeopleStepper from './PeopleStepper'
import { errorClass, labelClass } from './ui'

function MealDetails({ entry, onChangeRecipe, onClose }) {
  const [servings, setServings] = useState(String(entry.servings))
  const [error, setError] = useState('')
  const setEntry = useSetPlanEntry()
  const removeEntry = useRemovePlanEntry()
  const { day, slot, recipe } = entry

  function handleDone() {
    const number = Number(servings)
    if (!Number.isInteger(number) || number < 1 || number > 20) return setError('Pick a number of people from 1 to 20')
    if (number === entry.servings) return onClose()
    setEntry.mutate(
      { day, slot, recipeId: recipe.id, servings: number },
      { onSuccess: onClose, onError: (err) => setError(err.message) },
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="font-heading text-xl font-bold">{recipe.name}</p>
        <p className="text-charcoal/75">
          The recipe serves {recipe.serves}. Amounts written in the method are for {recipe.serves} people.
        </p>
      </div>

      <div>
        <label htmlFor="planned-servings" className={labelClass}>How many people is this for?</label>
        <PeopleStepper id="planned-servings" value={servings} onChange={setServings} />
        <p className="mt-1 text-sm text-charcoal/75">We scale the shopping list to match.</p>
      </div>

      {error && <p role="alert" className={errorClass}>{error}</p>}

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleDone} disabled={setEntry.isPending}>Done</Button>
        <Button variant="secondary" onClick={onChangeRecipe}>Change recipe</Button>
        <Button
          variant="secondary"
          disabled={removeEntry.isPending}
          onClick={() => removeEntry.mutate({ day, slot }, { onSuccess: onClose })}
        >
          Remove meal
        </Button>
      </div>
    </div>
  )
}

export default MealDetails
