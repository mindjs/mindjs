const { Module } = require('@framework100500/common');
const { HTTP_METHODS } = require('@framework100500/common/http');
const { RoutingModule, APP_ROUTING_MODULES_RESOLVER } = require('@framework100500/routing');

class GoodByeModule {}
module.exports = Module(GoodByeModule, {
  imports: []  ,
  providers: [
    {
      provide: APP_ROUTING_MODULES_RESOLVER,
      useClass: class GoodByeModuleRoutingResolver {
        resolve() {
          return [
            RoutingModule.forRoot({
              providers: [],
              routerDescriptor: {
                prefix: 'good-bye',
                commonMiddleware: [],
                injectCommonMiddlewareResolvers: [],
                routes: [{
                  path: 'my-love',
                  method: HTTP_METHODS.GET,

                  injectMiddlewareResolvers: [],
                  middleware: [
                    async (ctx, next) => {
                      console.log('Very long preparation for saying it...');
                      return next();
                    },
                    async (ctx, next) => {
                      console.log('Nice to meet you and see you again soon...');
                      return next();
                    }
                  ],

                  handler: async (ctx) => {
                    ctx.body = 'Just, .... Bye!';
                  },
                }]
              }
            }),
          ]
        }
      }
    }
  ],
});
