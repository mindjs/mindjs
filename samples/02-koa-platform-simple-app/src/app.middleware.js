const {
  APP_MIDDLEWARE,
} = require('@framework100500/core');

const AppConfigService = require('./config.service');

const APP_MIDDLEWARE_PROVIDERS = [
  {
    provide: APP_MIDDLEWARE,
    useFactory: function (config) {
      return  async (ctx, next) => {
        console.log('App configuration, %s', config.configuration);
        return next();
      }
    },
    deps: [AppConfigService]
  },
];

module.exports = APP_MIDDLEWARE_PROVIDERS;
