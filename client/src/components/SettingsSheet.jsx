// The Settings bottom sheet: dietary preferences and household size.
// Built on the native <dialog> element, which gives us focus trapping, the Esc key and a
// backdrop for free (good for accessibility, and no extra library).
import { DIETARY_TAGS, preferencesSchema } from '@nosh/shared'
import { Minus, Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { usePreferences, useSavePreferences } from '../api/preferences'
import Button from './Button'
import CheckboxGroup from './CheckboxGroup'
import { errorClass, inputClass, labelClass } from './ui'

// The form inside the sheet. It is only mounted while the sheet is open, so it
// starts from the saved values each time (cancelled edits are thrown away).
function SettingsForm({ saved, onClose }) {
  const [dietary, setDietary] = useState(saved.dietary)
  const [size, setSize] = useState(String(saved.householdSize))
  const [error, setError] = useState('')
  const save = useSavePreferences()

  const changeSize = (change) => setSize(String(Math.max(1, (Number(size) || 1) + change)))

  function handleSubmit(event) {
    event.preventDefault()
    const check = preferencesSchema.safeParse({ dietary, householdSize: Number(size) })
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
        <div className="flex items-center gap-2">
          <Button variant="secondary" aria-label="One fewer person" onClick={() => changeSize(-1)} className="!px-3">
            <Minus aria-hidden="true" />
          </Button>
          <input id="household-size" type="number" inputMode="numeric" min="1" max="20"
            className={`${inputClass} max-w-24 text-center`} value={size} onChange={(e) => setSize(e.target.value)} />
          <Button variant="secondary" aria-label="One more person" onClick={() => changeSize(1)} className="!px-3">
            <Plus aria-hidden="true" />
          </Button>
        </div>
        <p className="mt-1 text-sm text-charcoal/75">We use this to work out how much to buy.</p>
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
  const dialogRef = useRef(null)
  const { data: saved } = usePreferences()

  // Keep the native dialog in step with our `open` prop.
  useEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="settings-title"
      onClose={onClose} // fires when Esc closes the dialog
      onClick={(e) => e.target === dialogRef.current && onClose()} // tap the backdrop to close
      className="m-0 mt-auto w-full max-w-none rounded-t-2xl bg-white p-0 text-charcoal backdrop:bg-charcoal/60"
    >
      <div className="mx-auto max-h-[90vh] max-w-2xl overflow-y-auto p-5">
        <h2 id="settings-title" className="mb-4 font-heading text-2xl font-bold">Settings</h2>
        {open && saved && <SettingsForm saved={saved} onClose={onClose} />}
      </div>
    </dialog>
  )
}

export default SettingsSheet
