const { isArray } = require('lodash');
const {
  APP_SERVER,
  APP_INITIALIZER,
  APP_MIDDLEWARE_INITIALIZER,
  APP_MIDDLEWARE,
} = require('@framework100500/core');
const {
  Inject,
} = require('@framework100500/common');
const {
  APP_ROUTERS_INITIALIZER,
  APP_ROUTER_MIDDLEWARE_INITIALIZER,
  APP_ROUTE_MOUNTER,
} = require('@framework100500/routing');

const AppConfigService = require('./config.service');

class EnableProxyAppInitializer {
  static get parameters() {
    return [
      AppConfigService,
      Inject(APP_SERVER),
    ]
  }

  constructor(
    appConfigService,
    appServer,
  ) {
    this.appConfigService = appConfigService;
    this.appServer = appServer;
  }

  init() {
    this.appServer.proxy = this.appConfigService.isProxy;
    if (this.appServer.proxy) {
      console.log('App proxy is enabled.');
    }
  }
}

const APP_INITIALIZERS = [
  {
    provide: APP_INITIALIZER,
    useClass: EnableProxyAppInitializer,
    multi: true,
  },
  {
    provide: APP_ROUTERS_INITIALIZER,
    useClass: class AppRoutersInitializer {

      init(appServer, appRouters) {
        if (!(appServer && isArray(appRouters))) {
          return;
        }

        console.log('Custom APP_ROUTERS_INITIALIZER');
        appRouters.forEach(r => appServer.use(r.routes()));
      }
    },
  },
  {
    provide: APP_MIDDLEWARE_INITIALIZER,
    useClass: class AppMiddlewareInitializer {

      static get parameters() {
        return [
          Inject(APP_SERVER),
          Inject(APP_MIDDLEWARE),
        ]
      }

      constructor(
        appServer,
        appMiddleware,
      ) {
        this.appMiddleware = appMiddleware;
        this.appServer = appServer;
      }

      init() {
        if (!(this.appServer && isArray(this.appMiddleware))) {
          return;
        }
        console.log('Custom APP_MIDDLEWARE_INITIALIZER');

        this.appMiddleware.forEach(m => this.appServer.use(m));
      }
    },
  },
  {
    provide: APP_ROUTER_MIDDLEWARE_INITIALIZER,
    useClass: class AppRouterMiddlewareInitializer {

      init(router, middleware) {
        if (!(router && isArray(middleware))) {
          return;
        }

        console.log('Custom APP_ROUTER_MIDDLEWARE_INITIALIZER');
        middleware.map(mw => router.use(mw))
      }
    },
  },
  {
    provide: APP_ROUTE_MOUNTER,
    useClass: class AppRouteMounter {

      mount(router, { path, method, middleware, handler }) {

        console.log('Custom APP_ROUTE_MOUNTER');
        router[method](path, ...middleware, handler);
      }
    },
  },
];


module.exports = {
  APP_INITIALIZERS,
};
