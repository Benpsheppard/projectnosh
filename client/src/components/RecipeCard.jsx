// Recipe card. Collapsed: name, serves, dietary badges and key tags.
// Tap the heading to expand in place and see the ingredients and method.
// `onAddToPlan` is optional: the "Add to plan" button only appears once the Plan tab provides it.
import { useId, useState } from 'react'
import Button from './Button'
import DietaryBadge from './DietaryBadge'
import { formatIngredient } from '../lib/formatIngredient'

function RecipeCard({ recipe, onAddToPlan }) {
  const [open, setOpen] = useState(false)
  const detailsId = useId()

  return (
    <li className="rounded-2xl border-2 border-charcoal/30 bg-white p-4">
      <h2 className="font-heading text-xl font-bold">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen(!open)}
          className="flex min-h-11 w-full items-center justify-between gap-2 text-left"
        >
          {recipe.name}
          <span aria-hidden="true">{open ? '−' : '+'}</span>
        </button>
      </h2>

      <p className="text-charcoal/75">
        Serves {recipe.serves} · {recipe.mealType.join(', ')}
        {!recipe.isBuiltin && ' · Your recipe'}
      </p>

      {(recipe.dietary.length > 0 || recipe.tags.length > 0) && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {recipe.dietary.map((tag) => (
            <li key={tag}>
              <DietaryBadge tag={tag} />
            </li>
          ))}
          {recipe.tags.map((tag) => (
            <li key={tag} className="rounded-full border-2 border-charcoal/40 px-2.5 py-0.5 text-sm">
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div id={detailsId} hidden={!open} className="mt-4">
        <h3 className="font-heading font-bold">Ingredients (serves {recipe.serves})</h3>
        <ul className="mt-1 list-disc pl-5">
          {recipe.ingredients.map((ingredient, i) => (
            <li key={i}>{formatIngredient(ingredient)}</li>
          ))}
        </ul>

        <h3 className="mt-4 font-heading font-bold">Method</h3>
        <p className="text-sm text-charcoal/75">Amounts in the steps are for {recipe.serves} people.</p>
        <ol className="mt-1 list-decimal space-y-1 pl-5">
          {recipe.method.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>

      {onAddToPlan && (
        <Button variant="secondary" className="mt-3" onClick={() => onAddToPlan(recipe)}>
          Add to plan
        </Button>
      )}
    </li>
  )
}

export default RecipeCard
