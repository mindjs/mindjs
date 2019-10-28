const { HttpStatus } = require('@mindjs/common/http');

const stubResponse = { statusCode: HttpStatus.OK, message: HttpStatus.getStatusText(HttpStatus.OK) };

module.exports = {
  stubResponse,
};
