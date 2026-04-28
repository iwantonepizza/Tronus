import { useState } from 'react'
import type { ReactNode } from 'react'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Castle,
  Crown,
  MessageSquare,
  ScrollText,
  Trophy,
  Users,
} from 'lucide-react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { CommentThread } from '@/components/comments/CommentThread'
import { PlacementRow } from '@/components/match/PlacementRow'
import { VoteButtons } from '@/components/match/VoteButtons'
import { PlayerPill } from '@/components/player/PlayerPill'
import { StatTile } from '@/components/stats/StatTile'
import { Button } from '@/components/ui/Button'
import { useComments, usePostComment } from '@/hooks/useComments'
import { useAuth } from '@/hooks/useAuth'
import { useSessionDetail } from '@/hooks/useSessions'
import {
  useCastVote,
  useDeleteVote,
  useUpdateVote,
  useVotes,
} from '@/hooks/useVotes'
import type { DomainComment, DomainVote } from '@/types/domain'

const USE_MOCKS = __USE_MOCKS__

const endReasonLabels: Record<string, string> = {
  castles_7: '7 замков',
  timer: 'Таймер',
  rounds_end: 'Конец раундов',
  early: 'Досрочно',
  other: 'Другое',
}

export function MatchDetailPage() {
  const location = useLocation()
  const { id } = useParams()
  const sessionId = id ? Number(id) : null
  const { user } = useAuth()
  const sessionQuery = useSessionDetail(sessionId)
  const commentsQuery = useComments(sessionId)
  const votesQuery = useVotes(sessionId)

  if (sessionQuery.isLoading || commentsQuery.isLoading || votesQuery.isLoading) {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
          <p className="font-display text-3xl text-text-primary">
            Загружаем карточку партии…
          </p>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            Подтягиваем сессию, комментарии и голоса участников.
          </p>
        </section>
      </main>
    )
  }

  if (sessionQuery.isError || commentsQuery.isError || votesQuery.isError) {
    return <Navigate replace to="/404" />
  }

  const stateMatch =
    USE_MOCKS &&
    (location.state as { match?: typeof sessionQuery.data } | null)?.match &&
    String(
      (location.state as { match?: typeof sessionQuery.data } | null)?.match?.id,
    ) === id
      ? (location.state as { match?: typeof sessionQuery.data } | null)?.match
      : null

  if (!sessionQuery.data && !stateMatch) {
    return <Navigate replace to="/404" />
  }

  const match = (stateMatch ?? sessionQuery.data)!

  return (
    <MatchDetailContent
      comments={commentsQuery.data ?? []}
      currentUser={user}
      initialMatch={match}
      initialVotes={votesQuery.data ?? []}
    />
  )
}

