import { useEffect, useState } from 'react'
import { Dices, Loader2, Play, ShieldAlert, Shuffle, Users } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import {
  useInvites,
  useRandomizeFactions,
  useSessionDetail,
  useStartSession,
} from '@/hooks/useSessions'
import { useReferenceData } from '@/hooks/useReferenceData'

const FACTION_COLORS: Record<string, string> = {
  stark: '#4A7FA5', lannister: '#C9A84C', baratheon: '#F5C842',
  greyjoy: '#7B7B8D', tyrell: '#5D9B4F', martell: '#C96B36',
  arryn: '#5B8DC9', tully: '#8E3A3A', targaryen: '#B5352D',
}

export function MatchStartPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const sessionId = id ? Number(id) : null

  const sessionQuery = useSessionDetail(sessionId)
  const invitesQuery = useInvites(sessionId)
  const referenceQuery = useReferenceData()
  const randomizeMutation = useRandomizeFactions(sessionId!)
  const startMutation = useStartSession(sessionId!)

  // assignment: { [userId]: factionSlug }
  const [assignment, setAssignment] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)

  const goingInvites = (invitesQuery.data ?? []).filter((i) => i.rsvp_status === 'going')

  // init empty assignments when invites load
  useEffect(() => {
    if (goingInvites.length > 0 && Object.keys(assignment).length === 0) {
      const init: Record<number, string> = {}
      goingInvites.forEach((inv) => { init[inv.user.id] = '' })
      setAssignment(init)
    }
  }, [goingInvites.length])

  if (sessionId === null) return <Navigate replace to="/404" />

  if (sessionQuery.isLoading || invitesQuery.isLoading) {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-8 flex items-center gap-4">
          <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
          <p className="text-text-secondary">Загружаем…</p>
        </section>
      </main>
    )
  }

  const session = sessionQuery.data
  if (!session) return <Navigate replace to="/404" />

  if (session.status !== 'planned') {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-8">
          <div className="flex items-start gap-4">
            <ShieldAlert className="h-6 w-6 text-amber-400 mt-0.5" />
            <p className="text-sm text-text-secondary">
              Начать партию можно только из статуса «запланирована».
            </p>
          </div>
        </section>
      </main>
    )
  }

  const allFactions = referenceQuery.data?.factions ?? []
  const usedFactions = new Set(Object.values(assignment).filter(Boolean))
  const availableFactions = (slug: string) =>
    allFactions.filter((f) => f.slug === slug || !usedFactions.has(f.slug))

  const handleRandomize = async () => {
    setError(null)
    try {
      const result = await randomizeMutation.mutateAsync()
      const newAssignment: Record<number, string> = {}
      result.forEach((r) => { newAssignment[r.user_id] = r.faction_slug })
      setAssignment(newAssignment)
    } catch {
      setError('Ошибка случайного распределения. Проверьте наличие идущих игроков.')
    }
  }

  const handleStart = async () => {
    setError(null)
    const missing = goingInvites.filter((inv) => !assignment[inv.user.id])
    if (missing.length > 0) {
      setError(`Назначьте фракцию для: ${missing.map((i) => i.user.nickname).join(', ')}`)
      return
    }
    try {
      await startMutation.mutateAsync({
        factions_assignment: Object.entries(assignment).map(([uid, slug]) => ({
          user_id: Number(uid),
          faction_slug: slug,
        })),
      })
      navigate(`/matches/${sessionId}/rounds`, { replace: true })
    } catch (e: unknown) {
      setError('Не удалось начать партию. Проверьте приглашения и фракции.')
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4">
      {/* Header */}
      <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
        <div className="flex items-center gap-3 mb-2">
          <Play className="h-5 w-5 text-text-secondary" />
          <span className="text-xs text-text-secondary uppercase tracking-widest font-medium">
            Начало партии
          </span>
        </div>
        <h1 className="font-display text-3xl text-text-primary">Распределение фракций</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Режим: <span className="text-text-primary">{session.mode.name}</span> ·{' '}
          Игроков идёт: <span className="text-text-primary">{goingInvites.length}</span>
        </p>
      </section>

      {/* No going invites */}
      {goingInvites.length === 0 && (
        <section className="rounded-[2rem] border border-amber-400/30 bg-amber-950/20 p-6">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-amber-400 mt-0.5" />
            <div>
              <p className="text-sm text-amber-200 font-medium">Нет участников</p>
              <p className="text-sm text-amber-300/70 mt-1">
                Нужно хотя бы один игрок со статусом «идёт».
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Faction assignment grid */}
      {goingInvites.length > 0 && (
        <>
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs text-text-secondary uppercase tracking-widest font-medium">
                Назначить фракции
              </h2>
              <button
                type="button"
                onClick={handleRandomize}
                disabled={randomizeMutation.isPending}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs border border-border-subtle text-text-secondary hover:text-text-primary hover:border-text-secondary/40 transition disabled:opacity-40"
              >
                {randomizeMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Shuffle className="h-3 w-3" />
                )}
                Случайно
              </button>
            </div>

            {goingInvites.map((invite) => {
              const selected = assignment[invite.user.id] ?? ''
              const color = selected ? (FACTION_COLORS[selected] ?? '#888') : '#444'
              return (
                <div
                  key={invite.user.id}
                  className="flex items-center gap-4 rounded-2xl px-5 py-3 bg-bg-elev1 border border-border-subtle"
                >
                  <div
                    className="h-8 w-1.5 rounded-full flex-shrink-0 transition-all duration-300"
                    style={{ background: color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {invite.user.nickname}
                    </p>
                    {invite.desired_faction && invite.desired_faction !== selected && (
                      <p className="text-xs text-text-secondary/60">
                        Хочет: {invite.desired_faction}
                      </p>
                    )}
                  </div>
                  <select
                    value={selected}
                    onChange={(e) =>
                      setAssignment((prev) => ({
                        ...prev,
                        [invite.user.id]: e.target.value,
                      }))
                    }
                    className="rounded-xl bg-bg-elev2 border border-border-subtle px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-text-secondary/40 transition min-w-[140px]"
                  >
                    <option value="">— выбрать —</option>
                    {availableFactions(selected).map((f) => (
                      <option key={f.slug} value={f.slug}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
          </section>

          {/* Start button */}
          {error && (
            <section className="rounded-2xl border border-red-400/30 bg-red-950/20 px-5 py-3">
              <p className="text-sm text-red-300">{error}</p>
            </section>
          )}

          <section className="pb-8">
            <Button
              variant="primary"
              fullWidth
              disabled={startMutation.isPending || goingInvites.length === 0}
              onClick={handleStart}
            >
              {startMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Начинаем…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Dices className="h-4 w-4" />
                  Начать партию
                </span>
              )}
            </Button>
          </section>
        </>
      )}
    </main>
  )
}
