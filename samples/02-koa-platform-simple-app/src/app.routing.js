const { RoutingModule } = require('@mindjs/routing');
const { HTTP_METHODS } = require('@mindjs/common/http');

const { HelloWorldHandlerResolver } = require('./handlers.resolvers');
const { AddExclamationMarkMiddlewareResolver, LogOutTimeMiddlewareResolver } = require('./middleware.resolvers');

module.exports = RoutingModule.forRoot({
  providers: [],
  routerDescriptor: {
    prefix: '/api',
    commonMiddleware: [
      async (ctx, next) => {
        console.log('Hello. Now is %s', new Date());
        return next();
      },
    ],
    commonMiddlewareResolvers: [
      LogOutTimeMiddlewareResolver,
      // NOTE: it can be also provided as
      // {
      //   resolver: LogOutTimeMiddlewareResolver,
      //   resolveParams: [3, 2, '1', 'logout'],
      // },
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
        },
      ],
      // AND/OR
      middlewareResolvers: [
        AddExclamationMarkMiddlewareResolver,
        // NOTE: it can be also provided as
        // {
        //   resolver: AddExclamationMarkMiddlewareResolver,
        //   resolveParams: [1, 2, '3', 'other'],
        // },
      ],

      // handler: async (ctx) => {
      //   ctx.body = `hello, ${ ctx.state.name }`
      // },
      // OR
      handlerResolver: HelloWorldHandlerResolver,
      handlerResolverResolveParams: ['Resolve', 'params'],
    }],
  },
});
