const { isFunction, isObject, isArray, flatten } = require('lodash');

const {
  Module,
  Inject,
} = require('@framework100500/common');
const { Injector, ReflectiveInjector } = require('@framework100500/common/DI');
const { HTTP_METHODS } = require('@framework100500/common/http');
const { injectSyncFromTree, invokeOn, invokeFn, injectSync } = require('@framework100500/common/utils');

const {
  APP_ROUTER_DESCRIPTOR_RESOLVER,
  APP_ROUTER_MIDDLEWARE_INITIALIZER,
  APP_ROUTER_PROVIDER,
  APP_ROUTERS_INITIALIZER,
  APP_ROUTE_MOUNTER,
} = require('./DI.tokens');
const {
  stubHandler,
} = require('./constants');
const {
  AppRouterMiddlewareInitializer,
  AppRoutersInitializer,
  AppRouteMounter,
} = require('./initializers');
const {
  normalizeRoutePath,
  isValidHandler,
  isValidMiddlewareList,
} = require('./utils');

/*
   Usage notes:

    in your Application module add RoutingModule to imports array

    RoutingModule.forRoot({
      providers: [{
          provide: APP_ROUTER_DESCRIPTOR_RESOLVER,
          useFactory: function() {
           return {
              resolve() {
                return {
                  prefix: string,
                  commonMiddleware: Function[],
                  commonMiddlewareResolvers: (Injectable|{ resolver: Injectable, resolveParams: *[] })[],
                  routes: [
                    {
                      path: string,
                      method: HTTP_METHODS,

                      middlewareResolvers?: (Injectable|{ resolver: Injectable, resolveParams: *[] })[],
                      middleware?: Function[],

                      handlerResolver?: Injectable,
                      handlerResolverResolveParams?: *[],
                      handler?: Function,
                  },
                ],
              };
            }
           };
          },
        multi: true
      }],
      routerDescriptor: {
         prefix: string,
         commonMiddleware: Function[],
         commonMiddlewareResolvers: (Injectable|{ resolver: Injectable, resolveParams: *[] })[],
         routes: [
          {
            path: {string},
            method: HTTP_METHODS,

            middlewareResolvers?: (Injectable|{ resolver: Injectable, resolveParams: *[] })[],
            middleware?: Function[],

            handlerResolver?: Injectable,
            handlerResolverResolveParams?: *[],
            handler?: Function,
          },
        ],
      },
   });

   or just provide APP_ROUTING_MODULES_RESOLVER as follows

   {
     provide: APP_ROUTING_MODULES_RESOLVER,
     useFactory: function () {
      return {
        async resolve() {
          return [
            RoutingModule.forRoot({
              providers: [],
              routerDescriptor: {
                prefix: 'prefix',
                commonMiddlewareResolvers: [],
                commonMiddleware: [],
                routes: [],
              },
            }),
          ];
      };
    },
    deps: [],
   }
 */
class RoutingModule {

  static get parameters() {
    return [
      Inject(Injector),
      Inject(APP_ROUTER_PROVIDER),
    ];
  }

  constructor(
    moduleInjector,
    routerProvider,
  ) {
    this.moduleInjector = moduleInjector;
    this.routerProvider = routerProvider;
  }

  /**
   * @param {{
   *   providers: Injectable[]|Provider[],
   *   routerDescriptor: {
   *     prefix: string,
   *     commonMiddlewareResolvers: (Injectable|{ resolver: Injectable, resolveParams: *[] })[],
   *     commonMiddleware: Function[],
   *     routes: {
   *       path: string,
   *       method: HTTP_METHODS.GET|HTTP_METHODS.POST|HTTP_METHODS.PUT|HTTP_METHODS.PATCH|HTTP_METHODS.DELETE|HTTP_METHODS.HEAD|HTTP_METHODS.OPTIONS,
   *
   *       handler: Function,
   *       handlerResolver: Injectable,
   *       handlerResolverResolveParams: *[],
   *
   *       middleware: Function[],
   *       middlewareResolvers: (Injectable|{ resolver: Injectable, resolveParams: *[] })[],
   *    }[]
   *   }
   * }} routingConfig
   * @returns {{providers: {provide: *, useFactory: (function(): {resolve(): Promise<*>}), multi: boolean}[]}}
   */
  static forRoot({ providers = [], routerDescriptor = {} }) {
    return {
      module: Module(RoutingModule),
      providers: [
        ...providers,
        {
          provide: APP_ROUTER_DESCRIPTOR_RESOLVER,
          useFactory: function () {
            return {
              resolve() {
                return {
                  ...routerDescriptor,
                };
              },
            };
          },
          multi: true,
        },
      ],
    };
  }

  /**
   *
   * @param appServer
   * @returns {Promise<[]|*>}
   */
  async resolveAndInitRouters(appServer) {
    const routerDescriptorResolvers = injectSync(this.moduleInjector, APP_ROUTER_DESCRIPTOR_RESOLVER);

    if (!routerDescriptorResolvers) {
      this.routers = [];
      return;
    }

    this.routers = isArray(routerDescriptorResolvers)
      ? await Promise.all(
        routerDescriptorResolvers
          .filter(Boolean)
          .filter(r => isFunction(r.resolve))
          .map((r) => this._resolveRouter(r))
      )
      : [await this._resolveRouter(routerDescriptorResolvers)];

    await this.initRouters(appServer, flatten(this.routers));
  }

  /**
   *
   * @param appServer
   * @param routers
   * @returns {Promise<*>}
   */
  async initRouters(appServer, routers) {
    let routersInitializer = injectSyncFromTree(this.moduleInjector, APP_ROUTERS_INITIALIZER);
    if (!routersInitializer) {
      routersInitializer = new AppRoutersInitializer();
    }

    return isObject(routersInitializer) && isFunction(routersInitializer.init)
      ? invokeOn(routersInitializer, 'init', appServer, routers)
      : invokeFn(routersInitializer, appServer, routers);
  }

