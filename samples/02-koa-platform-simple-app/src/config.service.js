const { Injectable } = require('@framework100500/common');
const { isDevEnvironment } = require('@framework100500/common/utils');

const DEFAULT_PORT = 3000;

class ConfigService {

  get configuration() {
    return isDevEnvironment() ? 'development' : 'production';
  }

  get isProxy() {
    return process.env.IS_PROXY || true;
  }

  get exclamationMark() {
    return '!';
  }

  get port() {
    return process.env.PORT || DEFAULT_PORT;
  }
}
module.exports = Injectable(ConfigService);
