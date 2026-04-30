import { useState } from 'react'
import {
  AlertTriangle,
  Castle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Sword,
  Trash2,
  Trophy,
  Zap,
} from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import {
  useCompleteRound,
  useDiscardLastRound,
  useRounds,
  useSessionDetail,
} from '@/hooks/useSessions'
import type { DomainParticipation } from '@/types/domain'
import type { ApiRoundSnapshot } from '@/api/types'

const FACTION_COLORS: Record<string, string> = {
  stark: '#4A7FA5', lannister: '#C9A84C', baratheon: '#F5C842',
  greyjoy: '#7B7B8D', tyrell: '#5D9B4F', martell: '#C96B36',
  arryn: '#5B8DC9', tully: '#8E3A3A', targaryen: '#B5352D',
}

const WILDLINGS_POSITIONS = [0, 2, 4, 6, 8, 10, 12] as const

function WildlingsStepper({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const idx = WILDLINGS_POSITIONS.indexOf(value as (typeof WILDLINGS_POSITIONS)[number])
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={idx <= 0}
        onClick={() => onChange(WILDLINGS_POSITIONS[idx - 1])}
        className="h-7 w-7 rounded-lg bg-bg-elev2 border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-30 transition"
      >
        <ChevronDown className="h-4 w-4" />
      </button>
      <div className="flex-1">
        <div className="flex gap-1 justify-center">
          {WILDLINGS_POSITIONS.map((pos) => (
            <div
              key={pos}
              className={`h-2.5 flex-1 rounded-full transition-all ${
                pos <= value
                  ? pos >= 10
                    ? 'bg-red-500'
                    : pos >= 6
                    ? 'bg-amber-400'
                    : 'bg-text-secondary/50'
                  : 'bg-bg-elev2 border border-border-subtle'
              }`}
            />
          ))}
        </div>
        <p className="text-center text-xs text-text-secondary mt-1">{value}</p>
      </div>
      <button
        type="button"
        disabled={idx >= WILDLINGS_POSITIONS.length - 1}
        onClick={() => onChange(WILDLINGS_POSITIONS[idx + 1])}
        className="h-7 w-7 rounded-lg bg-bg-elev2 border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-30 transition"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
    </div>
  )
}

function NumberStepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-6 w-6 rounded-md bg-bg-elev2 border border-border-subtle text-xs text-text-secondary hover:text-text-primary disabled:opacity-30 transition flex items-center justify-center"
      >
        −
      </button>
      <span className="w-6 text-center text-sm font-mono text-text-primary">{value}</span>
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-6 w-6 rounded-md bg-bg-elev2 border border-border-subtle text-xs text-text-secondary hover:text-text-primary disabled:opacity-30 transition flex items-center justify-center"
      >
        +
      </button>
    </div>
  )
}

