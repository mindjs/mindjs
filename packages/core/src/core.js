const { difference, flatten, isArray, isFunction } = require('lodash');

const { ReflectiveInjector } = require('./DI');
const {
  APP_INJECTOR,
  MODULE_INJECTOR,
  APP_INITIALIZER,
  APP_MIDDLEWARE_INITIALIZER,
  APP_SERVER_ERROR_LISTENER,
  APP_SERVER_NET_LISTENER,
  APP_ROUTERS_RESOLVER,
  APP_ROUTERS,
  APP_ROUTERS_INITIALIZER,
} = require('./DI.tokens');
const { invokeFn, invokeOnAll, injectAsync, injectOneAsync, isModuleWithProviders } = require('./helpers');
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

    const modulesWithProviders = imports.filter(isModuleWithProviders);
    const ordinaryModules = difference(imports, modulesWithProviders);
    /* ROUTING */
    const routingModules = modulesWithProviders.filter(m => m.module.name === 'RoutingModule');
    const restModulesWithProviders = difference(modulesWithProviders, routingModules);

    let appProviders = [
      ...providers,
      // ...ordinaryModules, // TODO: init it recursively and provide after DI tree is built
      appModule, // TODO: add providable check...
    ];

    if (imports && imports.length) {
      let importedProviders = ordinaryModules.reduce((m, { providers }) => ([...m, ...providers]), []);
      importedProviders = restModulesWithProviders.reduce((m, { module, providers }) => {
        return [...m, module, ...providers];
      }, [...importedProviders]);
      appProviders = [...appProviders, ...importedProviders];
    }

    const resolvedAppProviders = ReflectiveInjector.resolve(appProviders);
    let appInjector = ReflectiveInjector.fromResolvedProviders(resolvedAppProviders);
    const appInjectorProvider = ReflectiveInjector.resolve([{ // TODO: check if it can be skipped or repalced with 'injection-js' Injector
      provide: APP_INJECTOR,
      useValue: appInjector,
    }]);
    appInjector = appInjector.createChildFromResolved(appInjectorProvider);

    /* ROUTING */
    /*
    * 1. APP_ROUTERS_RESOLVER
    * */
    const appRoutersResolver = await injectAsync(appInjector, APP_ROUTERS_RESOLVER);

    /* ROUTING */
    // TODO: extract helper..
    /*
    * 2. APP_ROUTER_DESCRIPTOR_RESOLVER
    * */
    let resolved = [];
    /* ROUTING */
    if (appRoutersResolver) {
      resolved = appRoutersResolver && isArray(appRoutersResolver)
        ? await invokeOnAll(appRoutersResolver, 'resolve')
        : [await invokeFn(appRoutersResolver.resolve())];
    }
    /* ROUTING */
    const allRouters = [...resolved, ...routingModules];
    /* ROUTING */
    const routers = await Promise.all(allRouters.map(async ({ module, providers }) => {
      const resolvedRoutingProviders = ReflectiveInjector.resolve(providers);
      let routingInjector = appInjector.createChildFromResolved(resolvedRoutingProviders);
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
      return appInjector;
    }

    const routersProviders = [{
      provide: APP_ROUTERS,
      useValue: routersFlattened,
    }];

    const routersInitializer = await injectAsync(appInjector, APP_ROUTERS_INITIALIZER);

    if (!routersInitializer) {
      routersProviders.push({
        provide: APP_ROUTERS_INITIALIZER,
        useClass: AppRoutersInitializer
      });
    }

    const routersProvider = ReflectiveInjector.resolve(routersProviders);

    return appInjector.createChildFromResolved(routersProvider);
  }

  // static async initApplicationModule(appModule) {
  //
  // }
  //
  // static async initModule(appInjector, appModule) {
  //
  // }
  //
  // static async initApplicationRouting(appInjector, routingModules) {
  //
  // }

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
    if (isFunction(appModuleInstance.startServer) ) {
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
