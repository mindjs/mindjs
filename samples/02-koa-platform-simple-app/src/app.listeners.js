const { APP_TERMINATION_SIGNAL } = require('@mindjs/core');
const { Inject } = require('@mindjs/common');

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

    console.log(`Custom AppServerListener`);
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

module.exports = {
  AppServerListener,
};
