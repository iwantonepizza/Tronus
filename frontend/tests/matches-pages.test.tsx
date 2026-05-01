import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockMatches } from '@/mocks/data'
import { MatchDetailPage } from '@/pages/MatchDetailPage'
import { MatchesPage } from '@/pages/MatchesPage'
import { renderWithProviders } from './renderWithProviders'

describe('matches pages', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('filters matches by status and shows empty state when nothing matches', async () => {
    renderWithProviders(
      <MemoryRouter>
        <MatchesPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText(/Найдено матчей:/i)).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Отменены' })[0])
    expect(screen.getByText(/Найдено матчей: 2/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Поиск'), {
      target: { value: 'not-found-query' },
    })

    expect(screen.getByText(/Партий не найдено/i)).toBeInTheDocument()
  })

  it('applies mobile filters only after confirm and closes modal on apply/cancel', async () => {
    renderWithProviders(
      <MemoryRouter>
        <MatchesPage />
      </MemoryRouter>,
    )

    expect(
      await screen.findByText((content) => content.includes('Найдено матчей:')),
    ).toBeInTheDocument()
    expect(document.body.textContent).toContain(
      `Найдено матчей: ${mockMatches.length}`,
    )

    const openFiltersButton = screen
      .getAllByRole('button')
      .find((button) => button.textContent?.includes('Фильтры'))

    if (!openFiltersButton) {
      throw new Error('Open filters button not found')
    }

    fireEvent.click(openFiltersButton)

    const dialog = screen.getByRole('dialog')
    const cancelledButton = within(dialog)
      .getAllByRole('button')
      .find((button) => button.textContent?.includes('Отменены'))
    const cancelButton = within(dialog)
      .getAllByRole('button')
      .find((button) => button.textContent?.includes('Отмена'))

    if (!cancelledButton || !cancelButton) {
      throw new Error('Dialog buttons for cancel flow not found')
    }

    fireEvent.click(cancelledButton)
    fireEvent.click(cancelButton)

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()
    expect(document.body.textContent).toContain(
      `Найдено матчей: ${mockMatches.length}`,
    )

    fireEvent.click(openFiltersButton)

    const reopenedDialog = screen.getByRole('dialog')
    const reopenedCancelledButton = within(reopenedDialog)
      .getAllByRole('button')
      .find((button) => button.textContent?.includes('Отменены'))
    const applyButton = within(reopenedDialog)
      .getAllByRole('button')
      .find((button) => button.textContent?.includes('Применить'))

    if (!reopenedCancelledButton || !applyButton) {
      throw new Error('Dialog buttons for apply flow not found')
    }

    fireEvent.click(reopenedCancelledButton)
    fireEvent.click(applyButton)

    expect(
      screen.queryByRole('dialog'),
    ).not.toBeInTheDocument()
    expect(document.body.textContent).toContain('Найдено матчей: 2')
  })

  it('allows voting and posting a comment on match detail mock screen', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/matches/206']}>
        <Routes>
          <Route path="/matches/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/Итоговая таблица/i)).toBeInTheDocument()

    const crownButton = screen
      .getAllByLabelText('Голос корона')
      .find(
        (button) =>
          !button.hasAttribute('disabled') &&
          !button.className.includes('bg-gold/15'),
      )

    if (!crownButton) {
      throw new Error('Editable inactive crown button not found')
    }

    fireEvent.click(crownButton)
    expect(crownButton.className).toContain('bg-gold/15')

    fireEvent.change(screen.getByPlaceholderText('Напишите комментарий...'), {
      target: { value: 'Новый тестовый комментарий' },
    })
    fireEvent.click(screen.getByLabelText('Отправить комментарий'))

    expect(screen.getByText('Новый тестовый комментарий')).toBeInTheDocument()
  })

  it('shows invite roster instead of standings table and allows creator to cancel a planned mock match', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderWithProviders(
      <MemoryRouter initialEntries={['/matches/201']}>
        <Routes>
          <Route path="/matches/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/Карточка партии/i)).toBeInTheDocument()
    expect(await screen.findByText(/Участники \(4\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Не пойдут \(1\)/i)).toBeInTheDocument()
    expect(screen.queryByText(/Итоговая таблица/i)).not.toBeInTheDocument()
    expect(
      screen.getByText(/Турнирная таблица появится после старта партии/i),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Отменить партию/i }))

    expect(await screen.findByText('Партия отменена.')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Отменена')).toBeInTheDocument()
    })
  })

  it('renders cancelled match in read-only invite mode without share button', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/matches/204']}>
        <Routes>
          <Route path="/matches/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      await screen.findByText(/Партия отменена. Состав сохранён как справка/i),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Поделиться ссылкой/i }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/Итоговая таблица/i)).not.toBeInTheDocument()
  })

  it('hides planned and in-progress management buttons for a regular participant', async () => {
    const inProgressMatch = {
      ...mockMatches.find((match) => match.id === 201)!,
      status: 'in_progress' as const,
    }

    const regularUserAuth = {
      user: {
        id: 2,
        username: 'northwind',
        email: 'northwind@example.com',
        is_active: true,
        nickname: 'NorthWind',
        favorite_faction: 'stark' as const,
        bio: '',
        current_avatar: null,
        date_joined: '2026-04-22T00:00:00Z',
      },
      isAuthenticated: true,
      isBootstrapping: false,
      login: async () => {
        throw new Error('Not implemented in this test.')
      },
      logout: async () => {},
      register: async () => ({
        id: 2,
        status: 'pending_approval' as const,
        auto_activated: false,
      }),
      refreshUser: async () => null,
    }

    renderWithProviders(
      <MemoryRouter initialEntries={['/matches/201']}>
        <Routes>
          <Route path="/matches/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>,
      {
        authValue: regularUserAuth,
      },
    )

    expect(
      await screen.findByRole('heading', { level: 1, name: /Карточка партии/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Начать партию/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Редактировать/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Отменить партию/i }),
    ).not.toBeInTheDocument()

    renderWithProviders(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/matches/201',
            state: { match: inProgressMatch },
          },
        ]}
      >
        <Routes>
          <Route path="/matches/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>,
      {
        authValue: regularUserAuth,
      },
    )

    expect(await screen.findByText(/Итоговая таблица/i)).toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Трекер раундов/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Завершить/i }),
    ).not.toBeInTheDocument()
  })

  it('renders timeline block with events for a completed match', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/matches/206']}>
        <Routes>
          <Route path="/matches/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('Хронология партии')).toBeInTheDocument()
    expect(screen.getByText('Партия началась')).toBeInTheDocument()
    expect(screen.getByText('Атака одичалых')).toBeInTheDocument()
    expect(screen.getByText('Битва королей')).toBeInTheDocument()
    expect(screen.getByText('Партия финализирована')).toBeInTheDocument()
  })

  it('toggles chronicler messages in comment thread via localStorage', async () => {
    window.localStorage.removeItem('tronus.chat.hideChronicler')

    renderWithProviders(
      <MemoryRouter initialEntries={['/matches/206']}>
        <Routes>
          <Route path="/matches/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    const toggleButton = await screen.findByText('Скрыть летописца')
    expect(toggleButton).toBeInTheDocument()

    expect(
      screen.getByText(
        /Летописец: партия завершена после девятого раунда/i,
      ),
    ).toBeInTheDocument()

    fireEvent.click(toggleButton)

    expect(screen.getByText('Показать летописца')).toBeInTheDocument()
    expect(
      screen.queryByText(
        /Летописец: партия завершена после девятого раунда/i,
      ),
    ).not.toBeInTheDocument()
    expect(window.localStorage.getItem('tronus.chat.hideChronicler')).toBe('1')
  })
})
