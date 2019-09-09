const { HTTP_METHODS } = require('@framework100500/common');
const { RoutingModule } = require('@framework100500/routing');

const { AddExclamationMarkMiddlewareResolver, LogOutTimeMiddlewareResolver } = require('./middleware-resolvers');
const { HelloWorldHandlerResolver } = require('./handlers-resolvers');

module.exports = RoutingModule.forRoot({
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

      injectHandlerResolver: HelloWorldHandlerResolver,
    }],
  },
});
