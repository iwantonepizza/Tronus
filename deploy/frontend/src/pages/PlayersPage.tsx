import { Link } from 'react-router-dom'
import { Users } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlayerPill } from '@/components/player/PlayerPill'
import { useUsers } from '@/hooks/useUsers'

export function PlayersPage() {
  const usersQuery = useUsers()

  if (usersQuery.isLoading) {
    return <PageStatus title="Загружаем игроков..." />
  }

  if (usersQuery.isError) {
    return (
      <EmptyState
        icon={<Users className="h-5 w-5" />}
        title="Список игроков недоступен"
        description="Публичный список пользователей не ответил. Проверьте backend и повторите попытку."
      />
    )
  }

  const users = usersQuery.data ?? []

  return (
    <main className="space-y-6">
      <header className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
          Реестр игроков
        </p>
        <h1 className="mt-4 font-display text-4xl text-text-primary md:text-5xl">
          Игроки
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-text-secondary">
          Публичный состав закрытой группы. Откройте профиль, чтобы посмотреть
          винрейт, серии, фракции и свежую форму.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => (
          <Link
            key={user.id}
            to={`/players/${user.id}`}
            className="rounded-[1.75rem] border border-border-subtle bg-bg-elev1 p-5 shadow-panel transition hover:-translate-y-0.5 hover:border-gold/60"
          >
            <PlayerPill size="lg" user={user} />
            <p className="mt-4 text-sm leading-7 text-text-secondary">
              С нами с {new Date(user.dateJoined).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </section>
    </main>
  )
}

function PageStatus({ title }: { title: string }) {
  return (
    <main className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-6 shadow-panel">
      <p className="font-display text-3xl text-text-primary">{title}</p>
    </main>
  )
}
