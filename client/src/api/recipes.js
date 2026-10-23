import { useQuery } from '@tanstack/react-query'

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Something went wrong. Please try again.')
  return res.json()
}

export function useRecipes() {
  return useQuery({ queryKey: ['recipes'], queryFn: () => getJson('/api/recipes') })
}