function MatchDetailContent({
  comments,
  currentUser,
  initialMatch,
  initialVotes,
}: {
  comments: DomainComment[]
  currentUser: ReturnType<typeof useAuth>['user']
  initialMatch: NonNullable<ReturnType<typeof useSessionDetail>['data']>
  initialVotes: DomainVote[]
}) {
  const postCommentMutation = usePostComment(initialMatch.id)
  const castVoteMutation = useCastVote(initialMatch.id)
  const updateVoteMutation = useUpdateVote(initialMatch.id)
  const deleteVoteMutation = useDeleteVote(initialMatch.id)
  const [commentDraft, setCommentDraft] = useState('')
  const [mockComments, setMockComments] = useState<DomainComment[]>(comments)
  const [mockVotes, setMockVotes] = useState<DomainVote[]>(initialVotes)
  const match = initialMatch
  const votes = USE_MOCKS ? mockVotes : initialVotes
  const resolvedComments = USE_MOCKS ? mockComments : comments

  const sortedParticipations = [...match.participations].sort(
    (left, right) => (left.place ?? 99) - (right.place ?? 99),
  )

  const handleVote = async (
    toUserId: number,
    voteType: DomainVote['voteType'],
  ) => {
    if (!currentUser) {
      return
    }

    const currentVotes = USE_MOCKS ? mockVotes : votes
    const existingVote = currentVotes.find(
      (vote) =>
        vote.fromUser.id === currentUser.id && vote.toUser.id === toUserId,
    )

    if (USE_MOCKS) {
      if (existingVote) {
        if (existingVote.voteType === voteType) {
          setMockVotes((current) =>
            current.filter((vote) => vote.id !== existingVote.id),
          )
          return
        }

        setMockVotes((current) =>
          current.map((vote) =>
            vote.id === existingVote.id ? { ...vote, voteType } : vote,
          ),
        )
        return
      }

      const recipient = match.participations.find(
        (participation) => participation.user.id === toUserId,
      )?.user

      if (!recipient) {
        return
      }

      setMockVotes((current) => [
        {
          id: Date.now(),
          fromUser: {
            id: currentUser.id,
            nickname: currentUser.nickname,
            favoriteFaction: currentUser.favorite_faction,
            currentAvatarUrl: currentUser.current_avatar,
            dateJoined: currentUser.date_joined,
          },
          toUser: recipient,
          voteType,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ])
      return
    }

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        await deleteVoteMutation.mutateAsync(existingVote.id)
        return
      }

      await updateVoteMutation.mutateAsync({
        voteId: existingVote.id,
        voteType,
      })
      return
    }

    await castVoteMutation.mutateAsync({ toUserId, voteType })
  }

  const handlePostComment = async () => {
    const nextBody = commentDraft.trim()

    if (!nextBody) {
      return
    }

    if (USE_MOCKS) {
      if (!currentUser) {
        return
      }

      setMockComments((current) => [
        {
          id: Date.now(),
          author: {
            id: currentUser.id,
            nickname: currentUser.nickname,
            favoriteFaction: currentUser.favorite_faction,
            currentAvatarUrl: currentUser.current_avatar,
            dateJoined: currentUser.date_joined,
          },
          body: nextBody,
          createdAt: new Date().toISOString(),
          editedAt: null,
        },
        ...current,
      ])
      setCommentDraft('')
      return
    }

    await postCommentMutation.mutateAsync(nextBody)
    setCommentDraft('')
  }

  const totalCrowns = votes.filter(
    (vote) => vote.voteType === 'positive',
  ).length
  const totalShits = votes.filter((vote) => vote.voteType === 'negative').length

  return (
    <main className="space-y-6">
      <Link
        to="/matches"
        className="inline-flex items-center gap-2 text-sm font-medium text-gold transition hover:text-gold-hover"
      >
        <ArrowLeft className="h-4 w-4" />
        Все партии
      </Link>

      <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-gold/12 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-gold">
            {match.status === 'completed'
              ? 'Завершена'
              : match.status === 'planned'
                ? 'Запланирована'
                : 'Отменена'}
          </span>
          <span className="rounded-full border border-border-subtle bg-bg-base px-3 py-1 text-xs text-text-secondary">
            Match #{match.id}
          </span>
          <span className="rounded-full border border-border-subtle bg-bg-base px-3 py-1 text-xs text-text-secondary">
            {match.mode.name}
          </span>
          <span className="rounded-full border border-border-subtle bg-bg-base px-3 py-1 text-xs text-text-secondary">
            {match.deck.name}
          </span>
        </div>

        <h1 className="mt-5 font-display text-4xl text-text-primary md:text-5xl">
          Карточка партии
        </h1>
        <p className="mt-3 text-base leading-7 text-text-secondary">
          {format(new Date(match.scheduledAt), 'dd MMMM yyyy, HH:mm')} • host{' '}
          {match.createdBy.nickname}
        </p>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-text-secondary">
          {match.planningNote}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          {match.status === 'planned' ? (
            <>
              <Button variant="secondary">Я иду</Button>
              <Button variant="ghost">Под вопросом</Button>
              <Button variant="ghost">Не иду</Button>
              <Link
                to={`/matches/${match.id}/edit`}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-border-subtle px-4 text-sm font-semibold text-text-primary transition hover:border-gold hover:text-gold"
              >
                Редактировать
              </Link>
              <Link
                to={`/matches/${match.id}/finalize`}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-gold px-4 text-sm font-semibold text-black transition hover:bg-gold-hover"
              >
                Финализировать
              </Link>
            </>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary">Открыть профиль победителя</Button>
              <Button variant="ghost">Поделиться ссылкой</Button>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-3xl text-text-primary">
                Result board
              </h2>
              <span className="text-sm text-text-secondary">
                Участников: {sortedParticipations.length}
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {sortedParticipations.map((participation) => (
                <Link
                  key={participation.id}
                  to={`/players/${participation.user.id}`}
                  className="block"
                >
                  <PlacementRow participation={participation} />
                </Link>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <StatTile
              icon={<ScrollText className="h-5 w-5" />}
              label="Раундов"
              value={match.outcome?.roundsPlayed ?? '—'}
            />
            <StatTile
              icon={<Trophy className="h-5 w-5" />}
              label="Причина"
              value={
                match.outcome
                  ? endReasonLabels[match.outcome.endReason]
                  : 'Итог ещё не зафиксирован'
              }
            />
            <StatTile
              icon={<Crown className="h-5 w-5" />}
              label="MVP"
              value={match.outcome?.mvp?.nickname ?? '—'}
            />
          </section>

          {match.outcome?.finalNote ? (
            <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
              <h2 className="font-display text-3xl text-text-primary">
                Outcome note
              </h2>
              <p className="mt-4 text-sm leading-7 text-text-secondary">
                {match.outcome.finalNote}
              </p>
            </section>
          ) : null}

          <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-3xl text-text-primary">
                Голоса участников
              </h2>
              <span className="text-sm text-text-secondary">
                🜁 {totalCrowns} / 💩 {totalShits}
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {sortedParticipations.map((participation) => {
                const receivedCrowns = votes.filter(
                  (vote) =>
                    vote.toUser.id === participation.user.id &&
                    vote.voteType === 'positive',
                ).length
                const receivedShits = votes.filter(
                  (vote) =>
                    vote.toUser.id === participation.user.id &&
                    vote.voteType === 'negative',
                ).length
                const myVote =
                  votes.find(
                    (vote) =>
                    vote.fromUser.id === currentUser?.id &&
                    vote.toUser.id === participation.user.id,
                  )?.voteType ?? null

                return (
                  <div
                    key={participation.id}
                    className="flex flex-col gap-4 rounded-[1.5rem] border border-border-subtle bg-bg-base p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-2">
                      <PlayerPill
                        faction={participation.faction}
                        user={participation.user}
                      />
                      <p className="text-sm text-text-secondary">
                        Получено: 🜁 {receivedCrowns} • 💩 {receivedShits}
                      </p>
                    </div>
                    <VoteButtons
                      currentVote={myVote}
                      editable={
                        Boolean(currentUser) &&
                        participation.user.id !== currentUser?.id
                      }
                      onVote={(nextVoteType) =>
                        void handleVote(participation.user.id, nextVoteType)
                      }
                    />
                  </div>
                )
              })}
            </div>
          </section>

          <CommentThread
            comments={resolvedComments}
            draft={commentDraft}
            onDraftChange={setCommentDraft}
            onPost={() => void handlePostComment()}
          />
        </div>

        <aside className="space-y-4">
          <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
            <h3 className="font-display text-2xl text-text-primary">
              Эта партия в цифрах
            </h3>
            <div className="mt-4 space-y-3">
              <MiniFactRow
                icon={<Users className="h-4 w-4" />}
                label="Участников"
                value={String(match.participations.length)}
              />
              <MiniFactRow
                icon={<Castle className="h-4 w-4" />}
                label="Всего замков"
                value={String(
                  match.participations.reduce(
                    (sum, participation) => sum + (participation.castles ?? 0),
                    0,
                  ),
                )}
              />
              <MiniFactRow
                icon={<MessageSquare className="h-4 w-4" />}
                label="Комментариев"
                value={String(resolvedComments.length)}
              />
              <MiniFactRow
                icon={<Crown className="h-4 w-4" />}
                label="Голосов"
                value={String(votes.length)}
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel">
            <h3 className="font-display text-2xl text-text-primary">
              Между участниками
            </h3>
            <p className="mt-3 text-sm leading-7 text-text-secondary">
              Быстрый виджет под будущий H2H: кто чаще встречается за одним
              столом и кто чаще забирает короны.
            </p>
            <div className="mt-4 space-y-3">
              {sortedParticipations.slice(0, 3).map((participation) => (
                <div
                  key={participation.id}
                  className="rounded-2xl border border-border-subtle bg-bg-base p-3"
                >
                  <PlayerPill
                    faction={participation.faction}
                    size="sm"
                    user={participation.user}
                  />
                  <p className="mt-2 text-xs leading-6 text-text-tertiary">
                    Чаще всего спорит за стол с{' '}
                    {sortedParticipations[0].user.nickname}.
                  </p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}

function MiniFactRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-bg-base px-4 py-3">
      <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
        {icon}
        {label}
      </div>
      <span className="font-display text-xl text-text-primary">{value}</span>
    </div>
  )
}
