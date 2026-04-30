import { useState } from 'react'
import { Check, Loader2, ShieldCheck, UserMinus } from 'lucide-react'
import {
  useApprovePendingUser,
  usePendingUsers,
  useRejectPendingUser,
} from '@/hooks/useAdmin'
import { useAuth } from '@/hooks/useAuth'
import { Navigate } from 'react-router-dom'

export function AdminRegistrationsPage() {
  const { user } = useAuth()
  const pendingQuery = usePendingUsers()
  const approveMutation = useApprovePendingUser()
  const rejectMutation = useRejectPendingUser()
  const [busyUserId, setBusyUserId] = useState<number | null>(null)
  const [confirmRejectId, setConfirmRejectId] = useState<number | null>(null)

  // We can only check is_staff/superuser if the auth payload exposes it. The
  // PrivateUserSerializer currently exposes is_active but not is_staff, so we
  // fall back to "let the API gate it" — a non-admin will simply see an empty
  // list (well, actually a 403 from the API, which the query will treat as
  // an error). That's acceptable for a closed-group app.
  if (user === null) {
    return <Navigate replace to="/login" />
  }

  if (pendingQuery.isLoading) {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-8 flex items-center gap-4">
          <Loader2 className="h-6 w-6 animate-spin text-text-secondary" />
          <p className="text-text-secondary">Загружаем заявки…</p>
        </section>
      </main>
    )
  }

  if (pendingQuery.isError) {
    return (
      <main className="space-y-6">
        <section className="rounded-[2rem] border border-red-400/30 bg-red-950/20 p-6">
          <p className="text-sm text-red-200">
            Не удалось получить список заявок. Скорее всего, у вас нет прав
            администратора.
          </p>
        </section>
      </main>
    )
  }

  const pendingUsers = pendingQuery.data?.results ?? []

  const handleApprove = async (userId: number) => {
    setBusyUserId(userId)
    try {
      await approveMutation.mutateAsync(userId)
    } finally {
      setBusyUserId(null)
    }
  }

  const handleReject = async (userId: number) => {
    if (confirmRejectId !== userId) {
      setConfirmRejectId(userId)
      return
    }
    setBusyUserId(userId)
    try {
      await rejectMutation.mutateAsync(userId)
      setConfirmRejectId(null)
    } finally {
      setBusyUserId(null)
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4">
      <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-5 w-5 text-text-secondary" />
          <span className="text-xs text-text-secondary uppercase tracking-widest font-medium">
            Админ
          </span>
        </div>
        <h1 className="font-display text-3xl text-text-primary">
          Заявки на регистрацию
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Здесь видны пользователи, зарегистрировавшиеся без секретного слова.
          Подтвердите, чтобы выдать им доступ, или удалите заявку.
        </p>
      </section>

      {pendingUsers.length === 0 ? (
        <section className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-8 text-center">
          <p className="text-sm text-text-secondary">
            Нет ожидающих заявок.
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          {pendingUsers.map((pending) => {
            const isBusy = busyUserId === pending.id
            const showRejectConfirm = confirmRejectId === pending.id
            return (
              <article
                key={pending.id}
                className="flex flex-col gap-3 rounded-2xl border border-border-subtle bg-bg-elev1 px-5 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {pending.nickname || '— ник не задан —'}
                  </p>
                  <p className="truncate text-xs text-text-secondary">
                    {pending.email}
                  </p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    Зарегистрирован:{' '}
                    {new Date(pending.date_joined).toLocaleString('ru-RU')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleApprove(pending.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-950/20 px-3 py-1.5 text-sm text-emerald-300 transition hover:bg-emerald-950/40 disabled:opacity-40"
                  >
                    {isBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Подтвердить
                  </button>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleReject(pending.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm border transition disabled:opacity-40 ${
                      showRejectConfirm
                        ? 'border-red-400/60 bg-red-950/30 text-red-200'
                        : 'border-border-subtle text-text-secondary hover:border-red-400/40 hover:text-red-300'
                    }`}
                  >
                    {isBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserMinus className="h-3.5 w-3.5" />
                    )}
                    {showRejectConfirm ? 'Точно удалить?' : 'Отклонить'}
                  </button>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
