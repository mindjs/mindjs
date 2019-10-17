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
 * @param m
 * @returns {boolean}
 */
function isRoutingModule(m) {
  return get(m, 'module.name', '') === 'RoutingModule';
}

module.exports = {
  isValidMiddlewareList,
  normalizeRoutePath,
  isRoutingModule
};
