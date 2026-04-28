import type { ReactElement, ReactNode } from 'react'
import { render } from '@testing-library/react'
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { AuthContext, type AuthContextValue } from '@/context/auth-context'

const defaultAuthValue: AuthContextValue = {
  user: {
    id: 1,
    username: 'ironfist',
    email: 'ironfist@example.com',
    is_active: true,
    nickname: 'IronFist',
    favorite_faction: 'lannister',
    bio: '',
    current_avatar: null,
    date_joined: '2026-04-22T00:00:00Z',
  },
  isAuthenticated: true,
  isBootstrapping: false,
  login: async () => {
    throw new Error('Not implemented in tests.')
  },
  logout: async () => {},
  register: async () => ({ id: 1, status: 'pending_approval' }),
  refreshUser: async () => null,
}

export function renderWithProviders(
  element: ReactElement,
  options?: {
    authValue?: Partial<AuthContextValue>
  },
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })

  const authValue: AuthContextValue = {
    ...defaultAuthValue,
    ...options?.authValue,
  }

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    )
  }

  return render(element, { wrapper: Wrapper })
}
