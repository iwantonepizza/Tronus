import { fireEvent, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { LAST_CREATE_STORAGE_KEY } from '@/lib/session-planner'
import { CreateSessionPage } from '@/pages/CreateSessionPage'
import { EditSessionPage } from '@/pages/EditSessionPage'
import { FinalizeSessionPage } from '@/pages/FinalizeSessionPage'
import { MatchDetailPage } from '@/pages/MatchDetailPage'
import { renderWithProviders } from './renderWithProviders'

describe('session flow pages', () => {
  beforeEach(() => {
    window.localStorage.removeItem(LAST_CREATE_STORAGE_KEY)
  })

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

  it('restores last mode and deck from localStorage on open', async () => {
    window.localStorage.setItem(
      LAST_CREATE_STORAGE_KEY,
      JSON.stringify({
        modeSlug: 'dance_with_dragons',
        deckSlug: 'alternative',
      }),
    )

    renderWithProviders(
      <MemoryRouter initialEntries={['/matches/new']}>
        <Routes>
          <Route path="/matches/new" element={<CreateSessionPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByRole('heading', { name: /Новая партия/i })

    const modeRow = screen.getAllByText('Режим').at(-1)?.closest('div')
    const deckRow = screen.getAllByText('Колода').at(-1)?.closest('div')

    expect(modeRow).toBeTruthy()
    expect(deckRow).toBeTruthy()
    expect(within(modeRow!).getByText('Танец с драконами')).toBeInTheDocument()
    expect(within(deckRow!).getByText('Alternative')).toBeInTheDocument()
  })

  it('stores the last chosen mode and deck after successful create flow', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/matches/new']}>
        <Routes>
          <Route path="/matches/new" element={<CreateSessionPage />} />
          <Route path="/matches/:id" element={<MatchDetailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /Танец с драконами/i }))
    fireEvent.click(screen.getByRole('button', { name: /^Alternative$/i }))
    fireEvent.click(screen.getByRole('button', { name: /\+ IronFist/i }))
    fireEvent.click(screen.getByRole('button', { name: /\+ Kraken42/i }))
    fireEvent.click(screen.getByRole('button', { name: /Сохранить черновик/i }))

    expect(await screen.findByText(/Карточка партии/i)).toBeInTheDocument()
    expect(
      JSON.parse(window.localStorage.getItem(LAST_CREATE_STORAGE_KEY) ?? 'null'),
    ).toEqual({
      modeSlug: 'dance_with_dragons',
      deckSlug: 'alternative',
    })
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
