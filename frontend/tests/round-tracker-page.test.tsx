import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { RoundTrackerPage } from '@/pages/RoundTrackerPage'
import { renderWithProviders } from './renderWithProviders'

const completeRoundMock = vi.fn()
const discardLastRoundMock = vi.fn()
const recordWildlingsRaidMock = vi.fn()
const recordClashOfKingsMock = vi.fn()

const sessionDetail = {
  id: 999,
  scheduledAt: '2026-04-29T18:00:00Z',
  status: 'in_progress' as const,
  mode: {
    slug: 'classic',
    name: 'Классика',
    minPlayers: 3,
    maxPlayers: 6,
  },
  deck: {
    slug: 'original',
    name: 'Base',
  },
  createdBy: {
    id: 1,
    nickname: 'IronFist',
    favoriteFaction: 'lannister' as const,
    currentAvatarUrl: null,
    dateJoined: '2026-04-20T10:00:00Z',
  },
  planningNote: 'Тестовый матч для трекера.',
  participations: [
    {
      id: 11,
      user: {
        id: 1,
        nickname: 'IronFist',
        favoriteFaction: 'lannister' as const,
        currentAvatarUrl: null,
        dateJoined: '2026-04-20T10:00:00Z',
      },
      faction: 'lannister' as const,
      place: null,
      castles: 4,
      isWinner: false,
      notes: '',
    },
    {
      id: 12,
      user: {
        id: 2,
        nickname: 'Kraken42',
        favoriteFaction: 'greyjoy' as const,
        currentAvatarUrl: null,
        dateJoined: '2026-04-20T10:00:00Z',
      },
      faction: 'greyjoy' as const,
      place: null,
      castles: 5,
      isWinner: false,
      notes: '',
    },
    {
      id: 13,
      user: {
        id: 3,
        nickname: 'DireWolf',
        favoriteFaction: 'stark' as const,
        currentAvatarUrl: null,
        dateJoined: '2026-04-20T10:00:00Z',
      },
      faction: 'stark' as const,
      place: null,
      castles: 3,
      isWinner: false,
      notes: '',
    },
  ],
  outcome: null,
  commentsCount: 0,
  votes: [],
}

const rounds = [
  {
    id: 201,
    round_number: 2,
    influence_throne: [12, 11, 13],
    influence_sword: [11, 12, 13],
    influence_court: [13, 11, 12],
    supply: {
      '11': 2,
      '12': 2,
      '13': 1,
    },
    castles: {
      '11': 4,
      '12': 5,
      '13': 3,
    },
    wildlings_threat: 6 as const,
    note: 'Тестовый второй раунд.',
    created_at: '2026-04-29T19:00:00Z',
  },
]

vi.mock('@/hooks/useSessions', () => ({
  useSessionDetail: () => ({
    data: sessionDetail,
    isLoading: false,
    isError: false,
  }),
  useRounds: () => ({
    data: rounds,
    isLoading: false,
    isError: false,
  }),
  useCompleteRound: () => ({
    isPending: false,
    mutateAsync: completeRoundMock,
  }),
  useDiscardLastRound: () => ({
    isPending: false,
    mutateAsync: discardLastRoundMock,
  }),
  useRecordWildlingsRaid: () => ({
    isPending: false,
    mutateAsync: recordWildlingsRaidMock,
  }),
  useRecordClashOfKings: () => ({
    isPending: false,
    mutateAsync: recordClashOfKingsMock,
  }),
}))

describe('round tracker page', () => {
  beforeEach(() => {
    completeRoundMock.mockReset()
    discardLastRoundMock.mockReset()
    recordWildlingsRaidMock.mockReset()
    recordClashOfKingsMock.mockReset()
    recordWildlingsRaidMock.mockResolvedValue({
      id: 501,
    })
    recordClashOfKingsMock.mockResolvedValue({
      id: 502,
    })
  })

  it('submits the wildlings raid wizard in three steps', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/matches/999/rounds']}>
        <Routes>
          <Route path="/matches/:id/rounds" element={<RoundTrackerPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { level: 1, name: /Трекер раундов/i }),
    ).toBeInTheDocument()

    const openWildlingsButton = screen
      .getAllByRole('button')
      .find((button) => button.textContent?.includes('Атака одичалых'))
    expect(openWildlingsButton).toBeDefined()
    fireEvent.click(openWildlingsButton!)

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/Шаг 1 из 3/i)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: /^Дальше$/i }))

    fireEvent.click(
      within(dialog).getByRole('button', { name: /Одичалые прорвались/i }),
    )
    fireEvent.click(within(dialog).getByRole('button', { name: /^Дальше$/i }))

    fireEvent.change(within(dialog).getByLabelText('Карта исхода'), {
      target: { value: 'horn' },
    })

    fireEvent.click(
      within(dialog).getByRole('button', { name: /Зафиксировать атаку/i }),
    )

    await waitFor(() => {
      expect(recordWildlingsRaidMock).toHaveBeenCalledWith({
        bids: [
          { participation_id: 11, amount: 0 },
          { participation_id: 12, amount: 0 },
          { participation_id: 13, amount: 0 },
        ],
        outcome: 'loss',
        outcome_card_slug: 'horn',
        wildlings_threat_after: 6,
      })
    })

    expect(
      await screen.findByText(
        /Атака одичалых зафиксирована в хронологии партии/i,
      ),
    ).toBeInTheDocument()
  })

  it('submits the clash of kings wizard across three tracks', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/matches/999/rounds']}>
        <Routes>
          <Route path="/matches/:id/rounds" element={<RoundTrackerPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { level: 1, name: /Трекер раундов/i }),
    ).toBeInTheDocument()

    const openClashButton = screen
      .getAllByRole('button')
      .find((button) => button.textContent?.includes('Битва королей'))
    expect(openClashButton).toBeDefined()
    fireEvent.click(openClashButton!)

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/Шаг 1 из 3/i)).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('button', { name: /^Дальше$/i }))
    fireEvent.click(within(dialog).getByRole('button', { name: /^Дальше$/i }))

    fireEvent.click(
      within(dialog).getByRole('button', { name: /Зафиксировать аукцион/i }),
    )

    await waitFor(() => {
      expect(recordClashOfKingsMock).toHaveBeenCalledWith({
        influence_throne: [
          { participation_id: 12, bid: 0, place: 1 },
          { participation_id: 11, bid: 0, place: 2 },
          { participation_id: 13, bid: 0, place: 3 },
        ],
        influence_sword: [
          { participation_id: 11, bid: 0, place: 1 },
          { participation_id: 12, bid: 0, place: 2 },
          { participation_id: 13, bid: 0, place: 3 },
        ],
        influence_court: [
          { participation_id: 13, bid: 0, place: 1 },
          { participation_id: 11, bid: 0, place: 2 },
          { participation_id: 12, bid: 0, place: 3 },
        ],
      })
    })

    expect(
      await screen.findByText(
        /Битва королей зафиксирована в хронологии партии/i,
      ),
    ).toBeInTheDocument()
  })
})
