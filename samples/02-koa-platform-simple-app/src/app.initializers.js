const AppConfigService = require('./config.service');

class AppRouteMounter {
  mount(appRouter, { path, method, middleware, handler }) {
    console.log('Custom AppRouteMounter');
    appRouter[method](path, ...middleware, handler);

    return appRouter;
  }
}

class EnableProxyAppInitializer {
  static get parameters() {
    return [
      AppConfigService,
    ]
  }

  constructor(
    appConfigService,
  ) {
    this.appConfigService = appConfigService;
  }

  init(appServer) {
    appServer.proxy = this.appConfigService.isProxy;
    if (appServer.proxy) {
      console.log('App proxy is enabled.');
    }
  }
}

module.exports = {
  AppRouteMounter,
  EnableProxyAppInitializer,
};
