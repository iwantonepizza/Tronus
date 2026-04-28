import { useState } from 'react'
import ReactConfetti from 'react-confetti'
import { Castle, GripVertical, ScrollText, ShieldAlert } from 'lucide-react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { PlacementRow } from '@/components/match/PlacementRow'
import { PlayerPill } from '@/components/player/PlayerPill'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { NumberStepper } from '@/components/ui/NumberStepper'
import { Select } from '@/components/ui/Select'
import { Stepper } from '@/components/ui/Stepper'
import { useFinalizeSession, useSessionDetail } from '@/hooks/useSessions'
import { useReferenceData } from '@/hooks/useReferenceData'
import type { DomainParticipation, EndReason } from '@/types/domain'

const USE_MOCKS = __USE_MOCKS__

const finalizeSteps = ['Места', 'Замки', 'Детали', 'Подтверждение']

export function FinalizeSessionPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { id } = useParams()
  const sessionId = id ? Number(id) : null
  const sessionQuery = useSessionDetail(sessionId)

  if (sessionId === null) {
    return <Navigate replace to="/404" />
  }

  if (sessionQuery.isLoading) {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <p className="font-display text-3xl text-text-primary">
            Загружаем finalize wizard…
          </p>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            Нужен актуальный состав planned-session перед фиксацией результата.
          </p>
        </section>
      </main>
    )
  }

  if (sessionQuery.isError || !sessionQuery.data) {
    const stateSession =
      USE_MOCKS &&
      (location.state as { match?: typeof sessionQuery.data } | null)?.match &&
      String(
        (location.state as { match?: typeof sessionQuery.data } | null)?.match?.id,
      ) === id
        ? (location.state as { match?: typeof sessionQuery.data } | null)?.match
        : null

    if (!stateSession) {
      return <Navigate replace to="/404" />
    }

    if (stateSession.status !== 'planned') {
      return (
        <EmptyState
          icon={<ShieldAlert className="h-5 w-5" />}
          title="Р¤РёРЅР°Р»РёР·РёСЂРѕРІР°С‚СЊ РјРѕР¶РЅРѕ С‚РѕР»СЊРєРѕ planned-session"
          description="Р”Р»СЏ completed Рё cancelled СЃРµСЃСЃРёР№ wizard СѓР¶Рµ РЅРµ РЅСѓР¶РµРЅ."
          cta={
            <Button
              variant="secondary"
              onClick={() => navigate(`/matches/${stateSession.id}`)}
            >
              РћС‚РєСЂС‹С‚СЊ РєР°СЂС‚РѕС‡РєСѓ РїР°СЂС‚РёРё
            </Button>
          }
        />
      )
    }

    return <FinalizeSessionContent session={stateSession} />
  }

  const routeMatch = sessionQuery.data

  if (routeMatch.status !== 'planned') {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-5 w-5" />}
        title="Финализировать можно только planned-session"
        description="Для completed и cancelled сессий wizard уже не нужен."
        cta={
          <Button variant="secondary" onClick={() => navigate(`/matches/${routeMatch.id}`)}>
            Открыть карточку партии
          </Button>
        }
      />
    )
  }

  return <FinalizeSessionContent session={routeMatch} />
}

