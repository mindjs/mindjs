const { isFunction } = require('lodash');

/**
 * Checks if value is a Promise
 * @param {*} value
 * @returns {boolean}
 */
function isPromise(value) {
  return !!(Promise && Promise.resolve && Promise.resolve(value) === value);
}

/**
 * Checks if provided function is an AsyncFunction
 * @param {Function} fn
 * @returns {boolean}
 */
function isAsyncFunction(fn) {
  if (!isFunction(fn)) {
    return false;
  }

  return fn.constructor.name === 'AsyncFunction';
}

/**
 *
 * @param {Function} fn
 * @returns {boolean}
 */
function isArrowFunction(fn) {
  return isFunction(fn) && !fn.prototype;
}

module.exports = {
  isArrowFunction,
  isAsyncFunction,
  isPromise,
};
