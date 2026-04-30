import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Castle,
  Crown,
  Loader2,
  ScrollText,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { CelebrationOverlay } from '@/components/ui/CelebrationOverlay'
import { useFinalizePlayedSession, useSessionDetail } from '@/hooks/useSessions'
import { useReferenceData } from '@/hooks/useReferenceData'
import { useUsers } from '@/hooks/useUsers'
import type { EndReason, FactionSlug, FinalizePlayedResultItem } from '@/api/types'

const FACTION_COLORS: Record<string, string> = {
  stark: '#4A7FA5',
  lannister: '#C9A84C',
  baratheon: '#F5C842',
  greyjoy: '#7B7B8D',
  tyrell: '#5D9B4F',
  martell: '#C96B36',
  arryn: '#5B8DC9',
  tully: '#8E3A3A',
  targaryen: '#B5352D',
}

const END_REASON_LABELS: Array<{ value: EndReason; label: string }> = [
  { value: 'castles_7', label: '7 замков' },
  { value: 'timer', label: 'Таймер' },
  { value: 'rounds_end', label: 'Раунды кончились' },
  { value: 'early', label: 'Досрочно' },
  { value: 'other', label: 'Другое' },
]

interface ResultRow {
  rowId: number
  user_id: number | null
  faction_slug: FactionSlug | ''
  place: number
  castles: number
}

let nextRowId = 1
function makeRow(place: number): ResultRow {
  return {
    rowId: nextRowId++,
    user_id: null,
    faction_slug: '',
    place,
    castles: 0,
  }
}

