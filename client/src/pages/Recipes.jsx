// Recipes tab: search, filter chips, the list of recipe cards, and the "Add recipe" form.
// Filtering is done by the API (we just send the search text, meal type and tags).
import { MEAL_TYPES, RECIPE_TAGS } from '@nosh/shared'
import { useState } from 'react'
import { useRecipes } from '../api/recipes'
import AddRecipeForm from '../components/AddRecipeForm'
import Button from '../components/Button'
import FilterChip from '../components/FilterChip'
import RecipeCard from '../components/RecipeCard'
import { inputClass, labelClass } from '../components/ui'

function Recipes() {
  const [adding, setAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  const [q, setQ] = useState('')
  const [mealType, setMealType] = useState(null)
  const [tags, setTags] = useState([])
  const { data: recipes, isPending, error } = useRecipes({ q: q.trim(), mealType, tags })

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
          setJustAdded(true)
        }}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-2xl font-bold">Recipes</h2>
        <Button onClick={() => { setJustAdded(false); setAdding(true) }}>Add recipe</Button>
      </div>

      {justAdded && (
        <p role="status" className="rounded-xl bg-nosh-green p-3 font-semibold">
          Recipe saved. You will find it under "Your recipe".
        </p>
      )}

      <div>
        <label htmlFor="recipe-search" className={labelClass}>Search recipes</label>
        <input id="recipe-search" type="search" className={inputClass} placeholder="Try “pasta” or “chicken”"
          value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <fieldset>
        <legend className="sr-only">Filter by meal</legend>
        <div className="flex flex-wrap gap-2">
          {MEAL_TYPES.map((type) => (
            <FilterChip key={type} label={type} selected={mealType === type}
              onToggle={() => setMealType(mealType === type ? null : type)} />
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="sr-only">Filter by tag</legend>
        <div className="flex flex-wrap gap-2">
          {RECIPE_TAGS.map((tag) => (
            <FilterChip key={tag} label={tag} selected={tags.includes(tag)} onToggle={() => toggleTag(tag)} />
          ))}
        </div>
      </fieldset>

      {isPending && <p>Loading recipes…</p>}
      {error && <p role="alert">{error.message}</p>}

      {recipes?.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-charcoal/40 p-6 text-center">
          <p className="font-bold">No recipes match that yet.</p>
          <p className="mb-3">Try fewer filters, or add your own.</p>
          {hasFilters && <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
        </div>
      )}

      {recipes?.length > 0 && (
        <>
          <p aria-live="polite" className="text-sm text-charcoal/75">
            Showing {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
          </p>
          <ul className="space-y-3">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default Recipes
