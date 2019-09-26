const request = require('request-promise-native');

const { Module } = require('@framework100500/common');

const { HTTP_CLIENT } = require('./DI.tokens');
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
          provide: HTTP_CLIENT,
          useValue: httpClient,
        },
        HttpClient,
      ],
    };
  }
}

module.exports = Module(HttpModule);