export function FinalizePlayedPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const sessionId = id ? Number(id) : null

  const sessionQuery = useSessionDetail(sessionId)
  const referenceQuery = useReferenceData()
  const usersQuery = useUsers()
  const finalizeMutation = useFinalizePlayedSession(sessionId!)

  const [rows, setRows] = useState<ResultRow[]>(() => [makeRow(1), makeRow(2), makeRow(3)])
  const [endReason, setEndReason] = useState<EndReason>('castles_7')
  const [roundsPlayed, setRoundsPlayed] = useState(6)
  const [mvpId, setMvpId] = useState<number | null>(null)
  const [finalNote, setFinalNote] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  // Set the winner's castles to 7 by default whenever end_reason === 'castles_7'
  useEffect(() => {
    if (endReason !== 'castles_7') return
    setRows((prev) =>
      prev.map((row) => (row.place === 1 ? { ...row, castles: 7 } : row)),
    )
  }, [endReason])

  if (sessionId === null) return <Navigate replace to="/404" />

  if (
    sessionQuery.isLoading ||
    referenceQuery.isLoading ||
    usersQuery.isLoading
  ) {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-8 flex items-center gap-4">
          <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
          <p className="text-text-secondary">Загружаем партию…</p>
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
            <div>
              <p className="text-sm text-text-primary">
                Эта партия уже не запланирована, ретроактивную запись сделать
                нельзя.
              </p>
              <p className="text-sm text-text-secondary mt-2">
                Используйте обычное завершение через раунды.
              </p>
            </div>
          </div>
        </section>
      </main>
    )
  }

  const allFactions = referenceQuery.data?.factions ?? []
  const allUsers = usersQuery.data ?? []
  const usedFactions = new Set(
    rows.map((r) => r.faction_slug).filter(Boolean) as string[],
  )
  const usedUserIds = new Set(
    rows.map((r) => r.user_id).filter((id): id is number => id !== null),
  )

  const availableFactions = (currentSlug: string) =>
    allFactions.filter((f) => f.slug === currentSlug || !usedFactions.has(f.slug))

  const availableUsers = (currentUserId: number | null) =>
    allUsers.filter(
      (u) => u.id === currentUserId || !usedUserIds.has(u.id),
    )

  const updateRow = (rowId: number, patch: Partial<ResultRow>) => {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)))
  }

  const addRow = () => {
    setRows((prev) => [...prev, makeRow(prev.length + 1)])
  }

  const removeRow = (rowId: number) => {
    setRows((prev) => {
      const filtered = prev.filter((r) => r.rowId !== rowId)
      // Re-number places to be 1..N continuous after a removal.
      return filtered.map((r, index) => ({ ...r, place: index + 1 }))
    })
  }

  const moveRow = (rowId: number, direction: -1 | 1) => {
    setRows((prev) => {
      const index = prev.findIndex((r) => r.rowId === rowId)
      const target = index + direction
      if (index === -1 || target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next.map((r, i) => ({ ...r, place: i + 1 }))
    })
  }

  const validate = (): string | null => {
    if (rows.length < (session.mode.minPlayers ?? 2)) {
      return `Нужно минимум ${session.mode.minPlayers ?? 2} игроков для режима «${session.mode.name}».`
    }
    if (rows.length > (session.mode.maxPlayers ?? 8)) {
      return `Слишком много игроков для режима «${session.mode.name}».`
    }
    for (const row of rows) {
      if (row.user_id === null) {
        return `Не выбран игрок на месте ${row.place}.`
      }
      if (!row.faction_slug) {
        return `Не выбрана фракция для игрока на месте ${row.place}.`
      }
    }
    if (endReason === 'castles_7') {
      const winner = rows.find((r) => r.place === 1)
      if (!winner || winner.castles < 7) {
        return 'При завершении по 7 замкам у победителя должно быть 7 замков.'
      }
    }
    return null
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    const error = validate()
    if (error) {
      setSubmitError(error)
      return
    }
    if (!confirmed) {
      setConfirmed(true)
      return
    }

    const payload = {
      results: rows.map<FinalizePlayedResultItem>((r) => ({
        user_id: r.user_id!,
        faction_slug: r.faction_slug as FactionSlug,
        place: r.place,
        castles: r.castles,
      })),
      rounds_played: roundsPlayed,
      end_reason: endReason,
      mvp: mvpId,
      final_note: finalNote,
    }

    try {
      await finalizeMutation.mutateAsync(payload)
      setShowCelebration(true)
    } catch (err) {
      setConfirmed(false)
      const apiMessage = (err as { details?: Record<string, string[]>; message?: string })?.message
      setSubmitError(apiMessage ?? 'Не удалось сохранить партию. Попробуйте ещё раз.')
    }
  }

  const winner = rows.find((r) => r.place === 1)
  const winnerColor = winner?.faction_slug
    ? FACTION_COLORS[winner.faction_slug] ?? '#d4af37'
    : '#d4af37'

  return (
    <>
      <main className="mx-auto max-w-3xl space-y-6 px-4 pb-12">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <div className="flex items-center gap-3 mb-2">
            <ScrollText className="h-5 w-5 text-text-secondary" />
            <span className="text-xs text-text-secondary uppercase tracking-widest font-medium">
              Партия задним числом
            </span>
          </div>
          <h1 className="font-display text-3xl text-text-primary">
            Записать результаты
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Режим: <span className="text-text-primary">{session.mode.name}</span>
            <span className="mx-2 text-text-tertiary">·</span>
            Колода: <span className="text-text-primary">{session.deck.name}</span>
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            Без раундов и приглашений: добавьте игроков, проставьте места и
            замки, и партия сразу попадёт в историю.
          </p>
        </section>

        {/* Results table */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs text-text-secondary uppercase tracking-widest font-medium">
              Игроки и места
            </h2>
            <button
              type="button"
              onClick={addRow}
              className="text-xs text-text-secondary hover:text-text-primary border border-border-subtle rounded-xl px-3 py-1.5 transition"
            >
              + Добавить игрока
            </button>
          </div>

          {rows.map((row, index) => {
            const color = row.faction_slug
              ? FACTION_COLORS[row.faction_slug] ?? '#888'
              : '#444'
            return (
              <div
                key={row.rowId}
                className={`grid grid-cols-[auto_auto_1fr_180px_auto_auto] gap-3 items-center rounded-2xl px-4 py-3 border transition-all ${
                  row.place === 1
                    ? 'bg-amber-950/20 border-amber-400/30'
                    : 'bg-bg-elev1 border-border-subtle'
                }`}
              >
                <span className="w-6 flex items-center justify-center">
                  {row.place === 1 ? (
                    <Crown className="h-4 w-4 text-amber-400" />
                  ) : (
                    <span className="font-mono text-sm text-text-secondary">
                      {row.place}
                    </span>
                  )}
                </span>
                <div
                  className="h-8 w-1.5 rounded-full"
                  style={{ background: color }}
                />
                <select
                  value={row.user_id ?? ''}
                  onChange={(e) =>
                    updateRow(row.rowId, {
                      user_id: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="rounded-xl bg-bg-elev2 border border-border-subtle px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-text-secondary/40 transition"
                >
                  <option value="">— игрок —</option>
                  {availableUsers(row.user_id).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nickname}
                    </option>
                  ))}
                </select>
                <select
                  value={row.faction_slug}
                  onChange={(e) =>
                    updateRow(row.rowId, {
                      faction_slug: e.target.value as FactionSlug,
                    })
                  }
                  className="rounded-xl bg-bg-elev2 border border-border-subtle px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-text-secondary/40 transition"
                >
                  <option value="">— фракция —</option>
                  {availableFactions(row.faction_slug).map((f) => (
                    <option key={f.slug} value={f.slug}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <Castle className="h-3.5 w-3.5 text-text-secondary" />
                  <input
                    type="number"
                    min={0}
                    max={7}
                    value={row.castles}
                    onChange={(e) =>
                      updateRow(row.rowId, {
                        castles: Math.max(
                          0,
                          Math.min(7, Number(e.target.value) || 0),
                        ),
                      })
                    }
                    className="w-12 rounded-lg bg-bg-elev2 border border-border-subtle px-2 py-1 text-sm text-text-primary text-center focus:outline-none focus:border-text-secondary/40 transition"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveRow(row.rowId, -1)}
                    disabled={index === 0}
                    className="text-xs text-text-secondary hover:text-text-primary border border-border-subtle rounded px-2 py-1 transition disabled:opacity-30"
                    title="Поднять выше"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveRow(row.rowId, 1)}
                    disabled={index === rows.length - 1}
                    className="text-xs text-text-secondary hover:text-text-primary border border-border-subtle rounded px-2 py-1 transition disabled:opacity-30"
                    title="Опустить ниже"
                  >
                    ↓
                  </button>
                  {rows.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeRow(row.rowId)}
                      className="text-xs text-text-secondary hover:text-red-400 border border-border-subtle hover:border-red-400/40 rounded px-2 py-1 transition ml-1"
                      title="Убрать игрока"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </section>

        {/* Match meta */}
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 space-y-5">
          <div>
            <label className="block text-xs text-text-secondary uppercase tracking-widest font-medium mb-2">
              Причина окончания
            </label>
            <div className="flex flex-wrap gap-2">
              {END_REASON_LABELS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEndReason(opt.value)}
                  className={`rounded-xl px-3 py-1.5 text-sm border transition-all ${
                    endReason === opt.value
                      ? 'border-text-primary/40 bg-bg-elev2 text-text-primary'
                      : 'border-transparent text-text-secondary hover:border-border-subtle'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-secondary uppercase tracking-widest font-medium mb-2">
              Сыграно раундов
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={roundsPlayed}
              onChange={(e) =>
                setRoundsPlayed(
                  Math.max(1, Math.min(10, Number(e.target.value) || 1)),
                )
              }
              className="w-24 rounded-xl bg-bg-elev2 border border-border-subtle px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-text-secondary/40 transition"
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary uppercase tracking-widest font-medium mb-2">
              MVP (необязательно)
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setMvpId(null)}
                className={`rounded-xl px-3 py-1.5 text-sm border transition-all ${
                  mvpId === null
                    ? 'border-border-subtle bg-bg-elev2 text-text-primary'
                    : 'border-transparent text-text-secondary hover:border-border-subtle'
                }`}
              >
                Без MVP
              </button>
              {rows
                .filter((r) => r.user_id !== null)
                .map((r) => {
                  const u = allUsers.find((p) => p.id === r.user_id)
                  if (!u) return null
                  return (
                    <button
                      key={r.user_id}
                      type="button"
                      onClick={() => setMvpId(r.user_id)}
                      className={`rounded-xl px-3 py-1.5 text-sm border transition-all ${
                        mvpId === r.user_id
                          ? 'border-amber-400/60 bg-amber-950/20 text-amber-300'
                          : 'border-transparent text-text-secondary hover:border-border-subtle'
                      }`}
                    >
                      {u.nickname}
                    </button>
                  )
                })}
            </div>
          </div>

          <div>
            <label className="block text-xs text-text-secondary uppercase tracking-widest font-medium mb-2">
              Заметка (необязательно)
            </label>
            <textarea
              value={finalNote}
              onChange={(e) => setFinalNote(e.target.value)}
              placeholder="Что было особенного…"
              rows={3}
              className="w-full rounded-xl bg-bg-elev2 border border-border-subtle px-4 py-3 text-sm text-text-primary placeholder-text-secondary/50 resize-none focus:outline-none focus:border-text-secondary/40 transition"
            />
          </div>
        </section>

        {submitError && (
          <section className="rounded-2xl border border-red-400/30 bg-red-950/20 px-5 py-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
              <p className="text-sm text-red-300">{submitError}</p>
            </div>
          </section>
        )}

        <section className="pb-2">
          {confirmed && (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-950/20 p-4 mb-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-amber-400 mt-0.5" />
              <p className="text-sm text-amber-200">
                Нажмите ещё раз. Это действие необратимо.
              </p>
            </div>
          )}
          <Button
            variant="primary"
            fullWidth
            disabled={finalizeMutation.isPending}
            onClick={handleSubmit}
          >
            {finalizeMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Сохраняем…
              </span>
            ) : confirmed ? (
              '✓ Подтвердить и сохранить'
            ) : (
              'Сохранить партию'
            )}
          </Button>
        </section>
      </main>

      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md relative rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel overflow-hidden">
            <CelebrationOverlay color={winnerColor} />
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="h-5 w-5 text-gold" />
              <h2 className="font-display text-2xl text-text-primary">
                Партия сохранена
              </h2>
            </div>
            <p className="text-sm text-text-secondary">
              Победитель — {allUsers.find((u) => u.id === winner?.user_id)?.nickname ?? '—'}.
              Открываем карточку партии.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowCelebration(false)
                navigate(`/matches/${sessionId}`, { replace: true })
              }}
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
