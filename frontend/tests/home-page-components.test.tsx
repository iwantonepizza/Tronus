import { screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOverviewStats } from '@/hooks/useStats'
import {
  useInvites,
  useSelfInvite,
  useUpdateInvite,
  useWithdrawInvite,
} from '@/hooks/useSessions'
import { HomePage } from '@/pages/HomePage'
import { renderWithProviders } from './renderWithProviders'

vi.mock('@/hooks/useStats', () => ({
  useOverviewStats: vi.fn(),
}))

vi.mock('@/hooks/useSessions', () => ({
  useInvites: vi.fn(),
  useSelfInvite: vi.fn(),
  useUpdateInvite: vi.fn(),
  useWithdrawInvite: vi.fn(),
}))

const mockedUseOverviewStats = vi.mocked(useOverviewStats)
const mockedUseInvites = vi.mocked(useInvites)
const mockedUseSelfInvite = vi.mocked(useSelfInvite)
const mockedUseUpdateInvite = vi.mocked(useUpdateInvite)
const mockedUseWithdrawInvite = vi.mocked(useWithdrawInvite)

describe('HomePage overview screen', () => {
  beforeEach(() => {
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
        recentMatches: [
          {
            id: 11,
            scheduledAt: '2026-04-20T19:00:00Z',
            status: 'completed',
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
            planningNote: 'Recent match note.',
            participations: [],
            outcome: {
              roundsPlayed: 7,
              endReason: 'castles_7',
              mvp: null,
              finalNote: 'Clean finish.',
            },
            commentsCount: 2,
            votes: [],
          },
        ],
        totalMatches: 18,
        activePlayers: 9,
        mostPopularFaction: {
          faction: {
            slug: 'lannister',
            name: 'Lannister',
            color: '#9B2226',
            onPrimary: '#F5E6C8',
          },
          games: 12,
        },
        currentLeader: {
          user: {
            id: 1,
            nickname: 'IronFist',
            favoriteFaction: 'lannister',
            currentAvatarUrl: null,
            dateJoined: '2026-04-22T00:00:00Z',
          },
          wins: 7,
        },
        factionWinrates: [
          {
            faction: {
              slug: 'lannister',
              name: 'Lannister',
              color: '#9B2226',
              onPrimary: '#F5E6C8',
            },
            winrate: 0.58,
          },
        ],
        topWinrate: [
          {
            user: {
              id: 1,
              nickname: 'IronFist',
              favoriteFaction: 'lannister',
              currentAvatarUrl: null,
              dateJoined: '2026-04-22T00:00:00Z',
            },
            winrate: 0.73,
          },
        ],
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

    mockedUseInvites.mockReturnValue({
      data: [
        {
          id: 1001,
          user: {
            id: 1,
            nickname: 'IronFist',
            avatar_url: null,
          },
          rsvp_status: 'going',
          desired_faction: 'lannister',
          desired_faction_summary: {
            slug: 'lannister',
            display_name: 'Lannister',
            color: '#9B2226',
          },
          invited_by: null,
          created_at: '2026-04-22T00:00:00Z',
        },
        {
          id: 1002,
          user: {
            id: 2,
            nickname: 'NorthWind',
            avatar_url: null,
          },
          rsvp_status: 'declined',
          desired_faction: null,
          desired_faction_summary: null,
          invited_by: null,
          created_at: '2026-04-22T00:00:00Z',
        },
      ],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useInvites>)

    mockedUseSelfInvite.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof useSelfInvite>)
    mockedUseUpdateInvite.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof useUpdateInvite>)
    mockedUseWithdrawInvite.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof useWithdrawInvite>)
  })

  it('renders the next match hero and invite-based RSVP block', async () => {
    renderWithProviders(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: /Tronus сегодня/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Все игры в Игру престолов записываются!'),
    ).toBeInTheDocument()
    expect((await screen.findAllByText(/Ближайшая партия/i)).length).toBeGreaterThan(0)
    expect(await screen.findByText(/Участники и RSVP/i)).toBeInTheDocument()
    expect(await screen.findByText(/Участники \(1\)/i)).toBeInTheDocument()
    expect(await screen.findByText(/Не пойдут \(1\)/i)).toBeInTheDocument()
    expect(await screen.findByText(/Это вы/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Присоединиться/i })).not.toBeInTheDocument()
  })

  it('links the next match hero to the match detail page', async () => {
    renderWithProviders(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('link', { name: /Открыть ближайшую партию #77/i }),
    ).toHaveAttribute('href', '/matches/77')
    expect(screen.getByText('Открыть карточку партии')).toBeInTheDocument()
  })

  it('shows login CTA for guests instead of join button', async () => {
    renderWithProviders(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
      {
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
      },
    )

    expect(await screen.findByRole('link', { name: 'Войти' })).toHaveAttribute(
      'href',
      '/login',
    )
    expect(screen.queryByRole('button', { name: /Присоединиться/i })).not.toBeInTheDocument()
  })
})
