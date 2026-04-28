import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Crown, Flame, Shield, Swords } from 'lucide-react'

export function NotFoundPage() {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex min-h-screen items-center justify-center px-6"
    >
      <section className="w-full max-w-3xl rounded-3xl border border-border-subtle bg-bg-elev1/95 p-10 shadow-panel backdrop-blur">
        <div className="mb-8 flex flex-wrap items-center gap-3 text-text-secondary">
          <Shield className="h-5 w-5 text-faction-stark" />
          <Swords className="h-5 w-5 text-faction-greyjoy" />
          <Crown className="h-5 w-5 text-gold" />
          <Flame className="h-5 w-5 text-faction-targaryen" />
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-gold/80">
          Route Missing
        </p>
        <h1 className="mt-4 font-display text-4xl text-text-primary md:text-5xl">
          Hello Tronus
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">
          Этот путь не зарегистрирован. Вернитесь в AppShell и продолжайте
          работу из основного navigation map.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex rounded-2xl bg-gold px-5 py-3 font-semibold text-black transition hover:bg-gold-hover"
          >
            На главную
          </Link>
        </div>
      </section>
    </motion.main>
  )
}
