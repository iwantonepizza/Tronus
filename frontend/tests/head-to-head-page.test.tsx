import { screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useHeadToHeadStats,
  useSuggestedHeadToHeadOpponent,
} from '@/hooks/useStats'
import { useUsers } from '@/hooks/useUsers'
import { HeadToHeadPage } from '@/pages/HeadToHeadPage'
import { renderWithProviders } from './renderWithProviders'

vi.mock('@/hooks/useStats', () => ({
  useHeadToHeadStats: vi.fn(),
  useSuggestedHeadToHeadOpponent: vi.fn(),
}))

vi.mock('@/hooks/useUsers', () => ({
  useUsers: vi.fn(),
}))

const mockedUseHeadToHeadStats = vi.mocked(useHeadToHeadStats)
const mockedUseSuggestedHeadToHeadOpponent = vi.mocked(
  useSuggestedHeadToHeadOpponent,
)
const mockedUseUsers = vi.mocked(useUsers)

describe('head-to-head page', () => {
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
        wins: {
          userA: 2,
          userB: 1,
        },
        higherPlace: {
          userA: 2,
          userB: 1,
        },
        favoriteFactions: {
          userA: 'lannister',
          userB: 'greyjoy',
        },
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
            deck: {
              slug: 'base',
              name: 'Base Deck',
            },
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

  it('renders the comparison summary and shared matches', async () => {
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
    expect(screen.getByText(/Колода: Base Deck/i)).toBeInTheDocument()
    expect(screen.getAllByText('IronFist').length).toBeGreaterThan(0)
    expect(screen.getAllByText('SeaWolf').length).toBeGreaterThan(0)
  })

  it('shows empty state before two players are selected for guest', async () => {
    mockedUseSuggestedHeadToHeadOpponent.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useSuggestedHeadToHeadOpponent>)

    renderWithProviders(
      <MemoryRouter initialEntries={['/h2h']}>
        <Routes>
          <Route path="/h2h" element={<HeadToHeadPage />} />
        </Routes>
      </MemoryRouter>,
      {
        authValue: {
          user: null,
          isAuthenticated: false,
        },
      },
    )

    expect(
      await screen.findByText('Выберите двух разных игроков'),
    ).toBeInTheDocument()
  })

  it('auto-fills self as user_a and suggested opponent as user_b on first open', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/h2h']}>
        <Routes>
          <Route path="/h2h" element={<HeadToHeadPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(mockedUseHeadToHeadStats).toHaveBeenLastCalledWith(1, 2)
    })
  })
})
