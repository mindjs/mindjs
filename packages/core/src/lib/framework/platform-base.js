const { Module } = require('@mindjs/common');
const { injectSync, injectOneSync, toArray } = require('@mindjs/common/utils');

const { get, isEmpty } = require('lodash');

const Mind = require('./core');
const {
  APP_SERVER,
  APP_SERVER_NET_LISTENER,
  APP_SERVER_ERROR_LISTENER,
  APP_INITIALIZER,
  APP_MIDDLEWARE,
  APP_MIDDLEWARE_INITIALIZER,
  APP_ROUTER_PROVIDER,
  APP_ROUTE_MOUNTER,
  APP_ROUTER_MIDDLEWARE_INITIALIZER,
  APP_ROUTERS_INITIALIZER,
} = require('./DI.tokens');

/**
 * TODO: add description and usage notes
 * @type {MindPlatform}
 */
module.exports = class MindPlatform {

  /**
   * @param {{
   *  platformProvidersOverride: Provider|Injectable[], list of providers that should be overridden. Any of platform provider can be overridden by providing it in application module
   *  platformExtraProviders: Provider|Injectable[], additional providers that should be provided on a platform level. E.g. APP_CONFIG or platform specific configuration providers
   * }} platformProvidersConfig
   * @param {{
   *   useDefaultMiddleware: boolean, enable or disable using platform default middleware
   *   useDefaultInitializers: boolean, enable or disable using platform default initializers
   * }} defaultsConfig
   */
  constructor(
    {
      platformProvidersOverride = [],
      platformExtraProviders = [],
    } = {},
    {
      useDefaultMiddleware = true,
      useDefaultInitializers = true,
    } = {},
  ) {
    // providers
    this.platformProvidersOverride = [...platformProvidersOverride];
    this.platformExtraProviders = [...platformExtraProviders];

    // options
    this.useDefaultInitializers = useDefaultInitializers;
    this.useDefaultMiddleware = useDefaultMiddleware;
  }

  /**
   *
   * @param {InjectionToken} token
   * @param {Provider} notFoundProvider
   * @returns {{readonly provide?: *}}
   */
  getOverrideProvider(token, notFoundProvider = undefined) {
    return this.platformProvidersOverride.find(({ provide }) => provide === token) || notFoundProvider;
  }

  /**
   *
   * @param {InjectionToken} token
   * @param {Provider|Provider[]} notFoundProviders
   * @returns {{readonly provide?: *}[]}
   */
  getOverrideProviders(token, notFoundProviders = []) {
    const overrideProviders = this.platformProvidersOverride.filter(({ provide }) => provide === token);
    return isEmpty(overrideProviders) ? toArray(notFoundProviders) : overrideProviders;
  }

  /*
    The next providers are specific for each platform and should be provided accordingly taking into account platformProvidersOverride
   */

  /**
   *
   * @returns {null}
   * @private
   */
  get serverProvider() {
    return null;
  }

  /**
   *
   * @returns {null}
   * @private
   */
  get serverNetListenerProvider() {
    return null;
  }

  /**
   *
   * @returns {Array}
   * @private
   */
  get serverErrorListenersProviders() {
    return [];
  }

  /**
   *
   * @returns {Array}
   * @private
   */
  get initializersProviders() {
    return [];
  }

  /**
   *
   * @returns {Array}
   * @private
   */
  get middlewareProviders() {
    return [];
  }

  /**
   *
   * @returns {null}
   * @private
   */
  get middlewareInitializerProvider() {
    return null;
  }

  /**
   *
   * @returns {null}
   * @private
   */
  get routerProvider() {
    return null;
  }

  /**
   *
   * @returns {null}
   */
  get routeMounterProvider() {
    return null;
  }

  /**
   *
   * @returns {null}
   */
  get routerMiddlewareInitializerProvider() {
    return null;
  }

  /**
   *
   * @returns {null}
   */
  get routersInitializerProvider() {
    return null;
  }

  /**
   *
   * @returns {Array}
   */
  get platformDefaultProviders() {
    return [];
  }

  /**
   * All platform providers
   * @returns {*[]}
   */
  getPlatformProviders() {
    return [
      // server and listeners
      this.serverProvider,
      this.serverNetListenerProvider,
      this.serverErrorListenersProviders,

      // initializers
      ...(this.useDefaultInitializers ? this.initializersProviders : []),

      // middleware
      ...(this.useDefaultMiddleware ? this.middlewareProviders : []),
      this.middlewareInitializerProvider,

      // routing
      this.routerProvider,
      this.routeMounterProvider,
      this.routerMiddlewareInitializerProvider,
      this.routersInitializerProvider,

      // others
      this.platformDefaultProviders,
      ...(toArray(this.platformExtraProviders)),
    ].filter(Boolean);
  }

  /**
   * Platform injector instance
   * @returns {*}
   */
  get injector() {
    return get(this.platformModuleDI, 'rootInjector');
  }

  /*
     Platform providers instances
   */

  /**
   *
   * @returns {*}
   */
  get server() {
    return injectOneSync(this.injector, APP_SERVER);
  }

  /**
   *
   * @returns {*}
   */
  get serverNetListener() {
    return injectOneSync(this.injector, APP_SERVER_NET_LISTENER);
  }

  /**
   *
   * @returns {*}
   */
  get serverErrorListener() {
    return injectSync(this.injector, APP_SERVER_ERROR_LISTENER);
  }

  /**
   *
   * @returns {*}
   */
  get initializers() {
    return injectSync(this.injector, APP_INITIALIZER);
  }

  /**
   *
   * @returns {*}
   */
  get middleware() {
    return injectSync(this.injector, APP_MIDDLEWARE);
  }

  /**
   *
   * @returns {*}
   */
  get middlewareInitializer() {
    return injectOneSync(this.injector, APP_MIDDLEWARE_INITIALIZER);
  }

  /**
   *
   * @returns {*}
   */
  get router() {
    return injectOneSync(this.injector, APP_ROUTER_PROVIDER);
  }

  /**
   *
   * @returns {*}
   */
  get routeMounter() {
    return injectSync(this.injector, APP_ROUTE_MOUNTER);
  }

  /**
   *
   * @returns {*}
   */
  get routerMiddlewareInitializer() {
    return injectOneSync(this.injector, APP_ROUTER_MIDDLEWARE_INITIALIZER);
  }

  /**
   *
   * @returns {*}
   */
  get routersInitializer() {
    return injectOneSync(this.injector, APP_ROUTERS_INITIALIZER);
  }

  /**
   * Bootstraps application module within a platform
   * @param {Module} appModule
   * @returns {Promise<Mind|*>}
   */
  async bootstrapModule(appModule) {
    if (!this.applicationMindModule) {
      await this.initApplicationModule(appModule);
    }

    return this.bootstrapApplicationModule();
  }

  /**
   *
   * @returns {Promise<Mind|*>}
   */
  async initApplicationModule(appModule) {
    if (this.applicationMindModule) {
      return;
    }
    this.applicationMindModule = appModule;
    await this._initPlatformModuleDI();

    this.applicationMind = new Mind(this.applicationMindModule, this);
    return this.applicationMind.initRootModuleDI();
  }

  /**
   *
   * @returns {Promise<*|Mind>}
   */
  async bootstrapApplicationModule() {
    if (!this.applicationMind) {
      return;
    }

    return this.applicationMind.bootstrap();
  }

  /**
   *
   * @returns {Promise<void>}
   * @private
   */
  async _initPlatformModuleDI() {
    this.platformModuleDI = await Mind.initModuleDI({
      module: Module(class PlatformModule {
      }, {
        providers: [
          ...this.getPlatformProviders(),
        ],
      }),
    });
  }

};
