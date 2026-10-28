// Recipes tab: dietary banner, search, filter chips, the list of recipe cards, and the "Add recipe" form.
// Filtering is done by the API (we send the search text, meal type, tags and whether to apply
// the saved dietary preferences).
import { MEAL_TYPES, RECIPE_TAGS, DIETARY_TAGS } from '@nosh/shared'
import { useState } from 'react'
import { ExternalLink, SlidersHorizontal } from 'lucide-react'
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
  const [filtersOpen, setFiltersOpen] = useState(false)
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
        <div className="flex items-center gap-2">
          <input id="recipe-search" type="search" className={`${inputClass} min-w-0`} placeholder="Try “pasta” or “chicken”"
            value={q} onChange={(e) => setQ(e.target.value)} />
          {/* Icon-only, so it needs a spoken name (aria-label, including how many are chosen) and a state
              (aria-expanded). The number is a badge that only appears when filters are chosen. It counts the
              hidden filters only: the meal chips below are always visible. */}
          <Button
            variant={filtersOpen ? 'primary' : 'secondary'}
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-label={tags.length > 0 ? `Filters, ${tags.length} selected` : 'Filters'}
            aria-expanded={filtersOpen}
            aria-controls="more-filters"
            className="relative grid size-12 shrink-0 place-items-center !px-0"
          >
            <SlidersHorizontal aria-hidden="true" size={22} />
            {tags.length > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-charcoal text-xs font-bold text-white"
              >
                {tags.length}
              </span>
            )}
          </Button>
        </div>
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

      {filtersOpen && (
        <div id="more-filters" className="space-y-4">
          <fieldset>
            <legend className="sr-only">Filter by tag</legend>
            <div className="flex flex-wrap gap-2">
              {RECIPE_TAGS.map((tag) => (
                <FilterChip key={tag} label={tag} selected={tags.includes(tag)} onToggle={() => toggleTag(tag)} />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="sr-only">Filter by dietary preference</legend>
            <div className="flex flex-wrap gap-2">
              {DIETARY_TAGS.map((tag) => (
                <FilterChip key={tag} label={tag} selected={tags.includes(tag)} onToggle={() => toggleTag(tag)} />
              ))}
            </div>
          </fieldset>
        </div>
      )}

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

          <p className="text-sm">
            Need recipe ideas? Try{' '}
            <a 
              href="https://www.bbcgoodfood.com/feature/budget" 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1 font-semibold text-charcoal underline underline-offset-4"
            >
              BBC Good Food Budget
              <ExternalLink aria-hidden="true" size={14} />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </p>
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
