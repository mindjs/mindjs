const { InjectionToken } = require('@framework100500/common/DI');

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
const APP_TERMINATION_SIGNAL = new InjectionToken('Framework100500AppTerminationSignal');
const APP_CONFIG = new InjectionToken('Framework100500ApplicationConfig');

/*
  Listeners
 */
const APP_SERVER_ERROR_LISTENER = new InjectionToken('Framework100500AppServerErrorListener');
const APP_SERVER_NET_LISTENER = new InjectionToken('Framework100500AppServerNetListener');

module.exports = {
  APP_CONFIG,
  APP_INITIALIZER,
  APP_MIDDLEWARE,
  APP_MIDDLEWARE_INITIALIZER,
  APP_SERVER,
  APP_SERVER_ERROR_LISTENER,
  APP_SERVER_NET_LISTENER,
  APP_TERMINATION_SIGNAL,
};
