import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

import { isApiError } from '../../shared/api/httpClient'
import { AuthProvider } from './AuthProvider'

export function shouldRetryQuery(failureCount: number, error: unknown) {
  if (isApiError(error) && error.status === 429) return false
  return failureCount < 1
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: shouldRetryQuery,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}
