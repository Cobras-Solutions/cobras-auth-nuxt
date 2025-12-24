import {
  defineNuxtModule,
  addPlugin,
  addRouteMiddleware,
  addImports,
  addServerHandler,
  addComponent,
  createResolver,
  addServerPlugin,
} from '@nuxt/kit'
import { defu } from 'defu'
import type { ModuleOptions } from './types'

export type { ModuleOptions, CobrasUser, CobrasAuthState } from './types'

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
    publicRoutes: ['/'],
    loginPath: '/login',
    enableDevTools: true,
    devToolsKey: 'ctrl+shift+d',
    cookieDomain: undefined,
    debug: false,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

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

    // Private runtime config (server-side only)
    nuxt.options.runtimeConfig.cobrasAuth = defu(
      nuxt.options.runtimeConfig.cobrasAuth || {},
      {
        cookieDomain: options.cookieDomain,
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

    // Add DevTools panel component
    if (options.enableDevTools) {
      addComponent({
        name: 'CobrasDevTools',
        filePath: resolver.resolve('./runtime/components/CobrasDevTools.vue'),
      })
    }

    // Log setup info in debug mode
    if (options.debug) {
      console.log('[@cobras/auth-nuxt] Module configured:', {
        mode: options.mode,
        authServiceUrl: options.authServiceUrl,
        globalMiddleware: options.globalMiddleware,
      })
    }
  },
})
