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
const APP_INITIALIZER = new InjectionToken('Framework100500AppInitializer');
const APP_MIDDLEWARE = new InjectionToken('Framework100500AppMiddleware');
const APP_MIDDLEWARE_INITIALIZER = new InjectionToken('Framework100500AppMiddlewareInitializer');
const APP_SERVER = new InjectionToken('Framework100500AppServer');

/*
  Listeners
 */
const APP_SERVER_ERROR_LISTENER = new InjectionToken('Framework100500AppServerErrorListener');
const APP_SERVER_NET_LISTENER = new InjectionToken('Framework100500AppServerNetListener');

/*
Routing
*/

/*
  This token is intended to be used for providing a Router constructor
*/
const APP_ROUTER_PROVIDER = new InjectionToken('Framework100500AppServerRouterProvider');
const APP_ROUTING_MODULES_RESOLVER = new InjectionToken('Framework100500AppRoutersResolver');
const APP_ROUTERS = new InjectionToken('Framework100500AppRouters');
const APP_ROUTERS_INITIALIZER = new InjectionToken('Framework100500AppRoutersInitializer');
const APP_ROUTER_DESCRIPTOR_RESOLVER = new InjectionToken('Framework100500AppRouterResolver');

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
