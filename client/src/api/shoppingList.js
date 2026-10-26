// Client-side access to the shopping list API, as React Query hooks.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from './client'

// { plannedMeals, toBuy: [line], atHome: [line] }
export function useShoppingList() {
  return useQuery({ queryKey: ['shopping-list'], queryFn: () => request('/api/shopping-list') })
}

// Moves an ingredient between "to buy" and "got it at home" (matched by its normalised name).
export function useSetAtHome() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ itemKey, atHome }) =>
      request(`/api/shopping-list/home-items/${encodeURIComponent(itemKey)}`, { method: atHome ? 'PUT' : 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-list'] }),
  })
}
