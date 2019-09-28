const request = require('request-promise-native');

const { Module } = require('@framework100500/common');

const { HTTP_CLIENT, HTTP_REQUEST_INTERCEPTOR } = require('./DI.tokens');
const HttpClient = require('./http.client');

/**
 * TODO: add separate entities: Handler, Request, HttpParams, etc..
 */
class HttpModule {
  static forRoot({ httpClient } = { httpClient: request }) {
    return {
      module: Module(HttpModule),
      providers: [
        {
          provide: HTTP_REQUEST_INTERCEPTOR,
          useClass: class HttpRequestInterceptor {
            intercept(request, httpHandler) {
              httpHandler.handle(request);
            }
          },
        },
        {
          provide: HTTP_CLIENT,
          useValue: httpClient,
        },
        HttpClient,
      ],
    };
  }
}

module.exports = Module(HttpModule);
