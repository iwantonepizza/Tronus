import { fireEvent, screen, waitFor, within } from '@testing-library/react'
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

  it('shows desktop shell and highlights current route', async () => {
    installMatchMedia(1280)
    window.history.pushState({}, '', '/matches')

    renderApp()

    expect(await screen.findByText('TRONUS')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()

    const matchesLink = screen.getByRole('link', { current: 'page' })
    expect(matchesLink).toHaveAttribute('href', '/matches')

    const createLink = screen
      .getAllByRole('link')
      .find((link) => link.getAttribute('href') === '/matches/new')

    expect(createLink).toBeDefined()
    expect(createLink).toHaveAttribute('href', '/matches/new')
  })

  it('opens the search palette and hides notifications for guests', async () => {
    installMatchMedia(1280)
    window.history.pushState({}, '', '/matches')

    renderApp()

    fireEvent.click(await screen.findByRole('button'))

    const paletteInput = screen.getAllByRole('textbox').at(-1)

    expect(paletteInput).toBeDefined()
    await waitFor(() => expect(paletteInput).toHaveFocus())
    expect(screen.queryByLabelText(/notifications/i)).not.toBeInTheDocument()
  })

  it('shows bottom navigation on mobile and hides desktop sidebar', async () => {
    installMatchMedia(390)
    window.history.pushState({}, '', '/leaderboard')

    renderApp()

    const navs = await screen.findAllByRole('navigation')
    expect(navs).toHaveLength(1)

    const mobileNav = navs[0]
    const links = within(mobileNav).getAllByRole('link')

    expect(links).toHaveLength(5)
    expect(within(mobileNav).getByRole('link', { current: 'page' })).toHaveAttribute(
      'href',
      '/leaderboard',
    )
  })
})
