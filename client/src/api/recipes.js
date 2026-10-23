// Client-side access to the recipes API, as React Query hooks (useRecipes, useCreateRecipe).
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from './client'

// filters: { q, mealType, tags } -> /api/recipes?q=..&mealType=..&tag=..&tag=..
function toQueryString({ q, mealType, tags = [] }) {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (mealType) params.set('mealType', mealType)
  tags.forEach((tag) => params.append('tag', tag))
  const text = params.toString()
  return text ? `?${text}` : ''
}

export function useRecipes(filters = {}) {
  return useQuery({
    queryKey: ['recipes', filters],
    queryFn: () => request(`/api/recipes${toQueryString(filters)}`),
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
