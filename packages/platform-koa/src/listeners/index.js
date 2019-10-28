const { Optional } = require('@mindjs/common');
const { APP_TERMINATION_SIGNAL, APP_CONFIG } = require('@mindjs/core');
const { TERMINATION_SIGNAL } = require('@mindjs/core/constants');

const { uniq } = require('lodash');

const { DEFAULT_APP_PORT } = require('../constants');

class KoaServerNetListener {
  static get parameters() {
    return [
      Optional(APP_CONFIG),
      Optional(APP_TERMINATION_SIGNAL),
    ];
  }

  constructor(
    appConfig,
    terminationSignal,
  ) {
    this.appConfig = appConfig;
    this.terminationSignal = terminationSignal;
  }

  /**
   *
   * @returns {string | number | *}
   */
  get appPort() {
    const envPort = process.env.PORT;
    const configPort = this.appConfig && this.appConfig.port;

    return envPort || configPort || DEFAULT_APP_PORT;
  }

  listen(appServer) {
    const port = this.appPort;
    const { SIGTERM, SIGINT } = TERMINATION_SIGNAL;

    const server = appServer.listen(port, () => {
      console.log(`App server is up and running on ${ port }`);
    });

    const handleTerminationSignal = () => {
      console.log('App server has been terminated.');
      server.close(() => {
        console.log('The server is closed');
      });
      server.unref();
    };

    uniq([SIGTERM, SIGINT, this.terminationSignal])
      .filter(Boolean)
      .map(signal => process.on(signal, handleTerminationSignal));
  }

}

class KoaServerErrorListener {

  listen(appServer) {
    const handleServerError = (e) => {
      console.error('Internal server error:');
      console.error(e);
    };
    const handleUncaughtException = (e) => {
      console.error('Unhandled Exception:');
      console.error(e);
    };
    const handleUnhandledRejection = (e) => {
      console.error('Unhandled Rejection:');
      console.error(e);
    };

    appServer.on('error', handleServerError);
    process.on('uncaughtException', handleUncaughtException);
    process.on('unhandledRejection', handleUnhandledRejection);
  }
}

module.exports = {
  KoaServerNetListener,
  KoaServerErrorListener,
};
