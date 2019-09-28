/**
 * Parses environment variable string
 * @param {string} envValue
 * @returns {*}
 */
function parseEnv(envValue) {
  if (!envValue) {
    return envValue;
  }

  let result;
  try {
    result = JSON.parse(envValue);
  } catch (e) {
    // ...
  }
  return result;
}

module.exports = {
  parseEnv
};
