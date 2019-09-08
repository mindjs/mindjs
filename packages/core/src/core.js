const { flatten, isArray, isFunction } = require('lodash');

const { ReflectiveInjector } = require('./DI');
const {
  MODULE_INJECTOR,
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

  constructor(appModule) {
    this.appModule = appModule;
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async bootstrap() {
    await Framework100500.bootstrap(this.appModule);
  }

  /**
   * TODO: extract helpers/methods and routing handling...
   * @static
   * @param appModule
   * @returns {Promise<ReflectiveInjector>}
   */
  static async initModuleAndRouting(appModule) {
    const { imports = [], providers = [] } = appModule;

    if (!(isArray(imports) && isArray(providers))) {
      return ReflectiveInjector.resolveAndCreate([appModule]);
    }

    /**
     * `Modules with providers` - share their providers with parent module
     * `Ordinary modules` - encapsulate their providers within own scope. At the same time an Ordinary module has an access to parent scope
     * `Routing modules` - do not have their own imports; encapsulate their providers for building application routing.
     */

    const ordinaryModules = imports.filter(m => !isModuleWithProviders(m));
    const restModulesWithProviders = imports.filter(m => isModuleWithProviders(m) && !isRoutingModule(m));

    /*
    *  1. Init top-level providers with all modules with providers and top-level routing modules
    * */
    /*
     * 2. Init recursively injectors of all `Ordinary modules`
     * */

    const importedProviders = restModulesWithProviders.reduce((memo, { module, providers }) => {
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

    // TODO: check if it can be skipped or repalced with 'injection-js' Injector
    // const rootInjectorProvider = ReflectiveInjector.resolve([{
    //   provide: APP_INJECTOR,
    //   useValue: rootInjector,
    // }]);
    // rootInjector = rootInjector.createChildFromResolved(rootInjectorProvider);

    const rootRoutingModules = Framework100500.extractRoutingModules(appModule, rootInjector);

    /* ROUTING */
    const routers = await Promise.all(rootRoutingModules.map(async ({ module, providers }) => {
      const resolvedRoutingProviders = ReflectiveInjector.resolve(providers);
      let routingInjector = rootInjector.createChildFromResolved(resolvedRoutingProviders);
      const restRoutingProviders = [
        {
          provide: MODULE_INJECTOR,
          useValue: routingInjector,
        },
        module,
      ];

      const resolvedRestRoutingProviders = ReflectiveInjector.resolve(restRoutingProviders);
      routingInjector = routingInjector.createChildFromResolved(resolvedRestRoutingProviders);
      const routingModule = await injectAsync(routingInjector, module);

      return await invokeFn(routingModule.resolveRouters());
    }));

    const routersFlattened = flatten(routers);
    if (!routersFlattened.length) {
      return rootInjector;
    }

    const routersProviders = [{
      provide: APP_ROUTERS,
      useValue: routersFlattened,
    }];

    const routersInitializer = await injectAsync(rootInjector, APP_ROUTERS_INITIALIZER);

    if (!routersInitializer) {
      routersProviders.push({
        provide: APP_ROUTERS_INITIALIZER,
        useClass: AppRoutersInitializer
      });
    }

    const routersProvider = ReflectiveInjector.resolve(routersProviders);

    return rootInjector.createChildFromResolved(routersProvider);
  }

  // static async initModule(parentInjector, appModule) {
  //
  // }
  //
  // static async initRoutingModule(parentInjector, routingModule) {
  //
  // }

  /**
   * TODO: leave as is or move to ordinary helper
   * @param module
   * @param moduleInjector
   * @returns {Promise<*[]>}
   */
  static async extractRoutingModules(module, moduleInjector) {
    const { imports } = module;
    let resolvedRoutingModules = [];

    const routingModules = imports.filter(m => isModuleWithProviders(m) && isRoutingModule(m));

    const routingModulesResolver = await injectAsync(moduleInjector, APP_ROUTING_MODULES_RESOLVER);
    if (routingModulesResolver) {
      resolvedRoutingModules = routingModulesResolver && isArray(routingModulesResolver)
        ? await invokeOnAll(routingModulesResolver, 'resolve')
        : [await invokeFn(routingModulesResolver.resolve())];
    }
    /* ROUTING */
    const moduleRoutingModules = [
      ...resolvedRoutingModules,
      ...routingModules,
    ];

    return moduleRoutingModules;
  }

  /**
   *
   * @param appInjector
   * @returns {Promise<*>}
   */
  static async invokeInitializers(appInjector) {
    let initializeInjector = appInjector;

    const appMiddlewareInitializer = await injectAsync(appInjector, APP_MIDDLEWARE_INITIALIZER);

    if (!appMiddlewareInitializer) {
      const resolvedProvidersWithMWInitializer = ReflectiveInjector.resolve([{
        provide: APP_INITIALIZER,
        useClass: MiddlewareInitializer,
        multi: true,
      }]);
      initializeInjector = appInjector.createChildFromResolved(resolvedProvidersWithMWInitializer);
    }

    const appInitializers = await injectAsync(appInjector, APP_INITIALIZER);
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
   * @param appInjector
   */
  static async mountRouters(appInjector) {
    const appRoutersInitializer = await injectOneAsync(appInjector, APP_ROUTERS_INITIALIZER);
    await invokeFn(isFunction(appRoutersInitializer.init) && appRoutersInitializer.init());
  }

  /**
   * @static
   * @param appInjector
   * @param appModule
   */
  static async startServer(appInjector, appModule) {
    if (!(appInjector && appModule)) {
      throw new Error('App Injector and/or App Module was/were not provided');
    }

    const appModuleInstance = await injectOneAsync(appInjector, appModule);
    const errorListeners = await injectAsync(appInjector, APP_SERVER_ERROR_LISTENER);
    const serverListener = await injectOneAsync(appInjector, APP_SERVER_NET_LISTENER);

    /*
    * Start server using a custom startServer method on bootstrap module or with provided server listeners
    * */
    if (isFunction(appModuleInstance.startServer)) {
      await invokeFn(appModuleInstance.startServer());
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
   * @param appModule
   * @returns {Promise<void>}
   */
  static async bootstrap(appModule) {
    const injector = await Framework100500.initModuleAndRouting(appModule);
    await Framework100500.invokeInitializers(injector);
    await Framework100500.mountRouters(injector);
    await Framework100500.startServer(injector, appModule); // TODO: use BOOTSTRAP_MODULE Injection token
  }

};
