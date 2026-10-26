// The "Add recipe" form. Collects text fields as strings, turns them into a recipe,
// checks it with the SAME shared schema the server uses, and shows friendly messages.
// A blank quantity means "to taste"; unit "none / count" means a plain count (e.g. 4 sausages).
import { DIETARY_TAGS, MEAL_TYPES, RECIPE_TAGS, UNITS, newRecipeSchema } from '@nosh/shared'
import { Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { useCreateRecipe } from '../api/recipes'
import Button from './Button'
import CheckboxGroup from './CheckboxGroup'
import { errorClass, inputClass, labelClass } from './ui'

const emptyIngredient = () => ({ quantity: '', unit: '', item: '' })

// Blank rows are ignored, but errors must point at the row the user sees, so we remember
// each kept row's original position.
function buildRecipe(form) {
  const kept = form.ingredients
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.item.trim() || row.quantity.trim())
  const steps = form.method.map((text, index) => ({ text: text.trim(), index })).filter((s) => s.text)

  const recipe = {
    name: form.name,
    serves: Number(form.serves),
    mealType: form.mealType,
    dietary: form.dietary,
    tags: form.tags,
    ingredients: kept.map(({ row }) => ({
      item: row.item.trim(),
      quantity: row.quantity.trim() === '' ? null : Number(row.quantity),
      unit: row.unit === '' ? null : row.unit,
    })),
    method: steps.map((s) => s.text),
  }
  return { recipe, ingredientRows: kept.map((k) => k.index), stepRows: steps.map((s) => s.index) }
}

// issues: [{ path: 'ingredients.1.item', message }] -> { 'ingredients.<form row>.item': message }
function toFieldErrors(issues, { ingredientRows, stepRows }) {
  const errors = {}
  for (const { path, message } of issues) {
    const parts = path.split('.')
    if (parts[0] === 'ingredients' && parts[1] !== undefined) parts[1] = ingredientRows[parts[1]]
    if (parts[0] === 'method' && parts[1] !== undefined) parts[1] = stepRows[parts[1]]
    const key = parts.join('.')
    errors[key] ??= message // keep the first message per field
  }
  return errors
}

