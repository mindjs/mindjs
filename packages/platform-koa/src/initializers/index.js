const { invokeOn, toArray } = require('@mindjs/common/utils');
const { HTTP_METHODS } = require('@mindjs/common/http');

const { isObject } = require('lodash');

const { initMiddlewareOn } = require('../utils');

class KoaRoutersInitializer {

  /**
   *
   * @param {Koa} appServer
   * @param {Router[]} appRouters
   * @returns {Promise<*[]>}
   */
  async init(appServer, appRouters) {
    return Promise.all(
      toArray(appRouters)
        .filter(Boolean)
        .map(async router => invokeOn(appServer, 'use', await invokeOn(router, 'routes')))
    );
  }
}

class KoaRouterMiddlewareInitializer {

  /**
   *
   * @param {Router} router
   * @param {Function[]}middleware
   * @returns {Promise<*[]>}
   */
  async init(router, middleware) {
    return initMiddlewareOn(router, middleware);
  }
}

class KoaRouteMounter {

  /**
   *
   * @param {Router} router
   * @param {*} routeDescriptor
   * @returns {Router}
   */
  mount(router, routeDescriptor) {
    if (!isObject(routeDescriptor)) {
      return router;
    }

    const { path, method = HTTP_METHODS.GET, middleware = [], handler } = routeDescriptor;
    router[method](path, ...middleware, handler);

    return router;
  }
}

class KoaMiddlewareInitializer {

  /**
   *
   * @param {Koa} appServer
   * @param {Function[]}appMiddleware
   * @returns {Promise<*[]>}
   */
  init(appServer, appMiddleware) {
    return initMiddlewareOn(appServer, appMiddleware);
  }
}

module.exports = {
  KoaRoutersInitializer,
  KoaRouterMiddlewareInitializer,
  KoaRouteMounter,
  KoaMiddlewareInitializer,
};
