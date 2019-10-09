const { flatten, isArray, isFunction, every } = require('lodash');

const {
  ReflectiveInjector,
} = require('@framework100500/common/DI');
const {
  invokeFn,
  invokeOnAll,
  injectAsync,
  injectOneAsync,
} = require('@framework100500/common/utils');

const {
  APP_ROUTING_MODULES_RESOLVER,
} = require('@framework100500/routing');
const {
  isRoutingModule,
} = require('@framework100500/routing/utils');

const {
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

  constructor(bootstrap100500Module) {
    this._app100500ServerTerminationEmitted = false;
    this._app100500InitializersInvoked = false;
    this._app100500RoutingInitiated = false;
    this._app100500ServerStarted = false;
    this.isApp100500Initiated = false;

    this.app100500RootModule = bootstrap100500Module;
  }

  /**
   *
   * @param {{module: *, injector?: *, child?: {module: *, injector?: *, child?: *}[]}} moduleDI
   * @returns {Promise<{module: *, injector: *, child: *}|{module: *, injector: *, child: []}>}
   */
  static async initModuleDI(moduleDI) {
    // TODO: add dummy checks
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

    const rootProviders = [
      ...providers,
      ...importedProviders,
      ...ordinaryModules, // provide ordinary modules on a root level
      appModule,
    ];
    const resolvedRootProviders = ReflectiveInjector.resolve(rootProviders);

    if (!rootInjector) {
      rootInjector = ReflectiveInjector.fromResolvedProviders(resolvedRootProviders);
    }
    if (!parentInjector) {
      parentInjector = rootInjector;
    }

    const moduleInjector = parentInjector.createChildFromResolved(resolvedRootProviders);

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
        ordinaryModules.map(async (m) => await Framework100500.initModuleDI({
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
   * @param rootDI
   * @returns {Promise<*>}
   */
  static async invokeInitializers(rootDI = {}) {
    const { rootInjector } = rootDI;

    if (!rootInjector) {
      throw new Error(('injector was not provided'));
    }

    const initializeInjector = rootInjector;

    const appMiddlewareInitializer = await injectAsync(rootInjector, APP_MIDDLEWARE_INITIALIZER);
    const appInitializers = await injectAsync(rootInjector, APP_INITIALIZER);
    const restInitializers = initializeInjector !== rootInjector
      ? await injectAsync(initializeInjector, APP_INITIALIZER)
      : [];

    const allInitializers = [
      ...(isArray(appInitializers) ? appInitializers : [appInitializers]),
      ...(isArray(restInitializers) ? restInitializers : [restInitializers]),
      ...(isArray(appMiddlewareInitializer) ? appMiddlewareInitializer : [appMiddlewareInitializer]),
    ];

    await invokeOnAll(allInitializers, 'init');
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

    const routingModulesResolver = await injectAsync(moduleInjector, APP_ROUTING_MODULES_RESOLVER);
    if (routingModulesResolver) {
      resolvedRoutingModules = routingModulesResolver && isArray(routingModulesResolver)
        ? await invokeOnAll(routingModulesResolver, 'resolve')
        : [await invokeFn(routingModulesResolver.resolve())];
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

    const appServer = await injectOneAsync(rootInjector, APP_SERVER);

    return await Promise.all(
      child.map(async ({ module, injector }) => {
        const routingModule = await injectAsync(injector, module);
        return await invokeFn(routingModule.resolveAndInitRouters(appServer));
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
    const { module: rootModule, injector: rootInjector } = moduleDI;

    if (!(rootModule && rootInjector)) {
      throw new Error('App Injector and/or App Module was/were not provided');
    }

    const rootModuleInstance = await injectOneAsync(rootInjector, rootModule);
    const errorListeners = await injectAsync(rootInjector, APP_SERVER_ERROR_LISTENER);
    const serverListener = await injectOneAsync(rootInjector, APP_SERVER_NET_LISTENER);

    /*
    * Start server using a custom startServer method on bootstrap module or with provided server listeners
    * */
    if (isFunction(rootModuleInstance.startServer)) {
      await invokeFn(rootModuleInstance.startServer());
      return;
    }

    const listeners = [
      ...(isArray(errorListeners) ? errorListeners : [errorListeners]),
      ...[serverListener],
    ];

    await invokeOnAll(listeners, 'listen');
  }

  /**
   * @static
   * @param rootModule
   * @returns {Promise<Framework100500>}
   */
  static async bootstrap(rootModule) {
    const appInstance = new Framework100500(rootModule);
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

    const terminateSignal = await injectOneAsync(rootInjector, APP_TERMINATION_SIGNAL, TERMINATION_SIGNAL.SIGTERM);

    return process.emit(terminateSignal);
  }

  /**
   * Initiates `rootModuleDI` for root module
   * @returns {Promise<void>}
   */
  async initRootModuleDI() {
    // TODO: add possibility to visualize DI tree
    this.rootModuleDI = await Framework100500.initModuleDI({ module: this.app100500RootModule });
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async invokeInitializers() {
    if (!this.rootModuleDI) {
      return;
    }
    await Framework100500.invokeInitializers(this.rootModuleDI);
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
