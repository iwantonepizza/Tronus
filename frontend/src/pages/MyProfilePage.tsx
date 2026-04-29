import { useState } from 'react'
import { Camera, LogOut, Save, Shield, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { changePassword } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/hooks/useAuth'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useUpdateMyProfile } from '@/hooks/useProfile'
import { useReferenceData } from '@/hooks/useReferenceData'
import type { PrivateUser } from '@/api/types'
import type { FactionSlug } from '@/types/domain'

export function MyProfilePage() {
  const { logout } = useAuth()
  const { data: user, isLoading } = useCurrentUser()
  const referenceQuery = useReferenceData()

  if (isLoading) {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <p className="font-display text-3xl text-text-primary">
            Загружаем профиль...
          </p>
        </section>
      </main>
    )
  }

  if (referenceQuery.isLoading) {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <p className="font-display text-3xl text-text-primary">
            Загружаем настройки профиля...
          </p>
        </section>
      </main>
    )
  }

  if (user === null) {
    return null
  }

  if (referenceQuery.isError || !referenceQuery.data) {
    return (
      <EmptyState
        icon={<Shield className="h-5 w-5" />}
        title="Настройки профиля недоступны"
        description="Фронт не смог загрузить справочники, нужные для редактирования профиля."
      />
    )
  }

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-border-subtle bg-[radial-gradient(circle_at_top_left,_rgba(201,164,76,0.16),_transparent_34%),linear-gradient(135deg,_rgba(23,23,31,1),_rgba(14,14,18,0.98))] p-6 shadow-panel">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-gold/80">
          Мой профиль
        </p>
        <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-4xl text-text-primary md:text-5xl">
              {user.nickname}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">
              Закрытая страница профиля. Здесь можно менять ник, био, любимую
              фракцию и сразу переходить в мастерскую аватаров.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => void logout()}
              iconLeft={<LogOut className="h-4 w-4" />}
            >
              Выйти
            </Button>
            <Link
              to="/me/avatar"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gold px-4 text-sm font-semibold text-black transition hover:bg-gold-hover"
            >
              <Camera className="h-4 w-4" />
              Мастерская аватаров
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <div className="flex items-center gap-4">
            <AvatarPreview nickname={user.nickname} src={user.current_avatar} />
            <div>
              <p className="font-display text-3xl text-text-primary">
                {user.nickname}
              </p>
              <p className="mt-2 text-sm text-text-secondary">{user.email}</p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4">
            <ProfileCard label="Логин" value={user.username} />
            <ProfileCard label="Почта" value={user.email} />
            <ProfileCard
              label="Любимая фракция"
              value={user.favorite_faction ?? 'не выбрана'}
            />
          </dl>
        </section>

        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <ProfileSettingsForm
            key={`${user.id}:${user.nickname}:${user.favorite_faction ?? 'none'}:${user.bio}`}
            user={user}
            factionOptions={referenceQuery.data.factions.map((faction) => ({
              label: faction.name,
              value: faction.slug,
            }))}
          />
        </section>
      </div>

      <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
        <ChangePasswordForm />
      </section>
    </main>
  )
}

function AvatarPreview({ nickname, src }: { nickname: string; src: string | null }) {
  if (src) {
    return (
      <img
        src={src}
        alt={`Аватар игрока ${nickname}`}
        className="h-24 w-24 rounded-[1.75rem] border border-border-subtle object-cover"
      />
    )
  }

  return (
    <div className="inline-flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-border-subtle bg-bg-base font-display text-3xl text-gold">
      {nickname.slice(0, 2).toUpperCase()}
    </div>
  )
}

function ProfileCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-base p-4">
      <dt className="font-mono text-xs uppercase tracking-[0.22em] text-text-secondary">
        {label}
      </dt>
      <dd className="mt-3 text-lg text-text-primary">{value}</dd>
    </div>
  )
}

