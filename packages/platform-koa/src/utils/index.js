const { invokeOn, toArray } = require('@framework100500/common/utils');

const { isFunction } = require('lodash');

/**
 *
 * @param {*} middlewareReceiver
 * @param {Function[]} middleware
 * @returns {Promise<*[]>}
 */
async function initMiddlewareOn(middlewareReceiver, middleware) {
  return Promise.all(
    toArray(middleware)
      .filter(mw => isFunction(mw))
      .map(mw => invokeOn(middlewareReceiver, 'use', mw))
  );
}

module.exports = {
  initMiddlewareOn,
};
