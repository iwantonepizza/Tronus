import { ShieldAlert } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { inviteUser, removeParticipant, updateParticipant } from '@/api/sessions'
import { SessionPlannerForm } from '@/components/match/SessionPlannerForm'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useReferenceData } from '@/hooks/useReferenceData'
import { useSessionDetail, useUpdateSession } from '@/hooks/useSessions'
import { useUsers } from '@/hooks/useUsers'

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
  const updateSessionMutation = useUpdateSession(sessionId ?? 0)

  if (sessionId === null) {
    return <Navigate replace to="/404" />
  }

  if (
    referenceQuery.isLoading ||
    usersQuery.isLoading ||
    sessionQuery.isLoading
  ) {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <p className="font-display text-3xl text-text-primary">
            Загружаем редактирование…
          </p>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            Собираем session detail, игроков и справочники для формы.
          </p>
        </section>
      </main>
    )
  }

  if (referenceQuery.isError || usersQuery.isError || sessionQuery.isError) {
    return <Navigate replace to="/404" />
  }

  if (!sessionQuery.data) {
    return <Navigate replace to="/404" />
  }

  const referenceData = referenceQuery.data!
  const match = sessionQuery.data

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

  return (
    <SessionPlannerForm
      allowEntryModeToggle={false}
      decks={referenceData.decks}
      description="Предзаполненная форма запланированной партии. Здесь можно перенастроить режим, состав и заметки до момента финализации."
      eyebrow="Редактирование партии"
      factions={referenceData.factions}
      initialDraft={{
        id: match.id,
        scheduledAt: match.scheduledAt,
        modeSlug: match.mode.slug,
        deckSlug: match.deck.slug,
        planningNote: match.planningNote,
        participantSeeds: match.participations.map((participant) => ({
          id: participant.id,
          userId: participant.user.id,
          faction: participant.faction,
        })),
      }}
      initialEntryMode="planned"
      isSubmitting={updateSessionMutation.isPending}
      modes={referenceData.modes}
      players={usersQuery.data ?? []}
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

        const existingParticipants = new Map(
          match.participations.map((participant) => [participant.id, participant]),
        )
        const nextSeeds = new Map(
          draft.participantSeeds.map((participant) => [participant.id, participant]),
        )

        for (const existingParticipation of match.participations) {
          const nextParticipant = nextSeeds.get(existingParticipation.id)

          if (!nextParticipant) {
            await removeParticipant(match.id, existingParticipation.id)
            continue
          }

          if (nextParticipant.faction !== existingParticipation.faction) {
            await updateParticipant(match.id, existingParticipation.id, {
              faction: nextParticipant.faction,
            })
          }
        }

        for (const participant of draft.participantSeeds) {
          if (existingParticipants.has(participant.id)) {
            continue
          }

          // ADR-0019 / F-230: новые seed'ы из формы редактирования становятся
          // SessionInvite со статусом 'maybe'. Старый addParticipant flow
          // создавал Participation на planned-сессии, что ломало start_session.
          await inviteUser(match.id, {
            user_id: participant.userId,
            desired_faction: participant.faction ?? null,
            rsvp_status: 'maybe',
          })
        }

        navigate(`/matches/${match.id}`)
      }}
    />
  )
}
