const { Inject } = require('@framework100500/common');
const { APP_SERVER, APP_MIDDLEWARE } = require('@framework100500/core');

const { isArray, isFunction } = require('lodash');

const AppConfigService = require('./config.service');

class EnableProxyAppInitializer {
  static get parameters() {
    return [
      AppConfigService,
      Inject(APP_SERVER)
    ]
  }

  constructor(
    appConfigService,
    appServer,
  ) {
    this.appConfigService = appConfigService;
    this.appServer = appServer;
  }

  async init() {
    this.appServer.proxy = this.appConfigService.isProxy;
    if (this.appServer.proxy) {
      console.log('App proxy is enabled.');
    }
  }
}

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
  EnableProxyAppInitializer,
  MiddlewareInitializer,
};
