import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { ApiError } from '@/api/client'
import { resetPassword } from '@/api/auth'
import {
  Field,
  FieldError,
  InlineMessage,
  Input,
  Label,
  Tag,
} from '@/pages/authShared'

const passwordResetSchema = z
  .object({
    email: z.string().trim().email('Введите корректный email.'),
    secret_word: z.string().trim().min(1, 'Введите секретное слово.'),
    new_password: z.string().min(8, 'Пароль должен быть не короче 8 символов.'),
    new_password_repeat: z.string().min(1, 'Повторите пароль.'),
  })
  .superRefine((values, ctx) => {
    if (values.new_password !== values.new_password_repeat) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['new_password_repeat'],
        message: 'Пароли не совпадают.',
      })
    }
  })

type PasswordResetFormValues = z.infer<typeof passwordResetSchema>

function mapValidationErrors(
  values: PasswordResetFormValues,
  setError: ReturnType<typeof useForm<PasswordResetFormValues>>['setError'],
) {
  const result = passwordResetSchema.safeParse(values)

  if (result.success) {
    return result.data
  }

  for (const issue of result.error.issues) {
    const fieldName = issue.path[0]

    if (
      fieldName === 'email' ||
      fieldName === 'secret_word' ||
      fieldName === 'new_password' ||
      fieldName === 'new_password_repeat'
    ) {
      setError(fieldName, { message: issue.message })
    }
  }

  return null
}

export function PasswordResetPage() {
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetFormValues>({
    defaultValues: {
      email: '',
      secret_word: '',
      new_password: '',
      new_password_repeat: '',
    },
  })

  async function onSubmit(rawValues: PasswordResetFormValues) {
    setFormError(null)
    setSuccessMessage(null)

    const values = mapValidationErrors(rawValues, setError)
    if (values === null) {
      return
    }

    try {
      await resetPassword(values)
      setSuccessMessage('Пароль обновлён. Теперь можно войти с новым паролем.')
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'validation_error' && error.details) {
          for (const [field, messages] of Object.entries(error.details)) {
            if (
              field === 'email' ||
              field === 'secret_word' ||
              field === 'new_password' ||
              field === 'new_password_repeat'
            ) {
              setError(field, { message: messages[0] })
            }
          }
          return
        }

        setFormError(error.message)
        return
      }

      setFormError('Не удалось обновить пароль. Попробуйте ещё раз.')
    }
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-6xl items-center px-6 py-16 md:px-10">
      <section className="grid w-full gap-8 overflow-hidden rounded-[2rem] border border-border-subtle bg-bg-elev1/95 shadow-panel backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-glow px-8 py-10 md:px-10">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-gold/80">
            Сброс по секретному слову
          </p>
          <h1 className="mt-4 font-display text-4xl text-text-primary md:text-5xl">
            Восстановление пароля
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-text-secondary">
            Введите email, секретное слово и новый пароль. Сброс доступен только
            для подтверждённой почты аккаунта.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Tag>email</Tag>
            <Tag>секретное слово</Tag>
            <Tag>повтор пароля</Tag>
            <Tag>ошибки в форме</Tag>
          </div>
        </div>
        <div className="px-8 py-10 md:px-10">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Field>
              <Label htmlFor="password-reset-email">Почта</Label>
              <Input
                id="password-reset-email"
                type="email"
                placeholder="you@example.com"
                aria-invalid={errors.email ? 'true' : 'false'}
                {...register('email')}
              />
              <FieldError message={errors.email?.message} />
            </Field>

            <Field>
              <Label htmlFor="password-reset-secret-word">Секретное слово</Label>
              <Input
                id="password-reset-secret-word"
                type="text"
                placeholder=""
                aria-invalid={errors.secret_word ? 'true' : 'false'}
                {...register('secret_word')}
              />
              <FieldError message={errors.secret_word?.message} />
              {!errors.secret_word ? (
                <p className="text-sm text-text-tertiary">
                  Секретное слово сообщит администратор.
                </p>
              ) : null}
            </Field>

            <Field>
              <Label htmlFor="password-reset-new-password">Новый пароль</Label>
              <Input
                id="password-reset-new-password"
                type="password"
                placeholder="Новый пароль"
                aria-invalid={errors.new_password ? 'true' : 'false'}
                {...register('new_password')}
              />
              <FieldError message={errors.new_password?.message} />
            </Field>

            <Field>
              <Label htmlFor="password-reset-new-password-repeat">
                Повтор нового пароля
              </Label>
              <Input
                id="password-reset-new-password-repeat"
                type="password"
                placeholder="Повторите новый пароль"
                aria-invalid={errors.new_password_repeat ? 'true' : 'false'}
                {...register('new_password_repeat')}
              />
              <FieldError message={errors.new_password_repeat?.message} />
            </Field>

            <InlineMessage message={formError} tone="error" />
            <InlineMessage message={successMessage} tone="success" />

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-gold px-5 py-3 font-semibold text-black transition hover:bg-gold-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Обновляем…' : 'Обновить пароль'}
            </button>
          </form>

          <div className="mt-6">
            <p className="text-sm text-text-secondary">
              <Link
                className="text-gold transition hover:text-gold-hover"
                to="/login"
              >
                Вернуться ко входу
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
