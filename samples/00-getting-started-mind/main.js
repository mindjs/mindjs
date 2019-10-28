const { mindPlatformKoa } = require('@mindjs/platform-koa');

const MindAppModule = require('./app/src/app.module');

mindPlatformKoa().bootstrapModule(MindAppModule);
