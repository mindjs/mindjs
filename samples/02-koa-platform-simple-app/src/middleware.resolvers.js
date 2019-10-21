const { Injectable } = require('@framework100500/common');

const AppConfigService = require('./config.service');

class AddExclamationMarkMiddlewareResolver {

  static get parameters() {
    return [
      AppConfigService,
    ]
  }

  constructor(
    appConfigService,
  ) {
    this.appConfigService = appConfigService;
  }

  resolve(...params) {
    if (params.length) {
      console.log('Resolve params received: %o', params);
    }
    return async (ctx, next) => {
      ctx.state.name = `${ ctx.state.name }${ this.appConfigService.exclamationMark }`;
      return next();
    }
  }
}

class LogOutTimeMiddlewareResolver {
  resolve(...params) {
    if (params.length) {
      console.log('Resolve params received: %o', params);
    }
    return async (ctx, next) => {
      await next();
      console.log('Bye, bye. You are living at %s', new Date());
    }
  }
}

module.exports = {
  AddExclamationMarkMiddlewareResolver: Injectable(AddExclamationMarkMiddlewareResolver),
  LogOutTimeMiddlewareResolver: Injectable(LogOutTimeMiddlewareResolver),
};
