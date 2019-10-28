const { APP_TERMINATION_SIGNAL, APP_CONFIG } = require('@mindjs/core');
const { Inject } = require('@mindjs/common');

const { readFileSync } = require('fs');
const https = require('https');

class AppServerListener {

  static get parameters() {
    return [
      Inject(APP_CONFIG),
      Inject(APP_TERMINATION_SIGNAL),
    ];
  }

  constructor(
    appConfig,
    terminationSignal,
  ) {
    this.appConfig = appConfig;
    this.terminationSignal = terminationSignal;
  }

  listen(appServer) {
    const { port, httpsConfig: { certPath, keyPath }, isDev } = this.appConfig;

    let server;

    if (isDev) {
      server = appServer.listen(port, () => {
        console.log(`App server is up and running on ${ port }`);
      });
    } else {
      let  httpsOptions;

      try {
        httpsOptions = {
          key: readFileSync(keyPath),
          cert: readFileSync(certPath),
        };
      } catch (e) {
        console.error(e);
      }

      if (httpsOptions) {
        // start the https server
        server =  https.createServer(httpsOptions, appServer.callback()).listen(port, () => {
          console.log(`Https server is up and running on ${ port }`);
        });
      }
    }

    process.on(this.terminationSignal, () => {
      console.log('App received a `%s` signal. Closing server connections.', this.terminationSignal);
      if (server) {
        server.close(() => {
          server.unref();
        });
      }
    });
  }
}

module.exports = {
  AppServerListener,
};
