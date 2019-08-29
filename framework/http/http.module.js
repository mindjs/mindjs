const request = require('request-promise-native');

const { providableClass } = require('../core');

const { HTTP_CLIENT } = require('./DI.tokens');
const HttpClient = require('./http.client');

class HttpModule {
  static forRoot({ httpClient } = { httpClient: request }) {
    return providableClass(HttpModule, {
      providers: [
        {
          provide: HTTP_CLIENT,
          useValue: httpClient,
        },
        HttpClient,
      ],
    });
  }
}

module.exports = providableClass(HttpModule, {
  providers: [
    {
      provide: HTTP_CLIENT,
      useValue: request,
    },
    HttpClient,
  ]
});
