// Bottom navigation with the three main tabs. Fixed to the bottom for easy thumb reach.
// The current tab is marked with aria-current and a bold label, not just colour.
// Icons come from lucide-react; they are decorative (the text label names each tab).
import { CalendarDays, ChefHat, ShoppingBasket } from 'lucide-react'

const TABS = [
  { id: 'recipes', label: 'Recipes', Icon: ChefHat },
  { id: 'plan', label: 'Plan', Icon: CalendarDays },
  { id: 'shopping', label: 'Shopping list', Icon: ShoppingBasket },
]

// pb-[env(safe-area-inset-bottom)] keeps the tabs clear of the iPhone home indicator.
function TabBar({ current, onChange }) {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 border-t-2 border-charcoal bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-2xl">
        {TABS.map((tab) => {
          const active = tab.id === current
          return (
            <li key={tab.id} className="flex-1">
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => onChange(tab.id)}
                className={`flex min-h-16 w-full flex-col items-center justify-center text-sm ${
                  active ? 'bg-nosh-green font-bold' : 'font-semibold'
                }`}
              >
                <tab.Icon aria-hidden="true" />
                {tab.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default TabBar
