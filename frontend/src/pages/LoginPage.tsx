import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('Введите корректный email.'),
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

    if (fieldName === 'email' || fieldName === 'password') {
      setError(fieldName, { message: issue.message })
    }
  }

  return null
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
      email: '',
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
            if (field === 'email' || field === 'password') {
              setError(field, { message: messages[0] })
            }
          }
          return
        }

        if (error.code === 'account_pending_approval') {
          setFormError('Аккаунт создан, но ещё ждёт подтверждения owner.')
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
      eyebrow="Session Auth"
      title="Вход в Tronus"
      description="Фронт работает через Django session + CSRF, без токенов в localStorage."
      footer={
        <p className="text-sm text-text-secondary">
          Нет аккаунта?{' '}
          <Link
            className="text-gold transition hover:text-gold-hover"
            to="/register"
          >
            Зарегистрироваться
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field>
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="friend@example.com"
            aria-invalid={errors.email ? 'true' : 'false'}
            {...register('email')}
          />
          <FieldError message={errors.email?.message} />
        </Field>

        <Field>
          <Label htmlFor="login-password">Пароль</Label>
          <Input
            id="login-password"
            type="password"
            placeholder="StrongPassword123!"
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

function AuthPageShell({
  children,
  description,
  eyebrow,
  footer,
  title,
}: {
  children: ReactNode
  description: string
  eyebrow: string
  footer?: ReactNode
  title: string
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16 md:px-10">
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
            <Tag>session cookie</Tag>
            <Tag>csrf protected</Tag>
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

function Field({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>
}

function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className="block font-mono text-xs uppercase tracking-[0.22em] text-text-secondary"
    />
  )
}

function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-2xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-gold"
    />
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-sm text-red-300">{message}</p>
}

function InlineMessage({
  message,
  tone,
}: {
  message: string | null
  tone: 'error' | 'success'
}) {
  if (message === null) {
    return null
  }

  const toneClass =
    tone === 'error'
      ? 'border-red-500/30 bg-red-500/10 text-red-200'
      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClass}`}>
      {message}
    </div>
  )
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-border-subtle bg-bg-elev2 px-4 py-2 font-mono text-xs text-text-secondary">
      {children}
    </span>
  )
}