function ProfileSettingsForm({
  user,
  factionOptions,
}: {
  user: PrivateUser
  factionOptions: Array<{ label: string; value: FactionSlug }>
}) {
  const updateProfileMutation = useUpdateMyProfile()
  const [nickname, setNickname] = useState(user.nickname)
  const [bio, setBio] = useState(user.bio)
  const [favoriteFaction, setFavoriteFaction] = useState<FactionSlug | ''>(
    user.favorite_faction ?? '',
  )
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)

  const formError =
    updateProfileMutation.error instanceof Error
      ? updateProfileMutation.error.message
      : null

  return (
    <>
      <div className="flex items-center gap-3">
        <UserRound className="h-5 w-5 text-gold" />
        <h2 className="font-display text-3xl text-text-primary">
          Настройки профиля
        </h2>
      </div>

      <form
        className="mt-6 space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          setFeedbackMessage(null)

          void updateProfileMutation
            .mutateAsync({
              nickname: nickname.trim(),
              bio,
              favorite_faction: favoriteFaction === '' ? null : favoriteFaction,
            })
            .then(() => {
              setFeedbackMessage('Профиль обновлён.')
            })
        }}
      >
        <Input
          label="Ник"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
        />

        <Select
          label="Любимая фракция"
          value={favoriteFaction}
          onChange={(event) =>
            setFavoriteFaction(event.target.value as FactionSlug | '')
          }
          options={[{ label: 'Не выбрана', value: '' }, ...factionOptions]}
        />

        <label className="block space-y-2">
          <span className="block font-mono text-xs uppercase tracking-[0.22em] text-text-secondary">
            О себе
          </span>
          <textarea
            aria-label="О себе"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-gold"
            placeholder="Короткая заметка о себе для закрытой группы."
          />
        </label>

        {formError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {formError}
          </div>
        ) : null}

        {feedbackMessage ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {feedbackMessage}
          </div>
        ) : null}

        <Button
          type="submit"
          iconLeft={<Save className="h-4 w-4" />}
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? 'Сохраняем...' : 'Сохранить профиль'}
        </Button>
      </form>
    </>
  )
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordRepeat, setNewPasswordRepeat] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <>
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-gold" />
        <h2 className="font-display text-3xl text-text-primary">
          Смена пароля
        </h2>
      </div>

      <form
        className="mt-6 space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          setFormError(null)
          setSuccessMessage(null)
          setFieldErrors({})

          if (newPassword !== newPasswordRepeat) {
            setFieldErrors({
              new_password_repeat: 'Пароли не совпадают.',
            })
            return
          }

          setIsSubmitting(true)

          void changePassword({
            current_password: currentPassword,
            new_password: newPassword,
            new_password_repeat: newPasswordRepeat,
          })
            .then(() => {
              setSuccessMessage('Пароль изменён.')
              setCurrentPassword('')
              setNewPassword('')
              setNewPasswordRepeat('')
            })
            .catch((error: unknown) => {
              if (error instanceof ApiError) {
                if (error.code === 'validation_error' && error.details) {
                  const nextFieldErrors: Record<string, string> = {}

                  for (const [field, messages] of Object.entries(error.details)) {
                    nextFieldErrors[field] = messages[0]
                  }

                  setFieldErrors(nextFieldErrors)
                  return
                }

                setFormError(error.message)
                return
              }

              setFormError('Не удалось изменить пароль.')
            })
            .finally(() => {
              setIsSubmitting(false)
            })
        }}
      >
        <Input
          label="Текущий пароль"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          error={fieldErrors.current_password}
        />

        <Input
          label="Новый пароль"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          error={fieldErrors.new_password}
        />

        <Input
          label="Повтор нового пароля"
          type="password"
          value={newPasswordRepeat}
          onChange={(event) => setNewPasswordRepeat(event.target.value)}
          error={fieldErrors.new_password_repeat}
        />

        {formError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {formError}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </div>
        ) : null}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Меняем...' : 'Сменить пароль'}
        </Button>
      </form>
    </>
  )
}
