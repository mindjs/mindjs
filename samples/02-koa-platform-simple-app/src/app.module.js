const {
  // APP_SERVER,
  // APP_SERVER_NET_LISTENER,
  CoreModule,
} = require('@framework100500/core');
const {
  // APP_ROUTE_MOUNTER,
  // APP_ROUTER_PROVIDER,
} = require('@framework100500/routing');
const { Module } = require('@framework100500/common');
// const { HttpModule } = require('@framework100500/http');

// const Koa = require('koa');
// const Router = require('koa-router');

const AppRouting = require('./app.routing');
const AppConfigService = require('./config.service');
// const { AppServerListener } = require('./app.listeners');
const { EnableProxyAppInitializer, AppRouteMounter } = require('./app.initializers');

const APP_MIDDLEWARE_PROVIDERS = require('./app.middleware');

const APP_SERVER_LISTENERS_PROVIDERS = [
 /*
  * NOTE: providing any of
  *  APP_SERVER_NET_LISTENER
  *  APP_SERVER_ERROR_LISTENER
  * will override a proper platform provider accordingly
  * */
  // {
  //   provide: APP_SERVER_NET_LISTENER,
  //   useClass: AppServerListener,
  // },
];

const APP_SERVICES_PROVIDERS = [
  AppConfigService,
];

const APP_PROVIDERS = [
  /*
 * NOTE:  providing any of
 *  APP_SERVER
 *  APP_ROUTER_PROVIDER
 * will override a proper platform provider accordingly
 * */
  // {
  //   provide: APP_SERVER,
  //   useValue: new Koa(),
  // },
  // // OR
  // // {
  // //   provide: APP_SERVER,
  // //   useFactory: function () {
  // //     console.log('custom APP_SERVER provider');
  // //     return new Koa();
  // //   },
  // // },
  // {
  //   provide: APP_ROUTER_PROVIDER,
  //   useFactory: function () {
  //     console.log('custom APP_ROUTER_PROVIDER provider');
  //     return Router;
  //   },
  // },
];

const APP_INITIALIZERS_PROVIDERS = [
  /*
   * NOTE: providing any of
   *  APP_MIDDLEWARE_INITIALIZER
   *  APP_ROUTER_MIDDLEWARE_INITIALIZER
   *  APP_ROUTERS_INITIALIZER
   *  APP_ROUTE_MOUNTER
   * will override a proper platform provider accordingly
   * */
  // {
  //   provide: APP_ROUTE_MOUNTER,
  //   useClass: AppRouteMounter,
  // },
  EnableProxyAppInitializer,
];

module.exports = Module(class AppModule {
}, {
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
