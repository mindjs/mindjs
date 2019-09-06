const { isArray, isFunction } = require('lodash');

const {
  APP_MIDDLEWARE,
  APP_ROUTERS,
  APP_SERVER,
} = require('./DI.tokens');

const { Inject } = require('./decorators');

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

class AppRoutersInitializer {

  static get parameters() {
    return [
      Inject(APP_SERVER),
      Inject(APP_ROUTERS)
    ];
  }

  constructor(
    appServer,
    appRouters,
  ) {
    this.appServer = appServer;
    this.appRouters = appRouters;
  }

  async init() {
    if (!(this.appServer && isArray(this.appRouters))) {
      return;
    }

    this.appRouters.map(r => {
      if (isFunction(r.routes)) {
        this.appServer.use(r.routes());
        return;
      }

      if (isFunction(r)) {
        this.appServer.use(r());
      }
    });
  }
}

module.exports = {
  MiddlewareInitializer,
  AppRoutersInitializer,
};
