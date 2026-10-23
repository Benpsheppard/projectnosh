// Root component. Currently a walking skeleton showing one recipe from the API; will become the tab layout.

import { useRecipes } from './api/recipes'

// Walking skeleton: proves client -> API -> SQLite works end to end.
// The real tabs replace this in the next phases.
function App() {
  const { data: recipes, isPending, error } = useRecipes()

  if (isPending) return <p className="p-4">Loading…</p>
  if (error) return <p className="p-4">{error.message}</p>

  const recipe = recipes[0]
  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="font-heading text-2xl font-bold">Nosh</h1>
      <article className="mt-4 rounded-xl bg-nosh-green p-4">
        <h2 className="font-heading text-xl font-bold">{recipe.name}</h2>
        <p>Serves {recipe.serves}</p>
      </article>
    </main>
  )
}

export default App
