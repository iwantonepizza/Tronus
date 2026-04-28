import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Crown, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { MatchVote } from '@/mocks/types'

interface VoteButtonsProps {
  currentVote: MatchVote['voteType'] | null
  editable?: boolean
  onVote: (vote: MatchVote['voteType']) => void
}

interface Particle {
  id: number
  angle: number
}

const PARTICLE_COUNT = 8

function ParticleBurst({ particles, color }: { particles: Particle[]; color: string }) {
  return (
    <AnimatePresence>
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180
        const dx = Math.cos(rad) * 28
        const dy = Math.sin(rad) * 28
        return (
          <motion.span
            key={p.id}
            className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
            style={{ backgroundColor: color, marginLeft: -4, marginTop: -4 }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: dx, y: dy, opacity: 0, scale: 0.4 }}
            exit={{}}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )
      })}
    </AnimatePresence>
  )
}

export function VoteButtons({
  currentVote,
  editable = true,
  onVote,
}: VoteButtonsProps) {
  const [crownParticles, setCrownParticles] = useState<Particle[]>([])
  const [shitParticles, setShitParticles] = useState<Particle[]>([])

  const fireParticles = (type: 'positive' | 'negative') => {
    const burst: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: Date.now() + i,
      angle: (360 / PARTICLE_COUNT) * i,
    }))

    if (type === 'positive') {
      setCrownParticles(burst)
      setTimeout(() => setCrownParticles([]), 650)
    } else {
      setShitParticles(burst)
      setTimeout(() => setShitParticles([]), 650)
    }
  }

  const handleVote = (vote: MatchVote['voteType']) => {
    onVote(vote)
    fireParticles(vote)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Crown / positive vote */}
      <div className="relative">
        <button
          type="button"
          disabled={!editable}
          onClick={() => handleVote('positive')}
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45',
            currentVote === 'positive'
              ? 'border-gold bg-gold/15 text-gold'
              : 'border-border-subtle bg-bg-base text-text-secondary hover:border-gold hover:text-gold',
          )}
          aria-label="Голос корона"
        >
          <Crown className="h-4 w-4" />
          👑
        </button>
        <ParticleBurst particles={crownParticles} color="#d4af37" />
      </div>

      {/* Shit / negative vote */}
      <div className="relative">
        <button
          type="button"
          disabled={!editable}
          onClick={() => handleVote('negative')}
          className={cn(
            'inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45',
            currentVote === 'negative'
              ? 'border-red-500/70 bg-red-500/12 text-red-200'
              : 'border-border-subtle bg-bg-base text-text-secondary hover:border-red-500/60 hover:text-red-200',
          )}
          aria-label="Голос говно"
        >
          <Trash2 className="h-4 w-4" />
          💩
        </button>
        <ParticleBurst particles={shitParticles} color="#8B6347" />
      </div>
    </div>
  )
}
