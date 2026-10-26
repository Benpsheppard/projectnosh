// Recipes tab: dietary banner, search, filter chips, the list of recipe cards, and the "Add recipe" form.
// Filtering is done by the API (we send the search text, meal type, tags and whether to apply
// the saved dietary preferences).
import { MEAL_TYPES, RECIPE_TAGS } from '@nosh/shared'
import { useState } from 'react'
import { usePreferences } from '../api/preferences'
import { useRecipes } from '../api/recipes'
import AddRecipeForm from '../components/AddRecipeForm'
import Button from '../components/Button'
import AddToPlanSheet from '../components/AddToPlanSheet'
import DietaryFilterBanner from '../components/DietaryFilterBanner'
import FilterChip from '../components/FilterChip'
import RecipeCard from '../components/RecipeCard'
import Sheet from '../components/Sheet'
import { inputClass, labelClass } from '../components/ui'

function Recipes({ dietaryFilterOn, onDietaryFilterChange }) {
  const [adding, setAdding] = useState(false)
  const [notice, setNotice] = useState('') // a short confirmation, e.g. "Recipe saved"
  const [planningRecipe, setPlanningRecipe] = useState(null) // recipe whose "Add to plan" sheet is open
  const [q, setQ] = useState('')
  const [mealType, setMealType] = useState(null)
  const [tags, setTags] = useState([])
  const { data: prefs, isPending: prefsLoading } = usePreferences()
  const dietary = prefs?.dietary ?? []
  const filteringByDiet = dietary.length > 0 && dietaryFilterOn
  // Wait for preferences first, so the list never flashes unfiltered and then changes.
  const { data: recipes, isPending, error } = useRecipes(
    { q: q.trim(), mealType, tags, suitable: filteringByDiet },
    { enabled: !prefsLoading },
  )

  const toggleTag = (tag) => setTags(tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag])
  const hasFilters = q.trim() !== '' || mealType !== null || tags.length > 0
  const clearFilters = () => {
    setQ('')
    setMealType(null)
    setTags([])
  }

  if (adding) {
    return (
      <AddRecipeForm
        onCancel={() => setAdding(false)}
        onDone={() => {
          setAdding(false)
          setNotice('Recipe saved. You will find it under "Your recipe".')
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-2xl font-bold">Recipes</h2>
        <Button onClick={() => { setNotice(''); setAdding(true) }}>Add recipe</Button>
      </div>

      {dietary.length > 0 && (
        <DietaryFilterBanner
          dietary={dietary}
          filterOn={dietaryFilterOn}
          onToggle={() => onDietaryFilterChange(!dietaryFilterOn)}
        />
      )}

      {notice && (
        <p role="status" className="rounded-xl bg-nosh-green p-3 font-semibold">
          {notice}
        </p>
      )}

      <div>
        <label htmlFor="recipe-search" className={labelClass}>Search recipes</label>
        <input id="recipe-search" type="search" className={inputClass} placeholder="Try “pasta” or “chicken”"
          value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <fieldset>
        <legend className="sr-only">Filter by meal</legend>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map((type) => (
            <FilterChip key={type} label={type} selected={mealType === type}
              onToggle={() => setMealType(mealType === type ? null : type)} />
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="sr-only">Filter by tag</legend>
        <div className="grid md:grid-cols-4 grid-cols-2 gap-2">
          {RECIPE_TAGS.map((tag) => (
            <FilterChip key={tag} label={tag} selected={tags.includes(tag)} onToggle={() => toggleTag(tag)} />
          ))}
        </div>
      </fieldset>

      {isPending && <p>Loading recipes…</p>}
      {error && <p role="alert">{error.message}</p>}

      {recipes?.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-charcoal/40 p-6 text-center">
          <p className="font-bold">We don't have a match for that yet.</p>
          <p className="mb-3">
            {filteringByDiet
              ? 'Your dietary settings are narrowing things down. You can show every recipe, or add your own.'
              : 'Try fewer filters, or add your own.'}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {hasFilters && <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
            {filteringByDiet && (
              <Button variant="secondary" onClick={() => onDietaryFilterChange(false)}>Show all recipes</Button>
            )}
          </div>
        </div>
      )}

      {recipes?.length > 0 && (
        <>
          <p aria-live="polite" className="text-sm text-charcoal/75">
            Showing {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
          </p>
          <ul className="space-y-3">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onAddToPlan={setPlanningRecipe} />
            ))}
          </ul>
        </>
      )}

      <Sheet open={planningRecipe !== null} onClose={() => setPlanningRecipe(null)} title="Add to plan">
        {planningRecipe && (
          <AddToPlanSheet
            recipe={planningRecipe}
            onAdded={(message) => {
              setNotice(message)
              setPlanningRecipe(null)
            }}
          />
        )}
      </Sheet>
    </div>
  )
}

export default Recipes
