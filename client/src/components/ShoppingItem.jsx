// One row of the shopping list: what to get, how much, which recipes need it, and a one-tap button
// that moves it between "To buy" and "You've got it at home".
import { House, Undo2 } from 'lucide-react'
import Button from './Button'

function ShoppingItem({ line, atHome, onToggle, busy }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border-2 border-charcoal/30 p-3">
      <div className="min-w-0">
        <p className={`font-bold capitalize ${atHome ? 'text-charcoal/75' : ''}`}>{line.name}</p>
        <p className="font-semibold">{line.label}</p>
        <p className="text-sm text-charcoal/75">For {line.recipes.map((r) => r.name).join(', ')}</p>
      </div>
      <Button
        variant="secondary"
        disabled={busy}
        onClick={() => onToggle(line)}
        aria-label={`${atHome ? 'Need it' : 'Got it'}: ${line.name}`}
        className="inline-flex shrink-0 items-center gap-1 text-sm"
      >
        {atHome ? <Undo2 aria-hidden="true" size={18} /> : <House aria-hidden="true" size={18} />}
        {atHome ? 'Need it' : 'Got it'}
      </Button>
    </li>
  )
}

export default ShoppingItem
