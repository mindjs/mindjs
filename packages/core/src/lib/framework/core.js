const { flatten, isFunction, every, get } = require('lodash');

const {
  ReflectiveInjector,
} = require('@mindjs/common/DI');
const {
  toArray,
  invokeOnAll,
  invokeOn,
  injectSync,
  injectOneSync,
} = require('@mindjs/common/utils');

const {
  APP_ROUTING_MODULES_RESOLVER,
} = require('@mindjs/routing');
const {
  isRoutingModule,
} = require('@mindjs/routing/utils');

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

module.exports = class Mind {

  constructor(bootstrapModuleMind, platformMind) {
    this.appRootModuleMind = bootstrapModuleMind;
    this.platformMind = platformMind;

    this.appServerMindTerminationEmitted = false;
    this.appServerMindInitializersInvoked = false;
    this.appRoutingMindInitiated = false;
    this.appServerMindStarted = false;
    this.isAppMindInitiated = false;
  }

  /**
   *
   * @param {{module: *, injector?: *, child?: {module: *, injector?: *, child?: *}[]}} moduleDI
   * @param {MindPlatform} platform
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
      Mind.initRoutingModulesDI({
        rootInjector,
        module: appModule,
        injector: moduleInjector,
      }),
      Promise.all(
        ordinaryModules.map((m) => Mind.initModuleDI({
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
    if (!appServer) {
      throw new Error('APP_SERVER provider was not found.');
    }

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

    const routingModules = await Mind.extractRoutingModules({
      rootInjector,
      module: parentModule,
      injector: parentModuleInjector,
      child: [],
    });

    if (!routingModules.length) {
      return {
        rootInjector,
        module: parentModule,
        injector: parentModuleInjector,
        child: [],
      };
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

    if (!appServer) {
      throw new Error('APP_SERVER provider was not found.');
    }

    return Promise.all(
      child.map(({ module, injector }) => {
        const routingModule = injectOneSync(injector, module);
        return invokeOn(routingModule, 'resolveAndInitRouters', appServer);
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
      await Mind.resolveAndMountRouters(routing);
    }

    if (child.length) {
      await Promise.all(
        child.map(async mDI => await Mind.initRouting(mDI))
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

    const appServer = injectOneSync(rootInjector, APP_SERVER);
    if (!appServer) {
      throw new Error('APP_SERVER provider was not found.');
    }

    const errorListeners = toArray(injectSync(rootInjector, APP_SERVER_ERROR_LISTENER));
    const serverListener = injectOneSync(rootInjector, APP_SERVER_NET_LISTENER);
    if (!serverListener) {
      throw new Error('APP_SERVER_NET_LISTENER provider was not found.');
    }

    /*
    * Start server using a custom startServer method on bootstrap module or with provided server listeners
    * */
    if (isFunction(rootModuleInstance.startServer)) {
      await invokeOn(rootModuleInstance, 'startServer', appServer);
      return;
    }

    const listeners = [
      serverListener,
      ...errorListeners,
    ].filter(Boolean);

    await invokeOnAll(listeners, 'listen', appServer);
  }

  /**
   * @static
   * @param {Module} rootModule
   * @param {*} platform
   * @returns {Promise<Mind>}
   */
  static async bootstrap(rootModule, platform) {
    const appInstance = new Mind(rootModule, platform);
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
   * @returns {Promise<Mind|*>}
   */
  async initRootModuleDI() {
    // TODO: add possibility to visualize DI tree
    this.rootModuleDI = await Mind.initModuleDI(
      { module: this.appRootModuleMind },
      this.platformMind,
    );
    return this;
  }

  /**
   *
   * @returns {Promise<Mind|*>}
   */
  async invokeInitializers() {
    if (!this.rootModuleDI) {
      return;
    }
    await Mind.invokeInitializers(this.rootModuleDI, this.platformMind);
    return this;
  }

  /**
   * Initiates routing modules DIs based on root module DI
   * @returns {Promise<Mind|*>}
   */
  async initRouting() {
    if (!this.rootModuleDI) {
      return this;
    }
    await Mind.initRouting(this.rootModuleDI);
    return this;
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async startServer() {
    if (!this.rootModuleDI) {
      return this;
    }
    await Mind.startServer(this.rootModuleDI);
    return this;
  }

  /**
   * Invokes initializers, routing and then starts a server if NET listeners have been provided
   * @returns {Promise<Mind|*>}
   */
  async initAndStart() {
    if (!this.rootModuleDI || this.isAppMindInitiated) {
      return this;
    }

    try {
      await this.invokeInitializers();
      this.appServerMindInitializersInvoked = true;
    } catch (e) {
      console.error(e);
      this.appServerMindInitializersInvoked = false;
    }

    try {
      await this.initRouting();
      this.appRoutingMindInitiated = true;
    } catch (e) {
      console.error(e);
      this.appRoutingMindInitiated = false;
    }

    try {
      await this.startServer();
      this.appServerMindStarted = true;
    } catch (e) {
      console.error(e);
      this.appServerMindStarted = false;
    }

    this.isAppMindInitiated = every([
      this.appServerMindInitializersInvoked,
      this.appRoutingMindInitiated,
      this.appServerMindStarted,
    ]);

    return this;
  }

  /**
   * Initiates root module DI, then invokes initializers, routing modules, and after that starts the server;
   * @returns {Promise<Mind|*>}
   */
  async bootstrap() {
    await this.initRootModuleDI();
    return this.initAndStart();
  }

  /**
   * Emits termination signal `SIGTERM` to app server
   * @returns {Promise<boolean>}
   */
  async terminateAppServer() {
    if (!this.isAppMindInitiated) {
      return;
    }

    const isEmitted = await Mind.terminateAppServer(this.rootModuleDI);
    this.appServerMindTerminationEmitted = !!isEmitted;

    return this.appServerMindTerminationEmitted;
  }
};
