const { Mind } = require('@mindjs/core');
const { AppModule } = require('./src');

/*
  const app = new Mind(AppModule);
  app.bootstrap();
*/
Mind.bootstrap(AppModule);
