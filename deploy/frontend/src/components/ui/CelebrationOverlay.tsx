import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { hexToRgba } from '@/lib/factions'
import { useMotionPreferences } from '@/lib/motion'

interface CelebrationOverlayProps {
  color: string
  durationMs?: number
}

interface ConfettiPiece {
  id: number
  left: string
  size: number
  offsetX: number
  rotate: number
  delay: number
}

export function CelebrationOverlay({
  color,
}: CelebrationOverlayProps) {
  const { shouldReduceMotion } = useMotionPreferences()

  const pieces = useMemo<ConfettiPiece[]>(
    () =>
      Array.from({ length: 22 }, (_, index) => ({
        id: index,
        left: `${8 + ((index * 83) % 84)}%`,
        size: 8 + (index % 4) * 3,
        offsetX: (index % 2 === 0 ? 1 : -1) * (18 + ((index * 7) % 36)),
        rotate: 80 + ((index * 41) % 220),
        delay: (index % 6) * 0.05,
      })),
    [],
  )

  if (shouldReduceMotion) {
    return null
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[2rem]">
      <div
        className="absolute inset-x-[12%] top-8 h-28 rounded-full blur-3xl"
        style={{
          background: `radial-gradient(circle, ${hexToRgba(color, 0.42)} 0%, transparent 70%)`,
        }}
      />
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          initial={{
            opacity: 0,
            x: 0,
            y: -36,
            rotate: 0,
            scale: 0.72,
          }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [0, piece.offsetX, piece.offsetX * 0.72],
            y: [-36, 148 + piece.id * 6, 252 + piece.id * 10],
            rotate: [0, piece.rotate],
            scale: [0.72, 1, 0.92],
          }}
          transition={{
            duration: 1.15 + (piece.id % 4) * 0.18,
            delay: piece.delay,
            ease: 'easeOut',
          }}
          className="absolute top-4 rounded-sm"
          style={{
            left: piece.left,
            width: piece.size,
            height: piece.size * 0.66,
            backgroundColor: piece.id % 3 === 0 ? '#F5E6C8' : color,
            boxShadow: `0 0 18px ${hexToRgba(color, 0.24)}`,
          }}
        />
      ))}
    </div>
  )
}
