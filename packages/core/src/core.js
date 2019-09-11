const { flatten, isArray, isFunction } = require('lodash');

const { ReflectiveInjector } = require('./DI');
const {
  APP_SERVER,
  APP_INITIALIZER,
  APP_MIDDLEWARE_INITIALIZER,
  APP_SERVER_ERROR_LISTENER,
  APP_SERVER_NET_LISTENER,
  APP_ROUTING_MODULES_RESOLVER,
  APP_ROUTERS,
  APP_ROUTERS_INITIALIZER,
} = require('./DI.tokens');
const { invokeFn, invokeOnAll, injectAsync, injectOneAsync, isModuleWithProviders, isRoutingModule } = require('./helpers');
const { MiddlewareInitializer, appRoutersInitializer } = require('./initializers');

module.exports = class Framework100500 {

  constructor(bootstrapModule) {
    this.rootModule = bootstrapModule;
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async bootstrap() {
    await Framework100500.bootstrap(this.rootModule);
  }

  /**
   *
   * @param {{module: *, injector?: *, child?: {module: *, injector?: *, child?: *}[]}} moduleDI
   * @returns {Promise<{module: *, injector: *, child: *}|{module: *, injector: *, child: []}>}
   */
  static async initModuleAndRouting(moduleDI) {
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
    const [routingInitDI, ordinaryModulesInjectors] = await Promise.all([
      Framework100500.initRoutingModules({
        rootInjector,
        module: appModule,
        injector: moduleInjector,
      }),
      Promise.all(
        ordinaryModules.map(async (m) => await Framework100500.initModuleAndRouting({
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
      routing: routingInitDI,
      child: [
        ...ordinaryModulesInjectors,
      ],
    };
  }

  /**
   *
   * @param {{module: *, injector: *, child?: {module: *, injector: *, child: []}[]}} moduleDI
   * @returns {Promise<{module: *, injector: *, child: {module: *, injector: *, child: []}[]}>|undefined}
   */
  static async initRoutingModules(moduleDI) {
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

    // TODO: extract a helper
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

    const resolvedRouters = await Promise.all(
      routingModulesDI.map(async ({ module, injector }) => {
        const routingModule = await injectAsync(injector, module);
        return await invokeFn(routingModule.resolveRouters());
      }),
    );

    const routingInitProviders = [{
      provide: APP_ROUTERS,
      useValue: flatten(resolvedRouters),
    }];

    // TODO: think about renaming the APP_ROUTERS_INITIALIZER token
    const routersInitializer = await injectAsync(rootInjector, APP_ROUTERS_INITIALIZER);

    if (!routersInitializer) {
      routingInitProviders.push({
        provide: APP_ROUTERS_INITIALIZER,
        useValue: appRoutersInitializer,
      });
    }

    const resolvedRoutingInitProviders = ReflectiveInjector.resolve(routingInitProviders);
    const routingInitInjector = rootInjector.createChildFromResolved(resolvedRoutingInitProviders);

    return {
      rootInjector,
      module: parentModule,
      injector: routingInitInjector,
      child: [
        ...routingModulesDI,
      ],
    };
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
   * @param rootDI
   * @returns {Promise<*>}
   */
  static async invokeInitializers(rootDI = {}) {
    const { rootInjector } = rootDI;

    if (!rootInjector) {
      throw new Error(('injector was not provided'));
    }

    let initializeInjector = rootInjector;

    const appMiddlewareInitializer = await injectAsync(rootInjector, APP_MIDDLEWARE_INITIALIZER);

    if (!appMiddlewareInitializer) {
      const resolvedProvidersWithMWInitializer = ReflectiveInjector.resolve([{
        provide: APP_INITIALIZER,
        useClass: MiddlewareInitializer,
        multi: true,
      }]);
      initializeInjector = rootInjector.createChildFromResolved(resolvedProvidersWithMWInitializer);
    }

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
   * @param rootDI
   * @returns {Promise<void>}
   */
  static async initRouting(rootDI) {
    const { routing, child } = rootDI;
    if (routing) {
      await Framework100500.mountRouters(routing);
    }

    if (child.length) {
      await Promise.all(
        child.map(async mDI => await Framework100500.initRouting(mDI))
      );
    }
  }

  /**
   * @static
   * @param routingInitDI
   */
  static async mountRouters(routingInitDI) {
    const { injector } = routingInitDI;
    const moduleRoutingInitializer = await injectOneAsync(injector, APP_ROUTERS_INITIALIZER);
    const appServer = await injectOneAsync(injector, APP_SERVER);
    const moduleRouters = await injectAsync(injector, APP_ROUTERS);
    await invokeFn(moduleRoutingInitializer, appServer, moduleRouters);
  }

  /**
   *
   * @param moduleDI
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
   * @returns {Promise<void>}
   */
  static async bootstrap(rootModule) {
    // TODO: add possibility to visualize DI tree
    const rootModuleDI = await Framework100500.initModuleAndRouting({ module: rootModule });
    await Framework100500.invokeInitializers(rootModuleDI);
    await Framework100500.initRouting(rootModuleDI);
    await Framework100500.startServer(rootModuleDI);
  }

};
