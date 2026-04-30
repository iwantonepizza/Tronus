import { Link } from 'react-router-dom'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export function ServerErrorPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-6">
      <section className="w-full max-w-2xl rounded-3xl border border-border-subtle bg-bg-elev1/95 p-10 shadow-panel backdrop-blur">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-red-400/80">
          Ошибка 500
        </p>
        <h1 className="mt-4 font-display text-4xl text-text-primary md:text-5xl">
          Сервер не отвечает
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-text-secondary">
          Что-то пошло не так на стороне сервера. Мы уже в курсе. Попробуйте обновить страницу или вернитесь позже.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-2xl border border-border-subtle bg-bg-base px-5 py-3 text-sm font-semibold text-text-primary transition hover:border-border-strong"
          >
            <RefreshCw className="h-4 w-4" />
            Обновить
          </button>
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
