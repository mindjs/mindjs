const { InjectionToken } = require('@mindjs/common/DI');

/*
  NOTE: For DI on a high level we use the `injection-js` npm package
        @See [https://github.com/mgechev/injection-js]
        @See [[https://v2.angular.io/docs/ts/latest/cookbook/ts-to-js.html#!#dependency-injection]
        @See [https://v4.angular.io/guide/dependency-injection]
*/

/*
  Server-related
 */
const APP_INITIALIZER = new InjectionToken('AppMindInitializer');
const APP_MIDDLEWARE = new InjectionToken('AppMindMiddleware');
const APP_MIDDLEWARE_INITIALIZER = new InjectionToken('AppMindMiddlewareInitializer');
const APP_SERVER = new InjectionToken('AppMindServer');
const APP_TERMINATION_SIGNAL = new InjectionToken('AppMindTerminationSignal');
const APP_CONFIG = new InjectionToken('AppMindConfig');

/*
  Listeners
 */
const APP_SERVER_ERROR_LISTENER = new InjectionToken('AppServerMindErrorListener');
const APP_SERVER_NET_LISTENER = new InjectionToken('AppServerMindNetListener');

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
