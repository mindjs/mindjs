const uuidv4 = require('uuid/v4');

const { isFunction } = require('lodash');

const { InjectionToken, _Inject, _Optional } = require('./DI');

/**
 *
 * @param targetClass
 * @returns {*}
 */
function injectableClassDecorator(targetClass) {
  if (!isFunction(targetClass) || (targetClass.token && targetClass.useClass)) {
    return targetClass;
  }

  const fwPrefix = 'Framework100500-';
  const tokenName = targetClass.name ? `${ fwPrefix }${ targetClass.name }` : `${ fwPrefix }-class-${ uuidv4() }`;
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
  if (!isFunction(targetClass) || (targetClass.token && targetClass.useClass)) {
    return targetClass;
  }

  Object.defineProperties(injectableClassDecorator(targetClass), {
    providers: {
      value: [ ...providers ],
    },
    imports: {
      value: [ ...imports ],
    },
  });

  Object.defineProperties(targetClass, {
    module: {
      value: targetClass,
    },
  });

  return targetClass;
}

/**
 * Shorthand decorator for a `new Inject()` statement
 * @param {string} token
 * @returns {Inject}
 */
function injectDecorator(token) {
  return new _Inject(token);
}

/**
 * This decorator tells DI to pass a null as a value for provider if it is not found in DI tree
 * @param {string} token
 * @returns {[Optional, Inject|Injectable]}
 */
function optionalDecorator(token) {
  const optional = new _Optional();

  return token instanceof InjectionToken
    ? [optional, injectDecorator(token)]
    : [optional, token];
}

module.exports = {
  Inject: injectDecorator,
  Optional: optionalDecorator,
  Module: moduleDecorator,
  Injectable: injectableClassDecorator,
};
