const {
  APP_SERVER,
  APP_SERVER_NET_LISTENER,
  APP_SERVER_ERROR_LISTENER,
  APP_MIDDLEWARE,
  APP_SERVER_TERMINATE_SIGNAL,
  APP_MIDDLEWARE_INITIALIZER,

  APP_INITIALIZER,
  CoreModule,
} = require('@framework100500/core');

const {
  APP_ROUTER_PROVIDER,
  RoutingModule,
} = require('@framework100500/routing');

const {
  HttpModule,
} = require('@framework100500/http');

const {
  HTTP_METHODS
} = require('@framework100500/common/http');
const {
  Module,
  Inject,
  Injectable,
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
const { EnableProxyAppInitializer, MiddlewareInitializer } = require('./app.initializers');

const HelloWorldHandlerResolver = Injectable(class HelloWorldHandlerResolver {
  resolve() {
    return async (ctx) => {
      ctx.body = `hello, ${ ctx.state.name }`
    }
  }
});

const AddExclamationMarkMiddlewareResolver = Injectable(class AddExclamationMarkMiddlewareResolver {

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

  resolve() {
    return async (ctx, next) => {
      ctx.state.name = `${ ctx.state.name }${ this.appConfigService.exclamationMark }`;
      return next();
    }
  }
});

const LogOutTimeMiddlewareResolver =  Injectable(class LogOutTimeMiddlewareResolver {

  resolve() {
    return async (ctx, next) => {
     await next();
      console.log('Bye, bye. Now is %s', new Date());
    }
  }
});

const MIDDLEWARE = [
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
];

const APP_SERVER_LISTENERS = [
  {
    provide: APP_SERVER_NET_LISTENER,
    useClass: class AppServerListener {

      static get parameters() {
        return [
          Inject(APP_SERVER),
          AppConfigService,
          Inject(APP_SERVER_TERMINATE_SIGNAL),
        ];
      }

      constructor(
        appServer,
        appConfigService,
        terminateSignal,
      ) {
        this.appServer = appServer;
        this.appConfigService = appConfigService;
        this.terminateSignal = terminateSignal;
      }

      listen() {
        const { port } = this.appConfigService;

        const listener = this.appServer.listen(port, () => {
          console.log(`App server is up and running on ${ port }`);
        });

        this.appServer.on(this.terminateSignal, () => {
          console.log(`App server received a termination signal, ${ this.terminateSignal }`);

          listener.close(() => {
            console.log(`App server is down.`);
          });
          listener.unref();
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
];

const APP_SERVICES = [
  AppConfigService,
];
const APP_INITIALIZERS = [
  {
    provide: APP_INITIALIZER,
    useClass: EnableProxyAppInitializer,
    multi: true,
  },
  {
    provide: APP_MIDDLEWARE_INITIALIZER,
    useClass: MiddlewareInitializer,
  }
];

class AppModule {}
module.exports = Module(AppModule, {
  imports: [
    CoreModule.forRoot(),
    HttpModule.forRoot(),

    RoutingModule.forRoot({
      providers: [],
      routerDescriptor: {
        prefix: '/api',
        commonMiddleware: [
          async (ctx, next) => {
            console.log('Hi there. Now is %s', new Date());
            return next();
          }
        ],
        commonMiddlewareResolvers: [
          LogOutTimeMiddlewareResolver,
        ],
        routes: [{
          path: 'hello-world',
          method: HTTP_METHODS.GET,

          middleware: [
            async (ctx, next) => {
              const { query } = ctx.request;
              const { name = 'world' } = query;
              ctx.state.name = name;
              return next();
            }
          ],
          // AND/OR
          middlewareResolvers: [
            AddExclamationMarkMiddlewareResolver
          ],

          // handler: async (ctx) => {
          //   ctx.body = `hello, ${ ctx.state.name }`
          // },
          // OR
          handlerResolver: HelloWorldHandlerResolver,
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
