const { every, isFunction, isArray } = require('lodash');

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

module.exports = {
  isValidMiddlewareList,
  normalizeRoutePath,
  isValidHandler,
};
