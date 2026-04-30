import { RefreshCw, WifiOff } from 'lucide-react'

export function NetworkErrorPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-6">
      <section className="w-full max-w-2xl rounded-3xl border border-border-subtle bg-bg-elev1/95 p-10 shadow-panel backdrop-blur">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border-subtle bg-bg-base">
          <WifiOff className="h-6 w-6 text-text-secondary" />
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-text-tertiary">
          Нет соединения
        </p>
        <h1 className="mt-4 font-display text-4xl text-text-primary md:text-5xl">
          Проблема с сетью
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-text-secondary">
          Не удаётся подключиться к серверу. Проверьте интернет-соединение и попробуйте снова.
        </p>
        <div className="mt-8">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-2xl bg-gold px-5 py-3 text-sm font-semibold text-black transition hover:bg-gold-hover"
          >
            <RefreshCw className="h-4 w-4" />
            Повторить
          </button>
        </div>
      </section>
    </main>
  )
}
