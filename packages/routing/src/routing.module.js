const { isFunction, isArray } = require('lodash');

const { HTTP_METHODS } = require('@framework100500/common');
const {
  Module,
  MODULE_INJECTOR,
  Inject,
  APP_ROUTER_DESCRIPTOR_RESOLVER,
  APP_SERVER_ROUTER_PROVIDER,
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
         injectCommonMiddleware: {InjectionToken[]|InjectableClass[]},
         routes: [
          {
            path: {string},
            method: HTTP_METHODS,

            injectMiddleware?: {InjectionToken[]|InjectableClass[]},
            middleware?: {Function[]},

            injectHandler?: {InjectionToken|InjectableClass},
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
 */
class RoutingModule {

  static get parameters() {
    return [
      Inject(MODULE_INJECTOR),
      Inject(APP_SERVER_ROUTER_PROVIDER),
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

    const router = new this.routerProvider();

    const resolvedCommonMiddleware = this._injectAllAndResolve(injectCommonMiddleware);

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
    const routePath = `${ prefix ? normalizeRoutePath(prefix) : prefix }${normalizeRoutePath(path) }`;

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
    return this.moduleInjector.get(token);
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
