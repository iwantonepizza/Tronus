import { screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useFactionStats,
  useFactionStatsList,
  useHeadToHeadStats,
  useSuggestedHeadToHeadOpponent,
  useLeaderboardStats,
  usePlayerStats,
} from '@/hooks/useStats'
import { FactionDetailPage } from '@/pages/FactionDetailPage'
import { FactionsPage } from '@/pages/FactionsPage'
import { HeadToHeadPage } from '@/pages/HeadToHeadPage'
import { LeaderboardPage } from '@/pages/LeaderboardPage'
import { PlayerProfilePage } from '@/pages/PlayerProfilePage'
import { useUsers } from '@/hooks/useUsers'
import { renderWithProviders } from './renderWithProviders'

vi.mock('@/hooks/useStats', () => ({
  usePlayerStats: vi.fn(),
  useLeaderboardStats: vi.fn(),
  useFactionStatsList: vi.fn(),
  useFactionStats: vi.fn(),
  useHeadToHeadStats: vi.fn(),
  useSuggestedHeadToHeadOpponent: vi.fn(),
}))

vi.mock('@/hooks/useUsers', () => ({
  useUsers: vi.fn(),
}))

const mockedUsePlayerStats = vi.mocked(usePlayerStats)
const mockedUseLeaderboardStats = vi.mocked(useLeaderboardStats)
const mockedUseFactionStatsList = vi.mocked(useFactionStatsList)
const mockedUseFactionStats = vi.mocked(useFactionStats)
const mockedUseHeadToHeadStats = vi.mocked(useHeadToHeadStats)
const mockedUseSuggestedHeadToHeadOpponent = vi.mocked(
  useSuggestedHeadToHeadOpponent,
)
const mockedUseUsers = vi.mocked(useUsers)

describe('stats pages', () => {
  beforeEach(() => {
    mockedUseUsers.mockReturnValue({
      data: [
        {
          id: 1,
          nickname: 'IronFist',
          favoriteFaction: 'lannister',
          currentAvatarUrl: null,
          dateJoined: '2026-04-22T00:00:00Z',
        },
        {
          id: 2,
          nickname: 'SeaWolf',
          favoriteFaction: 'greyjoy',
          currentAvatarUrl: null,
          dateJoined: '2026-04-22T00:00:00Z',
        },
      ],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useUsers>)

    mockedUsePlayerStats.mockReturnValue({
      data: {
        user: {
          id: 1,
          nickname: 'IronFist',
          favoriteFaction: 'lannister',
          currentAvatarUrl: null,
          dateJoined: '2026-04-22T00:00:00Z',
        },
        totalGames: 18,
        wins: 9,
        winrate: 0.5,
        avgPlace: 2.4,
        avgCastles: 4.2,
        favoriteFaction: 'lannister',
        bestFaction: { faction: 'lannister', winrate: 0.64 },
        worstFaction: { faction: 'stark', winrate: 0.33 },
        currentStreak: { type: 'win', count: 3 },
        last10: [
          { matchId: 77, place: 1, faction: 'lannister' },
          { matchId: 76, place: 3, faction: 'stark' },
        ],
        crownsReceived: 12,
        shitsReceived: 2,
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof usePlayerStats>)

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

    mockedUseFactionStatsList.mockReturnValue({
      data: [
        {
          faction: {
            slug: 'lannister',
            name: 'Lannister',
            color: '#9B2226',
            onPrimary: '#F5E6C8',
          },
          totalGames: 18,
          wins: 9,
          winrate: 0.5,
          avgPlace: 2.2,
          avgCastles: 4.1,
          byMode: [],
          topPlayers: [],
        },
      ],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useFactionStatsList>)

    mockedUseFactionStats.mockReturnValue({
      data: {
        faction: {
          slug: 'lannister',
          name: 'Lannister',
          color: '#9B2226',
          onPrimary: '#F5E6C8',
        },
        totalGames: 18,
        wins: 9,
        winrate: 0.5,
        avgPlace: 2.2,
        avgCastles: 4.1,
        byMode: [{ mode: 'Base 6P', winrate: 0.5, games: 18 }],
        topPlayers: [
          {
            user: {
              id: 1,
              nickname: 'IronFist',
              favoriteFaction: 'lannister',
              currentAvatarUrl: null,
              dateJoined: '2026-04-22T00:00:00Z',
            },
            winrate: 0.64,
            games: 11,
          },
        ],
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useFactionStats>)

    mockedUseHeadToHeadStats.mockReturnValue({
      data: {
        userA: {
          id: 1,
          nickname: 'IronFist',
          favoriteFaction: 'lannister',
          currentAvatarUrl: null,
          dateJoined: '2026-04-22T00:00:00Z',
        },
        userB: {
          id: 2,
          nickname: 'SeaWolf',
          favoriteFaction: 'greyjoy',
          currentAvatarUrl: null,
          dateJoined: '2026-04-22T00:00:00Z',
        },
        gamesTogether: 3,
        wins: { userA: 2, userB: 1 },
        higherPlace: { userA: 2, userB: 1 },
        favoriteFactions: { userA: 'lannister', userB: 'greyjoy' },
        matches: [
          {
            id: 77,
            scheduledAt: '2026-04-23T19:00:00Z',
            mode: {
              slug: 'base-6p',
              name: 'Base 6P',
              minPlayers: 6,
              maxPlayers: 6,
            },
            deck: { slug: 'base', name: 'Base Deck' },
            userA: {
              faction: 'lannister',
              place: 1,
              castles: 7,
              isWinner: true,
            },
            userB: {
              faction: 'greyjoy',
              place: 2,
              castles: 5,
              isWinner: false,
            },
          },
        ],
      },
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useHeadToHeadStats>)

    mockedUseSuggestedHeadToHeadOpponent.mockReturnValue({
      data: 2,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSuggestedHeadToHeadOpponent>)
  })

  it('renders player profile from stats hook data', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/players/1']}>
        <Routes>
          <Route path="/players/:id" element={<PlayerProfilePage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'IronFist' })).toBeInTheDocument()
    expect(screen.getByText('Получено корон')).toBeInTheDocument()
    expect(screen.getByText('Последние партии')).toBeInTheDocument()
  })

  it('renders leaderboard rows from stats hook data', async () => {
    renderWithProviders(
      <MemoryRouter>
        <LeaderboardPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: /Рейтинги сезона/i })).toBeInTheDocument()
    expect(screen.getByText('IronFist')).toBeInTheDocument()
    expect(screen.getByText('73%')).toBeInTheDocument()
  })

  it('renders factions overview and faction detail from stats hook data', async () => {
    renderWithProviders(
      <MemoryRouter>
        <FactionsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: /Карта меты/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Lannister' })).toBeInTheDocument()

    renderWithProviders(
      <MemoryRouter initialEntries={['/factions/lannister']}>
        <Routes>
          <Route path="/factions/:slug" element={<FactionDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Винрейт по режимам')).toBeInTheDocument()
    expect(screen.getByText('Лучшие игроки')).toBeInTheDocument()
    expect(screen.getAllByText('Lannister').length).toBeGreaterThan(0)
  })

  it('renders head-to-head comparison from stats hook data', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/h2h?user_a=1&user_b=2']}>
        <Routes>
          <Route path="/h2h" element={<HeadToHeadPage />} />
          <Route path="/matches/:id" element={<div>match</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: /Сравнение игроков/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Партий вместе')).toBeInTheDocument()
    expect(screen.getByText('Общие партии')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Партия #77' })).toBeInTheDocument()
  })
})
