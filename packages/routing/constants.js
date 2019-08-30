const { OK, getStatusText } = require('http-status-codes');

const stubHandler = ctx => ctx.body = { statusCode: OK, message: getStatusText(OK) };

module.exports = {
  stubHandler,
};
