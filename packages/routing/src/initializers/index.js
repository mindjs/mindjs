const {
  invokeOn,
  invokeFn,
} = require('@framework100500/common/utils');

const {
  isArray,
  isFunction,
} = require('lodash');

/**
 *
 * @param appServer
 * @param appRouters
 *  * @returns {Promise<*>}
 */
function appRoutersInitializer(appServer, appRouters) {
  if (!(appServer && isArray(appRouters))) {
    return Promise.resolve();
  }

  return Promise.all(
    appRouters.map(async r => {
      // Koa.js stuff
      if (isFunction(r.routes)) {
        return await invokeOn(appServer, 'use', await invokeOn(r, 'routes'));
      }

      // Express.js stuff
      if (isFunction(r)) {
        return await invokeOn(appServer, 'use', await invokeFn(r));
      }
    })
  );
}

/**
 *
 * @param {*} router
 * @param {*[]} middleware
 * @returns {Promise<*>}
 */
function appRouterMiddlewareInitializer(router, middleware) {
  if (!(router && isArray(middleware))) {
    return Promise.resolve();
  }

  return Promise.all(
    middleware
      .filter(mw => isFunction(mw))
      .map(async mw => await invokeOn(router, 'use', mw))
  );
}

module.exports = {
  appRoutersInitializer,
  appRouterMiddlewareInitializer,
};
