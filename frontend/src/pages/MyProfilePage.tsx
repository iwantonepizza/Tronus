import { useState } from 'react'
import { Camera, LogOut, Save, Shield, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
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
            Loading profile...
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
            Loading profile settings...
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
        title="Profile settings are unavailable"
        description="The frontend could not load reference data required for profile editing."
      />
    )
  }

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-border-subtle bg-[radial-gradient(circle_at_top_left,_rgba(201,164,76,0.16),_transparent_34%),linear-gradient(135deg,_rgba(23,23,31,1),_rgba(14,14,18,0.98))] p-6 shadow-panel">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-gold/80">
          My Profile
        </p>
        <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-4xl text-text-primary md:text-5xl">
              {user.nickname}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">
              Private owner-facing profile page. Here you can tune nickname,
              bio, favorite faction, and jump straight into the avatar studio.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => void logout()}
              iconLeft={<LogOut className="h-4 w-4" />}
            >
              Logout
            </Button>
            <Link
              to="/me/avatar"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gold px-4 text-sm font-semibold text-black transition hover:bg-gold-hover"
            >
              <Camera className="h-4 w-4" />
              Avatar studio
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
            <ProfileCard label="Username" value={user.username} />
            <ProfileCard label="Email" value={user.email} />
            <ProfileCard
              label="Favorite faction"
              value={user.favorite_faction ?? 'not set'}
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
    </main>
  )
}

function AvatarPreview({ nickname, src }: { nickname: string; src: string | null }) {
  if (src) {
    return (
      <img
        src={src}
        alt={`${nickname} avatar`}
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
          Profile settings
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
              setFeedbackMessage('Profile updated.')
            })
        }}
      >
        <Input
          label="Nickname"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
        />

        <Select
          label="Favorite faction"
          value={favoriteFaction}
          onChange={(event) =>
            setFavoriteFaction(event.target.value as FactionSlug | '')
          }
          options={[{ label: 'Not selected', value: '' }, ...factionOptions]}
        />

        <label className="block space-y-2">
          <span className="block font-mono text-xs uppercase tracking-[0.22em] text-text-secondary">
            Bio
          </span>
          <textarea
            aria-label="Bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-border-subtle bg-bg-base px-4 py-3 text-text-primary outline-none transition placeholder:text-text-tertiary focus:border-gold"
            placeholder="Short personal note for the closed group."
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
          {updateProfileMutation.isPending ? 'Saving...' : 'Save profile'}
        </Button>
      </form>
    </>
  )
}
