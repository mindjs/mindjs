const { isArray } = require('lodash');

/**
 * Converts a value to array or returns it if it is an Array
 * @param value
 * @returns {*[]}
 */
function toArray(value) {
  return isArray(value) ? value : [value];
}

module.exports = {
  toArray
};
