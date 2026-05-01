import { useCallback, useEffect } from 'react'
import { Trophy, Swords } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { FactionBadge } from '@/components/player/FactionBadge'
import { PlayerPill } from '@/components/player/PlayerPill'
import { StatTile } from '@/components/stats/StatTile'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/hooks/useAuth'
import { useHeadToHeadStats, useSuggestedHeadToHeadOpponent } from '@/hooks/useStats'
import { useUsers } from '@/hooks/useUsers'
import { formatDateTimeLong } from '@/lib/dates'

export function HeadToHeadPage() {
  const { user } = useAuth()
  const usersQuery = useUsers()
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedUserA = parseUserId(searchParams.get('user_a'))
  const selectedUserB = parseUserId(searchParams.get('user_b'))
  const effectiveUserA = selectedUserA ?? user?.id
  const suggestedOpponentQuery = useSuggestedHeadToHeadOpponent(effectiveUserA)

  const headToHeadQuery = useHeadToHeadStats(selectedUserA, selectedUserB)
  const users = usersQuery.data ?? []

  const setSelectedUsers = useCallback(
    (nextUserA?: number, nextUserB?: number) => {
      const next = new URLSearchParams()

      if (nextUserA !== undefined) {
        next.set('user_a', String(nextUserA))
      }

      if (nextUserB !== undefined) {
        next.set('user_b', String(nextUserB))
      }

      setSearchParams(next, { replace: true })
    },
    [setSearchParams],
  )

  useEffect(() => {
    if (
      selectedUserA === undefined &&
      user?.id !== undefined
    ) {
      setSelectedUsers(user.id, selectedUserB)
    }
  }, [selectedUserA, selectedUserB, setSelectedUsers, user?.id])

  useEffect(() => {
    const suggestedUserB = suggestedOpponentQuery.data

    if (
      effectiveUserA === undefined ||
      selectedUserB !== undefined ||
      suggestedUserB === undefined ||
      suggestedUserB === null ||
      suggestedUserB === effectiveUserA
    ) {
      return
    }

    setSelectedUsers(effectiveUserA, suggestedUserB)
  }, [effectiveUserA, selectedUserB, setSelectedUsers, suggestedOpponentQuery.data])

  const comparisonReady =
    selectedUserA !== undefined &&
    selectedUserB !== undefined &&
    selectedUserA !== selectedUserB

  if (usersQuery.isLoading) {
    return <PageStatus title="Загружаем игроков для сравнения..." />
  }

  if (usersQuery.isError) {
    return (
      <EmptyState
        icon={<Swords className="h-5 w-5" />}
        title="Сравнение недоступно"
        description="Публичный список пользователей не ответил, поэтому сравнение пока не собрать."
      />
    )
  }

  return (
    <main className="space-y-6">
      <header className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
          Лицом к лицу
        </p>
        <h1 className="mt-4 font-display text-4xl text-text-primary md:text-5xl">
          Сравнение игроков
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-text-secondary">
          Сравните двух игроков по общим партиям: победам, более высоким
          местам, любимым фракциям в этом матчапе и всей истории встреч.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
          <Select
            label="Игрок A"
            value={selectedUserA ? String(selectedUserA) : ''}
            options={[
              { label: 'Выберите игрока', value: '' },
              ...users.map((user) => ({
                label: user.nickname,
                value: String(user.id),
              })),
            ]}
            onChange={(event) =>
              setSelectedUsers(
                parseUserId(event.target.value),
                selectedUserB,
              )
            }
          />

          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border-subtle bg-bg-base px-4 text-sm font-semibold text-text-primary transition hover:border-gold hover:text-gold"
            onClick={() => setSelectedUsers(selectedUserB, selectedUserA)}
          >
            Поменять местами
          </button>

          <Select
            label="Игрок B"
            value={selectedUserB ? String(selectedUserB) : ''}
            options={[
              { label: 'Выберите игрока', value: '' },
              ...users.map((user) => ({
                label: user.nickname,
                value: String(user.id),
              })),
            ]}
            onChange={(event) =>
              setSelectedUsers(
                selectedUserA,
                parseUserId(event.target.value),
              )
            }
          />
        </div>
      </header>

      {!comparisonReady ? (
        <EmptyState
          icon={<Trophy className="h-5 w-5" />}
          title="Выберите двух разных игроков"
          description="Нужно указать обе стороны, чтобы загрузить их личное противостояние и общую историю."
        />
      ) : null}

      {selectedUserA !== undefined &&
      selectedUserB !== undefined &&
      selectedUserA === selectedUserB ? (
        <EmptyState
          icon={<Trophy className="h-5 w-5" />}
          title="Один и тот же игрок выбран дважды"
          description="Для сравнения нужны два разных игрока."
        />
      ) : null}

      {comparisonReady && headToHeadQuery.isLoading ? (
        <PageStatus title="Загружаем расклад по противостоянию..." />
      ) : null}

      {comparisonReady && (headToHeadQuery.isError || !headToHeadQuery.data) ? (
        <EmptyState
          icon={<Swords className="h-5 w-5" />}
          title="Сравнение не найдено"
          description="Бэкенд не вернул корректный payload для этой пары игроков."
        />
      ) : null}

      {comparisonReady && headToHeadQuery.data ? (
        <HeadToHeadContent stats={headToHeadQuery.data} />
      ) : null}
    </main>
  )
}

