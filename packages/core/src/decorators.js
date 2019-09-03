const uuidv4 = require('uuid/v4');

const { isFunction } = require('lodash');

const { InjectionToken, Inject } = require('./constants');

/**
 *
 * @param targetClass
 * @param providers
 * @param imports
 * @returns {*}
 */
function providableClassDecorator(targetClass) {
  if (!(targetClass && isFunction(targetClass))) {
    return targetClass;
  }

  const tokenName = targetClass.name ? targetClass.name : `class-${ uuidv4() }`;
  const injectionToken = new InjectionToken(tokenName);

  Object.defineProperties(targetClass, {
    token: {
      value: injectionToken,
      writable: false,
    },
    provide: {
      value: injectionToken,
      writable: false,
    },
    useClass: {
      value: targetClass,
      writable: false,
    },
  });

  return targetClass;
}

/**
 *
 * @param {Class|function|*} targetClass
 * @param {[*]} providers
 * @param {[*]} imports
 * @returns {Class|function|*}
 */
function moduleDecorator(targetClass, {
  providers = [],
  imports = [],
} = {}) {
  if (!isFunction(targetClass)) {
    return targetClass;
  }

  Object.defineProperties(providableClassDecorator(targetClass), {
    providers: {
      value: [ ...providers ],
    },
    imports: {
      value: [ ...imports ],
    },
  });

  return targetClass;
}

/**
 * Shorthand decorator for a new Inject() statement
 * @param {string} token
 * @returns {Inject}
 */
function injectDecorator(token) {
  return new Inject(token);
}

module.exports = {
  Inject: injectDecorator,
  Module: moduleDecorator,
  ProvidableClass: providableClassDecorator,
};