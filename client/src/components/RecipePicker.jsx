// The content of the "pick a meal" sheet: recipes for one meal slot, already narrowed by the
// meal type and (unless switched off) the saved dietary preferences. Tap a recipe to choose it.
// "Create your own" is the secondary option at the bottom.
import { PencilLine } from 'lucide-react'
import { usePreferences } from '../api/preferences'
import { useRecipes } from '../api/recipes'
import Button from './Button'
import DietaryBadge from './DietaryBadge'
import DietaryFilterBanner from './DietaryFilterBanner'

function RecipePicker({ slot, dietaryFilterOn, onDietaryFilterChange, onPick, onCreate }) {
  const { data: prefs, isPending: prefsLoading } = usePreferences()
  const dietary = prefs?.dietary ?? []
  const filteringByDiet = dietary.length > 0 && dietaryFilterOn
  const { data: recipes, isPending, error } = useRecipes(
    { mealType: slot, suitable: filteringByDiet },
    { enabled: !prefsLoading },
  )

  return (
    <div className="space-y-3">
      {dietary.length > 0 && (
        <DietaryFilterBanner dietary={dietary} filterOn={dietaryFilterOn} onToggle={() => onDietaryFilterChange(!dietaryFilterOn)} />
      )}

      {isPending && <p>Loading recipes…</p>}
      {error && <p role="alert">{error.message}</p>}

      {recipes?.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-charcoal/40 p-4 text-center">
          <p className="font-bold">Nothing for {slot} fits your settings yet.</p>
          <p className="mb-3">You can show every {slot} recipe, or make your own.</p>
          {filteringByDiet && (
            <Button variant="secondary" onClick={() => onDietaryFilterChange(false)}>Show all recipes</Button>
          )}
        </div>
      )}

      <ul className="space-y-2">
        {recipes?.map((recipe) => (
          <li key={recipe.id}>
            <button
              type="button"
              onClick={() => onPick(recipe)}
              className="w-full rounded-xl border-2 border-charcoal/40 p-3 text-left"
            >
              <span className="block font-heading text-lg font-bold">{recipe.name}</span>
              <span className="block text-charcoal/75">Serves {recipe.serves}</span>
              {recipe.dietary.length > 0 && (
                <span className="mt-1 flex flex-wrap gap-2">
                  {recipe.dietary.map((tag) => <DietaryBadge key={tag} tag={tag} />)}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <Button variant="secondary" onClick={onCreate} className="inline-flex items-center gap-2">
        <PencilLine aria-hidden="true" /> Create your own
      </Button>
    </div>
  )
}

export default RecipePicker
