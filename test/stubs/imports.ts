/**
 * Test stub for the Nitro `#imports` virtual module.
 * Tests mutate `runtimeConfig` to simulate module options / env.
 */
export const runtimeConfig: any = {
  public: {
    cobrasAuth: {
      authServiceUrl: 'https://auth.example.test',
      mode: 'internal',
      publicRoutes: [],
      debug: false,
    },
  },
  cobrasAuth: {
    cookieDomain: undefined,
    sessionSecret: '',
    guardApiRoutes: true,
    publicApiRoutes: [],
  },
}

export function useRuntimeConfig() {
  return runtimeConfig
}

export function resetRuntimeConfig(overrides: {
  mode?: 'internal' | 'public'
  sessionSecret?: string
  guardApiRoutes?: boolean
  publicApiRoutes?: string[]
} = {}) {
  runtimeConfig.public.cobrasAuth.mode = overrides.mode ?? 'internal'
  runtimeConfig.cobrasAuth.sessionSecret = overrides.sessionSecret ?? ''
  runtimeConfig.cobrasAuth.guardApiRoutes = overrides.guardApiRoutes ?? true
  runtimeConfig.cobrasAuth.publicApiRoutes = overrides.publicApiRoutes ?? []
}
