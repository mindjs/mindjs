/**
 * Check if current NODE_ENV is development
 * @returns {boolean}
 */
function isDevEnvironment() {
  return ['dev', 'development', undefined].includes(process.env.NODE_ENV);
}

module.exports = {
  isDevEnvironment,
};
