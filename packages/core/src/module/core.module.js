const { Module } = require('@framework100500/common');

const { APP_TERMINATION_SIGNAL } = require('../lib/framework');
const { TERMINATION_SIGNAL } = require('../lib/constants');

module.exports = class CoreModule {
  static forRoot() {
    return {
      module: Module(CoreModule),
      providers: [
        {
          provide: APP_TERMINATION_SIGNAL,
          useValue: TERMINATION_SIGNAL.SIGTERM,
        },
      ],
    };
  }
};
