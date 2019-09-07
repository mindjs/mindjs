const { isFunction, isArray } = require('lodash');

const { HTTP_METHODS } = require('@framework100500/common');
const {
  Module,
  MODULE_INJECTOR,
  Inject,
  APP_ROUTER_DESCRIPTOR_RESOLVER,
  APP_ROUTER_PROVIDER,
} = require('@framework100500/core');

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
         injectCommonMiddlewareResolvers: {InjectionToken[]|InjectableClass[]},
         routes: [
          {
            path: {string},
            method: HTTP_METHODS,

            injectMiddlewareResolvers?: {InjectionToken[]|InjectableClass[]},
            middleware?: {Function[]},

            injectHandlerResolver?: {InjectionToken|InjectableClass},
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
                injectCommonMiddlewareResolvers: [],
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
      Inject(MODULE_INJECTOR),
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
   *
   * @param providers
   * @param routes
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
    const routerDescriptorResolvers = this._inject(APP_ROUTER_DESCRIPTOR_RESOLVER);

    if (!routerDescriptorResolvers) {
      this.routers = [];
      return this.routers;
    }

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
      injectCommonMiddlewareResolvers = [],
      commonMiddleware = [],
      routes = [],
    } = await routerDescriptorResolver.resolve();

    const router = new this.routerProvider();

    const resolvedCommonMiddleware = this._injectAllAndResolve(injectCommonMiddlewareResolvers);

    router.use(...commonMiddleware, ...resolvedCommonMiddleware);

    const preparedRoutesDescriptors = this._prepareRoutesDescriptors(routes, prefix);

    preparedRoutesDescriptors.map(({ path, method = HTTP_METHODS.GET, middleware = [], handler }) => {
      router[method](path, ...middleware, handler);
    });

    return router;
  }

  /**
   *
   * @param routesDescriptors
   * @param {string} prefix
   * @returns {{path: (string|*), handler: (function(*): {message: string, statusCode: number}), method: string, middleware: *[]}[]}
   * @private
   */
  _prepareRoutesDescriptors(routesDescriptors = [], prefix = '') {
    return routesDescriptors.map(r => this._prepareRouteDescriptor(r, prefix));
  }

  /**
   *
   * @param routeDescriptor
   * @param {string} prefix
   * @returns {{path: (string|*), handler: (function(*): {message: string, statusCode: number}), method: string, middleware: *[]}}
   * @private
   */
  _prepareRouteDescriptor(routeDescriptor, prefix = '') {
    if (!(this.moduleInjector && routeDescriptor)) {
      throw new Error('Invalid input.');
    }

    let handlerToUse;

    const {
      path,

      method = HTTP_METHODS.GET,

      handler,
      injectHandlerResolver,
      injectHandlerResolveParams,

      middleware = [],
      injectMiddlewareResolvers = [],
    } = routeDescriptor;

    if (isValidHandler(handler)) {
      handlerToUse = handler;
    } else if (injectHandlerResolver) {
      const injectedAndResolvedHandler = this._injectAndResolve(injectHandlerResolver, injectHandlerResolveParams);
      handlerToUse = isValidHandler(injectedAndResolvedHandler) ? injectedAndResolvedHandler : stubHandler;
    }

    const injectedMiddleware = this._injectAllAndResolve(injectMiddlewareResolvers);
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

    let result;
    try {
      result = this.moduleInjector.get(token);
    } catch (e) {
      // ...
    }
    return result;
  }

  /**
   * TODO: use invokeFn
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
