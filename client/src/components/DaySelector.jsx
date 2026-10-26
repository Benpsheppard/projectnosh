// Row of seven day buttons (Mon-Sun). A day that has meals shows a count badge, so the marker
// is a number, not just a colour. The chosen day is highlighted and uses aria-pressed.
// Screen readers hear the full name and meal count; the short name is only for the eye.
import { DAYS } from '@nosh/shared'

function DaySelector({ selected, mealCounts, onSelect }) {
  return (
    <div role="group" aria-label="Choose a day" className="grid grid-cols-7 gap-0.5">
      {DAYS.map((name, day) => {
        const count = mealCounts[day] ?? 0
        return (
          <button
            key={name}
            type="button"
            aria-pressed={day === selected}
            onClick={() => onSelect(day)}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 border-charcoal text-sm font-semibold ${
              day === selected ? 'bg-nosh-green font-bold' : 'bg-white'
            }`}
          >
            <span aria-hidden="true">{name.slice(0, 3)}</span>
            <span className="sr-only">
              {name}
              {count > 0 && `, ${count} ${count === 1 ? 'meal' : 'meals'} planned`}
            </span>
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
