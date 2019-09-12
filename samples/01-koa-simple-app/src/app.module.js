const {
  Module,
  Inject,
  Injectable,
  APP_SERVER,
  APP_SERVER_NET_LISTENER,
  APP_SERVER_ERROR_LISTENER,
  APP_MIDDLEWARE,
  APP_ROUTER_PROVIDER,
  APP_INITIALIZER,
} = require('@framework100500/core');

const {
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
const { EnableProxyAppInitializer } = require('./app.initializers');

const HelloWorldHandlerResolver =  Injectable(class HelloWorldHandlerResolver {
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
];

class AppModule {}
module.exports = Module(AppModule, {
  imports: [
    RoutingModule.forRoot({
      providers: [
        HelloWorldHandlerResolver,
        LogOutTimeMiddlewareResolver,
        AddExclamationMarkMiddlewareResolver,
      ],
      routerDescriptor: {
        prefix: '/api',
        commonMiddleware: [
          async (ctx, next) => {
            console.log('Hi there. Now is %s', new Date());
            return next();
          }
        ],
        injectCommonMiddlewareResolvers: [
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
          injectMiddlewareResolvers: [
            AddExclamationMarkMiddlewareResolver
          ],

          // handler: async (ctx) => {
          //   ctx.body = `hello, ${ ctx.state.name }`
          // },
          // OR
          injectHandlerResolver: HelloWorldHandlerResolver,
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
