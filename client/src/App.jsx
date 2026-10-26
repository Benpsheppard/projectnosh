// Root component: the page header (with the Settings button), the current tab's page, and the bottom tab bar.
// Tab state is plain component state; with three tabs a router would be extra weight.
// `dietaryFilterOn` lives here so it survives switching tabs.
import { Settings } from 'lucide-react'
import { useState } from 'react'
import Plan from './pages/Plan'
import Recipes from './pages/Recipes'
import ShoppingList from './pages/ShoppingList'
import SettingsSheet from './components/SettingsSheet'
import TabBar from './components/TabBar'

const PAGES = { recipes: Recipes, plan: Plan, shopping: ShoppingList }

function App() {
  const [tab, setTab] = useState('recipes')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [dietaryFilterOn, setDietaryFilterOn] = useState(true)
  const Page = PAGES[tab]

  return (
    <>
      <header className="bg-charcoal px-4 py-1">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <p className="font-heading text-2xl font-bold text-nosh-green">Nosh</p>
          <button
            type="button"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
            className="grid size-12 place-items-center text-nosh-green focus-visible:outline-nosh-green"
          >
            <Settings aria-hidden="true" />
          </button>
        </div>
      </header>
      {/* pb-24 leaves room so the fixed tab bar never covers the last card */}
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4">
        <Page dietaryFilterOn={dietaryFilterOn} onDietaryFilterChange={setDietaryFilterOn} />
      </main>
      <TabBar current={tab} onChange={setTab} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}

export default App
