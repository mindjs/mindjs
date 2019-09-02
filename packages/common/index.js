const { HTTP_METHODS, CommonModule } = require('./src');
const HttpStatus = require('http-status-codes');

module.exports = {
  HttpStatus, // re-export http status codes for common usages
  HTTP_METHODS,

  CommonModule,
};
