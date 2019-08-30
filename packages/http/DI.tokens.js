const { InjectionToken } = require('injection-js');

const HTTP_CLIENT = new InjectionToken('HttpClient');
const HTTP_REQUEST_INTERCEPTOR = new InjectionToken('HttpRequestInterceptor');

module.exports = {
  HTTP_CLIENT,
  HTTP_REQUEST_INTERCEPTOR
};
