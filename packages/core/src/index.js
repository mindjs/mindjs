const {
  _Inject,
  InjectionToken,
  Injector,
  forwardRef,
  resolveForwardRef,
  ReflectiveInjector,
  ResolvedReflectiveFactory,
  ReflectiveKey,
} = require('./DI');

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
  APP_ROUTER_DESCRIPTOR_RESOLVER,
  APP_ROUTERS_RESOLVER,
  APP_SERVER_ROUTER_PROVIDER,
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
  APP_ROUTER_DESCRIPTOR_RESOLVER,
  APP_ROUTERS_RESOLVER,
  APP_SERVER_ROUTER_PROVIDER,

  Inject,
  Module,
  InjectableClass,

  Framework100500,
};
