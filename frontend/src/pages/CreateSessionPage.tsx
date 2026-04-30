import { useMemo } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { addParticipant } from '@/api/sessions'
import { SessionPlannerForm } from '@/components/match/SessionPlannerForm'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useReferenceData } from '@/hooks/useReferenceData'
import { useCreateSession } from '@/hooks/useSessions'
import { useUsers } from '@/hooks/useUsers'
import type { SessionPlannerDraft } from '@/types/domain'

const USE_MOCKS = __USE_MOCKS__

function toApiDateTime(value: string): string {
  return new Date(value).toISOString()
}

export function CreateSessionPage() {
  const navigate = useNavigate()
  const referenceQuery = useReferenceData()
  const usersQuery = useUsers()
  const createSessionMutation = useCreateSession()

  const initialDraft = useMemo<SessionPlannerDraft | null>(() => {
    if (!referenceQuery.data) {
      return null
    }

    return {
      id: 901,
      scheduledAt: '2026-05-16T19:30:00Z',
      modeSlug: referenceQuery.data.modes[0]?.slug ?? 'classic',
      deckSlug: referenceQuery.data.decks[0]?.slug ?? 'original',
      planningNote:
        'Вечерний стол без спешки, с таймером и чётким финалом.',
      participantSeeds: [],
    }
  }, [referenceQuery.data])

  if (referenceQuery.isLoading || usersQuery.isLoading || initialDraft === null) {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <p className="font-display text-3xl text-text-primary">
            Загружаем форму создания…
          </p>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            Нужны справочники и список игроков для сборки новой сессии.
          </p>
        </section>
      </main>
    )
  }

  if (referenceQuery.isError || usersQuery.isError) {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-5 w-5" />}
        title="Не удалось открыть форму создания"
        description="Фронт не смог загрузить справочники или список игроков."
        cta={
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Обновить страницу
          </Button>
        }
      />
    )
  }

  const referenceData = referenceQuery.data!
  const users = usersQuery.data ?? []

  return (
    <SessionPlannerForm
      decks={referenceData.decks}
      description="Экран создания сессии. Можно собрать состав, выбрать режим и либо запланировать партию, либо сразу перейти к финализации."
      eyebrow="Создание партии"
      factions={referenceData.factions}
      initialDraft={initialDraft}
      isSubmitting={createSessionMutation.isPending}
      modes={referenceData.modes}
      players={users}
      submitError={createSessionMutation.error?.message ?? null}
      submitLabel="Сохранить черновик"
      title="Новая партия"
      onSubmit={async ({ draft, entryMode }) => {
        if (USE_MOCKS) {
          const { buildMatchFromPlannerDraft } = await import('@/mocks/session-factory')
          const match = buildMatchFromPlannerDraft(draft)

          if (entryMode === 'played') {
            navigate(`/matches/${match.id}/finalize-played`, { state: { match } })
            return
          }

          navigate(`/matches/${match.id}`, { state: { match } })
          return
        }

        const createdSession = await createSessionMutation.mutateAsync({
          scheduled_at: toApiDateTime(draft.scheduledAt),
          mode: draft.modeSlug,
          deck: draft.deckSlug,
          planning_note: draft.planningNote,
        })

        // For the 'played' entry mode the dedicated retroactive page accepts
        // the full roster in one shot, so we don't pre-create participations
        // here — that would race against finalize_played_session() which
        // refuses to run if Participations already exist.
        if (entryMode === 'played') {
          navigate(`/matches/${createdSession.id}/finalize-played`)
          return
        }

        for (const participant of draft.participantSeeds) {
          await addParticipant(createdSession.id, {
            user: participant.userId,
            faction: participant.faction,
          })
        }

        navigate(`/matches/${createdSession.id}`)
      }}
    />
  )
}
