const injectDebug = require('debug')('Framework100500:DI:inject');

const { first, flatten, get, isArray, isFunction } = require('lodash');

/*
* TODO: split into separate scoped helpers and move to common module if necessary
* */

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

  return isPromise(result) ? await result : result;
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
 * @param {string}methodName
 * @returns {Promise<Array|*[]>}
 */
async function invokeOnAll(objects, methodName) {
  if (!(methodName && isArray(objects) && objects.length)) {
    return [];
  }

  return await Promise.all(
    objects
      .filter(Boolean)
      .filter(obj => isFunction(obj[methodName]))
      .map(async (obj) => await invokeFn(obj[methodName]())),
  );
}

async function injectAsync(injector, token) {
  if (!(injector && token)) {
    return;
  }

  let result;
  try {
    result = injector.get(token);
  } catch (e) {
    injectDebug('Dependency <%s> was not found in provided injector ', token);
  }
  return result;
}

async function injectOneAsync(injector, token) {
  if (!(injector && token)) {
    return;
  }

  const injected = await injectAsync(injector, token);

  return isArray(injected) ? first(injected) : injected;
}

/**
 * Checks if provided module is module with providers
 * @param {*} moduleOrDescriptor
 * @returns {boolean}
 */
function isModuleWithProviders(moduleOrDescriptor) {
  if (!moduleOrDescriptor) {
    return false;
  }

  return !(moduleOrDescriptor.imports) && !!(moduleOrDescriptor.module && moduleOrDescriptor.providers);
}

function isRoutingModule(m) {
  return get(m, 'module.name', '') === 'RoutingModule';
}

module.exports = {
  isArrowFunction,
  invokeFn,
  invokeAll,
  invokeOnAll,
  injectAsync,
  injectOneAsync,
  isModuleWithProviders,
  isRoutingModule,
};
