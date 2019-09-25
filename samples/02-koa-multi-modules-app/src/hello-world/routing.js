const { HTTP_METHODS } = require('@framework100500/common/http');
const { RoutingModule } = require('@framework100500/routing');

const {
  AddExclamationMarkMiddlewareResolver,
  LogOutTimeMiddlewareResolver,
} = require('./middleware-resolvers');
const {
  HelloWorldHandlerResolver,
} = require('./handlers-resolvers');

const addNameToStateMiddleware = async (ctx, next) => {
  const {query} = ctx.request;
  const {name = 'world'} = query;
  ctx.state.name = name;
  return next();
};

module.exports = RoutingModule.forRoot({
  providers: [

  ],
  routerDescriptor: {
    prefix: '/api',
    commonMiddleware: [
      async (ctx, next) => {
        console.log('Hi there. Now is %s', new Date());
        return next();
      }
    ],
    commonMiddlewareResolvers: [],
    routes: [
      {
        path: 'hello-world',
        method: HTTP_METHODS.GET,

        middleware: [
          addNameToStateMiddleware,
        ],
        // AND/OR
        middlewareResolvers: [
          AddExclamationMarkMiddlewareResolver,
          LogOutTimeMiddlewareResolver,
        ],

        handlerResolver: HelloWorldHandlerResolver,
      },
    ],
  },
});
