const {
  HTTP_CLIENT,
  HTTP_REQUEST_INTERCEPTOR,
} = require('./DI.tokens');

const HttpClient = require('./http.client');
const HttpModule = require('./http.module');

module.exports = {
  HTTP_CLIENT,
  HTTP_REQUEST_INTERCEPTOR,

  HttpClient,

  HttpModule,
};
