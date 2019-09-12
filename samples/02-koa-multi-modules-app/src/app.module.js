const {
  Module,
  Injectable,
  Inject,
  APP_SERVER,
  APP_ROUTER_PROVIDER,
} = require('@framework100500/core');
const { RoutingModule } = require('@framework100500/routing');
const { HTTP_METHODS } = require('@framework100500/common');
const { InjectionToken } = require('@framework100500/core/DI');

const Koa = require('koa');
const Router = require('koa-router');

const { MIDDLEWARE } = require('./app.middleware');
const { APP_INITIALIZERS } = require('./app.initializers');
const { APP_SERVER_LISTENERS } = require('./app.listeners');

const AppConfigService = require('./config.service');
const { HelloWorldModule } = require('./hello-world');

const BRANCH_EMOJI = new InjectionToken('BRANCH_EMOJI');

const APP_SERVICES = [
  AppConfigService,
];

const GetBranchHandlerResolver = Injectable(class GetBranchHandlerResolver {
  static get parameters() {
    return [
      Inject(BRANCH_EMOJI),
    ];
  }

  constructor(
    branchSign
  ) {
    this.branchSign = branchSign;
  }

  resolve() {
    return async (ctx) => {
      ctx.body = this.branchSign;
    }
  }
});

class AppModule {}
module.exports = Module(AppModule, {
  imports: [
    HelloWorldModule,
    RoutingModule.forRoot({
      providers: [
        GetBranchHandlerResolver,
      ],
      routerDescriptor: {
        prefix: 'root',
        injectCommonMiddlewareResolvers: [],
        commonMiddleware: [],
        routes: [{
          path: 'branch',
          method: HTTP_METHODS.GET,
          middleware: [],
          injectMiddlewareResolvers: [],
          injectHandlerResolver: GetBranchHandlerResolver,
        }]
      }
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

    {
      provide: BRANCH_EMOJI,
      useValue: '🌿',
    },
  ],
});
