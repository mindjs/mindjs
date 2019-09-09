const { Injectable } = require('@framework100500/core');

const DEFAULT_PORT = 3000;

class ConfigService {

  get isProxy() {
    return process.env.IS_PROXY || true;
  }

  get exclamationMark() {
    return '!';
  }

  get port() {
    return process.env.PORT || DEFAULT_PORT;
  }

  get corsOptions() {
    return {
      allowMethods: 'GET,POST,PUT,DELETE',
      origin: '*',
    }
  }
}
module.exports = Injectable(ConfigService);
