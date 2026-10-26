// Row of seven day buttons (Mon-Sun). A day that has meals shows a count badge, so the marker
// is a number, not just a colour. The chosen day is highlighted and uses aria-pressed.
import { DAYS } from '@nosh/shared'

function DaySelector({ selected, mealCounts, onSelect }) {
  return (
    <div role="group" aria-label="Choose a day" className="grid grid-cols-7 gap-1">
      {DAYS.map((name, day) => {
        const count = mealCounts[day] ?? 0
        return (
          <button
            key={name}
            type="button"
            aria-pressed={day === selected}
            aria-label={count > 0 ? `${name}, ${count} ${count === 1 ? 'meal' : 'meals'} planned` : name}
            onClick={() => onSelect(day)}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 border-charcoal text-sm font-semibold ${
              day === selected ? 'bg-nosh-green font-bold' : 'bg-white'
            }`}
          >
            {name.slice(0, 3)}
            <span aria-hidden="true" className={`grid size-5 place-items-center rounded-full text-xs ${count > 0 ? 'bg-charcoal text-white' : ''}`}>
              {count > 0 ? count : ''}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export default DaySelector
