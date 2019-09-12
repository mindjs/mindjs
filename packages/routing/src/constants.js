const { isFunction, first, get } = require('lodash');

const { HttpStatus } = require('@framework100500/common');

const stubResponse = { statusCode: HttpStatus.OK, message: HttpStatus.getStatusText(HttpStatus.OK) };
//
const stubHandler = (...args) => {
  if (!args.length) {
    return;
  }

  // Koa.js specific
  const koaCtx = first(args);
  const isKoaCtx = koaCtx.request && koaCtx.response && koaCtx.body;
  if (isKoaCtx) {
    koaCtx.body = stubResponse;
    return;
  }

  // Express.js specific
  const response = get(args, '1', {});
  const cb = get(args, '2');

  if (isFunction(response.send)) {
    response.send(stubResponse);

    // restify specific
    if (isFunction(cb)) {
      cb();
    }
    return;
  }

  if (isFunction(cb)) {
    cb();
  }
};

module.exports = {
  stubHandler,
};
