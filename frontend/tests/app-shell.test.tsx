import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { useLeaderboardStats } from '@/hooks/useStats'
import { renderWithProviders } from './renderWithProviders'

vi.mock('@/hooks/useStats', () => ({
  useLeaderboardStats: vi.fn(),
}))

const mockedUseLeaderboardStats = vi.mocked(useLeaderboardStats)

function installMatchMedia(width: number) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => {
      const minWidthMatch = /\(min-width:\s*(\d+)px\)/.exec(query)
      const maxWidthMatch = /\(max-width:\s*(\d+)px\)/.exec(query)

      let matches = false

      if (minWidthMatch) {
        matches = width >= Number(minWidthMatch[1])
      }

      if (maxWidthMatch) {
        matches = width <= Number(maxWidthMatch[1])
      }

      return {
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }
    }),
  })
}

function renderApp() {
  return renderWithProviders(<App />, {
    authValue: {
      user: null,
      isAuthenticated: false,
      isBootstrapping: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      refreshUser: vi.fn(),
    },
  })
}

describe('app shell', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/')
    mockedUseLeaderboardStats.mockReturnValue({
      data: {
        metric: 'winrate',
        label: 'Winrate',
        results: [
          {
            rank: 1,
            user: {
              id: 1,
              nickname: 'IronFist',
              favoriteFaction: 'lannister',
              currentAvatarUrl: null,
              dateJoined: '2026-04-22T00:00:00Z',
            },
            games: 18,
            metricValue: 0.73,
          },
        ],
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useLeaderboardStats>)
  })

  it('shows sidebar on desktop and highlights current route', async () => {
    installMatchMedia(1280)
    window.history.pushState({}, '', '/matches')

    renderApp()

    expect(await screen.findByText(/Лента партий/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Новая партия/i).length).toBeGreaterThan(0)
    expect(
      screen.queryByRole('link', { name: /Главная/i }),
    ).not.toBeInTheDocument()

    const activeLink = screen.getByRole('link', { name: /Партии/i })
    expect(activeLink).toHaveAttribute('aria-current', 'page')
  })

  it('shows explicit stubs for search and notifications actions', async () => {
    installMatchMedia(1280)
    window.history.pushState({}, '', '/matches')

    renderApp()

    expect(await screen.findByText(/Лента партий/i)).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: /Поиск по партии и игрокам/i }),
    )
    expect(screen.getByText('Поиск скоро будет.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Уведомления' }))
    expect(screen.getByText('Уведомления скоро будут.')).toBeInTheDocument()
  })

  it('shows bottom navigation on mobile and hides sidebar', async () => {
    installMatchMedia(390)
    window.history.pushState({}, '', '/leaderboard')

    renderApp()

    expect(await screen.findByText('Рейтинги сезона')).toBeInTheDocument()
    const mobileNav = screen.getByRole('navigation')

    expect(
      within(mobileNav).getByRole('link', { name: /^Обзор$/i }),
    ).toBeInTheDocument()
    expect(
      within(mobileNav).getByRole('link', { name: /^Я$/i }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Новая партия/i)).not.toBeInTheDocument()
  })
})
