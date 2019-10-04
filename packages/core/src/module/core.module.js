const { Module } = require('@framework100500/common');

const { APP_SERVER_TERMINATE_SIGNAL } = require('../lib/framework');
const { TERMINATE_SIGNAL } = require('./constants');

module.exports = class CoreModule {
  static forRoot() {
    return {
      module: Module(CoreModule),
      providers: [
        {
          provide: APP_SERVER_TERMINATE_SIGNAL,
          useValue: TERMINATE_SIGNAL,
        },
      ],
    };
  }
};
