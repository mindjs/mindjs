const { providableClass, Inject } = require('../core');
const { HTTP_CLIENT, HTTP_REQUEST_INTERCEPTOR } = require('./DI.tokens');

class HttpClient {

  static get parameters() {
    return [
      Inject(HTTP_CLIENT),
      Inject(HTTP_REQUEST_INTERCEPTOR),
    ];
  }

  constructor(
    httpClient,
    interceptors,
  ) {
    this.client = httpClient;
    // TODO: add interceptors handling
    this._interceptors = interceptors;
  }

  request(...params) {
    return this.client(...params);
  }

  get(...params) {
    return this.client.get(...params);
  }

  post(...params) {
    return this.client.post(...params);
  }

  put(...params) {
    return this.client.put(...params);
  }

  patch(...params) {
    return this.client.patch(...params);
  }

  delete(...params) {
    return this.client.delete(...params);
  }

  head(...params) {
    return this.client.head(...params);
  }

  options(...params) {
    return this.client.options(...params);
  }

}

module.exports = providableClass(HttpClient);
