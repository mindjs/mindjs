const stubMiddleware = async (ctx, next) => next();
const DEFAULT_APP_PORT = 4400;

module.exports = {
  stubMiddleware,
  DEFAULT_APP_PORT,
};
