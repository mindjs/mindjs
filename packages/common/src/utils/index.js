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
