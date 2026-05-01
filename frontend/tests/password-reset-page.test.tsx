import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { resetPassword } from '@/api/auth'
import { PasswordResetPage } from '@/pages/PasswordResetPage'

vi.mock('@/api/auth', async () => {
  const actual = await vi.importActual<typeof import('@/api/auth')>('@/api/auth')
  return {
    ...actual,
    resetPassword: vi.fn(),
  }
})

const mockedResetPassword = vi.mocked(resetPassword)

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/password-reset']}>
      <Routes>
        <Route path="/password-reset" element={<PasswordResetPage />} />
        <Route path="/login" element={<div>Вход в Tronus</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('password reset page', () => {
  beforeEach(() => {
    mockedResetPassword.mockReset()
  })

  it('validates password repeat before submit', async () => {
    renderPage()

    fireEvent.change(screen.getByLabelText('Почта'), {
      target: { value: 'ironfist@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Секретное слово'), {
      target: { value: 'lovecraft' },
    })
    fireEvent.change(screen.getByLabelText('Новый пароль'), {
      target: { value: 'NewStrongPassword123!' },
    })
    fireEvent.change(screen.getByLabelText('Повтор нового пароля'), {
      target: { value: 'WrongPassword123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Обновить пароль' }))

    expect(await screen.findByText('Пароли не совпадают.')).toBeInTheDocument()
  })

  it('submits password reset with email and shows success message', async () => {
    mockedResetPassword.mockResolvedValue({ status: 'password_reset' })

    renderPage()

    fireEvent.change(screen.getByLabelText('Почта'), {
      target: { value: 'ironfist@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Секретное слово'), {
      target: { value: 'lovecraft' },
    })
    fireEvent.change(screen.getByLabelText('Новый пароль'), {
      target: { value: 'NewStrongPassword123!' },
    })
    fireEvent.change(screen.getByLabelText('Повтор нового пароля'), {
      target: { value: 'NewStrongPassword123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Обновить пароль' }))

    await waitFor(() => {
      expect(mockedResetPassword).toHaveBeenCalledWith({
        email: 'ironfist@example.com',
        secret_word: 'lovecraft',
        new_password: 'NewStrongPassword123!',
        new_password_repeat: 'NewStrongPassword123!',
      })
    })

    expect(
      await screen.findByText('Пароль обновлён. Теперь можно войти с новым паролем.'),
    ).toBeInTheDocument()
  })

  it('shows backend validation message for invalid email or secret word', async () => {
    mockedResetPassword.mockRejectedValue(
      new ApiError({
        code: 'validation_error',
        message: 'Ошибка валидации.',
        status: 400,
        details: {
          email: ['Неверная почта или секретное слово.'],
        },
      }),
    )

    renderPage()

    fireEvent.change(screen.getByLabelText('Почта'), {
      target: { value: 'missing@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Секретное слово'), {
      target: { value: 'wrong-word' },
    })
    fireEvent.change(screen.getByLabelText('Новый пароль'), {
      target: { value: 'NewStrongPassword123!' },
    })
    fireEvent.change(screen.getByLabelText('Повтор нового пароля'), {
      target: { value: 'NewStrongPassword123!' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Обновить пароль' }))

    expect(
      await screen.findByText('Неверная почта или секретное слово.'),
    ).toBeInTheDocument()
  })
})
