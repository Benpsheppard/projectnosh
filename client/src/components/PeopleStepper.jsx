// A "number of people" field with big − and + buttons. Used for household size and planned servings.
// `value` is a string so people can clear the box while typing; callers validate on save.
import { Minus, Plus } from 'lucide-react'
import Button from './Button'
import { inputClass } from './ui'

function PeopleStepper({ id, value, onChange }) {
  const change = (amount) => onChange(String(Math.min(20, Math.max(1, (Number(value) || 1) + amount))))

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" aria-label="One fewer person" onClick={() => change(-1)} className="!px-3">
        <Minus aria-hidden="true" />
      </Button>
      <input id={id} type="number" inputMode="numeric" min="1" max="20"
        className={`${inputClass} max-w-24 text-center`} value={value} onChange={(e) => onChange(e.target.value)} />
      <Button variant="secondary" aria-label="One more person" onClick={() => change(1)} className="!px-3">
        <Plus aria-hidden="true" />
      </Button>
    </div>
  )
}

export default PeopleStepper
