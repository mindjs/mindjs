const { Inject } = require('@mindjs/common');
const { APP_MIDDLEWARE, APP_CONFIG } = require('@mindjs/core');

const { default: enforceHttps } = require('koa-sslify');

const APP_MIDDLEWARE_PROVIDERS = [
  {
    provide: APP_MIDDLEWARE,
    useFactory: function ({ isDev, port }) {
      return (isDev ? (ctx, next) => next() : enforceHttps({ port }));
    },
    deps: [Inject(APP_CONFIG)],
    multi: true,
  }
];

module.exports = APP_MIDDLEWARE_PROVIDERS;
