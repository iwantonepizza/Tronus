import { Check, Loader2, Minus, UserPlus, X } from 'lucide-react'
import {
  useInvites,
  useSelfInvite,
  useUpdateInvite,
  useWithdrawInvite,
} from '@/hooks/useSessions'
import { useAuth } from '@/hooks/useAuth'
import type { RsvpStatus } from '@/api/types'

const RSVP_LABELS: Record<RsvpStatus, string> = {
  going: 'Иду',
  maybe: 'Может быть',
  declined: 'Не иду',
  invited: 'Приглашён',
}

const RSVP_COLORS: Record<RsvpStatus, string> = {
  going: 'text-emerald-400 border-emerald-400/40 bg-emerald-950/20',
  maybe: 'text-amber-400 border-amber-400/40 bg-amber-950/20',
  declined: 'text-red-400 border-red-400/40 bg-red-950/20',
  invited: 'text-text-secondary border-border-subtle bg-bg-elev2',
}

export function RsvpBlock({ sessionId }: { sessionId: number }) {
  const { user } = useAuth()
  const invitesQuery = useInvites(sessionId)
  const selfInviteMutation = useSelfInvite(sessionId)
  const updateInviteMutation = useUpdateInvite(sessionId)
  const withdrawInviteMutation = useWithdrawInvite(sessionId)

  if (invitesQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 text-text-secondary py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Загружаем приглашения…</span>
      </div>
    )
  }

  const invites = invitesQuery.data ?? []
  const myInvite = user ? invites.find((i) => i.user.id === user.id) : null

  const handleRsvp = async (status: RsvpStatus) => {
    if (!myInvite) {
      if (status === 'going') {
        await selfInviteMutation.mutateAsync()
      }
      return
    }
    if (status === myInvite.rsvp_status) {
      // Withdraw
      await withdrawInviteMutation.mutateAsync(myInvite.id)
    } else {
      await updateInviteMutation.mutateAsync({
        inviteId: myInvite.id,
        payload: { rsvp_status: status },
      })
    }
  }

  const isBusy =
    selfInviteMutation.isPending ||
    updateInviteMutation.isPending ||
    withdrawInviteMutation.isPending

  return (
    <div className="space-y-4">
      {/* My RSVP */}
      {user && (
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-widest font-medium mb-2">
            Мой статус
          </p>
          <div className="flex gap-2">
            {(['going', 'maybe', 'declined'] as RsvpStatus[]).map((status) => {
              const isActive = myInvite?.rsvp_status === status
              return (
                <button
                  key={status}
                  type="button"
                  disabled={isBusy}
                  onClick={() => handleRsvp(status)}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm border transition-all disabled:opacity-40 ${
                    isActive
                      ? RSVP_COLORS[status]
                      : 'border-border-subtle text-text-secondary hover:border-text-secondary/40'
                  }`}
                >
                  {status === 'going' && <Check className="h-3.5 w-3.5" />}
                  {status === 'maybe' && <Minus className="h-3.5 w-3.5" />}
                  {status === 'declined' && <X className="h-3.5 w-3.5" />}
                  {RSVP_LABELS[status]}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Invite list */}
      {invites.length > 0 && (
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-widest font-medium mb-2">
            Участники ({invites.length})
          </p>
          <div className="space-y-1">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center gap-3 rounded-xl bg-bg-elev1 border border-border-subtle px-3 py-2"
              >
                <span className="flex-1 text-sm text-text-primary truncate">
                  {invite.user.nickname}
                </span>
                {invite.desired_faction && (
                  <span className="text-xs text-text-secondary capitalize hidden sm:block">
                    {invite.desired_faction}
                  </span>
                )}
                <span className={`rounded-lg px-2 py-0.5 text-xs border ${RSVP_COLORS[invite.rsvp_status]}`}>
                  {RSVP_LABELS[invite.rsvp_status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Join button for non-invited users */}
      {user && !myInvite && (
        <button
          type="button"
          disabled={selfInviteMutation.isPending}
          onClick={() => selfInviteMutation.mutateAsync()}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary border border-dashed border-border-subtle hover:border-text-secondary/40 rounded-xl px-4 py-2 transition disabled:opacity-40"
        >
          {selfInviteMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          Присоединиться
        </button>
      )}
    </div>
  )
}
