import { Trophy, Swords } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { FactionBadge } from '@/components/player/FactionBadge'
import { PlayerPill } from '@/components/player/PlayerPill'
import { StatTile } from '@/components/stats/StatTile'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import { useHeadToHeadStats } from '@/hooks/useStats'
import { useUsers } from '@/hooks/useUsers'

export function HeadToHeadPage() {
  const usersQuery = useUsers()
  const [searchParams, setSearchParams] = useSearchParams()

  const selectedUserA = parseUserId(searchParams.get('user_a'))
  const selectedUserB = parseUserId(searchParams.get('user_b'))

  const headToHeadQuery = useHeadToHeadStats(selectedUserA, selectedUserB)
  const users = usersQuery.data ?? []

  const setSelectedUsers = (nextUserA?: number, nextUserB?: number) => {
    const next = new URLSearchParams()

    if (nextUserA !== undefined) {
      next.set('user_a', String(nextUserA))
    }

    if (nextUserB !== undefined) {
      next.set('user_b', String(nextUserB))
    }

    setSearchParams(next, { replace: true })
  }

  const comparisonReady =
    selectedUserA !== undefined &&
    selectedUserB !== undefined &&
    selectedUserA !== selectedUserB

  if (usersQuery.isLoading) {
    return <PageStatus title="Loading players for comparison..." />
  }

  if (usersQuery.isError) {
    return (
      <EmptyState
        icon={<Swords className="h-5 w-5" />}
        title="Comparison is unavailable"
        description="The public users endpoint did not respond, so head-to-head cannot be assembled yet."
      />
    )
  }

  return (
    <main className="space-y-6">
      <header className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
          Head To Head
        </p>
        <h1 className="mt-4 font-display text-4xl text-text-primary md:text-5xl">
          Player comparison
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-text-secondary">
          Compare two players across shared matches: wins, higher placements,
          favorite factions in the matchup and the full common history.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
          <Select
            label="Player A"
            value={selectedUserA ? String(selectedUserA) : ''}
            options={[
              { label: 'Choose player', value: '' },
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
            Swap
          </button>

          <Select
            label="Player B"
            value={selectedUserB ? String(selectedUserB) : ''}
            options={[
              { label: 'Choose player', value: '' },
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
          title="Pick two different players"
          description="Select both sides to load their direct rivalry and shared match history."
        />
      ) : null}

      {selectedUserA !== undefined &&
      selectedUserB !== undefined &&
      selectedUserA === selectedUserB ? (
        <EmptyState
          icon={<Trophy className="h-5 w-5" />}
          title="Same player selected twice"
          description="Head-to-head requires two different players."
        />
      ) : null}

      {comparisonReady && headToHeadQuery.isLoading ? (
        <PageStatus title="Loading rivalry breakdown..." />
      ) : null}

      {comparisonReady && (headToHeadQuery.isError || !headToHeadQuery.data) ? (
        <EmptyState
          icon={<Swords className="h-5 w-5" />}
          title="Head-to-head was not found"
          description="The backend did not return a valid comparison payload for this pair."
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
            <MiniComparisonCard label="Wins" value={stats.wins.userA} />
            <MiniComparisonCard
              label="Higher placements"
              value={stats.higherPlace.userA}
            />
          </div>
          <FavoriteFactionCard
            label="Favorite matchup faction"
            slug={stats.favoriteFactions.userA}
          />
        </div>

        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-gold/30 bg-bg-base font-display text-2xl text-gold">
          VS
        </div>

        <div className="space-y-4">
          <PlayerPill size="lg" user={stats.userB} />
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniComparisonCard label="Wins" value={stats.wins.userB} />
            <MiniComparisonCard
              label="Higher placements"
              value={stats.higherPlace.userB}
            />
          </div>
          <FavoriteFactionCard
            label="Favorite matchup faction"
            slug={stats.favoriteFactions.userB}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatTile label="Games together" value={stats.gamesTogether} />
        <StatTile
          label={`${stats.userA.nickname} win share`}
          value={formatShare(stats.gamesTogether, stats.wins.userA)}
        />
        <StatTile
          label={`${stats.userB.nickname} win share`}
          value={formatShare(stats.gamesTogether, stats.wins.userB)}
        />
      </section>

      <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-display text-3xl text-text-primary">
              Shared matches
            </h2>
            <p className="mt-2 text-sm leading-7 text-text-secondary">
              Completed sessions where both players were present, with direct
              placement and castle totals side by side.
            </p>
          </div>
          <span className="text-sm text-text-tertiary">
            {stats.matches.length} recorded matches
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
                    Match #{match.id}
                  </Link>
                  <p className="mt-2 text-sm text-text-secondary">
                    {formatDate(match.scheduledAt)} • {match.mode.name} •{' '}
                    {match.deck.name}
                  </p>
                </div>
                <div className="text-sm text-text-tertiary">
                  Shared rivalry snapshot
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
            Winner
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <FactionBadge factionSlug={side.faction} size="sm" />
        <span className="rounded-full border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-secondary">
          Place {side.place ?? '-'}
        </span>
        <span className="rounded-full border border-border-subtle bg-bg-base px-3 py-2 text-sm text-text-secondary">
          Castles {side.castles ?? '-'}
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
          <span className="text-sm text-text-secondary">No clear favorite yet</span>
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
  return new Date(value).toLocaleString()
}
