// Client-side access to the weekly plan API, as React Query hooks.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from './client'

export function usePlan() {
  return useQuery({ queryKey: ['plan'], queryFn: () => request('/api/plan') })
}

// Sets (or replaces) the meal in a slot. Leave `servings` out to use the household size.
export function useSetPlanEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ day, slot, recipeId, servings }) =>
      request(`/api/plan/${day}/${slot}`, { method: 'PUT', body: JSON.stringify({ recipeId, servings }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plan'] }),
  })
}

export function useRemovePlanEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ day, slot }) => request(`/api/plan/${day}/${slot}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plan'] }),
  })
}
