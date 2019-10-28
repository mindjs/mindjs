const { APP_CONFIG } = require('@mindjs/core');
const { isDevEnvironment  } = require('@mindjs/common/utils');
const {
  mindPlatformKoa,
  KOA_CORS_CONFIG,
  // KOA_SERVE_STATIC_CONFIG,
  // KOA_LOGGER_CONFIG,
  // KOA_HEALTH_CONFIG,
  // KOA_COMPRESS_CONFIG,
  // KOA_BODY_PARSER_CONFIG,
  // KOA_HELMET_CONFIG
} = require('@mindjs/platform-koa');

const { AppModule } = require('./src');
const { join } = require('path');

const CONFIG_PROVIDERS = [
  // Platform configuration providers
  {
    provide: APP_CONFIG,
    useValue: {
      port: process.env.PORT || 4400,
      httpsConfig: {
        certPath: process.env.HTTPS_CERT_PATH || join(process.cwd(), './cert/prod/production.crt'),
        keyPath: process.env.HTTPS_KEY_PATH || join(process.cwd(), './cert/prod/production.key'),
      },
      isDev: isDevEnvironment(),
      configuration: isDevEnvironment() ? 'dev' : process.env.NODE_ENV_CONFIGURARION || 'production',
    },
  },
  {
    // see: https://github.com/koajs/cors#corsoptions
    provide: KOA_CORS_CONFIG,
    useValue:  {
      allowMethods: 'GET,POST,PUT,DELETE',
      origin: '*',
    }
  },
  // {
  // // see: https://github.com/koajs/static#options
  //   provide: KOA_SERVE_STATIC_CONFIG,
  //   useValue:  {
  //
  //   },
  // },
  // {
  // // see: https://github.com/koajs/logger#use-custom-transporter
  //   provide: KOA_LOGGER_CONFIG,
  //   useValue:  {
  //
  //   },
  // },
  // {
  // // see: https://github.com/alan-seymour/koa2-ping#configuration
  //   provide: KOA_HEALTH_CONFIG,
  //   useValue:  {
  //
  //   },
  // },
  // {
  // // see: https://github.com/koajs/compress#options
  //   provide: KOA_COMPRESS_CONFIG,
  //   useValue:  {
  //
  //   },
  // },
  // {
  // // see: https://github.com/koajs/bodyParser#options
  //   provide: KOA_BODY_PARSER_CONFIG,
  //   useValue:  {
  //
  //   }
  // },
  // {
  // // see: https://github.com/venables/koa-helmet#usage
  //   provide: KOA_HELMET_CONFIG,
  //   useValue:  {
  //
  //   },
  // },
];

mindPlatformKoa({
  platformExtraProviders: CONFIG_PROVIDERS,
}).bootstrapModule(AppModule);
