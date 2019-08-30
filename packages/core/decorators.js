const { InjectionToken, Inject } = require('injection-js');

const { isFunction } = require('lodash');

/**
 *
 * @param targetClass
 * @param providers
 * @param imports
 * @returns {*}
 */
function providableClassDecorator(targetClass, { providers = [], imports = [] } = {}) {
  if (!isFunction(targetClass)) {
    return targetClass;
  }

  const injectionToken = new InjectionToken(targetClass.name);

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
 * Shortcut for new Inject()
 * @param {string} token
 * @returns {Inject}
 */
function injectDecorator(token) {
  return new Inject(token);
}

module.exports = {
  providableClass: providableClassDecorator,
  Inject: injectDecorator,
};
