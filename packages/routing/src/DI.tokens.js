const { InjectionToken } = require('@framework100500/common/DI');

/*
Routing
*/

/*
  This token is intended to be used for providing a Router constructor
*/
const APP_ROUTER_PROVIDER = new InjectionToken('Framework100500AppServerRouterProvider');
const APP_ROUTING_MODULES_RESOLVER = new InjectionToken('Framework100500AppRoutersResolver');
const APP_ROUTERS_INITIALIZER = new InjectionToken('Framework100500AppRoutersInitializer');
const APP_ROUTER_MIDDLEWARE_INITIALIZER = new InjectionToken('Framework100500AppRouterMiddlewarenitializer');
const APP_ROUTER_DESCRIPTOR_RESOLVER = new InjectionToken('Framework100500AppRouterResolver');

module.exports = {
  APP_ROUTER_PROVIDER,
  APP_ROUTING_MODULES_RESOLVER,
  APP_ROUTER_DESCRIPTOR_RESOLVER,
  APP_ROUTER_MIDDLEWARE_INITIALIZER,
  APP_ROUTERS_INITIALIZER,
};
