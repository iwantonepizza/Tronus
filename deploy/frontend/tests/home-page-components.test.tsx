import { fireEvent, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOverviewStats } from '@/hooks/useStats'
import { HomePage } from '@/pages/HomePage'
import { renderWithProviders } from './renderWithProviders'

vi.mock('@/hooks/useStats', () => ({
  useOverviewStats: vi.fn(),
}))

const mockedUseOverviewStats = vi.mocked(useOverviewStats)

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
          participations: [
            {
              id: 1,
              user: {
                id: 1,
                nickname: 'IronFist',
                favoriteFaction: 'lannister',
                currentAvatarUrl: null,
                dateJoined: '2026-04-22T00:00:00Z',
              },
              faction: 'lannister',
              place: null,
              castles: null,
              isWinner: false,
              notes: '',
            },
            {
              id: 2,
              user: {
                id: 2,
                nickname: 'NorthWind',
                favoriteFaction: 'stark',
                currentAvatarUrl: null,
                dateJoined: '2026-04-22T00:00:00Z',
              },
              faction: 'stark',
              place: null,
              castles: null,
              isWinner: false,
              notes: '',
            },
          ],
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
  })

  it('renders the next match hero and key overview sections', async () => {
    renderWithProviders(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: /Tronus сегодня/i }),
    ).toBeInTheDocument()
    expect((await screen.findAllByText(/Ближайшая партия/i)).length).toBeGreaterThan(0)
    expect(await screen.findByText(/Последние партии/i)).toBeInTheDocument()
    expect(await screen.findByText(/Фракции в метагейме/i)).toBeInTheDocument()
    expect(await screen.findByText(/Самая длинная партия/i)).toBeInTheDocument()
  })

  it('switches RSVP state in the hero block', async () => {
    renderWithProviders(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    const maybeButton = await screen.findByRole('button', {
      name: /Ответ на приглашение: Под вопросом/i,
    })
    const goingButton = await screen.findByRole('button', {
      name: /Ответ на приглашение: Я иду/i,
    })

    expect(goingButton).toHaveAttribute('aria-pressed', 'true')
    expect(maybeButton).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(maybeButton)

    expect(maybeButton).toHaveAttribute('aria-pressed', 'true')
    expect(goingButton).toHaveAttribute('aria-pressed', 'false')
  })
})
