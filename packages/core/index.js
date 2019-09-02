const {
  APP_INITIALIZER,
  APP_INJECTOR,
  APP_MIDDLEWARE,
  APP_SERVER,
  APP_SERVER_ERROR_LISTENER,
  APP_SERVER_NET_LISTENER,
  MODULE_INJECTOR,
} = require('./src/DI.tokens');
const { providableClass, Inject } = require('./src/decorators');
const Framework100500 = require('./src/core');

module.exports = {
  APP_INITIALIZER,
  APP_INJECTOR,
  APP_MIDDLEWARE,
  APP_SERVER,
  APP_SERVER_ERROR_LISTENER,
  APP_SERVER_NET_LISTENER,
  MODULE_INJECTOR,

  providableClass,
  Inject,

  Framework100500,
};
