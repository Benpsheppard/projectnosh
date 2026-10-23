// Bottom navigation with the three main tabs. Fixed to the bottom for easy thumb reach.
// The current tab is marked with aria-current and a thicker top border, not just colour.

const TABS = [
  { id: 'recipes', label: 'Recipes', icon: '🍲' },
  { id: 'plan', label: 'Plan', icon: '📅' },
  { id: 'shopping', label: 'Shopping list', icon: '🛒' },
]

function TabBar({ current, onChange }) {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 border-t-2 border-charcoal bg-white">
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
                <span aria-hidden="true">{tab.icon}</span>
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
