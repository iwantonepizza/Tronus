import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'

export function ForbiddenPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-6">
      <section className="w-full max-w-2xl rounded-3xl border border-border-subtle bg-bg-elev1/95 p-10 shadow-panel backdrop-blur">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10">
          <Lock className="h-6 w-6 text-amber-400" />
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-amber-400/80">
          Ошибка 403
        </p>
        <h1 className="mt-4 font-display text-4xl text-text-primary md:text-5xl">
          Доступ запрещён
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-text-secondary">
          У вас нет прав для просмотра этой страницы. Если считаете, что это ошибка — обратитесь к создателю группы.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex rounded-2xl bg-gold px-5 py-3 text-sm font-semibold text-black transition hover:bg-gold-hover"
          >
            На главную
          </Link>
        </div>
      </section>
    </main>
  )
}
