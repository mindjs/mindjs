const {
  invokeOn,
  invokeFn,
} = require('@framework100500/common/utils');

const {
  HTTP_METHODS
} = require('@framework100500/common/http');

const {
  isArray,
  isObject,
  isFunction,
} = require('lodash');

class AppRoutersInitializer {

  /**
   *
   * @param appServer
   * @param appRouters
   * @returns {Promise<void>}
   */
  async init(appServer, appRouters) {
    if (!(appServer && isArray(appRouters))) {
      return;
    }

    await Promise.all(
      appRouters.map(async r => {
        // Koa.js stuff
        if (isFunction(r.routes)) {
          return invokeOn(appServer, 'use', await invokeOn(r, 'routes'));
        }

        // Express.js stuff
        if (isFunction(r)) {
          return invokeOn(appServer, 'use', await invokeFn(r));
        }
      })
    );
  }
}

class AppRouterMiddlewareInitializer {

  /**
   *
   * @param router
   * @param middleware
   * @returns {Promise<*>}
   */
  async init(router, middleware) {
    if (!(router && isArray(middleware))) {
      return;
    }

    await Promise.all(
      middleware
        .filter(mw => isFunction(mw))
        .map(async mw => invokeOn(router, 'use', mw))
    );
  }
}

class AppRouteMounter {

  /**
   *
   * @param router
   * @param routeDescriptor
   * @returns {*}
   */
  mount(router, routeDescriptor) {
    if (!(router && isObject(routeDescriptor))) {
      return router;
    }

    const { path, method = HTTP_METHODS.GET, middleware = [], handler } = routeDescriptor;
    router[method](path, ...middleware, handler);

    return router;
  }
}

module.exports = {
  AppRoutersInitializer,
  AppRouterMiddlewareInitializer,
  AppRouteMounter,
};
