const {
  APP_TERMINATION_SIGNAL,
} = require('@framework100500/core');
const {
  Inject,
} = require('@framework100500/common');

const AppConfigService = require('./config.service');

class AppServerListener {

  static get parameters() {
    return [
      AppConfigService,
      Inject(APP_TERMINATION_SIGNAL),
    ];
  }

  constructor(
    appConfigService,
    terminationSignal,
  ) {
    this.appConfigService = appConfigService;
    this.terminationSignal = terminationSignal;
  }

  listen(appServer) {
    const { port } = this.appConfigService;

    const server = appServer.listen(port, () => {
      console.log(`App server is up and running on ${ port }`);
    });

    process.on(this.terminationSignal, () => {
      console.log('App received a `%s` signal. Closing server connections.', this.terminationSignal);
      server.close(() => {
        server.unref();
      });
    });
  }
}

class AppServerErrorListener {

  listen(appServer) {
    appServer.on('error', (e) => {
      console.error('Server error: %O', e);
    });
    process.on('uncaughtException', (e) => {
      console.error('uncaughtException: %O', e);
    });
    process.on('unhandledRejection', (e) => {
      console.error('unhandledRejection: %O', e);
    });
  }
}

module.exports = {
  AppServerListener,
  AppServerErrorListener,
};
