const AppConfigService = require('./config.service');

class AppRoutersInitializer {
  init(appServer, appRouters) {
    // console.log('AppRoutersInitializer');
    appRouters
      .filter(Boolean)
      .map(router => appServer.use(router.routes()));
  }
}

class AppMiddlewareInitializer {
  init(appServer, appMiddleware) {
    // console.log('AppMiddlewareInitializer');
    appMiddleware
      .filter(Boolean)
      .map(m => appServer.use(m));
  }
}

class AppRouterMiddlewareInitializer {
  init(appRouter, appMiddleware) {
    // console.log('AppRouterMiddlewareInitializer');
    appMiddleware
      .filter(Boolean)
      .map(m => appRouter.use(m));
  }
}

class AppRouteMounter {
  mount(appRouter, { path, method, middleware, handler }) {
    // console.log('AppRouteMounter');
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
  AppMiddlewareInitializer,
  AppRoutersInitializer,
  AppRouterMiddlewareInitializer,
  AppRouteMounter,
  EnableProxyAppInitializer,
};
