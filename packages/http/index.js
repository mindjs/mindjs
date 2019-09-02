// TODO: implement a Testing Http Module solution
const { HTTP_METHODS } = require('../core');
const { HTTP_CLIENT, HTTP_REQUEST_INTERCEPTOR } = require('./src/DI.tokens');
const HttpClient = require('./src/http.client');
const HttpModule = require('./src/http.module');

module.exports = {
  HTTP_METHODS,
  HTTP_CLIENT,
  HTTP_REQUEST_INTERCEPTOR,

  HttpClient,

  HttpModule,
};
