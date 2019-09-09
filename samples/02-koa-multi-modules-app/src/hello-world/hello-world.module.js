const { Module } = require('@framework100500/core');

const { HELLO_WORD } = require('./DI.tokens');
const HelloWorldRoutingModule = require('./routing');

class HelloWorldModule {}
module.exports = Module(HelloWorldModule, {
  imports: [
    HelloWorldRoutingModule,
  ],
  providers: [
    {
      provide: HELLO_WORD,
      useValue: 'Aloha'
    }
  ]
});
