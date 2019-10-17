const { flatten, isFunction, every, get } = require('lodash');

const {
  ReflectiveInjector,
} = require('@framework100500/common/DI');
const {
  toArray,
  invokeFn,
  invokeOnAll,
  invokeOn,
  injectSync,
  injectOneSync,
} = require('@framework100500/common/utils');

const {
  APP_ROUTING_MODULES_RESOLVER,
} = require('@framework100500/routing');
const {
  isRoutingModule,
} = require('@framework100500/routing/utils');

const {
  APP_MIDDLEWARE,
  APP_SERVER,
  APP_INITIALIZER,
  APP_MIDDLEWARE_INITIALIZER,
  APP_SERVER_ERROR_LISTENER,
  APP_SERVER_NET_LISTENER,
  APP_TERMINATION_SIGNAL,
} = require('./DI.tokens');
const {
  isModuleWithProviders,
} = require('../utils');
const {
  TERMINATION_SIGNAL,
} = require('../constants');

module.exports = class Framework100500 {

  constructor(bootstrap100500Module, app100500Platform) {
    this._app100500ServerTerminationEmitted = false;
    this._app100500InitializersInvoked = false;
    this._app100500RoutingInitiated = false;
    this._app100500ServerStarted = false;
    this.isApp100500Initiated = false;

    this.app100500Platform = app100500Platform;
    this.app100500RootModule = bootstrap100500Module;
  }

  /**
   *
   * @param {{module: *, injector?: *, child?: {module: *, injector?: *, child?: *}[]}} moduleDI
   * @param {*} platform
   * @returns {Promise<{module: *, injector: *, child: *}|{module: *, injector: *, child: []}|*>}
   */
  static async initModuleDI(moduleDI, platform = undefined) {
    if (!(moduleDI && moduleDI.module)) {
      return;
    }

    let { injector: parentInjector, rootInjector } = moduleDI;
    const { module: appModule } = moduleDI;
    const { imports = [], providers = [] } = appModule;

    /**
     * `Modules with providers` - share their providers with parent module but do not have Routing modules within
     * `Ordinary modules` - encapsulate their providers within own scope. At the same time an Ordinary module has an access to parent scope
     * `Routing modules` - do not have their own imports; encapsulate their providers for building application routing.
     */
    const ordinaryModules = imports.filter(m => !isModuleWithProviders(m));
    const modulesWithProviders = imports.filter(m => isModuleWithProviders(m) && !isRoutingModule(m));

    /*
    *  1. Init top-level providers with all modules with providers and top-level routing modules
    * */
    const importedProviders = modulesWithProviders.reduce((memo, { module, providers }) => {
      return [...memo, module, ...providers];
    }, []);

    const moduleProviders = [
      ...providers,
      ...importedProviders,
      ...ordinaryModules, // provide ordinary modules on a root level
      appModule,
    ].filter(Boolean);
    const resolvedModuleProviders = ReflectiveInjector.resolve(moduleProviders);

    if (!parentInjector) {
      parentInjector = platform && platform.injector
        ? platform.injector // use platform injector as base for root module injector
        : ReflectiveInjector.fromResolvedProviders(resolvedModuleProviders);
    }

    const moduleInjector = parentInjector.createChildFromResolved(resolvedModuleProviders);

    if (!rootInjector) {
      rootInjector = moduleInjector;
    }

    /*
     * 2. Init injectors of Routing and Ordinary modules
     * */
    const [routingModulesDI, ordinaryModulesInjectors] = await Promise.all([
      Framework100500.initRoutingModulesDI({
        rootInjector,
        module: appModule,
        injector: moduleInjector,
      }),
      Promise.all(
        ordinaryModules.map((m) => Framework100500.initModuleDI({
          rootInjector,
          module: m,
          injector: moduleInjector,
        }))
      ),
    ]);

    return {
      rootInjector,
      module: appModule,
      injector: moduleInjector,
      routing: routingModulesDI,
      child: [
        ...ordinaryModulesInjectors,
      ],
    };
  }

  /**
   *
   * @param {*} rootDI
   * @param {*} platform
   * @returns {Promise<*>}
   */
  static async invokeInitializers(rootDI = {}, platform) {
    const { rootInjector, injector } = rootDI;

    if (!rootInjector) {
      throw new Error(('injector was not provided'));
    }

    const appServer = injectOneSync(rootInjector, APP_SERVER);
    const appMiddlewareInitializer = injectOneSync(rootInjector, APP_MIDDLEWARE_INITIALIZER);

    const platformInitializers = toArray(get(platform, 'initializers', []));
    const appInitializers = toArray(injectSync(rootInjector, APP_INITIALIZER, [])).filter(i => {
      return !platformInitializers.includes(i);
    });
    const restInitializers = toArray(injectSync(injector, APP_INITIALIZER, [])).filter(i => {
      return !platformInitializers.includes(i) && !appInitializers.includes(i);
    });

    const platformMiddleware = toArray(get(platform, 'middleware', []));
    const appMiddleware = toArray(injectSync(rootInjector, APP_MIDDLEWARE, [])).filter(m => {
      return !platformMiddleware.includes(m);
    });

    const allInitializers = [
      ...platformInitializers,
      ...appInitializers,
      ...restInitializers, // TODO: clean it up if it is not necessary...
    ].filter(Boolean);

    await Promise.all([
      invokeOnAll(allInitializers, 'init', appServer),
      invokeOn(appMiddlewareInitializer, 'init', appServer, [...platformMiddleware, ...appMiddleware]),
    ]);
  }

  /**
   *
   * @param moduleDI
   * @returns {Promise<*[]>}
   */
  static async extractRoutingModules(moduleDI) {
    const { module: appModule, injector: moduleInjector } = moduleDI;
    const { imports = [] } = appModule;
    let resolvedRoutingModules = [];

    const routingModules = imports.filter(m => isModuleWithProviders(m) && isRoutingModule(m));

    const routingModulesResolver = toArray(injectSync(moduleInjector, APP_ROUTING_MODULES_RESOLVER));
    if (routingModulesResolver) {
      resolvedRoutingModules = await invokeOnAll(routingModulesResolver, 'resolve');
    }

    return [
      ...flatten(resolvedRoutingModules),
      ...routingModules,
    ];
  }

  /**
   *
   * @param {{module: *, injector: *, child?: {module: *, injector: *, child: []}[]}} moduleDI
   * @returns {Promise<{module: *, injector: *, child: {module: *, injector: *, child: []}[]}>|undefined}
   */
  static async initRoutingModulesDI(moduleDI) {
    const { rootInjector, injector: parentModuleInjector, module: parentModule } = moduleDI;

    const routingModules = await Framework100500.extractRoutingModules({
      rootInjector,
      module: parentModule,
      injector: parentModuleInjector,
      child: [],
    });

    if (!routingModules.length) {
      return;
    }

    const routingModulesDI = await Promise.all(
      routingModules.map(async ({ module, providers }) => {
        const routingModuleProviders = ReflectiveInjector.resolve([
          ...providers,
          module,
        ]);
        const routingModuleInjector = parentModuleInjector.createChildFromResolved(routingModuleProviders);

        return {
          rootInjector,
          module,
          injector: routingModuleInjector,
          child: [],
        };
      }),
    );

    return {
      rootInjector,
      module: parentModule,
      injector: parentModuleInjector,
      child: [
        ...routingModulesDI,
      ],
    };
  }

  /**
   *
   * @static
   * @param routingModuleDI
   */
  static async resolveAndMountRouters(routingModuleDI) {
    const { rootInjector, child } = routingModuleDI;

    const appServer = injectOneSync(rootInjector, APP_SERVER);

    return Promise.all(
      child.map(({ module, injector }) => {
        const routingModule = injectOneSync(injector, module);
        return invokeFn(routingModule.resolveAndInitRouters(appServer));
      }),
    );
  }

  /**
   *
   * @param moduleDI
   * @returns {Promise<void>}
   */
  static async initRouting(moduleDI) {
    const { routing, child } = moduleDI;
    if (routing) {
      await Framework100500.resolveAndMountRouters(routing);
    }

    if (child.length) {
      await Promise.all(
        child.map(async mDI => await Framework100500.initRouting(mDI))
      );
    }
  }

  /**
   * Invokes either `startServer` method on Application module or
   *  `listen` one on APP_SERVER_NET_LISTENER and SERVER_ERROR_LISTENERs if such have been provided
   * @param {*} moduleDI
   * @returns {Promise<void>}
   */
  static async startServer(moduleDI = {}) {
    const { module: rootModule, rootInjector } = moduleDI;

    if (!(rootModule && rootInjector)) {
      throw new Error('App Injector and/or App Module was/were not provided');
    }

    const rootModuleInstance = injectOneSync(rootInjector, rootModule);
    const errorListeners = toArray(injectSync(rootInjector, APP_SERVER_ERROR_LISTENER));

    const serverListener = injectOneSync(rootInjector, APP_SERVER_NET_LISTENER);
    const appServer = injectOneSync(rootInjector, APP_SERVER);
    /*
    * Start server using a custom startServer method on bootstrap module or with provided server listeners
    * */
    if (isFunction(rootModuleInstance.startServer)) {
      await invokeFn(rootModuleInstance.startServer(appServer));
      return;
    }

    const listeners = [
      serverListener,
      ...errorListeners,
    ];

    await invokeOnAll(listeners, 'listen', appServer);
  }

  /**
   * @static
   * @param {Module} rootModule
   * @param {*} platform
   * @returns {Promise<Framework100500>}
   */
  static async bootstrap(rootModule, platform) {
    const appInstance = new Framework100500(rootModule, platform);
    await appInstance.bootstrap();

    return appInstance;
  }

  /**
   * Emits provided as APP_TERMINATION_SIGNAL termination signal or `SIGTERM` to node's process
   * @param {*} moduleDI
   * @returns {Promise<*>}
   */
  static async terminateAppServer(moduleDI = {}) {
    const { rootInjector } = moduleDI;
    if (!rootInjector) {
      return;
    }

    const terminateSignal = injectOneSync(rootInjector, APP_TERMINATION_SIGNAL, TERMINATION_SIGNAL.SIGTERM);

    return process.emit(terminateSignal);
  }

  /**
   * Initiates `rootModuleDI` for root module
   * @returns {Promise<void>}
   */
  async initRootModuleDI() {
    // TODO: add possibility to visualize DI tree
    this.rootModuleDI = await Framework100500.initModuleDI(
      { module: this.app100500RootModule },
      this.app100500Platform);
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async invokeInitializers() {
    if (!this.rootModuleDI) {
      return;
    }
    await Framework100500.invokeInitializers(this.rootModuleDI, this.app100500Platform);
  }

  /**
   * Initiates routing modules DIs based on root module DI
   * @returns {Promise<void>}
   */
  async initRouting() {
    if (!this.rootModuleDI) {
      return;
    }
    await Framework100500.initRouting(this.rootModuleDI);
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async startServer() {
    if (!this.rootModuleDI) {
      return;
    }
    await Framework100500.startServer(this.rootModuleDI);
  }

  /**
   * Invokes initializers, routing and then starts a server if NET listeners have been provided
   * @returns {Promise<void>}
   */
  async initAndStart() {
    if (!this.rootModuleDI || this.isApp100500Initiated) {
      return;
    }

    try {
      await this.invokeInitializers();
      this._app100500InitializersInvoked = true;
    } catch (e) {
      console.error(e);
      this._app100500InitializersInvoked = false;
    }

    try {
      await this.initRouting();
      this._app100500RoutingInitiated = true;
    } catch (e) {
      console.error(e);
      this._app100500RoutingInitiated = false;
    }

    try {
      await this.startServer();
      this._app100500ServerStarted = true;
    } catch (e) {
      console.error(e);
      this._app100500ServerStarted = false;
    }

    this.isApp100500Initiated = every([
      this._app100500InitializersInvoked,
      this._app100500RoutingInitiated,
      this._app100500ServerStarted,
    ]);
  }

  /**
   * Initiates root module DI, then invokes initializers, routing modules, and after that starts the server;
   * @returns {Promise<void>}
   */
  async bootstrap() {
    await this.initRootModuleDI();
    await this.initAndStart();
  }

  /**
   * Emits termination signal `SIGTERM` to app server
   * @returns {Promise<void>}
   */
  async terminateAppServer() {
    if (!this.isApp100500Initiated) {
      return;
    }

    const isEmitted = await Framework100500.terminateAppServer(this.rootModuleDI);
    this._app100500ServerTerminationEmitted = !!isEmitted;

    return this._app100500ServerTerminationEmitted;
  }
};
