const {
  MindPlatform,
} = require('@mindjs/core/platform-base');
const {
  APP_MIDDLEWARE_INITIALIZER,
  APP_SERVER,
  APP_SERVER_ERROR_LISTENER,
  APP_SERVER_NET_LISTENER,
  APP_MIDDLEWARE,
  APP_INITIALIZER,
} = require('@mindjs/core');
const {
  APP_ROUTERS_INITIALIZER,
  APP_ROUTE_MOUNTER,
  APP_ROUTER_MIDDLEWARE_INITIALIZER,
  APP_ROUTER_PROVIDER,
} = require('@mindjs/routing');

const {
  koaServerProvider,
  koaServerNetListenerProvider,
  koaServerErrorListenerProviders,
  koaAppInitializerProviders,
  koaAppMiddlewareProviders,
  koaAppMiddlewareInitializerProvider,
  koaAppRouterMiddlewareInitializerProvider,
  koaAppRouteMounterProvider,
  koaAppRoutersInitializerProvider,
  koaAppRouterProvider,
  koaAppDefaultProviders,
} = require('./providers');

class PlatformMindKoa extends MindPlatform {

  /**
   *
   * @returns {{readonly, provide?: *}}
   */
  get serverProvider() {
    return this.getOverrideProvider(APP_SERVER, koaServerProvider);
  }

  get serverNetListenerProvider() {
    return this.getOverrideProvider(APP_SERVER_NET_LISTENER, koaServerNetListenerProvider);
  }

  get serverErrorListenersProviders() {
    return this.getOverrideProviders(APP_SERVER_ERROR_LISTENER, koaServerErrorListenerProviders);
  }

  get initializersProviders() {
    return this.getOverrideProviders(APP_INITIALIZER, koaAppInitializerProviders);
  }

  get middlewareProviders() {
    return this.getOverrideProviders(APP_MIDDLEWARE, koaAppMiddlewareProviders);
  }

  get middlewareInitializerProvider() {
    return this.getOverrideProvider(APP_MIDDLEWARE_INITIALIZER, koaAppMiddlewareInitializerProvider);
  }

  get routerProvider() {
    return this.getOverrideProvider(APP_ROUTER_PROVIDER, koaAppRouterProvider);
  }

  get routeMounterProvider() {
    return this.getOverrideProvider(APP_ROUTE_MOUNTER, koaAppRouteMounterProvider);
  }

  get routerMiddlewareInitializerProvider() {
    return this.getOverrideProvider(APP_ROUTER_MIDDLEWARE_INITIALIZER, koaAppRouterMiddlewareInitializerProvider);
  }

  get routersInitializerProvider() {
    return this.getOverrideProvider(APP_ROUTERS_INITIALIZER, koaAppRoutersInitializerProvider);
  }

  get platformDefaultProviders() {
    return koaAppDefaultProviders;
  }

}

/**
 *
 * @param {{
 *  platformProvidersOverride: Provider|Injectable[], list of providers that should be overridden. Any of platform provider can be overridden by providing it in application module
 *  platformExtraProviders: Provider|Injectable[], additional providers that should be provided on a platform level. E.g. APP_CONFIG
 * }} platformProvidersConfig
 * @param {{
 *   useDefaultMiddleware: boolean, enable or disable using platform default middleware
 *   useDefaultInitializers: boolean, enable or disable using platform default initializers
 * }} defaultsConfig
 * @returns {PlatformMindKoa}
 */
function mindPlatformKoa(platformProvidersConfig = {}, defaultsConfig = {}) {
  return new PlatformMindKoa(platformProvidersConfig, defaultsConfig);
}

module.exports = {
  mindPlatformKoa,
};
