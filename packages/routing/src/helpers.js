const { every, get, isFunction, isArray } = require('lodash');

/**
 *
 * @param {string} routeName
 * @returns {string}
 */
function normalizeRoutePath(routeName) {
  return routeName.startsWith('/') ? routeName : `/${ routeName }`;
}

/**
 *
 * @param {Function|*} handler
 * @returns {boolean}
 */
const isValidHandler = handler => isFunction(handler);

/**
 *
 * @param {Function[]|*} mwList
 * @returns {boolean}
 */
const isValidMiddlewareList = mwList => {
  return every([
    isArray(mwList),
    every(mwList, isFunction),
  ], Boolean);
};

/**
 *
 * @param {ReflectiveInjector} injector
 * @param {InjectionToken} token
 * @returns {*}
 */
function injectRecursivelyFromInjectorTree(injector, token) {
  if (!(injector && token)) {
    return;
  }

  let result;
  try {
    result = injector.get(token);
  } catch (e) {
    // ...
  }

  if (!result && isFunction(get(injector, 'parent.get'))) {
    return injectRecursivelyFromInjectorTree(injector.parent, token);
  }

  return result;
}

module.exports = {
  isValidMiddlewareList,
  normalizeRoutePath,
  isValidHandler,
  injectRecursivelyFromInjectorTree,
};
