const { isFunction } = require('lodash');

const { HttpStatus } = require('@framework100500/common/http');

const stubResponse = { statusCode: HttpStatus.OK, message: HttpStatus.getStatusText(HttpStatus.OK) };

const stubHandler = (...args) => {
  if (!args.length) {
    return;
  }

  const [koaCtx, response, cb] = args;

  // Koa.js specific
  const isKoaCtx = koaCtx.request && koaCtx.response && koaCtx.body;
  if (isKoaCtx) {
    koaCtx.body = stubResponse;
    return;
  }

  // Express.js specific
  if (isFunction(response.send)) {
    response.send(stubResponse);

    // Restify specific
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
