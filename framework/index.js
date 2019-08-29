const {
  APP_INITIALIZER,
  APP_INJECTOR,
  APP_MIDDLEWARE,
  APP_SERVER,
  APP_SERVER_ERROR_LISTENER,
  APP_SERVER_NET_LISTENER,
  MODULE_INJECTOR,
  providableClass,
  Framework100500,
} = require('./core');

const {
  RoutingModule,
  APP_SERVER_ROUTER_PROVIDER,
  normalizeRoutePath,
  APP_ROUTERS_RESOLVER,
  APP_ROUTER_DESCRIPTOR_RESOLVER,
} = require('./routing');
const {
  HTTP_METHODS,
  HTTP_REQUEST_INTERCEPTOR,
  HTTP_CLIENT,
  HttpModule,
  HttpClient,
} = require('./http');

module.exports = {
  // Framework
  Framework100500,
  // Decorators
  providableClass,
  // DI tokens
  APP_INITIALIZER,
  APP_INJECTOR,
  APP_MIDDLEWARE,
  APP_SERVER,
  APP_SERVER_ERROR_LISTENER,
  APP_SERVER_NET_LISTENER,
  MODULE_INJECTOR,

  // ROUTING
  RoutingModule,
  APP_SERVER_ROUTER_PROVIDER,
  normalizeRoutePath,
  APP_ROUTERS_RESOLVER,
  APP_ROUTER_DESCRIPTOR_RESOLVER,

  // HTTP
  HTTP_METHODS,
  HTTP_REQUEST_INTERCEPTOR,
  HTTP_CLIENT,
  HttpModule,
  HttpClient,
};
