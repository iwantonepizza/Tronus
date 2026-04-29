export const USE_MOCKS =
  import.meta.env.MODE === 'test' ||
  (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true')
