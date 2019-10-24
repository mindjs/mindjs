const { Injectable } = require('@mindjs/common');

class HelloWorldHandlerResolver {
  resolve(...params) {
    // if (params.length) {
    //   console.log('Resolve params received: %o', params);
    // }
    return async (ctx) => {
      ctx.body = `hello, ${ ctx.state.name }`
    }
  }
}

module.exports = {
  HelloWorldHandlerResolver: Injectable(HelloWorldHandlerResolver),
};
