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

function renderWithRouter(initialEntry = '/login') {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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

  it('validates login field before submit', async () => {
    renderWithRouter('/login')

    fireEvent.change(screen.getByLabelText('Пароль'), {
      target: { value: 'StrongPassword123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByText('Введите email или ник.')).toBeInTheDocument()
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

    renderWithRouter('/login')

    fireEvent.change(screen.getByLabelText('Почта или ник'), {
      target: { value: 'ironfist' },
    })
    fireEvent.change(screen.getByLabelText('Пароль'), {
      target: { value: 'StrongPassword123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Входим…' })).toBeDisabled()
    })

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        login: 'ironfist',
        password: 'StrongPassword123!',
      })
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

    renderWithRouter('/login')

    fireEvent.change(screen.getByLabelText('Почта или ник'), {
      target: { value: 'pending@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Пароль'), {
      target: { value: 'StrongPassword123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }))

    expect(
      await screen.findByText(
        'Аккаунт создан, но ещё ждёт подтверждения владельца.',
      ),
    ).toBeInTheDocument()
  })

  it('shows pending approval state after regular registration', async () => {
    const registerMock = vi.fn(async () => ({
      id: 1,
      status: 'pending_approval' as const,
      auto_activated: false,
    }))

    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isBootstrapping: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: registerMock,
      refreshUser: vi.fn(),
    })

    renderWithRouter('/register')

    fireEvent.change(screen.getByLabelText('Почта'), {
      target: { value: 'friend@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Ник'), {
      target: { value: 'IronFist' },
    })
    fireEvent.change(screen.getByLabelText('Пароль'), {
      target: { value: 'StrongPassword123!' },
    })
    fireEvent.change(screen.getByLabelText('Повтор пароля'), {
      target: { value: 'StrongPassword123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать заявку' }))

    expect(
      await screen.findByText(
        'Заявка отправлена. Теперь дождитесь подтверждения владельца и затем войдите.',
      ),
    ).toBeInTheDocument()
  })

  it('redirects to login after auto-activated registration', async () => {
    const registerMock = vi.fn(async () => ({
      id: 1,
      status: 'active' as const,
      auto_activated: true,
    }))

    mockedUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isBootstrapping: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: registerMock,
      refreshUser: vi.fn(),
    })

    renderWithRouter('/register')

    fireEvent.change(screen.getByLabelText('Почта'), {
      target: { value: 'friend@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Ник'), {
      target: { value: 'IronFist' },
    })
    fireEvent.change(screen.getByLabelText('Пароль'), {
      target: { value: 'StrongPassword123!' },
    })
    fireEvent.change(screen.getByLabelText('Повтор пароля'), {
      target: { value: 'StrongPassword123!' },
    })
    fireEvent.change(screen.getByLabelText('Секретное слово'), {
      target: { value: 'lovecraft' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать заявку' }))

    await waitFor(() => {
      expect(screen.getByText('Вход в Tronus')).toBeInTheDocument()
    })
  })

  it('validates password repeat on register page', async () => {
    renderWithRouter('/register')

    fireEvent.change(screen.getByLabelText('Почта'), {
      target: { value: 'friend@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Ник'), {
      target: { value: 'IronFist' },
    })
    fireEvent.change(screen.getByLabelText('Пароль'), {
      target: { value: 'StrongPassword123!' },
    })
    fireEvent.change(screen.getByLabelText('Повтор пароля'), {
      target: { value: 'WrongPassword123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Создать заявку' }))

    expect(await screen.findByText('Пароли не совпадают.')).toBeInTheDocument()
  })
})
