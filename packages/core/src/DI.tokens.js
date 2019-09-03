const { InjectionToken } = require('./constants');

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
const APP_SERVER = new InjectionToken('AppServer');

/*
  Listeners
 */
const APP_SERVER_ERROR_LISTENER = new InjectionToken('AppServerErrorListener');
const APP_SERVER_NET_LISTENER = new InjectionToken('AppServerNetListener');

/*
  Injectors
 */
// TODO: investigate if it can be replaced with injection-js's Injector
const APP_INJECTOR = new InjectionToken('ApplicationInjector');
const MODULE_INJECTOR = new InjectionToken('ModuleInjector');

module.exports = {
  APP_INITIALIZER,
  APP_INJECTOR,
  APP_MIDDLEWARE,
  APP_SERVER,
  APP_SERVER_ERROR_LISTENER,
  APP_SERVER_NET_LISTENER,
  MODULE_INJECTOR,
};
