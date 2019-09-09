const { isArray } = require('lodash');
const {
  Inject,
  APP_SERVER,
  APP_INITIALIZER,
  APP_ROUTERS_INITIALIZER,
  APP_ROUTERS,
  APP_MIDDLEWARE_INITIALIZER,
  APP_MIDDLEWARE,
} = require('@framework100500/core');

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

const APP_INITIALIZERS = [
  {
    provide: APP_INITIALIZER,
    useClass: EnableProxyAppInitializer,
    multi: true,
  },
  {
    provide: APP_ROUTERS_INITIALIZER,
    useClass: class AppRoutersInitializer {
      static get parameters() {
        return [
          Inject(APP_SERVER),
          Inject(APP_ROUTERS),
        ]
      }

      constructor(
        appServer,
        appRouters,
      ) {
        this.appServer = appServer;
        this.appRouters = appRouters;
      }

     async init() {
       console.log(1);
       if (!(this.appServer && isArray(this.appRouters))) {
          return;
        }
        console.log('Custom routers init');

        this.appRouters.forEach(r => this.appServer.use(r.routes()));
      }
    }
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

     async init() {
       console.log(2);
       if (!(this.appServer && isArray(this.appMiddleware))) {
          return;
        }
        console.log('Custom middleware init');

        this.appMiddleware.forEach(m => this.appServer.use(m));
      }
    }
  },
];


module.exports = {
  APP_INITIALIZERS,
};
