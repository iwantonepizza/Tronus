import { fireEvent, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { CreateSessionPage } from '@/pages/CreateSessionPage'
import { EditSessionPage } from '@/pages/EditSessionPage'
import { FinalizeSessionPage } from '@/pages/FinalizeSessionPage'
import { MatchDetailPage } from '@/pages/MatchDetailPage'
import { renderWithProviders } from './renderWithProviders'

describe('session flow pages', () => {
  it('saves create-session mock flow into match detail', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/matches/new']}>
        <Routes>
          <Route path="/matches/new" element={<CreateSessionPage />} />
          <Route path="/matches/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /\+ IronFist/i }))
    fireEvent.click(screen.getByRole('button', { name: /\+ Kraken42/i }))
    fireEvent.click(screen.getByRole('button', { name: /Сохранить черновик/i }))

    expect(await screen.findByText(/Карточка партии/i)).toBeInTheDocument()
    expect(screen.getByText(/Вечерний стол без спешки/i)).toBeInTheDocument()
  })

  it('saves edit-session flow back into match detail', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/matches/201/edit']}>
        <Routes>
          <Route path="/matches/:id/edit" element={<EditSessionPage />} />
          <Route path="/matches/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(await screen.findByLabelText('Примечание к партии'), {
      target: { value: 'Обновили заметку для теста.' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Сохранить изменения/i }))

    expect(await screen.findByText(/Карточка партии/i)).toBeInTheDocument()
    expect(screen.getByText(/Обновили заметку для теста\./i)).toBeInTheDocument()
  })

  it('blocks finalize page for a planned session', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/matches/201/finalize']}>
        <Routes>
          <Route path="/matches/:id/finalize" element={<FinalizeSessionPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      await screen.findByText(/Финализировать можно только партию в статусе/i),
    ).toBeInTheDocument()
  })
})
