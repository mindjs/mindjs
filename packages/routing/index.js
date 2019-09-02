const { APP_ROUTER_DESCRIPTOR_RESOLVER, APP_ROUTERS_RESOLVER, APP_SERVER_ROUTER_PROVIDER } = require('./src/DI.tokens');
const { stubHandler } = require('./src/constants');
const { isValidMiddlewareList, isValidHandler, normalizeRoutePath } = require('./src/helpers');
const { RoutingModule } = require('./src/routing.module');

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
