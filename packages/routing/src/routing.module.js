const { Module, Inject, Optional } = require('@framework100500/common');
const { Injector, ReflectiveInjector } = require('@framework100500/common/DI');
const { HTTP_METHODS } = require('@framework100500/common/http');
const {
  toArray,
  invokeFn,
  invokeOn,
  injectSync,
  injectSyncFromTree,
} = require('@framework100500/common/utils');

const { isFunction, isObject, flatten } = require('lodash');

const {
  APP_ROUTER_DESCRIPTOR_RESOLVER,
  APP_ROUTER_MIDDLEWARE_INITIALIZER,
  APP_ROUTER_PROVIDER,
  APP_ROUTERS_INITIALIZER,
  APP_ROUTE_MOUNTER,
} = require('./DI.tokens');

const {
  normalizeRoutePath,
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
      Optional(APP_ROUTER_PROVIDER),
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
   *     commonMiddleware: Function[], this middleware is taken into account and executes first
   *     commonMiddlewareResolvers: (Injectable|{ resolver: Injectable, resolveParams: *[] })[],
   *     routes: {
   *       path: string,
   *       method: HTTP_METHODS.GET|HTTP_METHODS.POST|HTTP_METHODS.PUT|HTTP_METHODS.PATCH|HTTP_METHODS.DELETE|HTTP_METHODS.HEAD|HTTP_METHODS.OPTIONS,
   *
   *       handler: Function, if handler function is provided, then handlerResolver is ignored
   *       handlerResolver: Injectable,
   *       handlerResolverResolveParams: *[], params to pass to handlerResolver.resolve()
   *
   *       middleware: Function[], similarly to commonMiddleware it is taken into account and executes first
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
    if (!appServer) {
      return;
    }

    this.appServer = appServer;

    const routerDescriptorResolvers = injectSync(this.moduleInjector, APP_ROUTER_DESCRIPTOR_RESOLVER);

    if (!routerDescriptorResolvers) {
      this.routers = [];
      return;
    }

    const routers = await Promise.all(
      toArray(routerDescriptorResolvers)
        .filter(Boolean)
        .filter(r => isFunction(r.resolve))
        .map((r) => this._resolveRouter(r))
    );

    this.routers = flatten(routers);
    await this.initRouters();
  }

  /**
   *
   * @param appServer
   * @param routers
   * @returns {Promise<*>}
   */
  async initRouters() {
    const routersInitializer = injectSyncFromTree(this.moduleInjector, APP_ROUTERS_INITIALIZER);

    if (!routersInitializer) {
      console.warn('APP_ROUTERS_INITIALIZER was not found.');
      return;
    }

    return isObject(routersInitializer) && isFunction(routersInitializer.init)
      ? invokeOn(routersInitializer, 'init', this.appServer, this.routers)
      : invokeFn(routersInitializer, this.appServer, this.routers);
  }

  /**
   *
   * @param routerDescriptorResolver
   * @returns {Promise<*>}
   * @private
   */
  async _resolveRouter(routerDescriptorResolver) {
    if (!this.routerProvider) {
      console.warn('APP_ROUTER_PROVIDER was not found.');
      return;
    }

    const router = new this.routerProvider();
    /*
     * TODO:
     *  1. Add dataResolver support
     *  2. Add canActivate guards for each layer (parent and child (routes))
     *  3. add possibility to render templates
     *  4. add possibility to use array of paths in case if two or more API endpoints should expose the same behaviour (e.g. compatibility mode)
     */
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
    const routerMiddlewareInitializer = injectSyncFromTree(this.moduleInjector, APP_ROUTER_MIDDLEWARE_INITIALIZER);
    if (!routerMiddlewareInitializer) {
      console.warn('APP_ROUTER_MIDDLEWARE_INITIALIZER was not found.');
      return;
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
    const appRouteMounter = injectSyncFromTree(this.moduleInjector, APP_ROUTE_MOUNTER);

    if (!appRouteMounter) {
      console.warn('APP_ROUTE_MOUNTER was not found.');
      return;
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

    if (isFunction(handler)) {
      handlerToUse = handler;
    } else if (handlerResolver) {
      const injectedAndResolvedHandler = await this._provideAndResolve(
        handlerResolver,
        handlerResolverResolveParams,
      );
      if (isFunction(injectedAndResolvedHandler)) {
        handlerToUse = injectedAndResolvedHandler;
      }
    }

    if (!handlerToUse) {
      // TODO: add debug log...
      return;
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
