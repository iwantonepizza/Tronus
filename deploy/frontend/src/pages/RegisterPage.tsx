import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { useAuth } from '@/hooks/useAuth'
import {
  Field,
  FieldError,
  Input,
  InlineMessage,
  Label,
  Tag,
} from '@/pages/authShared'

const registerSchema = z
  .object({
    email: z.string().email('Введите корректный email.'),
    password: z.string().min(8, 'Пароль должен быть не короче 8 символов.'),
    password_repeat: z.string().min(1, 'Повторите пароль.'),
    nickname: z
      .string()
      .trim()
      .min(3, 'Ник должен быть не короче 3 символов.')
      .max(64, 'Ник не должен быть длиннее 64 символов.'),
    secret_word: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.password_repeat) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password_repeat'],
        message: 'Пароли не совпадают.',
      })
    }
  })

type RegisterFormValues = z.infer<typeof registerSchema>

function mapValidationErrors(
  values: RegisterFormValues,
  setError: ReturnType<typeof useForm<RegisterFormValues>>['setError'],
) {
  const result = registerSchema.safeParse(values)

  if (result.success) {
    return result.data
  }

  for (const issue of result.error.issues) {
    const fieldName = issue.path[0]

    if (
      fieldName === 'email' ||
      fieldName === 'password' ||
      fieldName === 'password_repeat' ||
      fieldName === 'nickname' ||
      fieldName === 'secret_word'
    ) {
      setError(fieldName, { message: issue.message })
    }
  }

  return null
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingApproval, setPendingApproval] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      email: '',
      password: '',
      password_repeat: '',
      nickname: '',
      secret_word: '',
    },
  })

  async function onSubmit(rawValues: RegisterFormValues) {
    setFormError(null)

    const values = mapValidationErrors(rawValues, setError)

    if (values === null) {
      return
    }

    try {
      const response = await registerUser(values)

      if (response.auto_activated) {
        navigate('/login', { replace: true })
        return
      }

      setPendingApproval(true)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'validation_error' && error.details) {
          for (const [field, messages] of Object.entries(error.details)) {
            if (
              field === 'email' ||
              field === 'password' ||
              field === 'password_repeat' ||
              field === 'nickname' ||
              field === 'secret_word'
            ) {
              setError(field, { message: messages[0] })
            }
          }
          return
        }

        setFormError(error.message)
        return
      }

      setFormError('Не удалось отправить заявку. Попробуйте ещё раз.')
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-6xl items-center px-6 py-16 md:px-10">
      <section className="grid w-full gap-8 overflow-hidden rounded-[2rem] border border-border-subtle bg-bg-elev1/95 shadow-panel backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-glow px-8 py-10 md:px-10">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-gold/80">
            Ожидает подтверждения
          </p>
          <h1 className="mt-4 font-display text-4xl text-text-primary md:text-5xl">
            Регистрация игрока
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-text-secondary">
            Новый пользователь создаётся неактивным. Если указать верное секретное
            слово, аккаунт активируется сразу; иначе владелец подтвердит его позже.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Tag>email + ник</Tag>
            <Tag>повтор пароля</Tag>
            <Tag>секретное слово</Tag>
            <Tag>ошибки в форме</Tag>
          </div>
        </div>
        <div className="px-8 py-10 md:px-10">
          {pendingApproval ? (
            <div className="space-y-4">
              <InlineMessage
                message="Заявка отправлена. Теперь дождитесь подтверждения владельца и затем войдите."
                tone="success"
              />
              <Link
                to="/login"
                className="inline-flex rounded-2xl border border-border-subtle px-5 py-3 text-sm text-text-primary transition hover:border-gold hover:text-gold"
              >
                Перейти ко входу
              </Link>
            </div>
          ) : (
            <form
              className="space-y-5"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <Field>
                <Label htmlFor="register-email">Почта</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="friend@example.com"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  {...register('email')}
                />
                <FieldError message={errors.email?.message} />
              </Field>

              <Field>
                <Label htmlFor="register-nickname">Ник</Label>
                <Input
                  id="register-nickname"
                  type="text"
                  placeholder="Ваш ник"
                  aria-invalid={errors.nickname ? 'true' : 'false'}
                  {...register('nickname')}
                />
                <FieldError message={errors.nickname?.message} />
              </Field>

              <Field>
                <Label htmlFor="register-password">Пароль</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Придумайте пароль"
                  aria-invalid={errors.password ? 'true' : 'false'}
                  {...register('password')}
                />
                <FieldError message={errors.password?.message} />
              </Field>

              <Field>
                <Label htmlFor="register-password-repeat">Повтор пароля</Label>
                <Input
                  id="register-password-repeat"
                  type="password"
                  placeholder="Повторите пароль"
                  aria-invalid={errors.password_repeat ? 'true' : 'false'}
                  {...register('password_repeat')}
                />
                <FieldError message={errors.password_repeat?.message} />
              </Field>

              <Field>
                <Label htmlFor="register-secret-word">Секретное слово</Label>
                <Input
                  id="register-secret-word"
                  type="text"
                  placeholder="секретное слово (опционально)"
                  aria-invalid={errors.secret_word ? 'true' : 'false'}
                  {...register('secret_word')}
                />
                <FieldError message={errors.secret_word?.message} />
              </Field>

              <InlineMessage message={formError} tone="error" />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-gold px-5 py-3 font-semibold text-black transition hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Отправляем…' : 'Создать заявку'}
              </button>
            </form>
          )}

          <div className="mt-6">
            <p className="text-sm text-text-secondary">
              Уже есть аккаунт?{' '}
              <Link
                className="text-gold transition hover:text-gold-hover"
                to="/login"
              >
                Войти
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
