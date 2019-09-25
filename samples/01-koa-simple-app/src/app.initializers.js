const { Inject } = require('@framework100500/common');
const { APP_SERVER } = require('@framework100500/core');

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

module.exports = {
  EnableProxyAppInitializer,
};
