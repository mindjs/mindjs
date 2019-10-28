const { InjectionToken } = require('@mindjs/common/DI');

const HTTP_CLIENT = new InjectionToken('HttpMindClient');
const HTTP_REQUEST_INTERCEPTOR = new InjectionToken('HttpRequestMindInterceptor');

module.exports = {
  HTTP_CLIENT,
  HTTP_REQUEST_INTERCEPTOR
};
