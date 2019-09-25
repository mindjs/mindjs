const HttpStatus = require('http-status-codes');

const HTTP_METHODS = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  PATCH: 'patch',
  DELETE: 'delete',
  HEAD: 'head',
  OPTIONS: 'options',
};

const HTTP_PROTOCOLS = {
  HTTP: 'http',
  HTTPS: 'https',
};

module.exports = {
  HTTP_METHODS,
  HTTP_PROTOCOLS,

  // re-export http status codes for common usages
  HttpStatus,
};
