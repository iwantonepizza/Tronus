import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import {
  Field,
  FieldError,
  InlineMessage,
  Input,
  Label,
  Tag,
} from '@/pages/authShared'

const loginSchema = z.object({
  login: z.string().trim().min(1, 'Введите email или ник.'),
  password: z.string().min(1, 'Введите пароль.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

function mapValidationErrors(
  values: LoginFormValues,
  setError: ReturnType<typeof useForm<LoginFormValues>>['setError'],
) {
  const result = loginSchema.safeParse(values)

  if (result.success) {
    return result.data
  }

  for (const issue of result.error.issues) {
    const fieldName = issue.path[0]

    if (fieldName === 'login' || fieldName === 'password') {
      setError(fieldName, { message: issue.message })
    }
  }

  return null
}

function AuthPageShell({
  children,
  description,
  eyebrow,
  footer,
  title,
}: {
  children: React.ReactNode
  description: string
  eyebrow: string
  footer?: React.ReactNode
  title: string
}) {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-6xl items-center px-6 py-16 md:px-10">
      <section className="grid w-full gap-8 overflow-hidden rounded-[2rem] border border-border-subtle bg-bg-elev1/95 shadow-panel backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-glow px-8 py-10 md:px-10">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-gold/80">
            {eyebrow}
          </p>
          <h1 className="mt-4 font-display text-4xl text-text-primary md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-text-secondary">
            {description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Tag>сессионная cookie</Tag>
            <Tag>защищено CSRF</Tag>
            <Tag>react-hook-form</Tag>
            <Tag>zod</Tag>
          </div>
        </div>
        <div className="px-8 py-10 md:px-10">
          {children}
          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </section>
    </main>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, login, user } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      login: '',
      password: '',
    },
  })

  const redirectTo =
    typeof location.state === 'object' &&
    location.state !== null &&
    'from' in location.state &&
    typeof location.state.from === 'object' &&
    location.state.from !== null &&
    'pathname' in location.state.from &&
    typeof location.state.from.pathname === 'string'
      ? location.state.from.pathname
      : '/me'

  if (isAuthenticated && user !== null) {
    return <Navigate to="/me" replace />
  }

  async function onSubmit(rawValues: LoginFormValues) {
    setFormError(null)

    const values = mapValidationErrors(rawValues, setError)
    if (values === null) {
      return
    }

    try {
      await login(values)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'validation_error' && error.details) {
          for (const [field, messages] of Object.entries(error.details)) {
            if (field === 'login' || field === 'password') {
              setError(field, { message: messages[0] })
            }
          }
          return
        }

        if (error.code === 'account_pending_approval') {
          setFormError('Аккаунт создан, но ещё ждёт подтверждения владельца.')
          return
        }

        setFormError(error.message)
        return
      }

      setFormError('Не удалось выполнить вход. Попробуйте ещё раз.')
    }
  }

  return (
    <AuthPageShell
      eyebrow="Сессионный вход"
      title="Вход в Tronus"
      description="Фронт работает через Django session + CSRF, без токенов в localStorage."
      footer={
        <div className="space-y-3 text-sm text-text-secondary">
          <p>
            Нет аккаунта?{' '}
            <Link
              className="text-gold transition hover:text-gold-hover"
              to="/register"
            >
              Зарегистрироваться
            </Link>
          </p>
          <p>
            <Link
              className="text-gold transition hover:text-gold-hover"
              to="/password-reset"
            >
              Забыли пароль?
            </Link>
          </p>
        </div>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field>
          <Label htmlFor="login-field">Почта или ник</Label>
          <Input
            id="login-field"
            type="text"
            placeholder="ваш_ник или you@example.com"
            aria-invalid={errors.login ? 'true' : 'false'}
            {...register('login')}
          />
          <FieldError message={errors.login?.message} />
        </Field>

        <Field>
          <Label htmlFor="login-password">Пароль</Label>
          <Input
            id="login-password"
            type="password"
            placeholder="Введите пароль"
            aria-invalid={errors.password ? 'true' : 'false'}
            {...register('password')}
          />
          <FieldError message={errors.password?.message} />
        </Field>

        <InlineMessage message={formError} tone="error" />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-gold px-5 py-3 font-semibold text-black transition hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Входим…' : 'Войти'}
        </button>
      </form>
    </AuthPageShell>
  )
}