  /**
   *
   * @param routerDescriptorResolver
   * @returns {Promise<*>}
   * @private
   */
  async _resolveRouter(routerDescriptorResolver) {
    const router = new this.routerProvider();
    const {
      prefix = '',
      commonMiddleware = [],
      commonMiddlewareResolvers = [],
      routes = [],
    } = await routerDescriptorResolver.resolve();

    const resolvedCommonMiddleware = await this._provideAllAndResolve(commonMiddlewareResolvers);
    const routerMiddleware = [...commonMiddleware, ...resolvedCommonMiddleware].filter(Boolean);
    await this._initMiddlewareOnRouter(router, routerMiddleware);

    const preparedRoutesDescriptors = await this._prepareRoutesDescriptors(routes, prefix);
    await this.mountRoutes(router, preparedRoutesDescriptors);

    return router;
  }

  /**
   *
   * @param router
   * @param middleware
   * @returns {Promise<void>}
   * @private
   */
  async _initMiddlewareOnRouter(router, middleware) {
    let routerMiddlewareInitializer = injectSyncFromTree(this.moduleInjector, APP_ROUTER_MIDDLEWARE_INITIALIZER);
    if (!routerMiddlewareInitializer) {
      routerMiddlewareInitializer = new AppRouterMiddlewareInitializer(); // use default one
    }

    isObject(routerMiddlewareInitializer) && isFunction(routerMiddlewareInitializer.init)
      ? await invokeOn(routerMiddlewareInitializer, 'init', router, middleware)
      : await invokeFn(routerMiddlewareInitializer, router, middleware);
  }

  /**
   *
   * @param router
   * @param routesDescriptors
   * @returns {Promise<*>}
   */
  async mountRoutes(router, routesDescriptors) {
    let appRouteMounter = injectSyncFromTree(this.moduleInjector, APP_ROUTE_MOUNTER);
    if (!appRouteMounter) {
      appRouteMounter = new AppRouteMounter(); // use default one
    }

    await Promise.all(
      routesDescriptors.map(async ({ path, method = HTTP_METHODS.GET, middleware = [], handler }) => {
        const routeDescriptor = { path, method, middleware, handler };
        return isObject(appRouteMounter) && isFunction(appRouteMounter.mount)
          ? invokeOn(appRouteMounter, 'mount', router, routeDescriptor)
          : invokeFn(appRouteMounter, router, routeDescriptor);
      }));
  }

  /**
   *
   * @param routesDescriptors
   * @param {string} prefix
   * @returns {{path: (string|*), handler: (function(*): {message: string, statusCode: number}), method: string, middleware: *[]}[]}
   * @private
   */
  async _prepareRoutesDescriptors(routesDescriptors = [], prefix = '') {
    return Promise.all(
      routesDescriptors.map(async r => await this._prepareRouteDescriptor(r, prefix)),
    );
  }

  /**
   *
   * @param routeDescriptor
   * @param {string} prefix
   * @returns {{path: (string|*), handler: (function(*): {message: string, statusCode: number}), method: string, middleware: *[]}}
   * @private
   */
  async _prepareRouteDescriptor(routeDescriptor, prefix = '') {
    if (!(this.moduleInjector && routeDescriptor)) {
      throw new Error('Invalid input.');
    }

    let handlerToUse;

    const {
      path,
      method = HTTP_METHODS.GET,

      handler,
      handlerResolver,
      handlerResolverResolveParams,

      middleware = [],
      middlewareResolvers = [],
    } = routeDescriptor;

    if (isValidHandler(handler)) {
      handlerToUse = handler;
    } else if (handlerResolver) {
      const injectedAndResolvedHandler = await this._provideAndResolve(
        handlerResolver,
        handlerResolverResolveParams,
      );
      handlerToUse = isValidHandler(injectedAndResolvedHandler) ? injectedAndResolvedHandler : stubHandler;
    }

    const injectedMiddleware = await this._provideAllAndResolve(middlewareResolvers);
    const routePath = `${ prefix ? normalizeRoutePath(prefix) : prefix }${ normalizeRoutePath(path) }`;

    return {
      path: routePath,
      method: method,
      middleware: [
        ...(isValidMiddlewareList(middleware) ? middleware : []), // TODO: improve/rework filtering valid middleware
        ...(isValidMiddlewareList(injectedMiddleware) ? injectedMiddleware : []),
      ],
      handler: handlerToUse,
    };
  }

  /**
   *
   * @param resolversAndResolveParams
   * @returns {any[]}
   * @private
   */
  async _provideAllAndResolve(resolversAndResolveParams = []) {
    return Promise.all(
      resolversAndResolveParams
        .filter(Boolean)
        .map(async (resolverOrResolverConfig) => {
          if (!resolverOrResolverConfig.resolveParams) {
            return this._provideAndResolve(resolverOrResolverConfig);
          }

          const { resolver, resolveParams } = resolverOrResolverConfig;

          return this._provideAndResolve(resolver, resolveParams);
        }).filter(Boolean),
    );
  }

  /**
   *
   * @param resolver
   * @param resolveParams
   * @returns {undefined}
   * @private
   */
  async _provideAndResolve(resolver, resolveParams = []) {
    const r = ReflectiveInjector.resolve([resolver]);
    const injected = injectSync(this.moduleInjector.createChildFromResolved(r), resolver);
    return invokeOn(injected, 'resolve', ...resolveParams);
  }
}

module.exports = RoutingModule;
