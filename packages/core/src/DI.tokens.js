const { InjectionToken } = require('./DI');

/*
  NOTE: For DI on a high level we use the `injection-js` npm package
        @See [https://github.com/mgechev/injection-js]
        @See [[https://v2.angular.io/docs/ts/latest/cookbook/ts-to-js.html#!#dependency-injection]
        @See [https://v4.angular.io/guide/dependency-injection]
*/

/*
  Server-related
 */
const APP_INITIALIZER = new InjectionToken('AppInitializer');
const APP_MIDDLEWARE = new InjectionToken('AppMiddleware');
const APP_MIDDLEWARE_INITIALIZER = new InjectionToken('AppMiddlewareInitializer');
const APP_SERVER = new InjectionToken('AppServer');

/*
  Listeners
 */
const APP_SERVER_ERROR_LISTENER = new InjectionToken('AppServerErrorListener');
const APP_SERVER_NET_LISTENER = new InjectionToken('AppServerNetListener');

/*
Routing
*/
/*
  This token is intended to be used for providing a Router constructor
*/
const APP_ROUTER_PROVIDER = new InjectionToken('AppServerRouter');
const APP_ROUTING_MODULES_RESOLVER = new InjectionToken('AppRoutersResolver');
const APP_ROUTERS = new InjectionToken('AppRouters');
const APP_ROUTERS_INITIALIZER = new InjectionToken('AppRoutersInitializer');
const APP_ROUTER_DESCRIPTOR_RESOLVER = new InjectionToken('AppRouterResolver');

module.exports = {
  APP_INITIALIZER,
  APP_MIDDLEWARE,
  APP_MIDDLEWARE_INITIALIZER,
  APP_SERVER,
  APP_SERVER_ERROR_LISTENER,
  APP_SERVER_NET_LISTENER,
  APP_ROUTER_DESCRIPTOR_RESOLVER,
  APP_ROUTER_PROVIDER,
  APP_ROUTING_MODULES_RESOLVER,
  APP_ROUTERS,
  APP_ROUTERS_INITIALIZER,
};
