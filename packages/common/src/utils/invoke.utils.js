const { isArray, isFunction, flatten } = require('lodash');
const { isObservable } = require('rxjs');

const { isAsyncFunction, isPromise } = require('./function.utils');

/**
 * Asynchronously invokes a function with provided arguments
 * @param {Function|*} fn
 * @param {*} args - list of arguments to invoke provided function with
 * @returns {Promise<*>}
 */
async function invokeFn(fn, ...args) {
  if (!isFunction(fn)) {
    return fn;
  }

  if (isAsyncFunction(fn)) {
    return await fn(...args);
  }

  const result = fn(...args);

  if (isPromise(result)) {
    return result;
  }

  if (isObservable(result)) {
    return new Promise((resolve, reject) => {
      const sub = result.subscribe(resolve, reject);
      sub.unsubscribe();
    });
  }

  return result;
}

/**
 *
 * @param {Object} obj
 * @param {string} methodName
 * @param {*} args
 * @returns {Promise<*>}
 */
async function invokeOn(obj, methodName, ...args) {
  if (!(obj && methodName)) {
    return;
  }

  return isFunction(obj[methodName])
    ? obj[methodName](...args)
    : obj[methodName];
}

/**
 * Asynchronously Invokes all provided functions (without passing arguments to them)
 *  and returns a flattened array of results of invocations
 * @param {[]} args
 * @returns {Promise<[*]>}
 */
async function invokeAll(...args) {
  if (!args.length) {
    return [];
  }

  const [firstArg, ...restArgs] = args;

  return await Promise.all([
    isArray(firstArg) && firstArg.length ? invokeAll(...firstArg) : invokeFn(firstArg),
    restArgs.length ? invokeAll(restArgs) : restArgs,
  ]).then(flatten);
}

/**
 * Invokes a given method without passing arguments to them on all provided objects
 * @param {*} objects
 * @param {string} methodName
 * @param {*[]} commonArgs
 * @returns {Promise<Array|*[]>}
 */
async function invokeOnAll(objects, methodName, ...commonArgs) {
  if (!(methodName && isArray(objects) && objects.length)) {
    return [];
  }

  return await Promise.all(
    objects
      .filter(Boolean)
      .map(async (obj) => await invokeOn(obj, methodName, ...commonArgs)),
  );
}

module.exports = {
  invokeAll,
  invokeFn,
  invokeOn,
  invokeOnAll,
};
