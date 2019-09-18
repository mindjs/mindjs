const {
  isArrowFunction,
  isAsyncFunction,
  isPromise,
} = require('./function.utils');
const {
  isModuleWithProviders,
} = require('./module.utils');
const {
  injectOneAsync,
  injectOneSync,
  injectSync,
  injectAsync,
} = require('./inject.utils');
const {
  invokeOnAll,
  invokeAll,
  invokeFn,
} = require('./invoke.utils');

module.exports = {
  isArrowFunction,
  isAsyncFunction,
  isPromise,

  isModuleWithProviders,

  injectOneAsync,
  injectOneSync,
  injectSync,
  injectAsync,

  invokeOnAll,
  invokeAll,
  invokeFn
};
