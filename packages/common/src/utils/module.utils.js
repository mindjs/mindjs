// const { get } = require('lodash');

/**
 * Checks if provided module is module with providers
 * @param {*} moduleOrDescriptor
 * @returns {boolean}
 */
function isModuleWithProviders(moduleOrDescriptor) {
  if (!moduleOrDescriptor) {
    return false;
  }

  return !(moduleOrDescriptor.imports) && !!(moduleOrDescriptor.module && moduleOrDescriptor.providers);
}

// function isRoutingModule(m) {
//   return get(m, 'module.name', '') === 'RoutingModule';
// }

module.exports = {
  isModuleWithProviders,
  // isRoutingModule,
};
