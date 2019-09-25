const { Injectable, Inject } = require('@framework100500/common');
const { HttpStatus} = require('@framework100500/common/http');

const { HELLO_WORD } = require('../DI.tokens');

class HelloWorldHandlerResolver {

  static get parameters() {
    return [
      Inject(HELLO_WORD),
    ];
  }

  constructor(
    helloWord,
  ) {
    this.helloWord = helloWord;
  }

  resolve() {
    return async (ctx) => {
      ctx.body = {
        status: HttpStatus.OK,
        message: `${ this.helloWord }, ${ ctx.state.name }`,
    }
    }
  }
}

module.exports = {
  HelloWorldHandlerResolver: Injectable(HelloWorldHandlerResolver),
};
