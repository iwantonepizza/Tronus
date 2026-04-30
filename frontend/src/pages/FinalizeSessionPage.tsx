import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Crown, Loader2, ScrollText, ShieldAlert, Sparkles } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { CelebrationOverlay } from '@/components/ui/CelebrationOverlay'
import { useFinalizeSession, useRounds, useSessionDetail } from '@/hooks/useSessions'

const FACTION_COLORS: Record<string, string> = {
  stark: '#4A7FA5', lannister: '#C9A84C', baratheon: '#F5C842',
  greyjoy: '#7B7B8D', tyrell: '#5D9B4F', martell: '#C96B36',
  arryn: '#5B8DC9', tully: '#8E3A3A', targaryen: '#B5352D',
}

function CastleBar({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className={`h-3 w-5 rounded-sm transition-all ${
          i < value
            ? value >= 7 ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]' : 'bg-text-secondary'
            : 'bg-bg-elev2 border border-border-subtle'
        }`} />
      ))}
    </div>
  )
}

export function FinalizeSessionPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const sessionId = id ? Number(id) : null

  const sessionQuery = useSessionDetail(sessionId)
  const roundsQuery = useRounds(sessionId)
  const finalizeMutation = useFinalizeSession(sessionId!)

  const [finalNote, setFinalNote] = useState('')
  const [mvpId, setMvpId] = useState<number | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [funFacts, setFunFacts] = useState<Array<{ icon: string; title: string; description: string }>>([])
  const [showFacts, setShowFacts] = useState(false)

  if (sessionId === null) return <Navigate replace to="/404" />

  if (sessionQuery.isLoading || roundsQuery.isLoading) {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-8 flex items-center gap-4">
          <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
          <p className="text-text-secondary">Загружаем данные партии…</p>
        </section>
      </main>
    )
  }

  const session = sessionQuery.data
  if (!session) return <Navigate replace to="/404" />

  if (session.status !== 'in_progress') {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-8">
          <div className="flex items-start gap-4">
            <ShieldAlert className="h-6 w-6 text-amber-400 mt-0.5" />
            <p className="text-sm text-text-secondary">Финализировать можно только партию в статусе «в процессе».</p>
          </div>
        </section>
      </main>
    )
  }

  const rounds = roundsQuery.data ?? []
  const lastRound = rounds.length > 0 ? rounds[rounds.length - 1] : null
  const castlesMap: Record<number, number> = {}
  if (lastRound) {
    for (const [k, v] of Object.entries(lastRound.castles)) castlesMap[Number(k)] = v
  }
  const throneTrack = lastRound?.influence_throne ?? []
  const thronePos = (pid: number) => { const i = throneTrack.indexOf(pid); return i === -1 ? 999 : i }
  const ranked = [...session.participations].sort((a, b) => {
    const diff = (castlesMap[b.id] ?? 0) - (castlesMap[a.id] ?? 0)
    return diff !== 0 ? diff : thronePos(a.id) - thronePos(b.id)
  })
  const winnerCastles = ranked[0] ? (castlesMap[ranked[0].id] ?? 0) : 0
  const canFinalize = winnerCastles >= 7

  const handleFinalize = async () => {
    if (!confirmed) { setConfirmed(true); return }
    try {
      const outcome = await finalizeMutation.mutateAsync({ mvp: mvpId, final_note: finalNote })
      const facts = (outcome as { fun_facts?: typeof funFacts })?.fun_facts ?? []
      if (facts.length > 0) {
        setFunFacts(facts)
        setShowFacts(true)
      } else {
        navigate(`/matches/${sessionId}`, { replace: true })
      }
    } catch { setConfirmed(false) }
  }

  return (
    <>
      <main className="mx-auto max-w-2xl space-y-6 px-4">
      <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
        <div className="flex items-center gap-3 mb-2">
          <ScrollText className="h-5 w-5 text-text-secondary" />
          <span className="text-xs text-text-secondary uppercase tracking-widest font-medium">Завершение партии</span>
        </div>
        <h1 className="font-display text-3xl text-text-primary">Подтверждение результата</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Места вычислены из последнего раунда{lastRound ? ` №${lastRound.round_number}` : ''}.
        </p>
      </section>

      {!lastRound && (
        <section className="rounded-[2rem] border border-amber-400/30 bg-amber-950/20 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
            <p className="text-sm text-amber-200">Нет раундов. Добавьте хотя бы один раунд перед финализацией.</p>
          </div>
        </section>
      )}

      {lastRound && (
        <section className="space-y-2">
          <h2 className="text-xs text-text-secondary uppercase tracking-widest font-medium px-1">Итоговые места</h2>
          {ranked.map((p, i) => {
            const castles = castlesMap[p.id] ?? 0
            const isWinner = i === 0 && canFinalize
            const color = FACTION_COLORS[p.faction] ?? '#888'
            return (
              <div key={p.id} className={`flex items-center gap-4 rounded-2xl px-5 py-3 border transition-all ${
                isWinner ? 'bg-amber-950/30 border-amber-400/30 shadow-[0_0_20px_rgba(251,191,36,0.1)]' : 'bg-bg-elev1 border-border-subtle'
              }`}>
                <span className="w-6 flex items-center justify-center">
                  {isWinner ? <Crown className="h-4 w-4 text-amber-400" /> : <span className="font-mono text-sm text-text-secondary">{i + 1}</span>}
                </span>
                <div className="h-8 w-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">{p.user.nickname}</p>
                  <p className="text-xs text-text-secondary capitalize">{p.faction}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <CastleBar value={castles} />
                  <span className="text-xs text-text-secondary">{castles}/7</span>
                </div>
                <span className="text-xs text-text-secondary/40 ml-1">☩{thronePos(p.id) + 1}</span>
              </div>
            )
          })}
        </section>
      )}

      {lastRound && !canFinalize && (
        <section className="rounded-[2rem] border border-red-400/30 bg-red-950/20 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
            <div>
              <p className="text-sm text-red-200 font-medium">Нет победителя</p>
              <p className="text-sm text-red-300/70 mt-1">
                Нужно 7 замков. Лидер: {ranked[0]?.user.nickname} ({winnerCastles} замков).
              </p>
            </div>
          </div>
        </section>
      )}

      {canFinalize && (
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 space-y-5">
          <div>
            <label className="block text-xs text-text-secondary uppercase tracking-widest font-medium mb-2">MVP (необязательно)</label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setMvpId(null)} className={`rounded-xl px-3 py-1.5 text-sm border transition-all ${mvpId === null ? 'border-border-subtle bg-bg-elev2 text-text-primary' : 'border-transparent text-text-secondary hover:border-border-subtle'}`}>
                Без MVP
              </button>
              {session.participations.map((p) => (
                <button key={p.id} type="button" onClick={() => setMvpId(p.user.id)} className={`rounded-xl px-3 py-1.5 text-sm border transition-all ${mvpId === p.user.id ? 'border-amber-400/60 bg-amber-950/20 text-amber-300' : 'border-transparent text-text-secondary hover:border-border-subtle'}`}>
                  {p.user.nickname}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-secondary uppercase tracking-widest font-medium mb-2">Заметка (необязательно)</label>
            <textarea value={finalNote} onChange={(e) => setFinalNote(e.target.value)} placeholder="Эпичный матч…" rows={3}
              className="w-full rounded-xl bg-bg-elev2 border border-border-subtle px-4 py-3 text-sm text-text-primary placeholder-text-secondary/50 resize-none focus:outline-none focus:border-text-secondary/40 transition" />
          </div>
        </section>
      )}

      {canFinalize && (
        <section className="pb-8">
          {confirmed && (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-950/20 p-4 mb-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-amber-400 mt-0.5" />
              <p className="text-sm text-amber-200">Нажмите ещё раз. Это действие необратимо.</p>
            </div>
          )}
          <Button variant="primary" fullWidth disabled={finalizeMutation.isPending} onClick={handleFinalize}>
            {finalizeMutation.isPending ? (
              <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Финализируем…</span>
            ) : confirmed ? '✓ Подтвердить завершение' : 'Завершить партию'}
          </Button>
          {finalizeMutation.isError && (
            <p className="mt-3 text-sm text-red-400 text-center">Ошибка — нет победителя с 7 замками?</p>
          )}
        </section>
      )}
    </main>

    {/* Fun facts modal */}
    {showFacts && (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
        <div className="w-full max-w-md relative rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel overflow-hidden">
          <CelebrationOverlay color={FACTION_COLORS[ranked[0]?.faction ?? ''] ?? '#d4af37'} />
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-5 w-5 text-gold" />
            <h2 className="font-display text-2xl text-text-primary">Итоги партии</h2>
          </div>
          <div className="space-y-3">
            {funFacts.map((fact, i) => (
              <div key={i} className="rounded-2xl border border-border-subtle bg-bg-base px-4 py-3">
                <p className="text-sm font-semibold text-text-primary">{fact.title}</p>
                <p className="mt-1 text-xs text-text-secondary leading-5">{fact.description}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => { setShowFacts(false); navigate(`/matches/${sessionId}`, { replace: true }) }}
            className="mt-5 w-full rounded-2xl border border-gold bg-gold/10 py-2.5 text-sm font-medium text-gold transition hover:bg-gold/20"
          >
            К карточке партии
          </button>
        </div>
      </div>
    )}
    </>
  )
}
