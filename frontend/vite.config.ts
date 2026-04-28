import path from 'node:path'

import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const isProductionBuild = mode === 'production'
  const useMocks =
    mode === 'test' ||
    (!isProductionBuild && env.VITE_USE_MOCKS === 'true')

  return {
    plugins: [react()],
    define: {
      __USE_MOCKS__: JSON.stringify(useMocks),
    },
    resolve: {
      alias: [
        ...(isProductionBuild
          ? [
              {
                find: /^@\/mocks\/data$/,
                replacement: path.resolve(
                  __dirname,
                  './src/build/noop-mocks-data.ts',
                ),
              },
              {
                find: /^@\/mocks\/session-factory$/,
                replacement: path.resolve(
                  __dirname,
                  './src/build/noop-session-factory.ts',
                ),
              },
            ]
          : []),
        {
          find: '@',
          replacement: path.resolve(__dirname, './src'),
        },
      ],
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:8008',
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './tests/setup.ts',
      css: true,
    },
  }
})
