
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

module.exports = {
  isModuleWithProviders,
};
