import { defineNuxtModule, createResolver, addPlugin, addImports, addRouteMiddleware, addServerHandler, addComponent } from '@nuxt/kit';
import { defu } from 'defu';

const module = defineNuxtModule({
  meta: {
    name: "@cobras/auth-nuxt",
    configKey: "cobrasAuth",
    compatibility: {
      nuxt: ">=3.0.0"
    }
  },
  defaults: {
    authServiceUrl: "https://cobras-auth-app-production.up.railway.app",
    mode: "public",
    siteId: void 0,
    siteDomain: void 0,
    globalMiddleware: false,
    publicRoutes: [],
    // Empty by default - user must explicitly set public routes
    loginPath: "/login",
    enableDevTools: true,
    devToolsKey: "ctrl+shift+d",
    cookieDomain: void 0,
    debug: false
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
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
        debug: options.debug
      }
    );
    nuxt.options.runtimeConfig.cobrasAuth = defu(
      nuxt.options.runtimeConfig.cobrasAuth || {},
      {
        cookieDomain: options.cookieDomain
      }
    );
    addPlugin({
      src: resolver.resolve("./runtime/plugins/auth.client"),
      mode: "client"
    });
    addPlugin({
      src: resolver.resolve("./runtime/plugins/auth.server"),
      mode: "server"
    });
    addImports([
      {
        name: "useCobrasAuth",
        from: resolver.resolve("./runtime/composables/useCobrasAuth")
      },
      {
        name: "useCobrasDevTools",
        from: resolver.resolve("./runtime/composables/useCobrasDevTools")
      },
      {
        name: "useCobrasMode",
        from: resolver.resolve("./runtime/composables/useCobrasMode")
      }
    ]);
    addRouteMiddleware({
      name: "cobras-auth",
      path: resolver.resolve("./runtime/middleware/auth"),
      global: options.globalMiddleware
    });
    addRouteMiddleware({
      name: "cobras-internal",
      path: resolver.resolve("./runtime/middleware/internal"),
      global: false
    });
    addServerHandler({
      route: "/api/_cobras/verify",
      handler: resolver.resolve("./runtime/server/api/verify.get")
    });
    addServerHandler({
      route: "/api/_cobras/refresh",
      handler: resolver.resolve("./runtime/server/api/refresh.post")
    });
    addServerHandler({
      route: "/api/_cobras/logout",
      handler: resolver.resolve("./runtime/server/api/logout.post")
    });
    addServerHandler({
      route: "/api/_cobras/exchange",
      handler: resolver.resolve("./runtime/server/api/exchange.post")
    });
    if (options.enableDevTools) {
      addComponent({
        name: "CobrasDevTools",
        filePath: resolver.resolve("./runtime/components/CobrasDevTools.vue")
      });
    }
    if (options.debug) {
      console.log("[@cobras/auth-nuxt] Module configured:", {
        mode: options.mode,
        authServiceUrl: options.authServiceUrl,
        globalMiddleware: options.globalMiddleware
      });
    }
  }
});

export { module as default };
