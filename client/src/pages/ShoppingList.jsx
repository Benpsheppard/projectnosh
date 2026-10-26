// Shopping list tab: everything the plan needs, added up, in two sections.
// "To buy" and "You've got it at home"; one tap on an item moves it between them.
// The list is worked out by the server from the plan each time, so it is always up to date.
import { CalendarDays } from 'lucide-react'
import { useSetAtHome, useShoppingList } from '../api/shoppingList'
import Button from '../components/Button'
import EstimateSummary from '../components/EstimateSummary'
import ShoppingItem from '../components/ShoppingItem'

function ShoppingList({ onNavigate, onOpenSettings }) {
  const { data: list, isPending, error } = useShoppingList()
  const setAtHome = useSetAtHome()
  // `line.itemKey` is the normalised name, so the choice sticks even if the plan changes.
  const toggle = (line, atHome) => setAtHome.mutate({ itemKey: line.itemKey, atHome })

  if (isPending) return <p>Loading your shopping list…</p>
  if (error) return <p role="alert">{error.message}</p>

  if (list.plannedMeals === 0) {
    return (
      <div className="space-y-4">
        <h2 className="font-heading text-2xl font-bold">Shopping list</h2>
        <div className="rounded-2xl border-2 border-dashed border-charcoal/40 p-6 text-center">
          <p className="font-bold">Nothing planned yet.</p>
          <p className="mb-3">Add a few meals to your week and your shopping list will appear here.</p>
          <Button variant="secondary" className="inline-flex items-center gap-2" onClick={() => onNavigate('plan')}>
            <CalendarDays aria-hidden="true" /> Go to your plan
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Shopping list</h2>
        <p className="text-charcoal/75">
          For {list.plannedMeals} planned {list.plannedMeals === 1 ? 'meal' : 'meals'}, scaled to the number of people on each.
        </p>
      </div>

      <EstimateSummary estimate={list.estimate} onOpenSettings={onOpenSettings} />

      {setAtHome.error && <p role="alert">{setAtHome.error.message}</p>}

      <section aria-labelledby="to-buy-title" className="space-y-3">
        <h3 id="to-buy-title" className="font-heading text-xl font-bold">To buy ({list.toBuy.length})</h3>
        {list.toBuy.length === 0 ? (
          <p className="rounded-xl bg-nosh-green/40 p-3 font-semibold">Nothing to buy. You've got it all at home.</p>
        ) : (
          <ul className="space-y-2">
            {list.toBuy.map((line) => (
              <ShoppingItem key={line.key} line={line} atHome={false} busy={setAtHome.isPending} onToggle={(l) => toggle(l, true)} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="at-home-title" className="space-y-3">
        <h3 id="at-home-title" className="font-heading text-xl font-bold">You've got it at home ({list.atHome.length})</h3>
        {list.atHome.length === 0 ? (
          <p className="text-charcoal/75">Tap "Got it" on anything already in your cupboards and it will move here.</p>
        ) : (
          <ul className="space-y-2">
            {list.atHome.map((line) => (
              <ShoppingItem key={line.key} line={line} atHome busy={setAtHome.isPending} onToggle={(l) => toggle(l, false)} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default ShoppingList
