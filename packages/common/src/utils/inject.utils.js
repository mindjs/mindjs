// const injectDebug = require('debug')('Framework100500:DI:inject');

const {
  first,
  get,
  isArray,
  isFunction,
} = require('lodash');

/**
 *
 * @param injector
 * @param token
 * @returns {*}
 */
function injectSync(injector, token) {
  if (!(injector && token)) {
    return;
  }

  let result;
  try {
    result = injector.get(token);
  } catch (e) {
    // TODO: add debug log?...
  }
  return result;
}

/**
 *
 * @param injector
 * @param token
 * @returns {*}
 */
function injectOneSync(injector, token) {
  const result = injectSync(injector, token);
  return isArray(result) ? first(result) : result;
}

/**
 *
 * @param {ReflectiveInjector} injector
 * @param {InjectionToken} token
 * @returns {*}
 */
function injectSyncFromTree(injector, token) {
  const result = injectSync(injector, token);

  if (!result && isFunction(get(injector, 'parent.get'))) {
    return injectSyncFromTree(injector.parent, token);
  }

  return result;
}

/**
 *
 * @param injector
 * @param token
 * @returns {Promise<*>}
 */
async function injectAsync(injector, token) {
  return injectSync(injector, token);
}

/**
 *
 * @param injector
 * @param token
 * @returns {Promise<*>}
 */
async function injectOneAsync(injector, token) {
  return injectOneSync(injector, token);
}

module.exports = {
  injectAsync,
  injectSync,
  injectOneSync,
  injectOneAsync,
  injectSyncFromTree,
};
