// const injectDebug = require('debug')('Framework100500:DI:inject');

const {
  first,
  get,
  isArray,
  isFunction,
} = require('lodash');

/**
 *
 * @param {ReflectiveInjector} injector
 * @param {InjectionToken} token
 * @param {*} notFoundValue?
 * @returns {*}
 */
function injectSync(injector, token, notFoundValue = undefined) {
  if (!(injector && token)) {
    return;
  }

  let result;
  try {
    result = injector.get(token, notFoundValue);
  } catch (e) {
    // TODO: add debug log
    if (!e.message.includes('No provider for InjectionToken')) {
      throw e;
    }
  }
  return result;
}

/**
 *
 * @param {ReflectiveInjector} injector
 * @param {InjectionToken} token
 * @param {*} notFoundValue?
 * @returns {*}
 */
function injectOneSync(injector, token, notFoundValue) {
  const result = injectSync(injector, token, notFoundValue);
  return isArray(result) ? first(result) : result;
}

/**
 *
 * @param {ReflectiveInjector|Injector} injector
 * @param {InjectionToken} token
 * @param {*} notFoundValue?
 * @returns {*}
 */
function injectSyncFromTree(injector, token, notFoundValue) {
  const result = injectSync(injector, token);

  if (!result && isFunction(get(injector, 'parent.get'))) {
    return injectSyncFromTree(injector.parent, token, notFoundValue);
  }

  return result || notFoundValue;
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
 * @param notFoundValue?
 * @returns {Promise<*>}
 */
async function injectOneAsync(injector, token, notFoundValue) {
  return injectOneSync(injector, token, notFoundValue);
}

module.exports = {
  injectAsync,
  injectSync,
  injectOneSync,
  injectOneAsync,
  injectSyncFromTree,
};
