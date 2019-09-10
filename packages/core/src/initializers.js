const { isArray, isFunction } = require('lodash');

const {
  APP_MIDDLEWARE,
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

function appRoutersInitializer(appServer, appRouters) {
  if (!(appServer && isArray(appRouters))) {
    return;
  }

  appRouters.map(r => {
    // Koa.js stuff
    if (isFunction(r.routes)) {
      appServer.use(r.routes());
      return;
    }

    // Express.js stuff
    if (isFunction(r)) {
      appServer.use(r());
    }
  });

}

module.exports = {
  MiddlewareInitializer,
  appRoutersInitializer,
};