function HeadToHeadContent({
  stats,
}: {
  stats: NonNullable<ReturnType<typeof useHeadToHeadStats>['data']>
}) {
  return (
    <>
      <section className="grid gap-6 rounded-[2rem] border border-border-subtle bg-[radial-gradient(circle_at_top,_rgba(201,164,76,0.14),_transparent_36%),linear-gradient(145deg,_rgba(23,23,31,1),_rgba(16,16,22,0.96))] p-6 shadow-panel lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="space-y-4">
          <PlayerPill size="lg" user={stats.userA} />
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniComparisonCard label="Победы" value={stats.wins.userA} />
            <MiniComparisonCard
              label="Более высокие места"
              value={stats.higherPlace.userA}
            />
          </div>
          <FavoriteFactionCard
            label="Любимая фракция в матчапе"
            slug={stats.favoriteFactions.userA}
          />
        </div>

        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-gold/30 bg-bg-base font-display text-2xl text-gold">
          VS
        </div>

        <div className="space-y-4">
          <PlayerPill size="lg" user={stats.userB} />
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniComparisonCard label="Победы" value={stats.wins.userB} />
            <MiniComparisonCard
              label="Более высокие места"
              value={stats.higherPlace.userB}
            />
          </div>
          <FavoriteFactionCard
            label="Любимая фракция в матчапе"
            slug={stats.favoriteFactions.userB}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatTile label="Партий вместе" value={stats.gamesTogether} />
        <StatTile
          label={`Доля побед ${stats.userA.nickname}`}
          value={formatShare(stats.gamesTogether, stats.wins.userA)}
        />
        <StatTile
          label={`Доля побед ${stats.userB.nickname}`}
          value={formatShare(stats.gamesTogether, stats.wins.userB)}
        />
      </section>

      <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-3xl text-text-primary">
              Общие партии
            </h2>
            <p className="mt-2 text-sm leading-7 text-text-secondary">
              Завершённые партии, где присутствовали оба игрока, с прямым
              сравнением мест и количества замков.
            </p>
          </div>
          <span className="text-sm text-text-tertiary">
            {stats.matches.length} зафиксированных партий
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {stats.matches.map((match) => (
            <article
              key={match.id}
              className="rounded-[1.75rem] border border-border-subtle bg-bg-base p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <Link
                    to={`/matches/${match.id}`}
                    className="font-display text-2xl text-text-primary transition hover:text-gold"
                  >
                    Партия #{match.id}
                  </Link>
                  <p className="mt-2 text-sm text-text-secondary">
                    {formatDate(match.scheduledAt)} • {match.mode.name} •{' '}
                    Колода: {match.deck.name}
                  </p>
                </div>
                <div className="text-sm text-text-tertiary">
                  Снимок общего противостояния
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <MatchSideCard
                  userLabel={stats.userA.nickname}
                  side={match.userA}
                />
                <MatchSideCard
                  userLabel={stats.userB.nickname}
                  side={match.userB}
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

function MatchSideCard({
  side,
  userLabel,
}: {
  side: NonNullable<ReturnType<typeof useHeadToHeadStats>['data']>['matches'][number]['userA']
  userLabel: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-border-subtle bg-bg-elev1 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-text-primary">{userLabel}</p>
        {side.isWinner ? (
          <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-gold">
            Победитель
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <FactionBadge factionSlug={side.faction} size="sm" />
        <span className="rounded-full border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-secondary">
          Место {side.place ?? '-'}
        </span>
        <span className="rounded-full border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-secondary">
          Замки {side.castles ?? '-'}
        </span>
      </div>
    </div>
  )
}

function FavoriteFactionCard({
  label,
  slug,
}: {
  label: string
  slug: NonNullable<ReturnType<typeof useHeadToHeadStats>['data']>['favoriteFactions']['userA']
}) {
  return (
    <div className="rounded-[1.5rem] border border-border-subtle bg-bg-base px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
        {label}
      </p>
      <div className="mt-3">
        {slug ? (
          <FactionBadge factionSlug={slug} />
        ) : (
          <span className="text-sm text-text-secondary">Пока без явного фаворита</span>
        )}
      </div>
    </div>
  )
}

function MiniComparisonCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-[1.5rem] border border-border-subtle bg-bg-base px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl text-text-primary">{value}</p>
    </div>
  )
}

function PageStatus({ title }: { title: string }) {
  return (
    <main className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
      <p className="font-display text-3xl text-text-primary">{title}</p>
    </main>
  )
}

function parseUserId(value: string | null) {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function formatShare(total: number, wins: number) {
  if (total === 0) {
    return '-'
  }

  return `${Math.round((wins / total) * 100)}%`
}

function formatDate(value: string) {
  return formatDateTimeLong(value)
}
