const { isArray, isFunction } = require('lodash');

const {
  APP_MIDDLEWARE,
  APP_SERVER,
} = require('./DI.tokens');

class MiddlewareInitializer {

  static get parameters() {
    return [
      Inject(APP_SERVER),
      Inject(APP_MIDDLEWARE)
    ];
  }

  constructor(appServer, appMiddleware) {
    this.appServer = appServer;
    this.appMiddleware = appMiddleware;
  }

  async init() {
    if (!(this.appServer && isArray(this.appMiddleware))) {
      return;
    }
    this.appMiddleware.map(m => isFunction(this.appServer.use) && this.appServer.use(m));
  }
}

module.exports = {
  MiddlewareInitializer,
};
