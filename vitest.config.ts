import { createRequire } from 'node:module'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// `h3` is not a direct dependency of the module (Nitro provides it in the
// consuming app), so resolve it from nuxt's own dependency tree for tests.
const require = createRequire(import.meta.url)
const nuxtRequire = createRequire(require.resolve('nuxt/package.json'))
const h3Dir = dirname(nuxtRequire.resolve('h3/package.json'))

export default defineConfig({
  resolve: {
    alias: {
      '#imports': fileURLToPath(new URL('./test/stubs/imports.ts', import.meta.url)),
      h3: h3Dir,
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
})
