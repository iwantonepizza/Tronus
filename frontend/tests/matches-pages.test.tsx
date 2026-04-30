import { fireEvent, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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

  it('shows RSVP loading state and allows creator to cancel a planned mock match', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    renderWithProviders(
      <MemoryRouter initialEntries={['/matches/201']}>
        <Routes>
          <Route path="/matches/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText(/Карточка партии/i)).toBeInTheDocument()

    expect(screen.getByText(/Загружаем приглашения/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Отменить партию/i }))

    expect(await screen.findByText('Партия отменена.')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Отменена')).toBeInTheDocument()
    })
  })

  it('renders timeline block with events for a completed match', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/matches/206']}>
        <Routes>
          <Route path="/matches/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    // Timeline section heading
    expect(await screen.findByText('Хронология партии')).toBeInTheDocument()

    // Known mock events for session 206
    expect(screen.getByText('Партия началась')).toBeInTheDocument()
    expect(screen.getByText('Атака одичалых')).toBeInTheDocument()
    expect(screen.getByText('Битва королей')).toBeInTheDocument()
    expect(screen.getByText('Партия финализирована')).toBeInTheDocument()
  })

  it('toggles chronicler messages in comment thread via localStorage', async () => {
    // Start with no persisted preference
    window.localStorage.removeItem('tronus.chat.hideChronicler')

    renderWithProviders(
      <MemoryRouter initialEntries={['/matches/206']}>
        <Routes>
          <Route path="/matches/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    // Session 206 has a chronicler comment (author: null) — toggle button must appear
    const toggleButton = await screen.findByText('Скрыть летописца')
    expect(toggleButton).toBeInTheDocument()

    // Chronicler message is visible before toggle
    expect(
      screen.getByText(
        /Летописец: партия завершена после девятого раунда/i,
      ),
    ).toBeInTheDocument()

    // Click to hide
    fireEvent.click(toggleButton)

    // Button label flips
    expect(screen.getByText('Показать летописца')).toBeInTheDocument()

    // Chronicler message hidden
    expect(
      screen.queryByText(
        /Летописец: партия завершена после девятого раунда/i,
      ),
    ).not.toBeInTheDocument()

    // localStorage persisted the preference
    expect(window.localStorage.getItem('tronus.chat.hideChronicler')).toBe('1')
  })
})
