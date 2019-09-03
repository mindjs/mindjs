const { InjectionToken } = require('@framework100500/core');

/*
  NOTE: For DI on a high level we use the `injection-js` npm package
        @See [https://github.com/mgechev/injection-js]
        @See [[https://v2.angular.io/docs/ts/latest/cookbook/ts-to-js.html#!#dependency-injection]
        @See [https://v4.angular.io/guide/dependency-injection]
*/

/*
  Routing
 */
const APP_SERVER_ROUTER_PROVIDER = new InjectionToken('AppServerRouter');
const APP_ROUTERS_RESOLVER = new InjectionToken('AppRoutersResolver');
const APP_ROUTER_DESCRIPTOR_RESOLVER = new InjectionToken('AppRouterResolver');

module.exports = {
  APP_ROUTERS_RESOLVER,
  APP_ROUTER_DESCRIPTOR_RESOLVER,
  APP_SERVER_ROUTER_PROVIDER,
};
