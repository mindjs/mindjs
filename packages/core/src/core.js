const { flatten, isArray, isFunction } = require('lodash');

const { ReflectiveInjector } = require('./DI');
const {
  APP_INITIALIZER,
  APP_MIDDLEWARE_INITIALIZER,
  APP_SERVER_ERROR_LISTENER,
  APP_SERVER_NET_LISTENER,
  APP_ROUTING_MODULES_RESOLVER,
  APP_ROUTERS,
  APP_ROUTERS_INITIALIZER,
} = require('./DI.tokens');
const { invokeFn, invokeOnAll, injectAsync, injectOneAsync, isModuleWithProviders, isRoutingModule } = require('./helpers');
const { MiddlewareInitializer, AppRoutersInitializer } = require('./initializers');

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
   * @param appModule
   * @returns {Promise<{module: *, injector: *, child: *[]}>}
   */
  static async initModuleAndRouting(appModule = {}) {
    const { imports = [], providers = [] } = appModule;

    if (!(isArray(imports) && isArray(providers))) {
      return {
        module: appModule,
        injector: ReflectiveInjector.resolveAndCreate([
          appModule,
        ]),
        child: [],
      };
    }

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
    const rootInjector = ReflectiveInjector.fromResolvedProviders(resolvedRootProviders);

    const routingInitInjector = await Framework100500.initAndMountRoutingModules({
      module: appModule,
      injector: rootInjector,
    });

    /*
     * 2. Init recursively injectors of `Ordinary modules`
     * */
    const ordinaryModulesInjectors = await Promise.all(
      ordinaryModules.map(async (m) => await Framework100500.initModuleAndRouting(m))
    );

    return {
      module: appModule,
      injector: rootInjector,
      child: [
        routingInitInjector,
        ...ordinaryModulesInjectors,
      ]
    };
  }

  static async initAndMountRoutingModules(DITree) {
    const { injector: parentModuleInjector, module: parentModule } = DITree;

    const rootRoutingModules = await Framework100500.extractRoutingModules(parentModule, parentModuleInjector);

    // TODO: extract a helper
    const routingModulesInjectors = await Promise.all(
      rootRoutingModules.map(async ({ module, providers }) => {
        const routingModuleProviders = ReflectiveInjector.resolve([
          ...providers,
          module,
        ]);
        const routingModuleInjector = parentModuleInjector.createChildFromResolved(routingModuleProviders);

        return {
          module,
          injector: routingModuleInjector,
          child: [],
        };
      })
    );

    const resolvedRouters = await Promise.all(
      routingModulesInjectors.map(async ({ module, injector }) => {
        const routingModule = await injectAsync(injector, module);
        return await invokeFn(routingModule.resolveRouters());
      })
    );

    const routingInitProviders = [{
      provide: APP_ROUTERS,
      useValue: flatten(resolvedRouters),
    }];

    // TODO: think about renaming the APP_ROUTERS_INITIALIZER token
    const routersInitializer = await injectAsync(parentModuleInjector, APP_ROUTERS_INITIALIZER);

    if (!routersInitializer) {
      routingInitProviders.push({
        provide: APP_ROUTERS_INITIALIZER,
        useClass: AppRoutersInitializer
      });
    }

    const resolvedRoutingInitProviders = ReflectiveInjector.resolve(routingInitProviders);
    const routingInitInjector = parentModuleInjector.createChildFromResolved(resolvedRoutingInitProviders);

    await Framework100500.mountRouters(routingInitInjector);

    return {
      module: parentModule,
      injector: routingInitInjector,
      child: [
        ...routingModulesInjectors,
      ],
    };
  }

  /**
   * TODO: leave as is or move to ordinary helper
   * @param appModule
   * @param appModuleInjector
   * @returns {Promise<*[]>}
   */
  static async extractRoutingModules(appModule, appModuleInjector) {
    const { imports } = appModule;
    let resolvedRoutingModules = [];

    const routingModules = imports.filter(m => isModuleWithProviders(m) && isRoutingModule(m));

    const routingModulesResolver = await injectAsync(appModuleInjector, APP_ROUTING_MODULES_RESOLVER);
    if (routingModulesResolver) {
      resolvedRoutingModules = routingModulesResolver && isArray(routingModulesResolver)
        ? await invokeOnAll(routingModulesResolver, 'resolve')
        : [await invokeFn(routingModulesResolver.resolve())];
    }

    return [
      ...resolvedRoutingModules,
      ...routingModules,
    ];
  }

  /**
   *
   * @param appDITree
   * @returns {Promise<*>}
   */
  static async invokeInitializers(appDITree = {}) {
    const { injector: rootInjector } = appDITree;

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
    const restInitializers = await injectAsync(initializeInjector, APP_INITIALIZER);

    const allInitializers = [
      ...(isArray(appInitializers) ? appInitializers : [appInitializers]),
      ...(isArray(restInitializers) ? restInitializers : [restInitializers]),
      ...(isArray(appMiddlewareInitializer) ? appMiddlewareInitializer : [appMiddlewareInitializer]),
    ];

    await invokeOnAll(allInitializers, 'init');
  }

  /**
   * @static
   * @param moduleInjector
   */
  static async mountRouters(moduleInjector) {
    const moduleRoutingInitializer = await injectOneAsync(moduleInjector, APP_ROUTERS_INITIALIZER);
    await invokeFn(isFunction(moduleRoutingInitializer.init) && moduleRoutingInitializer.init());
  }

  /**
   *
   * @param appDITree
   * @returns {Promise<void>}
   */
  static async startServer(appDITree = {}) {
   const { module: rootModule, injector: rootInjector } = appDITree;

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
    const appDITree = await Framework100500.initModuleAndRouting(rootModule);
    await Framework100500.invokeInitializers(appDITree);
    await Framework100500.startServer(appDITree); // TODO: use BOOTSTRAP_MODULE Injection token
  }

};
