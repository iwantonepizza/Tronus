import { fireEvent, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { MatchDetailPage } from '@/pages/MatchDetailPage'
import { MatchesPage } from '@/pages/MatchesPage'
import { renderWithProviders } from './renderWithProviders'

describe('matches pages', () => {
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

    expect(await screen.findByText(/Result board/i)).toBeInTheDocument()

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
})
