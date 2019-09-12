const { stubHandler } = require('./constants');

const {
  isValidMiddlewareList,
  isValidHandler,
  normalizeRoutePath,
} = require('./helpers');

const RoutingModule = require('./routing.module');

module.exports = {
  stubHandler,

  isValidMiddlewareList,
  isValidHandler,
  normalizeRoutePath,

  RoutingModule,
};
