import { Link, useLocation } from 'react-router-dom'

export function RoutePlaceholderPage({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  const location = useLocation()

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-border-subtle bg-bg-elev1 p-8 shadow-panel">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-gold/80">
          {eyebrow}
        </p>
        <h1 className="mt-4 font-display text-4xl text-text-primary md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">
          {description}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="rounded-full border border-border-subtle bg-bg-base px-4 py-2 font-mono text-xs text-text-secondary">
            маршрут: {location.pathname}
          </span>
          <span className="rounded-full border border-border-subtle bg-bg-base px-4 py-2 font-mono text-xs text-text-secondary">
            заглушка подключена
          </span>
          <span className="rounded-full border border-border-subtle bg-bg-base px-4 py-2 font-mono text-xs text-text-secondary">
            shell активен
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          'UI-атомы заменят эти блоки в следующей продуктовой задаче.',
          'Хуки с API-данными появятся, когда дозреют нужные backend endpoints.',
          'Эта страница уже встроена в общий роутинг и адаптивный layout.',
        ].map((note) => (
          <article
            key={note}
            className="rounded-3xl border border-border-subtle bg-bg-elev1/85 p-6"
          >
            <p className="text-sm leading-7 text-text-secondary">{note}</p>
          </article>
        ))}
      </div>

      <div className="rounded-3xl border border-dashed border-gold/30 bg-gold/5 p-6 text-sm leading-7 text-text-secondary">
        Дальше этот маршрут будет наполняться продакшн-контентом. До этого
        момента можно проверить shell, навигацию и защиту роутов.
        <div className="mt-4">
          <Link
            to="/"
            className="inline-flex rounded-2xl border border-border-subtle px-4 py-2 text-text-primary transition hover:border-gold hover:text-gold"
          >
            Вернуться на обзор
          </Link>
        </div>
      </div>
    </section>
  )
}
