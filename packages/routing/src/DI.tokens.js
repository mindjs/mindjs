const { InjectionToken } = require('@mindjs/common/DI');

/*
  Routing module injection tokens

  TODO:
   1. add tokens' descriptions
   2. Think about renaming tokens
*/

/*
  This token is intended to be used for providing a Router constructor
*/
const APP_ROUTER_PROVIDER = new InjectionToken('AppRouterMindProvider');
const APP_ROUTING_MODULES_RESOLVER = new InjectionToken('AppRoutingModulesMindsResolver');
const APP_ROUTERS_INITIALIZER = new InjectionToken('AppRoutersMindsInitializer');
const APP_ROUTER_MIDDLEWARE_INITIALIZER = new InjectionToken('AppRouterMiddlewareMindInitializer');
const APP_ROUTER_DESCRIPTOR_RESOLVER = new InjectionToken('AppRouterDescriptorMindResolver');
const APP_ROUTE_MOUNTER = new InjectionToken('AppRouteMindMounter');

module.exports = {
  APP_ROUTER_PROVIDER,
  APP_ROUTING_MODULES_RESOLVER,
  APP_ROUTER_DESCRIPTOR_RESOLVER,
  APP_ROUTER_MIDDLEWARE_INITIALIZER,
  APP_ROUTERS_INITIALIZER,
  APP_ROUTE_MOUNTER,
};
