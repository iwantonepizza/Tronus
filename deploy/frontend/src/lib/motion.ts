import { useReducedMotion } from 'framer-motion'

export function useMotionPreferences() {
  const shouldReduceMotion = useReducedMotion()

  return {
    shouldReduceMotion,
    duration(value: number) {
      return shouldReduceMotion ? 0 : value
    },
    delay(value: number) {
      return shouldReduceMotion ? 0 : value
    },
  }
}