// initialMealType pre-ticks a meal (used when creating a recipe from a plan slot).
// intro is an optional line under the heading. onDone receives the saved recipe.
function AddRecipeForm({ onDone, onCancel, initialMealType, intro }) {
  const [form, setForm] = useState({
    name: '', serves: '2', mealType: initialMealType ? [initialMealType] : [], dietary: [], tags: [],
    ingredients: [emptyIngredient(), emptyIngredient(), emptyIngredient()],
    method: [''],
  })
  const [errors, setErrors] = useState({})
  const summaryRef = useRef(null)
  const createRecipe = useCreateRecipe()

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))
  const setRow = (field, index, value) =>
    set(field, form[field].map((row, i) => (i === index ? value : row)))
  const removeRow = (field, index) => set(field, form[field].filter((_, i) => i !== index))

  function showErrors(next) {
    setErrors(next)
    // Move focus to the summary so keyboard and screen-reader users hear what went wrong.
    setTimeout(() => summaryRef.current?.focus(), 0)
  }

  function handleSubmit(event) {
    event.preventDefault()
    const built = buildRecipe(form)
    const check = newRecipeSchema.safeParse(built.recipe)
    if (!check.success) {
      const issues = check.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
      return showErrors(toFieldErrors(issues, built))
    }
    createRecipe.mutate(check.data, {
      onSuccess: onDone,
      onError: (err) => showErrors({ ...toFieldErrors(err.details, built), form: err.message }),
    })
  }

  const errorList = Object.values(errors)

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Add your own recipe</h2>
        {intro && <p className="mt-1">{intro}</p>}
      </div>

      {errorList.length > 0 && (
        <div ref={summaryRef} tabIndex={-1} role="alert" className="rounded-xl border-2 border-red-800 p-3">
          <p className="font-bold">Nearly there! A few things to fix:</p>
          <ul className="list-disc pl-5">
            {errorList.map((message, i) => (
              <li key={i}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label htmlFor="recipe-name" className={labelClass}>Recipe name</label>
        <input id="recipe-name" className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} />
        {errors.name && <p className={errorClass}>{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="recipe-serves" className={labelClass}>Serves how many people?</label>
        <input
          id="recipe-serves" type="number" inputMode="numeric" min="1" className={`${inputClass} max-w-28`}
          value={form.serves} onChange={(e) => set('serves', e.target.value)}
        />
        {errors.serves && <p className={errorClass}>{errors.serves}</p>}
      </div>

      <CheckboxGroup legend="Which meals is it for?" options={MEAL_TYPES} selected={form.mealType}
        onChange={(v) => set('mealType', v)} error={errors.mealType} />
      <CheckboxGroup legend="Dietary labels (only tick what is true)" options={DIETARY_TAGS} selected={form.dietary}
        onChange={(v) => set('dietary', v)} />
      <CheckboxGroup legend="Tags" options={RECIPE_TAGS} selected={form.tags} onChange={(v) => set('tags', v)} />

      <fieldset>
        <legend className={labelClass}>Ingredients</legend>
        <p className="mb-2 text-sm text-charcoal/75">
          Leave the amount blank for things like salt and pepper ("to taste"). Choose "none / count" for items you
          count, like 4 sausages.
        </p>
        {errors.ingredients && <p className={errorClass}>{errors.ingredients}</p>}
        <ul className="space-y-4">
          {form.ingredients.map((row, i) => (
            <li key={i} className="space-y-2 rounded-xl border-2 border-charcoal/30 p-3">
              <div className="flex gap-2">
                <div className="w-24">
                  <label htmlFor={`qty-${i}`} className="sr-only">Ingredient {i + 1} amount</label>
                  <input id={`qty-${i}`} placeholder="Amount" inputMode="decimal" className={inputClass}
                    value={row.quantity} onChange={(e) => setRow('ingredients', i, { ...row, quantity: e.target.value })} />
                </div>
                <div className="flex-1">
                  <label htmlFor={`unit-${i}`} className="sr-only">Ingredient {i + 1} unit</label>
                  <select id={`unit-${i}`} className={inputClass} value={row.unit}
                    onChange={(e) => setRow('ingredients', i, { ...row, unit: e.target.value })}>
                    <option value="">none / count</option>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor={`item-${i}`} className="sr-only">Ingredient {i + 1} name</label>
                <input id={`item-${i}`} placeholder="Ingredient, e.g. carrots" className={inputClass}
                  value={row.item} onChange={(e) => setRow('ingredients', i, { ...row, item: e.target.value })} />
              </div>
              {(errors[`ingredients.${i}.item`] || errors[`ingredients.${i}.quantity`]) && (
                <p className={errorClass}>Ingredient {i + 1}: {errors[`ingredients.${i}.item`] ?? errors[`ingredients.${i}.quantity`]}</p>
              )}
              {form.ingredients.length > 1 && (
                <Button variant="secondary" className="text-sm" onClick={() => removeRow('ingredients', i)}>
                  Remove ingredient {i + 1}
                </Button>
              )}
            </li>
          ))}
        </ul>
        <Button variant="secondary" className="mt-3 inline-flex items-center gap-2" onClick={() => set('ingredients', [...form.ingredients, emptyIngredient()])}>
          <Plus size={18} aria-hidden="true" /> Add another ingredient
        </Button>
      </fieldset>

      <fieldset>
        <legend className={labelClass}>Method</legend>
        {errors.method && <p className={errorClass}>{errors.method}</p>}
        <ol className="space-y-3">
          {form.method.map((text, i) => (
            <li key={i}>
              <label htmlFor={`step-${i}`} className="mb-1 block text-sm font-semibold">Step {i + 1}</label>
              <textarea id={`step-${i}`} rows={2} className={`${inputClass} py-2`} value={text}
                onChange={(e) => setRow('method', i, e.target.value)} />
              {form.method.length > 1 && (
                <Button variant="secondary" className="mt-2 text-sm" onClick={() => removeRow('method', i)}>
                  Remove step {i + 1}
                </Button>
              )}
            </li>
          ))}
        </ol>
        <Button variant="secondary" className="mt-3 inline-flex items-center gap-2" onClick={() => set('method', [...form.method, ''])}>
          <Plus size={18} aria-hidden="true" /> Add another step
        </Button>
      </fieldset>

      <div className="flex gap-3">
        <Button type="submit" disabled={createRecipe.isPending}>
          {createRecipe.isPending ? 'Saving…' : 'Save recipe'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  )
}

export default AddRecipeForm
