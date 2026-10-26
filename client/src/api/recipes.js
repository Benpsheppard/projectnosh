// Client-side access to the recipes API, as React Query hooks (useRecipes, useCreateRecipe).
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from './client'

// filters: { q, mealType, tags, suitable } -> /api/recipes?q=..&mealType=..&tag=..&suitable=true
function toQueryString({ q, mealType, tags = [], suitable }) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (mealType) params.set('mealType', mealType)
  tags.forEach((tag) => params.append('tag', tag))
  if (suitable) params.set('suitable', 'true')
  const text = params.toString()
  return text ? `?${text}` : ''
}

// options.enabled lets a page wait (e.g. until preferences have loaded) before asking.
export function useRecipes(filters = {}, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['recipes', filters],
    queryFn: () => request(`/api/recipes${toQueryString(filters)}`),
    enabled,
    placeholderData: keepPreviousData, // keep the old list on screen while a new search loads
  })
}

export function useCreateRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (recipe) => request('/api/recipes', { method: 'POST', body: JSON.stringify(recipe) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipes'] }),
  })
}
