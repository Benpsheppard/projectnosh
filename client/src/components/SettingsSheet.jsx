// The Settings bottom sheet: dietary preferences, household size and an optional weekly budget.
// Uses the shared Sheet (native <dialog>) for the frame.
import { DIETARY_TAGS, preferencesSchema } from '@nosh/shared'
import { useState } from 'react'
import { usePreferences, useSavePreferences } from '../api/preferences'
import Button from './Button'
import CheckboxGroup from './CheckboxGroup'
import PeopleStepper from './PeopleStepper'
import Sheet from './Sheet'
import { errorClass, inputClass, labelClass } from './ui'

// The form inside the sheet. The Sheet only mounts it while open, so it starts from the
// saved values each time.
function SettingsForm({ saved, onClose }) {
  const [dietary, setDietary] = useState(saved.dietary)
  const [size, setSize] = useState(String(saved.householdSize))
  // The budget is typed in pounds (e.g. "40" or "40.50") and saved as whole pence. Blank = no budget.
  const [budget, setBudget] = useState(saved.weeklyBudgetPence === null ? '' : (saved.weeklyBudgetPence / 100).toFixed(2))
  const [error, setError] = useState('')
  const save = useSavePreferences()

  function handleSubmit(event) {
    event.preventDefault()
    const budgetText = budget.trim().replace(/^£/, '')
    const weeklyBudgetPence = budgetText === '' ? null : Math.round(Number(budgetText) * 100)
    const check = preferencesSchema.safeParse({ dietary, householdSize: Number(size), weeklyBudgetPence })
    if (!check.success) return setError(check.error.issues[0].message)
    setError('')
    save.mutate(check.data, { onSuccess: onClose, onError: (err) => setError(err.message) })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <CheckboxGroup legend="Do you eat…" options={DIETARY_TAGS} selected={dietary} onChange={setDietary} />
      <p className="-mt-3 text-sm text-charcoal/75">
        We only show recipes that suit every box you tick. Vegan recipes also count as vegetarian and dairy-free.
      </p>

      <div>
        <label htmlFor="household-size" className={labelClass}>How many people are you cooking for?</label>
        <PeopleStepper id="household-size" value={size} onChange={setSize} />
        <p className="mt-1 text-sm text-charcoal/75">We use this to work out how much to buy.</p>
      </div>

      <div>
        <label htmlFor="weekly-budget" className={labelClass}>Weekly shopping budget (optional)</label>
        <div className="relative max-w-48">
          <span aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold">£</span>
          <input id="weekly-budget" inputMode="decimal" placeholder="e.g. 40" className={`${inputClass} pl-8`}
            value={budget} onChange={(e) => setBudget(e.target.value)} aria-describedby="weekly-budget-hint" />
        </div>
        <p id="weekly-budget-hint" className="mt-1 text-sm text-charcoal/75">
          We'll show how your shopping list compares. Leave it blank if you'd rather not set one.
        </p>
      </div>

      {error && <p role="alert" className={errorClass}>{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save'}</Button>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  )
}

function SettingsSheet({ open, onClose }) {
  const { data: saved } = usePreferences()

  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      {saved && <SettingsForm saved={saved} onClose={onClose} />}
    </Sheet>
  )
}

export default SettingsSheet
