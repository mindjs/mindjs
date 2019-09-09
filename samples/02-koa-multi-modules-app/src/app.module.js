const {
  Module,
  APP_SERVER,
  APP_ROUTER_PROVIDER,
} = require('@framework100500/core');

const Koa = require('koa');
const Router = require('koa-router');

const { MIDDLEWARE } = require('./app.middleware');
const { APP_INITIALIZERS } = require('./app.initializers');
const { APP_SERVER_LISTENERS } = require('./app.listeners');

const AppConfigService = require('./config.service');
const { HelloWorldModule } = require('./hello-world');

const APP_SERVICES = [
  AppConfigService,
];

class AppModule {}
module.exports = Module(AppModule, {
  imports: [
    HelloWorldModule,
  ],
  providers: [
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

    ...APP_SERVER_LISTENERS,
    ...APP_INITIALIZERS,
    ...APP_SERVICES,
    ...MIDDLEWARE,
  ],
});
