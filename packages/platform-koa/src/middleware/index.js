const { get } = require('lodash');

const bodyParser = require('koa-body');
const compress = require('koa-compress');
const cors = require('@koa/cors');
const { healthcheck } = require('@appliedblockchain/koa-healthcheck');
const helmet = require('koa-helmet');
const logger = require('koa-logger');
const serveStatic = require('koa-static');

const { stubMiddleware } = require('../constants');

/*
  TODO: add debug log...
 */

/**
 *
 * @param {Object} helmetConfig - @see: https://github.com/venables/koa-helmet#usage
 * @returns {Function} helmet middleware
 */
function koaHelmetMWFactory(helmetConfig) {
  return helmet(helmetConfig || {});
}

/**
 *
 * @param {{
 *   transporter: Function,
 * }} loggerConfig - @see: https://github.com/koajs/logger#use-custom-transporter
 * @returns {Function} logger middleware
 */
function koaLoggerMWFactory(loggerConfig) {
  const transporter = get(loggerConfig, 'transporter');
  return logger({ transporter });
}

/**
 *
 * @param {Object} compressConfig - @see: https://github.com/koajs/compress#options
 * @returns {Function} compress middleware
 */
function koaCompressMWFactory(compressConfig) {
  return compress(compressConfig || {});
}

/**
 *
 * @param {Object} bodyParserConfig - @see: https://github.com/koajs/bodyParser#options
 * @returns {Function} bodyParser middleware
 */
function koaBodyParserMWFactory(bodyParserConfig) {
  return bodyParser(bodyParserConfig || {});
}

/**
 *
 * @param {{
 *   [routePath]: string,
 *   [customData]: object,
 *   [healthCheckToken]: string,
 * }} healthConfig - @see: https://www.npmjs.com/package/@appliedblockchain/koa-healthcheck#koa-healthcheck-middleware
 * @returns {Function} health middleware
 */
function koaHealthMWFactory(healthConfig) {
  const customRoutePath = get(healthConfig, 'routePath', '/ping');
  const customReportData = get(healthConfig, 'customData');
  const healthCheckToken = get(healthConfig, 'healthCheckToken', process.env.APP_HEALTH_CHECK_TOKEN);

  return healthcheck({
    path: customRoutePath,
    custom: customReportData,
  }, healthCheckToken);
}

/**
 *
 * @param {Object} corsConfig - @see: https://github.com/koajs/cors#corsoptions
 * @returns {Function} cors middleware
 */
function koaCORSMWFactory(corsConfig) {
  if (!corsConfig) {
    return stubMiddleware;
  }
  return cors(corsConfig);
}

/**
 *
 * @param {{
 *   root: string,
 *   options: Object,
 * }} serveStaticConfig - @see: https://github.com/koajs/static#options
 * @returns {Function} serveStatic middleware
 */
function koaServeStaticMWFactory(serveStaticConfig) {
  if (!serveStaticConfig) {
    return stubMiddleware;
  }
  const { root, options = {} } = serveStaticConfig;
  return serveStatic(root, options);
}

module.exports = {
  koaHelmetMWFactory,
  koaLoggerMWFactory,
  koaCompressMWFactory,
  koaBodyParserMWFactory,
  koaHealthMWFactory,
  koaCORSMWFactory,
  koaServeStaticMWFactory,
};
