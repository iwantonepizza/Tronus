import { ShieldAlert } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { SessionPlannerForm } from '@/components/match/SessionPlannerForm'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useReferenceData } from '@/hooks/useReferenceData'
import {
  useInviteUser,
  useInvites,
  useSessionDetail,
  useUpdateInvite,
  useUpdateSession,
  useWithdrawInvite,
} from '@/hooks/useSessions'
import { useUsers } from '@/hooks/useUsers'
import type { FactionSlug } from '@/api/types'
import type { PlannerParticipantSeed } from '@/types/domain'

const USE_MOCKS = __USE_MOCKS__

function toApiDateTime(value: string): string {
  return new Date(value).toISOString()
}

export function EditSessionPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const sessionId = id ? Number(id) : null
  const referenceQuery = useReferenceData()
  const usersQuery = useUsers()
  const sessionQuery = useSessionDetail(sessionId)
  const invitesQuery = useInvites(sessionId)
  const updateSessionMutation = useUpdateSession(sessionId ?? 0)
  const inviteUserMutation = useInviteUser(sessionId ?? 0)
  const updateInviteMutation = useUpdateInvite(sessionId ?? 0)
  const withdrawInviteMutation = useWithdrawInvite(sessionId ?? 0)

  if (sessionId === null) {
    return <Navigate replace to="/404" />
  }

  if (
    referenceQuery.isLoading ||
    usersQuery.isLoading ||
    sessionQuery.isLoading ||
    invitesQuery.isLoading
  ) {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <p className="font-display text-3xl text-text-primary">
            Загружаем редактирование…
          </p>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            Собираем session detail, приглашения, игроков и справочники для формы.
          </p>
        </section>
      </main>
    )
  }

  if (
    referenceQuery.isError ||
    usersQuery.isError ||
    sessionQuery.isError ||
    invitesQuery.isError
  ) {
    return <Navigate replace to="/404" />
  }

  if (!sessionQuery.data) {
    return <Navigate replace to="/404" />
  }

  const referenceData = referenceQuery.data!
  const match = sessionQuery.data
  const users = usersQuery.data ?? []
  const invites = invitesQuery.data ?? []
  const activeInvites = invites.filter((invite) => invite.rsvp_status !== 'declined')

  if (match.status !== 'planned') {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-5 w-5" />}
        title="Редактирование доступно только для запланированной партии"
        description="Завершённые и отменённые партии уже нельзя менять через сценарий планирования."
        cta={
          <Button variant="secondary" onClick={() => navigate(`/matches/${match.id}`)}>
            Открыть карточку партии
          </Button>
        }
      />
    )
  }

  const initialParticipantSeeds: PlannerParticipantSeed[] = []
  const takenFactions = new Set<string>()

  for (const invite of activeInvites) {
    const player = users.find((candidate) => candidate.id === invite.user.id)
    const candidateFactions: FactionSlug[] = [
      invite.desired_faction,
      player?.favoriteFaction ?? null,
      ...referenceData.factions.map((faction) => faction.slug),
    ].filter(
      (slug): slug is FactionSlug =>
        Boolean(slug) &&
        referenceData.factions.some((faction) => faction.slug === slug),
    )

    const nextFaction: FactionSlug | undefined =
      candidateFactions.find((slug) => !takenFactions.has(slug)) ??
      referenceData.factions[0]?.slug

    if (!nextFaction) {
      continue
    }

    takenFactions.add(nextFaction)
    initialParticipantSeeds.push({
      id: invite.id,
      userId: invite.user.id,
      faction: nextFaction,
      rsvpStatus: invite.rsvp_status,
    })
  }

  return (
    <SessionPlannerForm
      allowEntryModeToggle={false}
      decks={referenceData.decks}
      description="Редактирование planned-партии идёт через единый состав игроков. Каждый игрок здесь уже считается участником с RSVP-статусом."
      eyebrow="Редактирование партии"
      factions={referenceData.factions}
      initialDraft={{
        id: match.id,
        scheduledAt: match.scheduledAt,
        modeSlug: match.mode.slug,
        deckSlug: match.deck.slug,
        planningNote: match.planningNote,
        participantSeeds: initialParticipantSeeds,
      }}
      initialEntryMode="planned"
      isSubmitting={
        updateSessionMutation.isPending ||
        inviteUserMutation.isPending ||
        updateInviteMutation.isPending ||
        withdrawInviteMutation.isPending
      }
      modes={referenceData.modes}
      players={users}
      submitError={updateSessionMutation.error?.message ?? null}
      submitLabel="Сохранить изменения"
      title="Редактирование плана"
      onSubmit={async ({ draft }) => {
        if (USE_MOCKS) {
          const { buildMatchFromPlannerDraft } = await import('@/mocks/session-factory')
          navigate(`/matches/${match.id}`, {
            state: {
              match: buildMatchFromPlannerDraft(draft, {
                createdById: match.createdBy.id,
                commentsCount: match.commentsCount,
                status: 'planned',
                votes: match.votes,
              }),
            },
          })
          return
        }

        await updateSessionMutation.mutateAsync({
          scheduled_at: toApiDateTime(draft.scheduledAt),
          mode: draft.modeSlug,
          deck: draft.deckSlug,
          planning_note: draft.planningNote,
        })

        const existingInvites = new Map(
          activeInvites.map((invite) => [invite.id, invite]),
        )
        const nextSeeds = new Map(
          draft.participantSeeds.map((participant) => [participant.id, participant]),
        )

        for (const existingInvite of activeInvites) {
          const nextParticipant = nextSeeds.get(existingInvite.id)

          if (!nextParticipant) {
            await withdrawInviteMutation.mutateAsync(existingInvite.id)
            continue
          }

          if (nextParticipant.faction !== existingInvite.desired_faction) {
            await updateInviteMutation.mutateAsync({
              inviteId: existingInvite.id,
              payload: { desired_faction: nextParticipant.faction },
            })
          }
        }

        for (const participant of draft.participantSeeds) {
          if (existingInvites.has(participant.id)) {
            continue
          }

          await inviteUserMutation.mutateAsync({
            user_id: participant.userId,
            desired_faction: participant.faction ?? null,
            rsvp_status: participant.rsvpStatus ?? 'maybe',
          })
        }

        navigate(`/matches/${match.id}`)
      }}
    />
  )
}
