const { ProvideableClass } = require('@framework100500/core');

const DEFAULT_PORT = 3000;

class ConfigService {

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
module.exports = ProvideableClass(ConfigService);
