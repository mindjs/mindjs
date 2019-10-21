const { HttpStatus } = require('@framework100500/common/http');

const stubResponse = { statusCode: HttpStatus.OK, message: HttpStatus.getStatusText(HttpStatus.OK) };

module.exports = {
  stubResponse,
};
