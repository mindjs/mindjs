const { Inject } = require('injection-js');

const { isFunction, isArray } = require('lodash');

const { providableClass, MODULE_INJECTOR, HTTP_METHODS } = require('../core');

const {
  APP_ROUTER_DESCRIPTOR_RESOLVER,
  APP_SERVER_ROUTER_PROVIDER,
} = require('./DI.tokens');
const { stubHandler } = require('./constants');
const { normalizeRoutePath, isValidHandler, isValidMiddlewareList } = require('./helpers');

/*

   Usage notes:

    in your Application module add RoutingModule to imports array

    RoutingModule.forRoot({
      providers: [],
      routerDescriptor: {
         prefix: {string},
         commonMiddleware: {Function[]},
         injectCommonMiddleware: {InjectionToken[]|providableClass[]},
         routes: [
          {
            path: {string},
            method: HTTP_METHODS,

            injectMiddleware?: {InjectionToken[]|providableClass[]},
            middleware?: {Function[]},

            injectHandler?: {InjectionToken|providableClass},
            handler?: {Function},
          },
        ],
      },
   });

   or just provide APP_ROUTERS_RESOLVER as follows

   {
     provide: APP_ROUTERS_RESOLVER,
     useFactory: function () {
      return {
        async resolve() {
          return [
            RoutingModule.forRoot({
              providers: [],
              routerDescriptor: {
                prefix: 'prefix',
                injectCommonMiddleware: [],
                routes: [],
              },
            }),
          ];
      };
    },
    deps: [],
   }

   or provide APP_ROUTER_DESCRIPTOR_RESOLVER in your module providers

   {
     provide: APP_ROUTER_DESCRIPTOR_RESOLVER,
     useFactory: function () {
      return {
        async resolve() {
          return {
            prefix: 'prefix',
            injectCommonMiddleware: [],
            routes: [],
          },;
      };
    },
    deps: [],
    multi: true
  }
 */
class RoutingModule {

  static get parameters() {
    return [
      new Inject(MODULE_INJECTOR),
      new Inject(APP_SERVER_ROUTER_PROVIDER),
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
   *
   * @param providers
   * @param routes
   * @returns {{providers: {provide: *, useFactory: (function(): {resolve(): Promise<*>}), multi: boolean}[]}}
   */
  static forRoot({ providers = [], routerDescriptor = {} }) {
    return {
      module: providableClass(RoutingModule),
      providers: [
        ...providers,
        {
          provide: APP_ROUTER_DESCRIPTOR_RESOLVER,
          useFactory: function () {
            return {
              async resolve() {
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
   * TODO: split into separate methods
   * @returns {Promise<Router[]>}
   */
  async resolveRouters() {
    const routerDescriptorResolvers = this.moduleInjector.get(APP_ROUTER_DESCRIPTOR_RESOLVER);

    this.routers = isArray(routerDescriptorResolvers)
      ? await Promise.all(routerDescriptorResolvers
        .filter(Boolean)
        .filter(r => isFunction(r.resolve))
        .map((r) => this._resolveRouter(r))
      )
      : [await this._resolveRouter(routerDescriptorResolvers)];

    return this.routers;
  }

  /**
   *
   * @param routerDescriptorResolver
   * @returns {Promise<*>}
   * @private
   */
  async _resolveRouter(routerDescriptorResolver) {
    const {
      prefix = '',
      injectCommonMiddleware = [],
      commonMiddleware = [],
      routes = [],
    } = await routerDescriptorResolver.resolve();

    const router = new this.routerProvider({ prefix: normalizeRoutePath(prefix) });

    const resolvedCommonMiddleware = this._injectAllAndResolve(injectCommonMiddleware);

    router.use(...commonMiddleware, ...resolvedCommonMiddleware);

    const preparedRoutesDescriptors = this._prepareRoutesDescriptors(routes);

    preparedRoutesDescriptors.map(({ path, method = HTTP_METHODS.GET, middleware = [], handler }) => {
      router[method](path, ...middleware, handler);
    });

    return router;
  }

  /**
   *
   * @param routesDescriptors
   * @returns {{path: (string|*), handler: (function(*): {message: string, statusCode: number}), method: string, middleware: *[]}[]}
   * @private
   */
  _prepareRoutesDescriptors(routesDescriptors = []) {
    return routesDescriptors.map(r => this._prepareRouteDescriptor(r));
  }

  /**
   *
   * @param routeDescriptor
   * @returns {{path: (string|*), handler: (function(*): {message: string, statusCode: number}), method: string, middleware: *[]}}
   * @private
   */
  _prepareRouteDescriptor(routeDescriptor) {
    if (!(this.moduleInjector && routeDescriptor)) {
      throw new Error('Invalid input.');
    }

    let handlerToUse;

    const {
      handler,
      injectHandler,
      injectHandlerResolveParams,
      injectMiddleware = [],
      method = HTTP_METHODS.GET,
      middleware = [],
      path,
    } = routeDescriptor;

    if (isValidHandler(handler)) {
      handlerToUse = handler;
    } else if (injectHandler) {
      const injectedAndResolvedHandler = this._injectAndResolve(injectHandler, injectHandlerResolveParams);
      handlerToUse = isValidHandler(injectedAndResolvedHandler) ? injectedAndResolvedHandler : stubHandler;
    }

    const injectedMiddleware = this._injectAllAndResolve(injectMiddleware);

    return {
      path: normalizeRoutePath(path),
      method: method,
      middleware: [
        ...(isValidMiddlewareList(middleware) ? middleware : []), // TODO: rework filtering valid middleware
        ...(isValidMiddlewareList(injectedMiddleware) ? injectedMiddleware : []),
      ],
      handler: handlerToUse,
    };
  }

  /**
   *
   * @param tokensAndResolveParams
   * @returns {any[]}
   * @private
   */
  _injectAllAndResolve(tokensAndResolveParams = []) {
    return tokensAndResolveParams.map((t) => {
      if (!t.resolveParams) {
        return this._injectAndResolve(t);
      }

      const { token, resolveParams } = t;

      return token && resolveParams
        ? this._injectAndResolve(token, resolveParams)
        : this._inject(token);
    }).filter(Boolean);
  }

  /**
   *
   * @param {InjectionToken} token
   * @private
   */
  _inject(token) {
    if (!(this.moduleInjector && token)) {
      return;
    }
    return this.moduleInjector.get(token);
  }

  /**
   *
   * @param token
   * @param resolveParams
   * @returns {undefined}
   * @private
   */
  _injectAndResolve(token, resolveParams = []) {
    const injected = this._inject(token);
    return injected && injected.resolve ? injected.resolve(...resolveParams) : undefined;
  }
}

module.exports = RoutingModule;
