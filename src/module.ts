import {
  defineNuxtModule,
  addPlugin,
  addRouteMiddleware,
  addImports,
  addServerHandler,
  addComponent,
  createResolver,
  addServerPlugin,
  addServerImports,
  extendPages,
} from '@nuxt/kit'
import { defu } from 'defu'
import type { ModuleOptions } from './types'

export type { ModuleOptions, CobrasUser, CobrasAuthState, CobrasSession } from './types'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@cobras/auth-nuxt',
    configKey: 'cobrasAuth',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {
    authServiceUrl: 'https://cobras-auth-app-production.up.railway.app',
    mode: 'public',
    siteId: undefined,
    siteDomain: undefined,
    globalMiddleware: false,
    publicRoutes: [], // Empty by default - user must explicitly set public routes
    loginPath: '/login',
    enableDevTools: true,
    devToolsKey: 'ctrl+shift+d',
    cookieDomain: undefined,
    sessionSecret: undefined,
    guardApiRoutes: true,
    publicApiRoutes: [],
    debug: false,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // Make sure Nitro bundles our runtime (it imports from '#imports')
    nuxt.options.build.transpile.push(resolver.resolve('./runtime'))

    // Merge options with runtime config
    nuxt.options.runtimeConfig.public.cobrasAuth = defu(
      nuxt.options.runtimeConfig.public.cobrasAuth || {},
      {
        authServiceUrl: options.authServiceUrl,
        mode: options.mode,
        siteId: options.siteId,
        siteDomain: options.siteDomain,
        publicRoutes: options.publicRoutes,
        loginPath: options.loginPath,
        enableDevTools: options.enableDevTools,
        devToolsKey: options.devToolsKey,
        debug: options.debug,
      }
    )

    // Private runtime config (server-side only).
    // sessionSecret is overridable at runtime via NUXT_COBRAS_AUTH_SESSION_SECRET;
    // the plain COBRAS_AUTH_SESSION_SECRET env var is also honoured at runtime.
    nuxt.options.runtimeConfig.cobrasAuth = defu(
      nuxt.options.runtimeConfig.cobrasAuth || {},
      {
        cookieDomain: options.cookieDomain,
        sessionSecret: options.sessionSecret ?? '',
        guardApiRoutes: options.guardApiRoutes,
        publicApiRoutes: options.publicApiRoutes,
      }
    )

    // Add main auth plugin (runs on client and server)
    addPlugin({
      src: resolver.resolve('./runtime/plugins/auth.client'),
      mode: 'client',
    })
    addPlugin({
      src: resolver.resolve('./runtime/plugins/auth.server'),
      mode: 'server',
    })

    // Add composables
    addImports([
      {
        name: 'useCobrasAuth',
        from: resolver.resolve('./runtime/composables/useCobrasAuth'),
      },
      {
        name: 'useCobrasDevTools',
        from: resolver.resolve('./runtime/composables/useCobrasDevTools'),
      },
      {
        name: 'useCobrasMode',
        from: resolver.resolve('./runtime/composables/useCobrasMode'),
      },
    ])

    // Add route middleware
    addRouteMiddleware({
      name: 'cobras-auth',
      path: resolver.resolve('./runtime/middleware/auth'),
      global: options.globalMiddleware,
    })

    // Add internal-only middleware (for internal mode)
    addRouteMiddleware({
      name: 'cobras-internal',
      path: resolver.resolve('./runtime/middleware/internal'),
      global: false,
    })

    // Add server API routes for proxying auth requests
    addServerHandler({
      route: '/api/_cobras/verify',
      handler: resolver.resolve('./runtime/server/api/verify.get'),
    })

    addServerHandler({
      route: '/api/_cobras/refresh',
      handler: resolver.resolve('./runtime/server/api/refresh.post'),
    })

    addServerHandler({
      route: '/api/_cobras/logout',
      handler: resolver.resolve('./runtime/server/api/logout.post'),
    })

    addServerHandler({
      route: '/api/_cobras/exchange',
      handler: resolver.resolve('./runtime/server/api/exchange.post'),
    })

    addServerHandler({
      route: '/api/_cobras/ip-probe',
      handler: resolver.resolve('./runtime/server/api/ip-probe.get'),
    })

    // Server helpers for app API routes (auto-imported in Nitro:
    // requireCobrasSession(event) / getCobrasSession(event))
    addServerImports([
      {
        name: 'requireCobrasSession',
        from: resolver.resolve('./runtime/server/utils/session'),
      },
      {
        name: 'getCobrasSession',
        from: resolver.resolve('./runtime/server/utils/session'),
      },
    ])

    // Internal-mode API guard: requires a valid signed session on /api/**
    // (except /api/_cobras/* and publicApiRoutes). No-op in public mode.
    addServerHandler({
      middleware: true,
      handler: resolver.resolve('./runtime/server/middleware/api-guard'),
    })

    // Warn once at startup when COBRAS_AUTH_SESSION_SECRET is missing/weak
    addServerPlugin(resolver.resolve('./runtime/server/plugins/session-secret'))

    // Add DevTools panel component
    if (options.enableDevTools) {
      addComponent({
        name: 'CobrasDevTools',
        filePath: resolver.resolve('./runtime/components/CobrasDevTools.vue'),
      })
    }

    // Add auth error page
    extendPages((pages) => {
      pages.push({
        name: 'cobras-auth-error',
        path: '/_auth/error',
        file: resolver.resolve('./runtime/pages/auth-error.vue'),
      })
    })

    // Log setup info in debug mode
    if (options.debug) {
      console.log('[@cobras/auth-nuxt] Module configured:', {
        mode: options.mode,
        authServiceUrl: options.authServiceUrl,
        globalMiddleware: options.globalMiddleware,
        guardApiRoutes: options.guardApiRoutes,
        publicApiRoutes: options.publicApiRoutes,
      })
    }
  },
})
