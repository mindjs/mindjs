const { RoutingModule } = require('@mindjs/routing');
const { HTTP_METHODS } = require('@mindjs/common/http');

module.exports = RoutingModule.forRoot({
  providers: [],
  routerDescriptor: {
    prefix: '/api',
    commonMiddleware: [],
    commonMiddlewareResolvers: [
      // NOTE: it can be also provided as
      // {
      //   resolver: ,
      //   resolveParams: [3, 2, '1', 'logout'],
      // },
    ],
    routes: [
      {
      path: '',
      method: HTTP_METHODS.GET,

      middleware: [],
      // AND/OR
      middlewareResolvers: [
        // NOTE: it can be also provided as
        // {
        //   resolver: AddExclamationMarkMiddlewareResolver,
        //   resolveParams: [1, 2, '3', 'other'],
        // },
      ],

      handler: async (ctx) => {
        ctx.body = `hello, ${ ctx.state.name }`
      },
      // OR
      // handlerResolver: ,
      // handlerResolverResolveParams: ['Resolve', 'params'],
    }],
  },
});
