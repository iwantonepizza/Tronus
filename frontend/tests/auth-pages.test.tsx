import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

const mockedUseAuth = vi.mocked(useAuth)

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
}

function renderWithRouter(element: ReactNode) {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={element} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/me" element={<div>Protected page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('auth pages', () => {
  beforeEach(() => {
    mockedUseAuth.mockReset()
    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isBootstrapping: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      refreshUser: vi.fn(),
    })
  })

  it('validates login email before submit', async () => {
    renderWithRouter(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'not-an-email' },
    })
    fireEvent.change(screen.getByLabelText('Пароль'), {
      target: { value: 'StrongPassword123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

    expect(
      await screen.findByText('Введите корректный email.'),
    ).toBeInTheDocument()
  })

  it('disables login button while request is in flight', async () => {
    const deferred = createDeferred<{
      id: number
      nickname: string
      email: string
      username: string
      is_active: boolean
      favorite_faction: null
      current_avatar: null
      date_joined: string
      bio: string
    }>()
    const loginMock = vi.fn(() => deferred.promise)

    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isBootstrapping: false,
      login: loginMock,
      logout: vi.fn(),
      register: vi.fn(),
      refreshUser: vi.fn(),
    })

    renderWithRouter(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'friend@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Пароль'), {
      target: { value: 'StrongPassword123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Входим…' })).toBeDisabled()
    })

    deferred.resolve({
      id: 1,
      nickname: 'IronFist',
      email: 'friend@example.com',
      username: 'friend@example.com',
      is_active: true,
      favorite_faction: null,
      current_avatar: null,
      date_joined: '2026-04-22T00:00:00Z',
      bio: '',
    })
  })

  it('shows backend pending approval error inline', async () => {
    const loginMock = vi.fn(async () => {
      throw new ApiError({
        code: 'account_pending_approval',
        message: 'This account is pending owner approval.',
        status: 403,
      })
    })

    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isBootstrapping: false,
      login: loginMock,
      logout: vi.fn(),
      register: vi.fn(),
      refreshUser: vi.fn(),
    })

    renderWithRouter(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'pending@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Пароль'), {
      target: { value: 'StrongPassword123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

    expect(
      await screen.findByText(
        'Аккаунт создан, но ещё ждёт подтверждения owner.',
      ),
    ).toBeInTheDocument()
  })
})
