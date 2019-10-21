const {
  APP_SERVER,
  APP_SERVER_NET_LISTENER,
  APP_SERVER_ERROR_LISTENER,
  APP_MIDDLEWARE_INITIALIZER,
  APP_INITIALIZER,
  CoreModule,
} = require('@framework100500/core');
const {
  APP_ROUTER_PROVIDER,
  APP_ROUTE_MOUNTER,
  APP_ROUTERS_INITIALIZER,
  APP_ROUTER_MIDDLEWARE_INITIALIZER,
} = require('@framework100500/routing');
const { Module } = require('@framework100500/common');
// const { HttpModule } = require('@framework100500/http');

const Koa = require('koa');
const Router = require('koa-router');

const AppRouting = require('./app.routing');
const AppConfigService = require('./config.service');
const { AppServerListener, AppServerErrorListener } = require('./app.listeners');
const {
  EnableProxyAppInitializer,
  AppMiddlewareInitializer,
  AppRoutersInitializer,
  AppRouterMiddlewareInitializer,
  AppRouteMounter,
} = require('./app.initializers');

const APP_MIDDLEWARE_PROVIDERS = require('./app.middleware');

const APP_SERVER_LISTENERS_PROVIDERS = [
  {
    provide: APP_SERVER_NET_LISTENER,
    useClass: AppServerListener ,
  },
  {
    provide: APP_SERVER_ERROR_LISTENER,
    useClass: AppServerErrorListener,
  },
];

const APP_SERVICES_PROVIDERS = [
  AppConfigService,
];

const APP_PROVIDERS = [
  {
    provide: APP_SERVER,
    useValue: new Koa(),
  },
  {
    provide: APP_ROUTER_PROVIDER,
    useFactory: function () {
      return Router;
    },
  },
];

const APP_INITIALIZERS_PROVIDERS = [
  {
    provide: APP_INITIALIZER,
    useClass: EnableProxyAppInitializer,
    multi: true,
  },
  {
    provide: APP_MIDDLEWARE_INITIALIZER,
    useClass: AppMiddlewareInitializer,
  },
  {
    provide: APP_ROUTER_MIDDLEWARE_INITIALIZER,
    useClass: AppRouterMiddlewareInitializer,
  },
  {
    provide: APP_ROUTERS_INITIALIZER,
    useClass: AppRoutersInitializer,
  },
  {
    provide: APP_ROUTE_MOUNTER,
    useClass: AppRouteMounter,
  },
];

module.exports = Module(class AppModule {}, {
  imports: [
    CoreModule.forRoot(),
    // HttpModule.forRoot(),
    AppRouting,
  ],
  providers: [
    ...APP_PROVIDERS,
    ...APP_SERVER_LISTENERS_PROVIDERS,
    ...APP_INITIALIZERS_PROVIDERS,
    ...APP_SERVICES_PROVIDERS,
    ...APP_MIDDLEWARE_PROVIDERS,
  ],
});
