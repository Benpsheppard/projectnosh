// A toggle chip used for filters. `aria-pressed` tells screen readers it is on/off,
// and the selected chip also shows a tick, so state never relies on colour alone.

import { Check } from 'lucide-react'

function FilterChip({ label, selected, onToggle }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`inline-flex min-h-11 items-center gap-1 rounded-full border-2 border-charcoal px-4 text-sm font-semibold ${
        selected ? 'bg-nosh-green' : 'bg-white'
      }`}
    >
      {selected && <Check size={16} aria-hidden="true" />}
      {label}
    </button>
  )
}

export default FilterChip
