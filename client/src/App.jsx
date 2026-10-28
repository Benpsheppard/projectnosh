// Root component: the page header (with the Settings button), the current tab's page, and the bottom tab bar.
// Tab state is plain component state; with three tabs a router would be extra weight.
// `dietaryFilterOn` lives here so it survives switching tabs.
import { Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import Plan from './pages/Plan'
import Recipes from './pages/Recipes'
import ShoppingList from './pages/ShoppingList'
import SettingsSheet from './components/SettingsSheet'
import TabBar from './components/TabBar'
// The Nosh wordmark, resized to about twice its display size so it stays light for older phones.
import brandName from './assets/brandName-header.png'

const PAGES = { recipes: Recipes, plan: Plan, shopping: ShoppingList }
const TITLES = { recipes: 'Recipes', plan: 'Plan', shopping: 'Shopping list' }

function App() {
  const [tab, setTab] = useState('recipes')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [dietaryFilterOn, setDietaryFilterOn] = useState(true)
  const Page = PAGES[tab]

  // Each tab is a new "page" to the user: update the browser title and start at the top.
  useEffect(() => {
    document.title = `${TITLES[tab]} | Nosh`
    window.scrollTo(0, 0)
  }, [tab])

  return (
    <>
      <header className="bg-charcoal px-4 py-1">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          {/* Still the page's <h1>: the image's alt text is what screen readers hear. Width and height
              match the image's shape, so the page does not jump while it loads. */}
          <h1>
            <img src={brandName} alt="Nosh" width="105" height="40" className="block h-10 w-auto" />
          </h1>
          <button
            type="button"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
            className="grid size-12 place-items-center text-coral focus-visible:outline-coral"
          >
            <Settings aria-hidden="true" />
          </button>
        </div>
      </header>
      {/* pb-24 leaves room so the fixed tab bar never covers the last card */}
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4">
        <Page dietaryFilterOn={dietaryFilterOn} onDietaryFilterChange={setDietaryFilterOn} onNavigate={setTab} onOpenSettings={() => setSettingsOpen(true)} />
      </main>
      <TabBar current={tab} onChange={setTab} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}

export default App
