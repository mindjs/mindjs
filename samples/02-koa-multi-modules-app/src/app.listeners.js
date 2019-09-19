const {
  APP_SERVER,
  APP_SERVER_NET_LISTENER,
  APP_SERVER_ERROR_LISTENER,
} = require('@framework100500/core');
const {
  Inject,
} = require('@framework100500/common');

const AppConfigService = require('./config.service');

const APP_SERVER_LISTENERS = [
  {
    provide: APP_SERVER_NET_LISTENER,
    useClass: class AppServerListener {

      static get parameters() {
        return [
          Inject(APP_SERVER),
          AppConfigService,
        ];
      }

      constructor(
        appServer,
        appConfigService,
      ) {
        this.appServer = appServer;
        this.appConfigService = appConfigService;
      }

      listen() {
        const { port } = this.appConfigService;
        this.appServer.listen(port, () => {
          console.log(`App server is up and running on ${ port }`);
        });
      }
    },
  },
  {
    provide: APP_SERVER_ERROR_LISTENER,
    useClass: class AppServerErrorListener {

      static get parameters() {
        return [
          Inject(APP_SERVER),
        ];
      }

      constructor(
        appServer,
      ) {
        this.appServer = appServer;
      }

      listen() {
        this.appServer.on('error', (e) => {
          console.error(e);
        });
      }
    },
  },
];

module.exports = {
  APP_SERVER_LISTENERS,
};
