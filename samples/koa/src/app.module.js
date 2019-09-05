const {
  Module,
  Inject,
  APP_SERVER,
  APP_SERVER_NET_LISTENER,
  APP_SERVER_ERROR_LISTENER,
  APP_MIDDLEWARE,
  // APP_INITIALIZER,
} = require('@framework100500/core');
const {
  APP_SERVER_ROUTER_PROVIDER,
  RoutingModule,
} = require('@framework100500/routing');
const {
  HTTP_METHODS
} = require('@framework100500/common');

const Koa = require('koa');
const Router = require('koa-router');

const bodyParser = require('koa-body');
const compress = require('koa-compress');
const cors = require('@koa/cors');
const health = require('koa2-ping');
const helmet = require('koa-helmet');
const logger = require('koa-logger');

const AppConfigService = require('./config.service');

class AppModule {}
module.exports = Module(AppModule, {
  imports: [
    RoutingModule.forRoot({
      // providers: [],
      routerDescriptor: {
        // prefix: '',
        commonMiddleware: [],
        injectCommonMiddleware: [],
        routes: [{
          path: 'hello-world',
          method: HTTP_METHODS.GET,

          middleware: [
            async (ctx, next) => {
              console.log('Request query: %O', ctx.request.query);
              return  next();
            }
          ],
          // AND/OR
          // injectMiddleware: [],

          handler: async (ctx) => {
            ctx.body = 'hello world'
          },
          // OR
          // injectHandler: '',
        }],
      },
    }),
  ],
  providers: [
    {
      provide: APP_SERVER,
      useValue: new Koa(),
    },
    {
      provide: APP_SERVER_ROUTER_PROVIDER,
      useFactory: function () {
        return Router;
      },
    },

    AppConfigService,

    {
      provide: APP_SERVER_NET_LISTENER,
      useClass: class AppServerListener {

        static get parameters() {
          return [
            Inject(APP_SERVER),
            AppConfigService,
          ];
        }

        constructor(
          appServer,
          appConfigService,
        ) {
          this.appServer = appServer;
          this.appConfigService = appConfigService;
        }

        listen() {
          const { port } = this.appConfigService;
          this.appServer.listen(port, () => {
            console.log(`App server is up and running on ${ port }`);
          });
        }
      },
    },
    {
      provide: APP_SERVER_ERROR_LISTENER,
      useClass: class AppServerErrorListener {

        static get parameters() {
          return [
            Inject(APP_SERVER),
          ];
        }

        constructor(
          appServer,
        ) {
          this.appServer = appServer;
        }

        listen() {
          this.appServer.on('error', (e) => {
            console.error(e);
          });
        }
      },
    },

    {
      provide: APP_MIDDLEWARE,
      useFactory: function() {
        return helmet();
      },
      multi: true,
    },
    {
      provide: APP_MIDDLEWARE,
      useFactory: function() {
        return logger();
      },
      multi: true,
    },
    {
      provide: APP_MIDDLEWARE,
      useFactory: function() {
        return compress();
      },
      multi: true,
    },
    {
      provide: APP_MIDDLEWARE,
      useFactory: function() {
        return bodyParser();
      },
      multi: true,
    },
    {
      provide: APP_MIDDLEWARE,
      useFactory: function() {
        return health();
      },
      multi: true,
    },
    {
      provide: APP_MIDDLEWARE,
      useFactory: function(config) {
        return cors({ ...config.corsOptions });
      },
      deps: [AppConfigService],
      multi: true,
    },
  ],
});
