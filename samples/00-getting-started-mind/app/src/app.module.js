const { Module } = require('@mindjs/common');
const { HTTP_METHODS } = require('@mindjs/common/http');
const { CoreModule } = require('@mindjs/core');
const { RoutingModule } = require('@mindjs/routing');

module.exports = Module(class MindAppModule{}, {
  imports: [
    CoreModule.forRoot(),
    RoutingModule.forRoot({
      providers: [],
      routerDescriptor: {
        prefix: 'api',
        commonMiddleware: [],
        routes: [
          {
            path: 'hello-mind',
            method: HTTP_METHODS.GET,
            handler: async (ctx) => {
              ctx.body = {
                msg: 'Hello, Mind',
              }
            }
          }
        ],
      },
    }),
  ],
  providers: [],
});
