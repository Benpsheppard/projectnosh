// Client-side access to the preferences API (dietary tags + household size), as React Query hooks.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { request } from './client'

export function usePreferences() {
  return useQuery({ queryKey: ['preferences'], queryFn: () => request('/api/preferences') })
}

export function useSavePreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (prefs) => request('/api/preferences', { method: 'PUT', body: JSON.stringify(prefs) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] }) // the suitable list may have changed
    },
  })
}
