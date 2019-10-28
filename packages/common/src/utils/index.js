const {
  toArray,
} = require('./array.utils');
const {
  isDevEnvironment,
} = require('./env.utils');
const {
  isArrowFunction,
  isAsyncFunction,
  isPromise,
} = require('./function.utils');
const {
  injectSync,
  injectAsync,
  injectOneAsync,
  injectOneSync,
  injectSyncFromTree,
} = require('./inject.utils');
const {
  invokeAll,
  invokeFn,
  invokeOn,
  invokeOnAll,
} = require('./invoke.utils');

module.exports = {
  isDevEnvironment,

  toArray,

  isArrowFunction,
  isAsyncFunction,
  isPromise,

  injectSync,
  injectAsync,
  injectOneAsync,
  injectOneSync,
  injectSyncFromTree,

  invokeAll,
  invokeFn,
  invokeOn,
  invokeOnAll,
};
