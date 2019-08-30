// TODO: implement a Testing Http Module solution
const { HTTP_METHODS } = require('../core');
const { HTTP_CLIENT, HTTP_REQUEST_INTERCEPTOR } = require('./DI.tokens');
const HttpClient = require('./http.client');
const HttpModule = require('./http.module');

module.exports = {
  HTTP_METHODS,
  HTTP_CLIENT,
  HTTP_REQUEST_INTERCEPTOR,

  HttpClient,

  HttpModule,
};
