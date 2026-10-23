// Root component: the page header, the current tab's page, and the bottom tab bar.
// Tab state is plain component state; with three tabs a router would be extra weight.
import { useState } from 'react'
import Plan from './pages/Plan'
import Recipes from './pages/Recipes'
import ShoppingList from './pages/ShoppingList'
import TabBar from './components/TabBar'

const PAGES = { recipes: Recipes, plan: Plan, shopping: ShoppingList }

function App() {
  const [tab, setTab] = useState('recipes')
  const Page = PAGES[tab]

  return (
    <>
      <header className="bg-charcoal px-4 py-3">
        <p className="mx-auto max-w-2xl font-heading text-2xl font-bold text-nosh-green">Nosh</p>
      </header>
      {/* pb-24 leaves room so the fixed tab bar never covers the last card */}
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-4">
        <Page />
      </main>
      <TabBar current={tab} onChange={setTab} />
    </>
  )
}

export default App
