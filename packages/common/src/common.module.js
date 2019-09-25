const { Module } = require('./decorators');

// TODO: fill it with the common stuff
class CommonModule {}
module.exports = Module(CommonModule, {
  providers: [],
});
