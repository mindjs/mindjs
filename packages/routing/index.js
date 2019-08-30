const { APP_ROUTER_DESCRIPTOR_RESOLVER, APP_ROUTERS_RESOLVER, APP_SERVER_ROUTER_PROVIDER } = require('./DI.tokens');
const { stubHandler } = require('./constants');
const { isValidMiddlewareList, isValidHandler, normalizeRoutePath } = require('./helpers');
const { RoutingModule } = require('./routing.module');

module.exports = {
  APP_ROUTER_DESCRIPTOR_RESOLVER,
  APP_ROUTERS_RESOLVER,
  APP_SERVER_ROUTER_PROVIDER,

  stubHandler,

  isValidMiddlewareList,
  isValidHandler,
  normalizeRoutePath,

  RoutingModule,
};
