const { Module } = require('@framework100500/core');
const { RoutingModule } = require('@framework100500/routing');

const { HELLO_WORD } = require('./DI.tokens');
const HelloWorldRoutingModule = require('./routing');
const { GoodByeModule } = require('./good-bye');

class HelloWorldModule {}
module.exports = Module(HelloWorldModule, {
  imports: [
    GoodByeModule,
    HelloWorldRoutingModule,
    RoutingModule.forRoot({
      providers: [],
      routerDescriptor: {
        prefix: 'user',
        commonMiddleware: [
          async (ctx, next) => {
            console.log('Welcome to user\'s API endpoints');
            return next();
          }
        ],
        routes: [{
          path: 'name',
          method: 'get',
          middleware: [
            async (ctx, next) => {
              console.log('Doing some important stuff within user\'s name endpoint');
              return next();
            }
          ],
          handler: async (ctx) => {
            ctx.body = 'User data will be here soon'
          },
        }]
      }
    }),
  ],
  providers: [
    {
      provide: HELLO_WORD,
      useValue: 'Aloha'
    }
  ]
});
