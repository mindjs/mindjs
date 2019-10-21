const {
  APP_MIDDLEWARE,
} = require('@framework100500/core');

const bodyParser = require('koa-body');
const compress = require('koa-compress');
const cors = require('@koa/cors');
const health = require('koa2-ping');
const helmet = require('koa-helmet');
const logger = require('koa-logger');

const AppConfigService = require('./config.service');

const APP_MIDDLEWARE_PROVIDERS = [
  {
    provide: APP_MIDDLEWARE,
    useFactory: function () {
      return helmet();
    },
    multi: true,
  },
  {
    provide: APP_MIDDLEWARE,
    useFactory: function () {
      return logger();
    },
    multi: true,
  },
  {
    provide: APP_MIDDLEWARE,
    useFactory: function () {
      return compress();
    },
    multi: true,
  },
  {
    provide: APP_MIDDLEWARE,
    useFactory: function () {
      return bodyParser();
    },
    multi: true,
  },
  {
    provide: APP_MIDDLEWARE,
    useFactory: function () {
      return health();
    },
    multi: true,
  },
  {
    provide: APP_MIDDLEWARE,
    useFactory: function (config) {
      return cors({ ...config.corsOptions });
    },
    deps: [AppConfigService],
    multi: true,
  },
];

module.exports = APP_MIDDLEWARE_PROVIDERS;
