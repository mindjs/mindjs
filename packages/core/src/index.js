const {
  _Inject,
  InjectionToken,
  Injector,
  forwardRef,
  resolveForwardRef,
  ReflectiveInjector,
  ResolvedReflectiveFactory,
  ReflectiveKey,
} = require('./constants');

const Framework100500 = require('./core');

const {
  Inject,
  Module,
  InjectableClass,
} = require('./decorators');

const {
  APP_INITIALIZER,
  APP_INJECTOR,
  APP_MIDDLEWARE,
  APP_MIDDLEWARE_INITIALIZER,
  APP_SERVER,
  APP_SERVER_ERROR_LISTENER,
  APP_SERVER_NET_LISTENER,
  MODULE_INJECTOR,
} = require('./DI.tokens');

module.exports = {
  _Inject,
  InjectionToken,
  Injector,
  forwardRef,
  resolveForwardRef,
  ReflectiveInjector,
  ResolvedReflectiveFactory,
  ReflectiveKey,

  APP_INITIALIZER,
  APP_INJECTOR,
  APP_MIDDLEWARE,
  APP_MIDDLEWARE_INITIALIZER,
  APP_SERVER,
  APP_SERVER_ERROR_LISTENER,
  APP_SERVER_NET_LISTENER,
  MODULE_INJECTOR,

  Inject,
  Module,
  InjectableClass: InjectableClass,

  Framework100500,
};