function FinalizeSessionContent({
  session,
}: {
  session: NonNullable<ReturnType<typeof useSessionDetail>['data']>
}) {
  const navigate = useNavigate()
  const finalizeMutation = useFinalizeSession(session.id)
  const referenceQuery = useReferenceData()
  const [showConfetti, setShowConfetti] = useState(false)
  const [confettiColor, setConfettiColor] = useState('#d4af37')
  const [currentStep, setCurrentStep] = useState(0)
  const [participations, setParticipations] = useState<DomainParticipation[]>(
    session.participations.map((participation, index) => ({
      ...participation,
      place: index + 1,
      castles: participation.castles ?? 3,
      isWinner: index === 0,
    })),
  )
  const [roundsPlayed, setRoundsPlayed] = useState(
    session.outcome?.roundsPlayed ?? 9,
  )
  const [endReason, setEndReason] = useState<EndReason>(
    session.outcome?.endReason ?? 'castles_7',
  )
  const [mvpId, setMvpId] = useState(
    session.outcome?.mvp ? String(session.outcome.mvp.id) : '',
  )
  const [finalNote, setFinalNote] = useState(session.outcome?.finalNote ?? '')

  const moveParticipant = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction

    if (nextIndex < 0 || nextIndex >= participations.length) {
      return
    }

    setParticipations((current) => {
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)

      return next.map((participant, itemIndex) => ({
        ...participant,
        place: itemIndex + 1,
        isWinner: itemIndex === 0,
      }))
    })
  }

  const updateCastles = (participantId: number, castles: number) => {
    setParticipations((current) =>
      current.map((participant) =>
        participant.id === participantId
          ? { ...participant, castles }
          : participant,
      ),
    )
  }

  const winner = participations[0]
  const finalizedMatch = {
    ...session,
    status: 'completed' as const,
    participations: participations.map((participant, index) => ({
      ...participant,
      place: index + 1,
      isWinner: index === 0,
    })),
    outcome: {
      roundsPlayed,
      endReason,
      mvp:
        participations.find(
          (participant) => String(participant.user.id) === mvpId,
        )?.user ?? null,
      finalNote,
    },
  }

  return (
    <main className="space-y-6">
      {showConfetti && (
        <ReactConfetti
          recycle={false}
          numberOfPieces={320}
          gravity={0.25}
          colors={[confettiColor, '#ffffff', `${confettiColor}99`]}
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, pointerEvents: 'none' }}
        />
      )}
      <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
          Finalize Session
        </p>
        <h1 className="mt-4 font-display text-4xl text-text-primary md:text-5xl">
          Финализация партии
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">
          Wizard, в котором owner быстро фиксирует итог: порядок мест, замки,
          детали матча и итоговое подтверждение перед переходом в карточку
          партии.
        </p>

        <div className="mt-6">
          <Stepper currentStep={currentStep} steps={finalizeSteps} />
        </div>
      </section>

      {currentStep === 0 ? (
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
          <h2 className="font-display text-3xl text-text-primary">
            Step 1 — Места
          </h2>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            Пока без drag-and-drop, но уже можно переставлять участников вверх и
            вниз и сразу видеть будущие места.
          </p>

          <div className="mt-5 space-y-3">
            {participations.map((participant, index) => (
              <div
                key={participant.id}
                className="flex flex-col gap-3 rounded-[1.5rem] border border-border-subtle bg-bg-base p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-bg-elev1 font-display text-xl text-text-primary">
                    {index + 1}
                  </span>
                  <PlayerPill
                    faction={participant.faction}
                    size="lg"
                    user={participant.user}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => moveParticipant(index, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => moveParticipant(index, 1)}
                  >
                    ↓
                  </Button>
                  <span className="inline-flex items-center rounded-2xl border border-border-subtle px-3 text-text-tertiary">
                    <GripVertical className="h-4 w-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {currentStep === 1 ? (
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
          <h2 className="font-display text-3xl text-text-primary">
            Step 2 — Замки
          </h2>
          <div className="mt-5 space-y-4">
            {participations.map((participant) => (
              <div
                key={participant.id}
                className="flex flex-col gap-3 rounded-[1.5rem] border border-border-subtle bg-bg-base p-4 md:flex-row md:items-center md:justify-between"
              >
                <PlayerPill
                  faction={participant.faction}
                  size="lg"
                  user={participant.user}
                />
                <NumberStepper
                  icon={<Castle className="h-4 w-4" />}
                  max={15}
                  min={0}
                  value={participant.castles ?? 0}
                  onChange={(value) => updateCastles(participant.id, value)}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {currentStep === 2 ? (
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
          <h2 className="font-display text-3xl text-text-primary">
            Step 3 — Детали игры
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.5rem] border border-border-subtle bg-bg-base p-4">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-secondary">
                Раундов сыграно
              </p>
              <div className="mt-4">
                <NumberStepper
                  icon={<ScrollText className="h-4 w-4" />}
                  max={20}
                  min={1}
                  value={roundsPlayed}
                  onChange={setRoundsPlayed}
                />
              </div>
            </div>

            <Select
              label="Причина завершения"
              value={endReason}
              onChange={(event) =>
                setEndReason(event.target.value as EndReason)
              }
              options={[
                { label: '7 замков у победителя', value: 'castles_7' },
                { label: 'Таймер', value: 'timer' },
                { label: 'Закончились раунды', value: 'rounds_end' },
                { label: 'Досрочно', value: 'early' },
                { label: 'Другое', value: 'other' },
              ]}
            />

            <Select
              label="MVP"
              value={mvpId}
              onChange={(event) => setMvpId(event.target.value)}
              options={[
                { label: 'Не выбирать', value: '' },
                ...participations.map((participant) => ({
                  label: participant.user.nickname,
                  value: String(participant.user.id),
                })),
              ]}
            />

            <div className="rounded-[1.5rem] border border-border-subtle bg-bg-base p-4">
              <p className="font-display text-2xl text-text-primary">
                Победитель
              </p>
              <div className="mt-4">
                {winner ? (
                  <PlayerPill
                    faction={winner.faction}
                    size="lg"
                    user={winner.user}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <label className="mt-5 block space-y-2">
            <span className="block font-mono text-xs uppercase tracking-[0.22em] text-text-secondary">
              Final note
            </span>
            <textarea
              aria-label="Final note"
              value={finalNote}
              onChange={(event) => setFinalNote(event.target.value)}
              rows={4}
              className="w-full rounded-[1.5rem] border border-border-subtle bg-bg-base px-4 py-3 text-sm text-text-primary outline-none transition focus:border-gold/60"
            />
          </label>
        </section>
      ) : null}

      {currentStep === 3 ? (
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
          <h2 className="font-display text-3xl text-text-primary">
            Step 4 — Подтверждение
          </h2>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            Финальный превью-блок перед сохранением результата.
          </p>

          <div className="mt-5 space-y-3">
            {finalizedMatch.participations.map((participation) => (
              <PlacementRow
                key={participation.id}
                participation={participation}
              />
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <PreviewStat label="Раундов" value={String(roundsPlayed)} />
            <PreviewStat label="Причина" value={endReason} />
            <PreviewStat
              label="MVP"
              value={finalizedMatch.outcome?.mvp?.nickname ?? '—'}
            />
          </div>

          <Button
            className="mt-6 w-full"
            disabled={finalizeMutation.isPending}
            onClick={async () => {
              if (USE_MOCKS) {
                navigate(`/matches/${finalizedMatch.id}`, {
                  state: { match: finalizedMatch },
                })
                return
              }

              await finalizeMutation.mutateAsync({
                rounds_played: roundsPlayed,
                end_reason: endReason,
                mvp: mvpId ? Number(mvpId) : null,
                final_note: finalNote,
                participations: participations.map((participant, index) => ({
                  id: participant.id,
                  place: index + 1,
                  castles: participant.castles ?? 0,
                })),
              })

              // Resolve winner faction color for confetti
              const winnerFaction = participations[0]?.faction
              const factionColor = referenceQuery.data?.factions.find(
                (f) => f.slug === winnerFaction,
              )?.color
              if (factionColor) setConfettiColor(factionColor)
              setShowConfetti(true)
              setTimeout(() => {
                setShowConfetti(false)
                navigate(`/matches/${finalizedMatch.id}`)
              }, 3000)
            }}
          >
            {finalizeMutation.isPending ? 'Финализируем…' : 'Финализировать'}
          </Button>
        </section>
      ) : null}

      <div className="flex flex-wrap justify-between gap-3">
        <Button
          disabled={currentStep === 0}
          variant="secondary"
          onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
        >
          Назад
        </Button>
        {currentStep < finalizeSteps.length - 1 ? (
          <Button
            onClick={() => setCurrentStep((step) => Math.min(step + 1, 3))}
          >
            Дальше
          </Button>
        ) : null}
      </div>
    </main>
  )
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border-subtle bg-bg-base px-4 py-4">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-text-secondary">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl text-text-primary">{value}</p>
    </div>
  )
}
