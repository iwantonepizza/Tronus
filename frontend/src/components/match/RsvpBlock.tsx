import { useState } from 'react'
import { Check, ChevronDown, Loader2, Minus, UserPlus, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { resolveAssetUrl } from '@/api/client'
import type { ApiSessionInvite, RsvpStatus } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import {
  useInvites,
  useSelfInvite,
  useUpdateInvite,
  useWithdrawInvite,
} from '@/hooks/useSessions'
import { cn } from '@/lib/cn'

const USE_MOCKS = __USE_MOCKS__

const RSVP_LABELS: Record<RsvpStatus, string> = {
  going: 'Иду',
  maybe: 'Под вопросом',
  declined: 'Не иду',
  invited: 'Не отреагировал',
}

const RSVP_COLORS: Record<RsvpStatus, string> = {
  going: 'border-emerald-400/40 bg-emerald-950/20 text-emerald-400',
  maybe: 'border-amber-400/40 bg-amber-950/20 text-amber-400',
  declined: 'border-red-400/40 bg-red-950/20 text-red-400',
  invited: 'border-border-subtle bg-bg-elev2 text-text-secondary',
}

interface RsvpBlockProps {
  sessionCreatorId: number
  sessionId: number
  sessionStatus: 'planned' | 'cancelled'
}

export function RsvpBlock({
  sessionCreatorId,
  sessionId,
  sessionStatus,
}: RsvpBlockProps) {
  const { user } = useAuth()
  const invitesQuery = useInvites(sessionId)
  const selfInviteMutation = useSelfInvite(sessionId)
  const updateInviteMutation = useUpdateInvite(sessionId)
  const withdrawInviteMutation = useWithdrawInvite(sessionId)
  const [mockInvites, setMockInvites] = useState<ApiSessionInvite[] | null>(null)
  const [showDeclined, setShowDeclined] = useState(false)

  const isReadOnly = sessionStatus === 'cancelled'

  if (invitesQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-text-secondary">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Загружаем приглашения…</span>
      </div>
    )
  }

  const sourceInvites = invitesQuery.data ?? []
  const invites = USE_MOCKS ? mockInvites ?? sourceInvites : sourceInvites
  const myInvite = user ? invites.find((invite) => invite.user.id === user.id) : null
  const activeInvites = invites.filter((invite) => invite.rsvp_status !== 'declined')
  const declinedInvites = invites.filter((invite) => invite.rsvp_status === 'declined')
  const canManageInvites = Boolean(
    user &&
      (user.id === sessionCreatorId || user.is_staff === true || user.is_superuser === true),
  )
  const isBusy =
    selfInviteMutation.isPending ||
    updateInviteMutation.isPending ||
    withdrawInviteMutation.isPending
  const helperText =
    sessionStatus === 'cancelled'
      ? 'Партия отменена. Состав сохранён как справка и больше не редактируется.'
      : user
        ? 'Состав партии до старта ведётся только через приглашения и ответы RSVP.'
        : 'Войдите, чтобы отметить участие и выбрать удобный статус.'

  const upsertMockInvite = (nextInvite: ApiSessionInvite) => {
    setMockInvites((current) => {
      const base = current ?? sourceInvites
      const exists = base.some((invite) => invite.id === nextInvite.id)

      if (exists) {
        return base.map((invite) =>
          invite.id === nextInvite.id ? nextInvite : invite,
        )
      }

      return [...base, nextInvite]
    })
  }

  const removeMockInvite = (inviteId: number) => {
    setMockInvites((current) =>
      (current ?? sourceInvites).filter((invite) => invite.id !== inviteId),
    )
  }

  const handleRsvp = async (status: RsvpStatus) => {
    if (isReadOnly) {
      return
    }

    if (!myInvite) {
      if (!user || status !== 'going') {
        return
      }

      if (USE_MOCKS) {
        const nextInviteId =
          [...sourceInvites, ...(mockInvites ?? [])].reduce(
            (maxInviteId, invite) => Math.max(maxInviteId, invite.id),
            sessionId * 100,
          ) + 1

        upsertMockInvite({
          id: nextInviteId,
          user: {
            id: user.id,
            nickname: user.nickname,
            avatar_url: user.current_avatar,
          },
          rsvp_status: 'going',
          desired_faction: null,
          desired_faction_summary: null,
          invited_by: null,
          created_at: new Date().toISOString(),
        })
        return
      }

      await selfInviteMutation.mutateAsync()
      return
    }

    if (USE_MOCKS) {
      if (status === myInvite.rsvp_status) {
        removeMockInvite(myInvite.id)
        return
      }

      upsertMockInvite({
        ...myInvite,
        rsvp_status: status,
      })
      return
    }

    if (status === myInvite.rsvp_status) {
      await withdrawInviteMutation.mutateAsync(myInvite.id)
      return
    }

    await updateInviteMutation.mutateAsync({
      inviteId: myInvite.id,
      payload: { rsvp_status: status },
    })
  }

  const handleDeleteInvite = async (invite: ApiSessionInvite) => {
    if (isReadOnly) {
      return
    }

    if (USE_MOCKS) {
      removeMockInvite(invite.id)
      return
    }

    await withdrawInviteMutation.mutateAsync(invite.id)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-widest text-text-secondary">
            Участники ({activeInvites.length})
          </p>
          {declinedInvites.length > 0 ? (
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-border-subtle px-3 py-1 text-xs text-text-secondary transition hover:border-text-secondary/40 hover:text-text-primary"
              onClick={() => setShowDeclined((current) => !current)}
            >
              Не пойдут ({declinedInvites.length})
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform',
                  showDeclined && 'rotate-180',
                )}
              />
            </button>
          ) : null}
        </div>
        <p className="text-sm leading-6 text-text-secondary">{helperText}</p>
      </div>

      {user && !isReadOnly ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-text-secondary">
            Мой статус
          </p>
          <div className="flex flex-wrap gap-2">
            {(['going', 'maybe', 'declined'] as RsvpStatus[]).map((status) => {
              const isActive = myInvite?.rsvp_status === status

              return (
                <button
                  key={status}
                  type="button"
                  disabled={isBusy}
                  onClick={() => void handleRsvp(status)}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm transition-all disabled:opacity-40 ${
                    isActive
                      ? RSVP_COLORS[status]
                      : 'border-border-subtle text-text-secondary hover:border-text-secondary/40'
                  }`}
                >
                  {status === 'going' ? <Check className="h-3.5 w-3.5" /> : null}
                  {status === 'maybe' ? <Minus className="h-3.5 w-3.5" /> : null}
                  {status === 'declined' ? <X className="h-3.5 w-3.5" /> : null}
                  {RSVP_LABELS[status]}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {activeInvites.length > 0 ? (
        <div className="space-y-2">
          {activeInvites.map((invite) => (
            <article
              key={invite.id}
              className={cn(
                'grid gap-3 rounded-[1.5rem] border border-border-subtle bg-bg-elev1 px-4 py-3 md:grid-cols-[auto_1fr_auto_auto]',
                myInvite?.id === invite.id && 'border-gold/40 bg-gold/10',
              )}
            >
              <InviteAvatar
                nickname={invite.user.nickname}
                src={resolveAssetUrl(invite.user.avatar_url)}
              />
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold text-text-primary">
                    {invite.user.nickname}
                  </span>
                  {myInvite?.id === invite.id ? (
                    <span className="rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.2em] text-gold">
                      Это вы
                    </span>
                  ) : null}
                </div>
                {invite.desired_faction_summary ? (
                  <span
                    className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
                    style={{
                      borderColor: `${invite.desired_faction_summary.color}66`,
                      color: invite.desired_faction_summary.color,
                    }}
                  >
                    {invite.desired_faction_summary.display_name}
                  </span>
                ) : (
                  <span className="text-xs text-text-tertiary">
                    Фракция пока не выбрана
                  </span>
                )}
              </div>
              <div className="flex items-center md:justify-end">
                <span
                  className={`rounded-lg border px-2 py-1 text-xs ${RSVP_COLORS[invite.rsvp_status as RsvpStatus]}`}
                >
                  {RSVP_LABELS[invite.rsvp_status as RsvpStatus]}
                </span>
              </div>
              {!isReadOnly && user && (canManageInvites || user.id === invite.user.id) ? (
                <div className="flex items-center md:justify-end">
                  <Button
                    aria-label={`Удалить приглашение ${invite.user.nickname}`}
                    className="h-9 w-9 rounded-full px-0"
                    disabled={isBusy}
                    onClick={() => void handleDeleteInvite(invite)}
                    size="sm"
                    variant="ghost"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-border-subtle bg-bg-base px-4 py-5 text-sm text-text-secondary">
          Пока никто не подтвердил участие.
        </div>
      )}

      {declinedInvites.length > 0 && showDeclined ? (
        <div className="space-y-2 rounded-[1.5rem] border border-border-subtle bg-bg-base p-4">
          {declinedInvites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border-subtle/80 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <InviteAvatar
                  nickname={invite.user.nickname}
                  size="sm"
                  src={resolveAssetUrl(invite.user.avatar_url)}
                />
                <span className="truncate text-sm text-text-primary">
                  {invite.user.nickname}
                </span>
              </div>
              <span className={`rounded-lg border px-2 py-0.5 text-xs ${RSVP_COLORS.declined}`}>
                {RSVP_LABELS.declined}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {!user && !isReadOnly ? (
        <Link
          to="/login"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border-subtle px-4 text-sm font-semibold text-text-primary transition hover:border-gold hover:text-gold"
        >
          Войти
        </Link>
      ) : null}

      {user && !myInvite && !isReadOnly ? (
        <button
          type="button"
          disabled={selfInviteMutation.isPending}
          onClick={() => void handleRsvp('going')}
          className="flex items-center gap-2 rounded-xl border border-dashed border-border-subtle px-4 py-2 text-sm text-text-secondary transition hover:border-text-secondary/40 hover:text-text-primary disabled:opacity-40"
        >
          {selfInviteMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          Присоединиться
        </button>
      ) : null}
    </div>
  )
}

function InviteAvatar({
  nickname,
  size = 'md',
  src,
}: {
  nickname: string
  size?: 'sm' | 'md'
  src: string | null
}) {
  const sizeClassName = size === 'sm' ? 'h-10 w-10 text-sm' : 'h-12 w-12 text-base'

  if (src) {
    return (
      <img
        src={src}
        alt={`Аватар игрока ${nickname}`}
        className={`${sizeClassName} rounded-2xl border border-border-subtle object-cover`}
      />
    )
  }

  return (
    <div
      className={`${sizeClassName} inline-flex items-center justify-center rounded-2xl border border-border-subtle bg-bg-base font-semibold text-gold`}
    >
      {nickname.slice(0, 2).toUpperCase()}
    </div>
  )
}
