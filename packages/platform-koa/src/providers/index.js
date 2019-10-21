const { Optional } = require('@framework100500/common');
const { isDevEnvironment } = require('@framework100500/common/utils');
const {
  APP_MIDDLEWARE_INITIALIZER,
  APP_SERVER,
  APP_SERVER_ERROR_LISTENER,
  APP_SERVER_NET_LISTENER,
  APP_MIDDLEWARE,
  APP_CONFIG,
} = require('@framework100500/core');
const {
  APP_ROUTERS_INITIALIZER,
  APP_ROUTE_MOUNTER,
  APP_ROUTER_MIDDLEWARE_INITIALIZER,
  APP_ROUTER_PROVIDER,
} = require('@framework100500/routing');

const Koa = require('koa');
const Router = require('koa-router');

const {
  KoaServerNetListener,
  KoaServerErrorListener,
} = require('../listeners');
const {
  KoaRoutersInitializer,
  KoaRouterMiddlewareInitializer,
  KoaRouteMounter,
  KoaMiddlewareInitializer,
} = require('../initializers');
const {
  KOA_CORS_CONFIG,
  KOA_HELMET_CONFIG,
  KOA_SERVE_STATIC_CONFIG,
  KOA_BODY_PARSER_CONFIG,
  KOA_LOGGER_CONFIG,
  KOA_COMPRESS_CONFIG,
  KOA_HEALTH_CONFIG,
} = require('../DI.tokens');
const { DEFAULT_APP_PORT } = require('../constants');

const {
  koaHelmetMWFactory,
  koaLoggerMWFactory,
  koaCompressMWFactory,
  koaBodyParserMWFactory,
  koaHealthMWFactory,
  koaCORSMWFactory,
  koaServeStaticMWFactory,
} = require('../middleware');

const KOA_SERVER_PROVIDER = {
  provide: APP_SERVER,
  useValue: new Koa(),
};

const KOA_SERVER_NET_LISTENER_PROVIDER = {
  provide: APP_SERVER_NET_LISTENER,
  useClass: KoaServerNetListener,
};

const KOA_SERVER_ERROR_LISTENER_PROVIDERS = [
  {
    provide: APP_SERVER_ERROR_LISTENER,
    useClass: KoaServerErrorListener,
    multi: true,
  },
];

const KOA_APP_INITIALIZER_PROVIDERS = [];

const KOA_APP_MIDDLEWARE_PROVIDERS = [
  {
    provide: APP_MIDDLEWARE,
    useFactory: koaHelmetMWFactory,
    deps: [Optional(KOA_HELMET_CONFIG)],
    multi: true,
  },
  {
    provide: APP_MIDDLEWARE,
    useFactory: koaLoggerMWFactory,
    deps: [Optional(KOA_LOGGER_CONFIG)],
    multi: true,
  },
  {
    provide: APP_MIDDLEWARE,
    useFactory: koaCompressMWFactory,
    deps: [Optional(KOA_COMPRESS_CONFIG)],
    multi: true,
  },
  {
    provide: APP_MIDDLEWARE,
    useFactory: koaBodyParserMWFactory,
    deps: [Optional(KOA_BODY_PARSER_CONFIG)],
    multi: true,
  },
  {
    provide: APP_MIDDLEWARE,
    useFactory: koaHealthMWFactory,
    deps: [Optional(KOA_HEALTH_CONFIG)],
    multi: true,
  },
  {
    provide: APP_MIDDLEWARE,
    useFactory: koaCORSMWFactory,
    deps: [Optional(KOA_CORS_CONFIG)],
    multi: true,
  },
  {
    provide: APP_MIDDLEWARE,
    useFactory: koaServeStaticMWFactory,
    deps: [Optional(KOA_SERVE_STATIC_CONFIG)],
    multi: true,
  },
];

const KOA_APP_MIDDLEWARE_INITIALIZER_PROVIDER = {
  provide: APP_MIDDLEWARE_INITIALIZER,
  useClass: KoaMiddlewareInitializer,
};

const KOA_APP_ROUTER_PROVIDER = {
  provide: APP_ROUTER_PROVIDER,
  useFactory: function () {
    return Router;
  },
};

const KOA_APP_ROUTER_MIDDLEWARE_INITIALIZER_PROVIDER = {
  provide: APP_ROUTER_MIDDLEWARE_INITIALIZER,
  useClass: KoaRouterMiddlewareInitializer,
};

const KOA_APP_ROUTE_MOUNTER_PROVIDER = {
  provide: APP_ROUTE_MOUNTER,
  useClass: KoaRouteMounter,
};

const KOA_APP_ROUTERS_INITIALIZER_PROVIDER = {
  provide: APP_ROUTERS_INITIALIZER,
  useClass: KoaRoutersInitializer,
};

const KOA_APP_DEFAULT_PROVIDERS = [
  {
    provide: APP_CONFIG,
    useValue: {
      port: DEFAULT_APP_PORT,
      configuration: 'development',
      isDev: isDevEnvironment(),
    }
  },
];

module.exports = {
  koaServerProvider: KOA_SERVER_PROVIDER,
  koaServerNetListenerProvider: KOA_SERVER_NET_LISTENER_PROVIDER,
  koaServerErrorListenerProviders: KOA_SERVER_ERROR_LISTENER_PROVIDERS,
  koaAppInitializerProviders: KOA_APP_INITIALIZER_PROVIDERS,
  koaAppMiddlewareProviders: KOA_APP_MIDDLEWARE_PROVIDERS,
  koaAppMiddlewareInitializerProvider: KOA_APP_MIDDLEWARE_INITIALIZER_PROVIDER,
  koaAppRouterMiddlewareInitializerProvider: KOA_APP_ROUTER_MIDDLEWARE_INITIALIZER_PROVIDER,
  koaAppRouteMounterProvider: KOA_APP_ROUTE_MOUNTER_PROVIDER,
  koaAppRoutersInitializerProvider: KOA_APP_ROUTERS_INITIALIZER_PROVIDER,
  koaAppRouterProvider: KOA_APP_ROUTER_PROVIDER,
  koaAppDefaultProviders: KOA_APP_DEFAULT_PROVIDERS,
};