function InfluenceTrack({
  label,
  icon,
  participations,
  order,
  onReorder,
}: {
  label: string
  icon: React.ReactNode
  participations: DomainParticipation[]
  order: number[]
  onReorder: (newOrder: number[]) => void
}) {
  const ordered = order.map((pid) => participations.find((p) => p.id === pid)).filter(Boolean) as DomainParticipation[]

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...order]
    const target = idx + dir
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]]
    onReorder(next)
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-text-secondary">{icon}</span>
        <span className="text-xs text-text-secondary uppercase tracking-widest font-medium">{label}</span>
      </div>
      <div className="space-y-1">
        {ordered.map((p, i) => {
          const color = FACTION_COLORS[p.faction] ?? '#888'
          return (
            <div key={p.id} className="flex items-center gap-2 rounded-xl bg-bg-elev1 border border-border-subtle px-3 py-1.5">
              <span className="w-4 text-center text-xs font-mono text-text-secondary">{i + 1}</span>
              <div className="h-4 w-1 rounded-full" style={{ background: color }} />
              <span className="flex-1 text-xs text-text-primary truncate">{p.user.nickname}</span>
              <div className="flex gap-0.5">
                <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="h-5 w-5 flex items-center justify-center rounded text-text-secondary hover:text-text-primary disabled:opacity-20 transition">
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button type="button" disabled={i === ordered.length - 1} onClick={() => move(i, 1)} className="h-5 w-5 flex items-center justify-center rounded text-text-secondary hover:text-text-primary disabled:opacity-20 transition">
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RoundHistoryCard({ snapshot, participations }: { snapshot: ApiRoundSnapshot; participations: DomainParticipation[] }) {
  const [open, setOpen] = useState(false)
  const leader = snapshot.influence_throne[0]
  const leaderP = participations.find((p) => p.id === leader)
  const maxCastles = Math.max(...Object.values(snapshot.castles), 0)

  return (
    <div className="rounded-2xl bg-bg-elev1 border border-border-subtle overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-bg-elev2/50 transition">
        <span className="w-16 text-xs font-mono text-text-secondary">Раунд {snapshot.round_number}</span>
        <Trophy className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
        <span className="flex-1 text-xs text-text-primary truncate">{leaderP?.user.nickname ?? '—'}</span>
        <span className="text-xs text-text-secondary">макс. {maxCastles}🏰</span>
        <span className="text-xs text-text-secondary ml-1">Угроза: {snapshot.wildlings_threat}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-text-secondary" /> : <ChevronDown className="h-3.5 w-3.5 text-text-secondary" />}
      </button>
      {open && (
        <div className="border-t border-border-subtle px-4 py-3 space-y-2">
          {participations.map((p) => {
            const castles = snapshot.castles[String(p.id)] ?? 0
            const supply = snapshot.supply[String(p.id)] ?? 0
            const color = FACTION_COLORS[p.faction] ?? '#888'
            return (
              <div key={p.id} className="flex items-center gap-3">
                <div className="h-3 w-1 rounded-full" style={{ background: color }} />
                <span className="text-xs text-text-secondary w-24 truncate">{p.user.nickname}</span>
                <span className="text-xs text-text-secondary">🏰 {castles}</span>
                <span className="text-xs text-text-secondary">⚓ {supply}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function RoundTrackerPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const sessionId = id ? Number(id) : null

  const sessionQuery = useSessionDetail(sessionId)
  const roundsQuery = useRounds(sessionId)
  const completeRoundMutation = useCompleteRound(sessionId!)
  const discardMutation = useDiscardLastRound(sessionId!)

  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const initForm = (participations: DomainParticipation[], lastSnapshot?: ApiRoundSnapshot) => ({
    influenceThrone: lastSnapshot?.influence_throne ?? participations.map((p) => p.id),
    influenceSword: lastSnapshot?.influence_sword ?? participations.map((p) => p.id),
    influenceCourt: lastSnapshot?.influence_court ?? participations.map((p) => p.id),
    supply: Object.fromEntries(participations.map((p) => [String(p.id), lastSnapshot?.supply[String(p.id)] ?? 1])),
    castles: Object.fromEntries(participations.map((p) => [String(p.id), lastSnapshot?.castles[String(p.id)] ?? 0])),
    wildlingsThreat: lastSnapshot?.wildlings_threat ?? 4,
    note: '',
  })

  const session = sessionQuery.data
  const rounds = roundsQuery.data ?? []
  const lastSnapshot = rounds.length > 0 ? rounds[rounds.length - 1] : undefined
  const participations = session?.participations ?? []

  const [form, setForm] = useState(() => initForm(participations, lastSnapshot))

  if (sessionId === null) return <Navigate replace to="/404" />
  if (sessionQuery.isLoading || roundsQuery.isLoading) {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-8 flex items-center gap-4">
          <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
          <p className="text-text-secondary">Загружаем трекер…</p>
        </section>
      </main>
    )
  }
  if (!session) return <Navigate replace to="/404" />

  if (session.status !== 'in_progress') {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-8">
          <p className="text-sm text-text-secondary">Трекер доступен только для партий в процессе.</p>
        </section>
      </main>
    )
  }

  const handleOpenForm = () => {
    setForm(initForm(participations, lastSnapshot))
    setShowForm(true)
    setError(null)
  }

  const handleCompleteRound = async () => {
    setError(null)
    try {
      await completeRoundMutation.mutateAsync({
        influence_throne: form.influenceThrone,
        influence_sword: form.influenceSword,
        influence_court: form.influenceCourt,
        supply: form.supply,
        castles: form.castles,
        wildlings_threat: form.wildlingsThreat,
        note: form.note,
      })
      setShowForm(false)
    } catch {
      setError('Ошибка сохранения раунда. Проверьте данные.')
    }
  }

  const handleDiscard = async () => {
    if (!lastSnapshot || lastSnapshot.round_number === 0) return
    if (!confirm(`Удалить раунд ${lastSnapshot.round_number}?`)) return
    await discardMutation.mutateAsync(lastSnapshot.id)
  }

  const currentCastles = lastSnapshot
    ? participations.map((p) => ({ p, castles: lastSnapshot.castles[String(p.id)] ?? 0 }))
    : participations.map((p) => ({ p, castles: 0 }))

  const leader = [...currentCastles].sort((a, b) => b.castles - a.castles)[0]
  const hasWinner = (leader?.castles ?? 0) >= 7

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4">
      {/* Header */}
      <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <Castle className="h-5 w-5 text-text-secondary" />
            <span className="text-xs text-text-secondary uppercase tracking-widest font-medium">
              В процессе · {session.mode.name}
            </span>
          </div>
          <span className="font-mono text-sm text-text-secondary">
            Раунд {lastSnapshot?.round_number ?? 0}
          </span>
        </div>
        <h1 className="font-display text-2xl text-text-primary">Трекер раундов</h1>

        {/* Wildlings threat bar */}
        {lastSnapshot && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-secondary">Угроза одичалых</span>
              <span className="text-xs font-mono text-text-secondary">{lastSnapshot.wildlings_threat}</span>
            </div>
            <div className="flex gap-1">
              {WILDLINGS_POSITIONS.map((pos) => (
                <div key={pos} className={`h-2 flex-1 rounded-full transition-all ${
                  pos <= lastSnapshot.wildlings_threat
                    ? pos >= 10 ? 'bg-red-500' : pos >= 6 ? 'bg-amber-400' : 'bg-text-secondary/50'
                    : 'bg-bg-elev2 border border-border-subtle'
                }`} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Current standings */}
      <section className="space-y-2">
        <h2 className="text-xs text-text-secondary uppercase tracking-widest font-medium px-1">
          Текущие позиции
        </h2>
        {[...currentCastles]
          .sort((a, b) => b.castles - a.castles)
          .map(({ p, castles }, i) => {
            const color = FACTION_COLORS[p.faction] ?? '#888'
            const isLeader = i === 0
            return (
              <div key={p.id} className={`flex items-center gap-4 rounded-2xl px-5 py-3 border transition-all ${
                hasWinner && isLeader ? 'bg-amber-950/30 border-amber-400/30' : 'bg-bg-elev1 border-border-subtle'
              }`}>
                <span className="w-5 text-xs font-mono text-text-secondary">{i + 1}</span>
                <div className="h-7 w-1.5 rounded-full" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{p.user.nickname}</p>
                  <p className="text-xs text-text-secondary capitalize">{p.faction}</p>
                </div>
                {/* Castle bars */}
                <div className="flex flex-col items-end gap-1">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <div key={j} className={`h-2.5 w-4 rounded-sm ${
                        j < castles
                          ? castles >= 7 ? 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.5)]' : 'bg-text-secondary/70'
                          : 'bg-bg-elev2 border border-border-subtle'
                      }`} />
                    ))}
                  </div>
                  <span className="text-xs text-text-secondary">{castles}/7</span>
                </div>
              </div>
            )
          })}
      </section>

      {/* Winner alert */}
      {hasWinner && (
        <section className="rounded-2xl border border-amber-400/40 bg-amber-950/20 px-5 py-4 flex items-center gap-3">
          <Trophy className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-200">Есть победитель!</p>
            <p className="text-xs text-amber-300/70 mt-0.5">
              {leader.p.user.nickname} набрал 7 замков. Можно финализировать.
            </p>
          </div>
          <Button variant="primary" onClick={() => navigate(`/matches/${sessionId}/finalize`)}>
            Завершить
          </Button>
        </section>
      )}

      {/* New round form */}
      {showForm ? (
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 space-y-6">
          <h2 className="font-display text-xl text-text-primary">
            Раунд {(lastSnapshot?.round_number ?? 0) + 1}
          </h2>

          {/* Influence tracks */}
          <div className="space-y-4">
            <InfluenceTrack
              label="Железный Трон"
              icon={<Trophy className="h-3.5 w-3.5" />}
              participations={participations}
              order={form.influenceThrone}
              onReorder={(order) => setForm((f) => ({ ...f, influenceThrone: order }))}
            />
            <InfluenceTrack
              label="Меч"
              icon={<Sword className="h-3.5 w-3.5" />}
              participations={participations}
              order={form.influenceSword}
              onReorder={(order) => setForm((f) => ({ ...f, influenceSword: order }))}
            />
            <InfluenceTrack
              label="Двор"
              icon={<Zap className="h-3.5 w-3.5" />}
              participations={participations}
              order={form.influenceCourt}
              onReorder={(order) => setForm((f) => ({ ...f, influenceCourt: order }))}
            />
          </div>

          {/* Supply & Castles */}
          <div>
            <h3 className="text-xs text-text-secondary uppercase tracking-widest font-medium mb-3">
              Снабжение и замки
            </h3>
            <div className="space-y-2">
              {participations.map((p) => {
                const color = FACTION_COLORS[p.faction] ?? '#888'
                const castles = form.castles[String(p.id)] ?? 0
                const supply = form.supply[String(p.id)] ?? 1
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl bg-bg-elev2 border border-border-subtle px-4 py-2.5">
                    <div className="h-5 w-1 rounded-full" style={{ background: color }} />
                    <span className="flex-1 text-xs text-text-primary truncate">{p.user.nickname}</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-text-secondary">🏰</span>
                        <NumberStepper value={castles} min={0} max={7} onChange={(v) => setForm((f) => ({ ...f, castles: { ...f.castles, [String(p.id)]: v } }))} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-text-secondary">⚓</span>
                        <NumberStepper value={supply} min={0} max={6} onChange={(v) => setForm((f) => ({ ...f, supply: { ...f.supply, [String(p.id)]: v } }))} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Wildlings */}
          <div>
            <h3 className="text-xs text-text-secondary uppercase tracking-widest font-medium mb-2">
              Угроза одичалых
            </h3>
            <WildlingsStepper
              value={form.wildlingsThreat}
              onChange={(v) => setForm((f) => ({ ...f, wildlingsThreat: v }))}
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs text-text-secondary uppercase tracking-widest font-medium mb-2">
              Заметка (необязательно)
            </label>
            <input
              type="text"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Что произошло в этом раунде…"
              className="w-full rounded-xl bg-bg-elev2 border border-border-subtle px-4 py-2.5 text-sm text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-text-secondary/40 transition"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-400">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-xl border border-border-subtle px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary transition"
            >
              Отмена
            </button>
            <Button variant="primary" onClick={handleCompleteRound} disabled={completeRoundMutation.isPending}>
              {completeRoundMutation.isPending ? (
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Сохраняем…</span>
              ) : 'Завершить раунд'}
            </Button>
          </div>
        </section>
      ) : (
        <section className="flex gap-3">
          <Button variant="primary" fullWidth onClick={handleOpenForm}>
            <span className="flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              Завершить раунд {(lastSnapshot?.round_number ?? 0) + 1}
            </span>
          </Button>
          {lastSnapshot && lastSnapshot.round_number > 0 && (
            <button
              type="button"
              onClick={handleDiscard}
              disabled={discardMutation.isPending}
              className="rounded-xl border border-border-subtle px-4 py-2.5 text-text-secondary hover:text-red-400 hover:border-red-400/40 transition disabled:opacity-40"
              title="Удалить последний раунд"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </section>
      )}

      {/* Round history */}
      {rounds.filter((r) => r.round_number > 0).length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs text-text-secondary uppercase tracking-widest font-medium px-1">
            История раундов
          </h2>
          {[...rounds].reverse().filter((r) => r.round_number > 0).map((snap) => (
            <RoundHistoryCard key={snap.id} snapshot={snap} participations={participations} />
          ))}
        </section>
      )}
    </main>
  )
}
