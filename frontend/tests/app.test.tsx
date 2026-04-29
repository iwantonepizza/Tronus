import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '@/App'
import { useHeadToHeadStats, useOverviewStats } from '@/hooks/useStats'
import { renderWithProviders } from './renderWithProviders'

vi.mock('@/hooks/useStats', () => ({
  useOverviewStats: vi.fn(),
  useHeadToHeadStats: vi.fn(),
}))

const mockedUseOverviewStats = vi.mocked(useOverviewStats)
const mockedUseHeadToHeadStats = vi.mocked(useHeadToHeadStats)

describe('App', () => {
  beforeEach(() => {
    mockedUseHeadToHeadStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useHeadToHeadStats>)

    mockedUseOverviewStats.mockReturnValue({
      data: {
        nextMatch: {
          id: 77,
          scheduledAt: '2026-04-24T19:00:00Z',
          status: 'planned',
          mode: {
            slug: 'base-6p',
            name: 'Base 6P',
            minPlayers: 6,
            maxPlayers: 6,
          },
          deck: {
            slug: 'base',
            name: 'Base Deck',
          },
          createdBy: {
            id: 1,
            nickname: 'IronFist',
            favoriteFaction: 'lannister',
            currentAvatarUrl: null,
            dateJoined: '2026-04-22T00:00:00Z',
          },
          planningNote: 'Friday night war council.',
          participations: [],
          outcome: null,
          commentsCount: 0,
          votes: [],
        },
        recentMatches: [],
        totalMatches: 18,
        activePlayers: 9,
        mostPopularFaction: null,
        currentLeader: null,
        factionWinrates: [],
        topWinrate: [],
        funFacts: [
          {
            icon: 'Flame',
            title: 'Самая длинная партия',
            description: 'Nine rounds and a bruised table.',
          },
        ],
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useOverviewStats>)
  })

  it('renders the overview home page inside app shell', async () => {
    renderWithProviders(<App />, {
      authValue: {
        user: null,
        isAuthenticated: false,
        isBootstrapping: false,
        login: async () => {
          throw new Error('Not implemented in this test.')
        },
        logout: async () => {},
        register: async () => ({
          id: 1,
          status: 'pending_approval',
          auto_activated: false,
        }),
        refreshUser: async () => null,
      },
    })

    expect(await screen.findByText('Tronus сегодня')).toBeInTheDocument()
    expect((await screen.findAllByText(/Ближайшая партия/i)).length).toBeGreaterThan(0)
  })
})
