const { every, difference, flatten, isArray, first, isFunction } = require('lodash');

const { ReflectiveInjector } = require('./constants');
const {
  APP_INJECTOR,
  MODULE_INJECTOR,
  APP_INITIALIZER,
  APP_MIDDLEWARE_INITIALIZER,
  APP_SERVER,
  APP_SERVER_ERROR_LISTENER,
  APP_SERVER_NET_LISTENER,
} = require('./DI.tokens');

const { invokeFn, invokeOnAll } = require('./helpers');
const { MiddlewareInitializer } = require('./initializers');

const {
  APP_ROUTERS_RESOLVER,
  // RoutingModule,
  // APP_ROUTER_DESCRIPTOR_RESOLVER,
} = require('@framework100500/routing');

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
   * TODO: extract helpers/methods
   * @static
   * @param appModule
   * @returns {Promise<{appInjector: ReflectiveInjector, clientRouters: any[]} | Promise<any[] | never>>}
   */
  static async initialize(appModule) {
    const { imports = [], providers = [] } = appModule;

    const modulesWithModuleProp = imports.filter(im => every([im, im.module]));
    const modulesWithoutModuleProp = difference(imports, modulesWithModuleProp);
    const routingModules = modulesWithModuleProp.filter(m => m.module.name === 'RoutingModule');

    const nonRoutingModulesWithModuleProp = difference(modulesWithModuleProp, routingModules);

    let appProviders = [
      ...providers,
      ...modulesWithoutModuleProp,
      appModule, // TODO: add providable check...
    ];

    if (imports && imports.length) {
      let importedProviders = modulesWithoutModuleProp.reduce((m, { providers }) => ([...m, ...providers]), []);
      importedProviders = nonRoutingModulesWithModuleProp.reduce((m, { module, providers }) => {
        return [...m, module, ...providers];
      }, [...importedProviders]);
      appProviders = [...appProviders, ...importedProviders];
    }

    const resolvedAppProviders = ReflectiveInjector.resolve(appProviders);
    let appInjector = ReflectiveInjector.fromResolvedProviders(resolvedAppProviders);
    const appInjectorProvider = ReflectiveInjector.resolve([{
      provide: APP_INJECTOR,
      useValue: appInjector,
    }]);
    appInjector = appInjector.createChildFromResolved(appInjectorProvider);

    await Framework100500.invokeInitializers(appInjector);

    // TODO: complete routing initiation...
    // APP_ROUTERS_RESOLVER - first - inject a routing resolver or create it combining all APP_ROUTER_DESCRIPTOR_RESOLVER
    // APP_ROUTER_DESCRIPTOR_RESOLVER

    let appRoutersResolver;
    try {
      appRoutersResolver = appInjector.get(APP_ROUTERS_RESOLVER);
      appRoutersResolver = isArray(appRoutersResolver) ? first(appRoutersResolver) : appRoutersResolver;
    } catch (e) {
      // eslint-disable-next-line
      console.warn('Unable to get the APP_ROUTERS_RESOLVER');
    }

    const resolved = appRoutersResolver ? await appRoutersResolver.resolve() : [];

    const routers = await Promise.all(resolved.map(async ({ module, providers }) => {

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

      const routingModule = routingInjector.get(module);

      return await routingModule.resolveRouters();
    }));

    return {
      injector: appInjector,
      routers: flatten(routers),
    };
  }

  /**
   *
   * @param appInjector
   * @returns {Promise<any[]>}
   */
  static async invokeInitializers(appInjector) {
    let appMiddlewareInitializer;
    let appInitializers = [];
    let initializeInjector = appInjector;

    try {
      appMiddlewareInitializer = appInjector.get(APP_MIDDLEWARE_INITIALIZER);

      isArray(appMiddlewareInitializer)
        ? await invokeOnAll('init', appMiddlewareInitializer)
        : await invokeFn(appMiddlewareInitializer.init);

    } catch (e) {
      const resolvedProvidersWithMWInitializer = ReflectiveInjector.resolve([{
        provide: APP_INITIALIZER,
        useClass: MiddlewareInitializer,
      }]);
      initializeInjector = appInjector.createChildFromResolved(resolvedProvidersWithMWInitializer);
    }

    try {
      appInitializers = initializeInjector.get(APP_INITIALIZER);
    } catch (e) {
      // eslint-disable-next-line
      console.warn('APP_INITIALIZERs are not found');
    }

    return await invokeOnAll('init', appInitializers);
  }

  /**
   * @static
   * @param appInjector
   * @param clientRouters
   */
  static mountRoutes(appInjector, clientRouters) {
    const appServer = appInjector.get(APP_SERVER);
    clientRouters.map(r => appServer.use(r.routes()));
  }

  /**
   * @static
   * @param appInjector
   * @param appModule
   */
  static startServer(appInjector, appModule) {
    const appModuleInstance = appInjector.get(appModule);

    let errorListeners;
    try {
      errorListeners = appInjector.get(APP_SERVER_ERROR_LISTENER);
    } catch (e) {
      errorListeners = [];
    }

    if (isArray(errorListeners)) {
      errorListeners.forEach(l => l.listen());
    }

    if (isFunction(appModuleInstance.startServer) ) {
      appModuleInstance.startServer();
      return;
    }

    const serverListener = appInjector.get(APP_SERVER_NET_LISTENER);
    serverListener.listen && serverListener.listen();
  }

  /**
   * @static
   * @param appModule
   * @returns {Promise<void>}
   */
  static async bootstrap(appModule) {
    const { injector, routers } = await Framework100500.initialize(appModule);
    Framework100500.mountRoutes(injector, routers);
    Framework100500.startServer(injector, appModule); // TODO: use BOOTSTRAP_MODULE Injection token
  }

};
