const { Injectable } = require('@framework100500/core');

const AppConfigService = require('../../config.service');

class LogOutTimeMiddlewareResolver {

  resolve() {
    return async (ctx, next) => {
      await next();
      console.log('Bye, bye. Now is %s', new Date());
    }
  }
}

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

  resolve() {
    return async (ctx, next) => {
      ctx.state.name = `${ ctx.state.name }${ this.appConfigService.exclamationMark }`;
      return next();
    }
  }
}

module.exports = {
  AddExclamationMarkMiddlewareResolver: Injectable(AddExclamationMarkMiddlewareResolver),
  LogOutTimeMiddlewareResolver: Injectable(LogOutTimeMiddlewareResolver),
};
